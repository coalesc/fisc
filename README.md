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

Taxprep is two products with one name, so there are two adapters.

| Adapter | What it talks to | State |
|---|---|---|
| `ifirm` | CCH iFirm Taxprep, the cloud module, over the vendor's Web API | endpoints built from published documentation, **never run against a live site** |
| `taxprep` | Taxprep on the desktop, over the COM automation module | specified, no transport, every operation reports `false` |

Neither should be pointed at a production return yet. The `ifirm` adapter can read and write cells where a verified cell map exists, and reports `set_field` and `get_field` as unsupported until one is loaded — the vocabulary is per-form and per-tax-year, and this repository ships none of it.

## MCP tools

| Tool | Purpose |
|---|---|
| `get_capabilities` | Report the configured adapter, the operations it supports per return type, and what the firm must hold to use it |
| `list_concepts` | List verified vendor-neutral concepts for a return type |
| `create_return` | Validate or create a tax return |
| `set_field` | Validate or write a semantic tax field with optional evidence provenance |
| `get_field` | Read a semantic tax field |
| `list_forms` | List forms in a return |
| `list_returns` | List returns visible to the configured adapter |
| `get_diagnostics` | Retrieve vendor validation diagnostics |

Mutation tools default to **validate** rather than **commit**. An adapter must explicitly support a write operation before fisc should expose it as available.

Support is declared **per return type**, not per operation. An adapter whose only sanctioned write path is corporate reports `set_field: ["t2"]` — a single boolean would have forced it to either promise a T1 write it cannot perform or deny a real T2 one.

## Safety model

MCP is an interface, not an authorization system. Production deployments must add controls around it.

**Before enabling any vendor adapter, read [docs/security.md](docs/security.md)** — it covers the validate/commit boundary, why a SIN must never travel through a tool argument, where credentials belong, and the vendor-terms check that has to happen first.

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
    types.ts                common adapter contract, entitlements
    ifirm/                  CCH iFirm Taxprep (cloud, Web API)
    taxprep/                Taxprep desktop (COM), specified only
    dtmax/                  DT Max (produced documents), specified only
docs/
  entitlements.md          what a firm must hold before an adapter runs
  cra-landscape.md         what the CRA opens, gates, and will never supply
  dtmax-integration-research.md   DT Max: read path, write path, and what is unknown
  prior-art.md             how the IRS and Intuit modelled tax logic
  explaining-a-decision.md why a rule did NOT fire, and how to say so
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

## Research

Findings are written down before they are built on, with sources, so the next reader can
re-check rather than trust. Each claim is tagged verified or unverified, and each
document ends with what it could **not** establish.

| Document | Question it answers |
| --- | --- |
| [`docs/cra-landscape.md`](docs/cra-landscape.md) | What the CRA publishes openly, what it gates behind EFILE certification, and the half of a return it will never hold |
| [`docs/dtmax-integration-research.md`](docs/dtmax-integration-research.md) | Whether DT Max can be read from and written to, measured against real returns and the vendor's full knowledge base |
| [`docs/prior-art.md`](docs/prior-art.md) | How others modelled tax logic, reasoned about missing information, ordered adaptive questions, and tracked required documents — and the two decisions that evidence settles |
| [`docs/explaining-a-decision.md`](docs/explaining-a-decision.md) | How to answer "why is this still outstanding, and what would change it" — the tri-state that records short-circuit evaluation, Doyle's blocking witness, and the joint-relevance bug Oracle documents |

Two facts from that work shape everything else here:

**CRA's Auto-fill My Return already delivers slips into certified tax software, for
free.** No integration should be justified by "types the T4 faster." The value is in
what arrives as a receipt or a declaration — medical expenses, donations, childcare,
self-employment, rental — which no tax authority can supply and only whoever spoke to the
client can.

**A vendor's own output is often a better source than its API.** DT Max has no API of any
kind, yet a produced return carries every CRA line across five tax years, and **28 of the
30 concepts in `src/concepts` appear in it**, matched by line number. Read what the
software already prints before asking anyone for access.

**Computing the tax is out of scope, and now for a measured reason.** Two mature US engines
agree on federal income tax for only 79.6–84.4% of 111,347 households within $15, and the
divergence is concentrated exactly where professional clients live: on wage-only inputs they
differ on one record by $0.01, but add itemized deductions, capital income and pass-through
business income and 1,000 records diverge, to a maximum of $27,840. No reusable Canadian
engine exists in any case — `openfisca-canada` does not exist, and the only open T1 has no
Quebec TP-1. See `prior-art.md` §9.

## Vendor access

Each adapter must use a supported integration path and comply with the vendor's terms. Do not scrape professional tax software or bypass authentication controls just to make an adapter work.

Before enabling a vendor adapter in production, verify:

1. the customer's license permits the integration;
2. Coalesc is permitted to provide the integration commercially;
3. the authentication and credential boundary is approved;
4. multi-tenant use is permitted where applicable;
5. SDK/API redistribution terms permit any code or artifacts included here.

Adapters declare these prerequisites as **entitlements** and refuse to start until the operator asserts them in `FISC_ENTITLEMENTS`. See [docs/entitlements.md](docs/entitlements.md).

Two of those entitlements are about where fisc runs. Vendor agreements here routinely restrict who may hold a firm's account access information, so adapters are built to run in an environment the customer controls, with the credential read from that environment rather than transported to us.

**Naming a vendor to say what an adapter talks to is descriptive. A logo, a "partner" claim, or any implication of certification or endorsement is not** — those need the vendor's written permission, separately from permission to build the integration at all.

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
