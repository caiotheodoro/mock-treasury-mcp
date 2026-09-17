# mock-treasury-mcp

Demo-only MCP server exposing two fake treasury tools — `wire_transfer` and `reverse_transaction` — used for a TrueFoundry Agent Gateway governance demo (agent identity, topology firewall, MCP Tool Approval).

**No real money moves.** Every call is simulated and kept in an in-memory ledger for the lifetime of the process.

## Run

```
npx github:caiotheodoro/mock-treasury-mcp
```

Intended to be run as a hosted STDIO MCP server inside TrueFoundry's MCP Gateway ("Create a hosted STDIO-based MCP Server").
