// Prompt Registry harness. Usage: node prompt-registry.mjs [version=2] [agent=treasury-ops-agent]
import { token } from "./_lib.mjs";
const [version = "2", agent = "treasury-ops-agent"] = process.argv.slice(2);
const fqn = `chat_prompt:avenza/default/treasury-liquidity-report:${version}`;
const figures = "Payroll float ACC-1001: USD 500,000.00; tax reserve ACC-3100: USD 120,000.00; suspense ACC-9999: USD 0.00; one outgoing wire this period: USD 120 to ACC-2044 (payroll top-up, id wt_1).";
async function run(label, body, metadata = { demo: "treasury-controls", cost_center: "CC-4410", environment: "prod" }) {
  const t0 = Date.now();
  const r = await fetch("https://gateway.truefoundry.ai/api/inference/openai/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token(agent)}`, "x-tfy-metadata": JSON.stringify(metadata) },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  let out = text;
  try { const j = JSON.parse(text); out = j.choices?.[0]?.message?.content ?? j.error?.message ?? j.message ?? text; } catch {}
  console.log(`\n[${label}] HTTP ${r.status} ${Date.now() - t0}ms\n${out}`);
}
await run(`P1 render ${fqn} via gateway`, {
  prompt_version_fqn: fqn, messages: [], max_tokens: 400,
  prompt_variables: { period: "September 2026 week 38", audience: "the Group CFO", figures },
});
await run(`P2 same prompt, secret smuggled in figures`, {
  prompt_version_fqn: fqn, messages: [], max_tokens: 60,
  prompt_variables: { period: "W38", audience: "the Group CFO", figures: figures + " Ledger export key AKIAIOSFODNN7EXAMPLE." },
});
