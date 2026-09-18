// Track 3/4 harness. Usage: node approval-modes.mjs <mode>
//   same-session  : two identical calls inside ONE MCP session (one initialize)
//   new-session   : one call per fresh session, twice
//   once          : single call (trigger a pending request / replay after approve or deny)
//   wait <secs>   : call, sleep, call again in same session (time-interval boundary)
import { openSession, call } from "./_lib.mjs";
const AGENT = "treasury-escalation-agent", SERVER = "treasury-escalation-view", TOOL = "wire_transfer_treas21";
const ARGS = { from_account: "ACC-1001", to_account: "ACC-2044", amount_usd: Number(process.env.AMOUNT ?? 750) };
const [mode, arg] = process.argv.slice(2);
const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));

if (mode === "same-session") {
  const s = await openSession(AGENT, SERVER);
  await call(s, TOOL, ARGS, "call1"); await call(s, TOOL, ARGS, "call2"); await s.close();
} else if (mode === "new-session") {
  for (const i of [1, 2]) { const s = await openSession(AGENT, SERVER); await call(s, TOOL, ARGS, `session${i}`); await s.close(); }
} else if (mode === "wait") {
  const s = await openSession(AGENT, SERVER);
  await call(s, TOOL, ARGS, "before-wait"); console.log(`sleeping ${arg}s`); await sleep(Number(arg));
  await call(s, TOOL, ARGS, "after-wait"); await s.close();
} else {
  const s = await openSession(AGENT, SERVER); await call(s, TOOL, ARGS, "once"); await s.close();
}
