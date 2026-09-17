#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "mock-treasury-mcp",
  version: "1.0.0",
});

const ledger = [];

const seedBalances = {
  "ACC-1001": 500000,
  "ACC-2044": 125000,
};

function currentBalance(account) {
  const seed = seedBalances[account] ?? 0;
  const delta = ledger.reduce((sum, e) => {
    if (e.type !== "wire_transfer") return sum;
    if (e.from_account === account) return sum - e.amount_usd;
    if (e.to_account === account) return sum + e.amount_usd;
    return sum;
  }, 0);
  return seed + delta;
}

server.registerTool(
  "get_account_balance",
  {
    title: "Get Account Balance",
    description:
      "Read-only balance lookup for an internal account reference. DEMO ONLY - fake seeded balances, no wire/reversal capability.",
    inputSchema: {
      account: z.string().describe("Account reference, e.g. ACC-1001"),
    },
  },
  async ({ account }) => {
    return {
      content: [
        {
          type: "text",
          text: `Balance for ${account}: $${currentBalance(account).toFixed(2)} (demo ledger only).`,
        },
      ],
    };
  }
);

server.registerTool(
  "wire_transfer",
  {
    title: "Wire Transfer",
    description:
      "Simulate a wire transfer between two internal account references. DEMO ONLY - no real funds move.",
    inputSchema: {
      from_account: z.string().describe("Source account reference, e.g. ACC-1001"),
      to_account: z.string().describe("Destination account reference, e.g. ACC-2044"),
      amount_usd: z.number().positive().describe("Amount in USD"),
      memo: z.string().optional(),
    },
  },
  async ({ from_account, to_account, amount_usd, memo }) => {
    const entry = {
      id: `wt_${ledger.length + 1}`,
      type: "wire_transfer",
      from_account,
      to_account,
      amount_usd,
      memo: memo ?? null,
      at: new Date().toISOString(),
    };
    ledger.push(entry);
    return {
      content: [
        {
          type: "text",
          text: `Simulated wire transfer executed: $${amount_usd} from ${from_account} to ${to_account} (id=${entry.id}). No real funds moved - demo ledger only.`,
        },
      ],
    };
  }
);

server.registerTool(
  "reverse_transaction",
  {
    title: "Reverse Transaction",
    description: "Simulate reversing a prior transaction by id. DEMO ONLY.",
    inputSchema: {
      transaction_id: z.string().describe("id returned by a prior wire_transfer call"),
    },
  },
  async ({ transaction_id }) => {
    const original = ledger.find((e) => e.id === transaction_id);
    if (!original) {
      return {
        content: [
          { type: "text", text: `No transaction found with id ${transaction_id}.` },
        ],
        isError: true,
      };
    }
    return {
      content: [
        {
          type: "text",
          text: `Simulated reversal of ${transaction_id}: $${original.amount_usd} returned to ${original.from_account}. Demo ledger only.`,
        },
      ],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
