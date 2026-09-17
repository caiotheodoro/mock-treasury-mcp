#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "mock-treasury-mcp",
  version: "1.0.0",
});

const ledger = [];

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
