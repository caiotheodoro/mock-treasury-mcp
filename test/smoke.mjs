import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const serverPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "index.js");
const child = spawn("node", [serverPath], { stdio: ["pipe", "pipe", "inherit"] });

let buf = "";
child.stdout.on("data", (d) => {
  buf += d.toString();
  let idx;
  while ((idx = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, idx);
    buf = buf.slice(idx + 1);
    if (line.trim()) {
      console.log("<-", line);
    }
  }
});

function send(msg) {
  child.stdin.write(JSON.stringify(msg) + "\n");
}

send({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "smoke-test", version: "0.0.1" },
  },
});

setTimeout(() => {
  send({ jsonrpc: "2.0", method: "notifications/initialized" });
  send({ jsonrpc: "2.0", id: 2, method: "tools/list" });
}, 300);

setTimeout(() => {
  send({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "wire_transfer",
      arguments: { from_account: "ACC-1001", to_account: "ACC-2044", amount_usd: 500 },
    },
  });
}, 600);

setTimeout(() => {
  child.kill();
  process.exit(0);
}, 1200);
