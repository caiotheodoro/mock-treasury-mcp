// Usage: node cross-agent.mjs <agent> [amount]
import { openSession, call } from "./_lib.mjs";
const [agent = "treasury-ops-agent", amount = "510"] = process.argv.slice(2);
const s = await openSession(agent, "treasury-escalation-view");
await call(s, "wire_transfer_treas21", { from_account: "ACC-1001", to_account: "ACC-2044", amount_usd: Number(amount) }, agent);
await s.close();
