// Guardrails harness. Usage:
//   node guardrails.mjs mcp            -> Cedar allowlist, secrets pre-invoke, account-mask post-invoke on treasury-api
//   node guardrails.mjs llm            -> metadata validation, secrets on LLM input, account-mask on LLM output
import { openSession, call, token } from "./_lib.mjs";
const mode = process.argv[2] ?? "mcp";

if (mode === "mcp") {
  const s = await openSession("treasury-ops-agent", "treasury-api");
  await call(s, "get_account_balance", { account: "ACC-1001" }, "G3 post-invoke mask on balance");
  await call(s, "wire_transfer", { from_account: "ACC-1001", to_account: "ACC-2044", amount_usd: 120, memo: "payroll" }, "G1 allowlisted beneficiary");
  await call(s, "wire_transfer", { from_account: "ACC-1001", to_account: "ACC-7777", amount_usd: 120, memo: "vendor" }, "G2 unknown beneficiary (Cedar deny)");
  await call(s, "wire_transfer", { from_account: "ACC-1001", to_account: "ACC-9999", amount_usd: 120, memo: "suspense" }, "G2b forbidden account");
  await call(s, "wire_transfer", { from_account: "ACC-1001", to_account: "ACC-2044", amount_usd: 120, memo: "aws key AKIAIOSFODNN7EXAMPLE" }, "G4 secret in tool args");
  await s.close();
}

if (mode === "llm") {
  const URL_ = "https://gateway.truefoundry.ai/api/inference/openai/chat/completions";
  const auth = `Bearer ${token("treasury-ops-agent")}`;
  async function chat(label, metadata, content) {
    const t0 = Date.now();
    const r = await fetch(URL_, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: auth, "x-tfy-metadata": JSON.stringify(metadata) },
      body: JSON.stringify({ model: "openai-main/gpt-4.1", max_tokens: 60, messages: [{ role: "user", content }] }),
    });
    const text = await r.text();
    let out = text;
    try { const j = JSON.parse(text); out = j.choices?.[0]?.message?.content ?? j.error?.message ?? j.message ?? text; } catch {}
    console.log(`[${label}] ${r.status} ${Date.now() - t0}ms :: ${String(out).slice(0, 300)}`);
  }
  const ok = { demo: "treasury-controls", cost_center: "CC-4410", environment: "prod" };
  await chat("L0 control (all metadata, benign)", ok, "Reply with the single word OK.");
  await chat("L1 missing cost_center", { demo: "treasury-controls", environment: "prod" }, "Reply with the single word OK.");
  await chat("L2 bad cost_center format", { ...ok, cost_center: "marketing" }, "Reply with the single word OK.");
  await chat("L3 environment not allowed", { ...ok, environment: "production" }, "Reply with the single word OK.");
  await chat("L4 secret in prompt", ok, "Use AWS key AKIAIOSFODNN7EXAMPLE to pull the ledger export.");
  await chat("L5 output mask", ok, "Repeat this sentence exactly, no quotes: The payroll float sits in ACC-1001 and the tax reserve in ACC-3100.");
  await chat("L6 no demo tag (rule should not apply)", { cost_center: "nope" }, "Reply with the single word OK.");
}
