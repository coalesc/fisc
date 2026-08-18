# fisc

Open-source MCP server for professional tax software.

Connect AI agents to **Taxprep**, **DT Max**, and other Canadian tax preparation packages through the [Model Context Protocol](https://modelcontextprotocol.io).

## What is this?

Canadian accounting firms prepare tax returns in software like Taxprep (Wolters Kluwer) and DT Max (Thomson Reuters). Those systems were built around professional tax workflows, not around one common interface for AI agents. **fisc** is an open interoperability layer that aims to give agents a consistent way to read, populate, and manage returns across tax software.

```
Your AI agent
    ↓ MCP
   fisc
    ↓ adapters
Taxprep  ·  DT Max  ·  ...
```

## Why open-source?

We do not think the connector should be the lock-in.

Accounting firms should be able to connect AI to the tax software they already trust through an interface that is inspectable, portable, and open to contributions. A shared interoperability layer also makes it easier for developers and software vendors to add adapters without rebuilding the same plumbing in private.

Coalesc is building its product above this layer: the engagement workflow, document intelligence, evidence, orchestration, review controls, and the reasoning that decides what should happen next. **Open the rails; compete on the intelligence and workflow.**

## Status

**Early development. fisc is not yet functional.** We're building the Taxprep adapter first via the CCH iFirm Taxprep Web API, then researching the best supported path for DT Max.

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

- **Taxprep** (CCH iFirm Taxprep Web API) — in progress
- **DT Max** (Thomson Reuters) — integration path under research
- More to come

## Architecture

fisc uses a **vendor-neutral tax concept layer**. Instead of asking an agent to understand software-specific cell IDs, it can work with semantic concepts:

```typescript
// What your agent says:
await client.callTool("set_field", {
  return_id: "2026-john-smith",
  concept: "employment_income",
  value: 82400,
  source: "t4_acme.pdf"
});

// An adapter translates that concept to the tax software's native representation.
```

Concept-to-vendor mappings are maintained per tax year, software, and return type.

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
  adapters/
    taxprep/            # CCH iFirm Taxprep adapter
    dtmax/              # DT Max adapter (planned)
  tools/                # MCP tool implementations
```

## Contributing

We welcome contributions — especially:

- **New adapters** for professional tax software
- **Concept mappings** for additional return types (T2, T3, T5013)
- **Tax year updates** to mappings
- **Safer tool and review patterns** for AI-assisted tax workflows

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Who builds this?

fisc is built by [Coalesc](https://coalesc.ai), which is building an end-to-end workspace where accountants and AI prepare, review, and move client engagements forward together. We plan to use fisc as an interoperability layer between that workspace and the tax software firms already use.

## License

[Apache License 2.0](LICENSE)
