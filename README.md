# fisc

Open-source MCP server for professional tax software.

Connect AI agents to **Taxprep**, **DT Max**, and other Canadian tax preparation packages through the [Model Context Protocol](https://modelcontextprotocol.io).

## What is this?

Canadian accounting firms prepare tax returns in software like Taxprep (Wolters Kluwer) and DT Max (Thomson Reuters). These tools have no AI interface. **fisc** bridges that gap — it lets any MCP-compatible AI agent read, populate, and manage tax returns programmatically.

```
Your AI agent
    ↓ MCP
   fisc
    ↓ adapters
Taxprep  ·  DT Max  ·  ...
```

## Why open-source?

The value isn't in the connector — it's in what flows through it. We believe every firm should be able to wire AI into their existing tax software without vendor lock-in. The more adapters exist, the more useful the ecosystem is for everyone.

## Status

**Early development.** We're building the Taxprep adapter first (via the CCH iFirm Web API), then DT Max.

### Planned tools

| Tool | Description |
|------|-------------|
| `create_return` | Create a new tax return for a taxpayer |
| `set_field` | Set a value in a return (e.g. employment income, medical expenses) |
| `get_field` | Read a value from a return |
| `list_forms` | List available forms in a return |
| `get_diagnostics` | Retrieve validation diagnostics |
| `list_returns` | List existing returns |

### Planned adapters

- **Taxprep** (CCH iFirm Web API) — in progress
- **DT Max** (Thomson Reuters) — researching import format
- More to come

## Architecture

fisc uses a **vendor-neutral tax concept layer**. Instead of mapping directly to software-specific cell IDs, it translates semantic concepts:

```typescript
// What your agent says:
await client.callTool("set_field", {
  return_id: "2026-john-smith",
  concept: "employment_income",
  value: 82400,
  source: "t4_acme.pdf"
});

// What fisc translates to (Taxprep):
// Cell T1.Towjac134 = 82400

// What fisc translates to (DT Max):
// Keyword EMPLOYMENT_INCOME = 82400
```

The concept-to-cell mapping is maintained per tax year, per software, per return type.

## Getting started

> **Note:** fisc is not yet functional. Star the repo to follow progress.

```bash
# Clone
git clone https://github.com/coalesc/fisc.git
cd fisc

# Install
npm install

# Configure (when adapters are ready)
cp .env.example .env
# Add your CCH iFirm API credentials

# Run
npm start
```

## Project structure

```
src/
  index.ts              # MCP server entry point
  concepts/             # Vendor-neutral tax concept definitions
    t1.ts               # T1 personal return concepts
  adapters/
    taxprep/            # CCH iFirm Taxprep adapter
      client.ts         # API client
      mappings/         # Concept → cell ID mappings by year
    dtmax/              # DT Max adapter (planned)
  tools/                # MCP tool implementations
```

## Contributing

We welcome contributions — especially:

- **New adapters** for other tax software (Profile, Caseware, TurboTax Pro, etc.)
- **Concept mappings** for additional return types (T2, T3, T5013)
- **Tax year updates** to cell ID mappings

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Who builds this?

fisc is built by [Coalesc](https://coalesc.ai), an intake automation platform for Canadian accounting firms. We use fisc internally to connect our document extraction pipeline to the tax software our customers already use.

## License

[MIT](LICENSE)
