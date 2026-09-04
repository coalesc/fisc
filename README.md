# fisc

Open-source MCP interoperability layer for professional Canadian tax software.

`fisc` gives AI agents a vendor-neutral interface for systems such as **Taxprep**, **DT Max**, and other professional tax packages through the [Model Context Protocol](https://modelcontextprotocol.io).

```text
Your AI agent
    ↓ MCP
   fisc
    ↓ vendor adapters
Taxprep · DT Max · ...
```

## Why this exists

Canadian accounting firms already trust tax software that encodes years of tax rules, diagnostics, filing workflows, and review behaviour. Agents should not require firms to replace those systems or learn vendor-specific cell IDs.

`fisc` is the interoperability layer. Coalesc builds above it: engagement state, document intelligence, evidence, approvals, orchestration, review controls, and the reasoning that decides what should happen next.

**Open the rails; compete on the workflow and intelligence.**

## Status

**Early development. Do not use fisc to modify production tax returns yet.**

The MCP contract now supports T1, T2, T3, and T5013 as protocol return types. Only verified concept packs should be published; the current concept pack is still limited to a starter set for T1.

The first vendor adapter is Taxprep. It remains intentionally disabled for production operations until the applicable CCH iFirm Taxprep API access, authentication model, endpoint contract, and vendor terms have been verified.

## MCP tools

| Tool | Purpose |
|---|---|
| `get_capabilities` | Report the configured adapter and operations it actually supports |
| `list_concepts` | List verified vendor-neutral concepts for a return type |
| `create_return` | Validate or create a tax return |
| `set_field` | Validate or write a semantic tax field with optional evidence provenance |
| `get_field` | Read a semantic tax field |
| `list_forms` | List forms in a return |
| `list_returns` | List returns visible to the configured adapter |
| `get_diagnostics` | Retrieve vendor validation diagnostics |

Mutation tools default to **validate** rather than **commit**. An adapter must explicitly support a write operation before fisc should expose it as available.

## Safety model

MCP is an interface, not an authorization system. Production deployments must add controls around it.

- **Least privilege:** use the narrowest vendor permissions available.
- **Validate before commit:** writes should be previewed before they are applied.
- **Evidence provenance:** material writes can carry a source document reference, page, and checksum.
- **No raw taxpayer secrets in agent prompts:** use opaque internal taxpayer references instead of passing SINs through MCP tools.
- **Customer-controlled credentials:** vendor credentials should remain in the environment authorized by the customer and vendor terms.
- **No credential sharing in this repository:** secrets, tokens, customer data, and vendor SDK binaries do not belong in git.
- **Audit every production mutation:** the application using fisc should record actor, engagement, evidence, requested action, approval, and vendor result.

## Architecture

`fisc` separates semantic tax concepts from vendor integrations.

```text
src/
  index.ts                 MCP server and safety defaults
  concepts/                verified vendor-neutral tax concepts
  adapters/
    types.ts                common adapter contract
    taxprep/                Taxprep adapter
    dtmax/                  planned
```

An agent should work with concepts:

```ts
await client.callTool("set_field", {
  return_id: "return-123",
  tax_year: 2026,
  concept: "employment_income",
  value: 82400,
  evidence_source_id: "doc-456",
  evidence_page: 1,
  mode: "validate"
});
```

The adapter is responsible for translating that concept to a verified vendor-native field for the correct tax year.

## Why open source

The interoperability contract should not be Coalesc's lock-in.

An open layer makes integrations inspectable, lets firms and vendors contribute adapters, reduces duplicate plumbing across the profession, and makes it easier to verify what an agent is allowed to ask tax software to do.

What is **not** part of this repository:

- Coalesc's engagement orchestration and agent policies
- customer-specific methodology and mappings
- proprietary review logic and evals
- customer credentials or data
- vendor SDK code, binaries, or documentation that cannot legally be redistributed

Adapters are open only where vendor agreements permit it. A public adapter may expose an open contract while loading a separately licensed vendor SDK at runtime.

## Vendor access

Each adapter must use a supported integration path and comply with the vendor's terms. Do not scrape professional tax software or bypass authentication controls just to make an adapter work.

Before enabling a vendor adapter in production, verify:

1. the customer's license permits the integration;
2. Coalesc is permitted to provide the integration commercially;
3. the authentication and credential boundary is approved;
4. multi-tenant use is permitted where applicable;
5. SDK/API redistribution terms permit any code or artifacts included here.

## Contributing

Useful contributions include:

- adapters for professional tax software;
- verified T2, T3, T5013 and additional T1 concept mappings;
- tax-year mapping updates;
- conformance tests shared across adapters;
- safer mutation, approval, and provenance patterns.

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Apache License 2.0. Vendor APIs and SDKs remain subject to their own licenses and agreements.
