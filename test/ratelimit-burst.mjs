// Track 2 harness. Usage: node ratelimit-burst.mjs <agent> [n=6] [metadataHeaderJSON]
import { openSession, call } from "./_lib.mjs";
const [agent = "treasury-readonly-agent", n = "6", hdr] = process.argv.slice(2);
const extra = hdr ? JSON.parse(hdr) : {};
const server = agent === "treasury-readonly-agent" ? "treasury-readonly-view" : "treasury-api";
const tool = agent === "treasury-readonly-agent" ? "get_account_balance_treas21" : "get_account_balance";
const s = await openSession(agent, server, extra);
for (let i = 1; i <= Number(n); i++) await call(s, tool, { account: "ACC-1001" }, `${agent}#${i}`);
await s.close();
