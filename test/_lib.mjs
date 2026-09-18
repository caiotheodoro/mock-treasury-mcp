import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { readFileSync } from "node:fs";

export const GATEWAY = "https://gateway.truefoundry.ai/avenza/mcp";
export const token = (agent) => readFileSync(new URL(`../.tokens/${agent}.jwt`, import.meta.url), "utf8").trim();

/** Open one MCP session (one initialize) for an agent against a server slug. */
export async function openSession(agent, serverSlug, extraHeaders = {}) {
  const transport = new StreamableHTTPClientTransport(new URL(`${GATEWAY}/${serverSlug}/server`), {
    requestInit: { headers: { Authorization: `Bearer ${token(agent)}`, ...extraHeaders } },
  });
  const client = new Client({ name: `r2-${agent}`, version: "2.0.0" });
  await client.connect(transport);
  return { client, transport, sessionId: () => transport.sessionId, close: () => client.close().catch(() => {}) };
}

export function summarize(result) {
  const meta = result?._meta ?? {};
  const text = (result?.content ?? []).map((c) => c.text).join(" | ");
  return `${meta.approval_status ?? (result?.isError ? "error" : "ok")}${meta.approval_request_id ? " req=" + meta.approval_request_id : ""} :: ${text}`;
}

export async function call(sess, toolName, args, label = "") {
  const t0 = Date.now();
  try {
    const r = await sess.client.callTool({ name: toolName, arguments: args });
    console.log(`[${label}] ${Date.now() - t0}ms session=${sess.sessionId()} -> ${summarize(r)}`);
    return r;
  } catch (e) {
    console.log(`[${label}] ${Date.now() - t0}ms session=${sess.sessionId()} -> THROW ${e.message}`);
    return { error: e.message };
  }
}
