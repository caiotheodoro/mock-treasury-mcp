// Report review gate harness. Usage: node report-flow.mjs <draft|publish|regen|status|tamper> [period]
// Talks to the gateway as report-writer-agent against MCP server slug report-desk.
import { openSession, call } from "./_lib.mjs";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
const [mode = "draft", period = "2026-Q3"] = process.argv.slice(2);
const AGENT = process.env.AGENT ?? "report-writer-agent", SERVER = process.env.SERVER ?? "report-desk";
const STATE = new URL("../.report-state.json", import.meta.url);
const load = () => existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : {};
const save = (o) => writeFileSync(STATE, JSON.stringify(o, null, 2));
const parseDraft = (r) => JSON.parse(r.content[0].text);
const s = await openSession(AGENT, SERVER);
try {
  if (mode === "draft" || mode === "regen") {
    const r = await call(s, "draft_report", { period, audience: "Board Audit Committee" }, mode);
    const d = parseDraft(r); const st = load(); st[mode === "regen" ? "B" : "A"] = d; save(st);
    console.log(`saved ${mode === "regen" ? "B" : "A"}: ${d.report_id} ${d.url} sha=${d.sha256.slice(0, 12)}`);
    if (mode === "regen") await call(s, "publish_report", { report_id: d.report_id, url: d.url, sha256: d.sha256, summary: d.summary }, "publish(B)");
  } else if (mode === "publish") {
    const d = load()[process.env.WHICH ?? "A"];
    await call(s, "publish_report", { report_id: d.report_id, url: d.url, sha256: d.sha256, summary: d.summary }, `publish(${process.env.WHICH ?? "A"})`);
  } else if (mode === "status") {
    for (const k of ["A", "B"]) { const d = load()[k]; if (d) await call(s, "get_report_status", { report_id: d.report_id }, `status(${k})`); }
  } else if (mode === "list") {
    const t = await s.client.listTools(); console.log(t.tools.map((x) => x.name));
  }
} finally { await s.close(); }
