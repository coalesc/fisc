# fisc

Open interoperability layer for professional tax software.

**fisc lets software and AI work with tax returns through portable tax concepts instead of vendor-specific APIs, cell IDs, and file formats.** MCP is the first transport, not the architecture.

> **Status:** early development. fisc is not yet ready for production tax work. The Taxprep adapter is being built first; DT Max is planned after a supported integration path is confirmed.

## The idea

Professional tax software is specialized and trusted. AI products should not need to replace it, and every developer should not have to rebuild the same private connector layer.

fisc separates four things:

```text
AI agent / application
        ↓
MCP · SDK · REST (transports)
        ↓
TaxInteroperabilityService
        ↓
canonical tax concepts · evidence refs · write plans
        ↓
Taxprep adapter · DT Max adapter · ...
        ↓
professional tax software
```

A caller can work with a concept such as `employment_income` or `rrsp_deduction`. The adapter translates that concept to the representation used by the configured tax package for the right return type and tax year.

That means the durable asset is the **common tax interface and adapter ecosystem**. MCP is simply one way to expose it.

## Why open source?

**We do not think the connector should be the lock-in.**

Accounting firms should be able to connect software and AI to the tax systems they already trust through an interface that is inspectable, portable, and open to contributions. Developers and software vendors should be able to add adapters without rebuilding the same plumbing in private.

Coalesc builds above this layer: engagement state, document intelligence, evidence, completeness, orchestration, review controls, and the reasoning that decides what should happen next.

**Open the rails. Compete on the intelligence and workflow.**

## What fisc is — and is not

fisc aims to provide:

- vendor-neutral tax concepts;
- tax-year-aware vendor mappings;
- adapter capability discovery;
- portable return references;
- evidence/source references;
- safe read operations;
- plan-before-write semantics;
- idempotency and conflict guards;
- diagnostics and form access where vendors support them;
- multiple transports over the same core service.

fisc is **not** intended to be:

- a tax reasoning engine;
- an eligibility or tax-position engine;
- a replacement for professional tax software;
- a filing authority;
- a substitute for accountant review;
- a store of client tax data by default.

The interoperability layer should know **how to express an operation safely**. The host application and accountant remain responsible for **why the operation should happen**.

## Safety model: plan before write

A direct `set_field` call is simple, but it is a poor default for autonomous software.

fisc uses a two-step write model:

```text
proposed changes
      ↓
plan_changes        ← no vendor mutation
      ↓
inspect mappings, warnings, evidence, conflicts
      ↓
policy / human approval
      ↓
apply_plan          ← explicit mutation
```

A write plan can include:

- the canonical concept;
- proposed value;
- source evidence references;
- optional evidence content hashes;
- the resolved vendor field;
- warnings or unmapped concepts;
- an optional expected current value to prevent stale overwrites;
- an idempotency key.

The host application decides what approval policy is appropriate. fisc does not pretend that every tax write deserves the same level of autonomy.

## Core API

The TypeScript package exposes a transport-agnostic `TaxInteroperabilityService`.

```typescript
import { TaxInteroperabilityService } from "@coalesc/fisc";

const fisc = new TaxInteroperabilityService([adapter]);

const plan = await fisc.planChanges(
  {
    id: "return-123",
    adapter: "taxprep",
    tax_year: 2026,
    return_type: "t1",
  },
  [
    {
      concept: "employment_income",
      value: 82400,
      sources: [
        {
          id: "t4-acme",
          kind: "document",
          page: 1,
          content_hash: "sha256:...",
        },
      ],
    },
  ],
  "engagement-456:employment-income:v1",
);

// Inspect plan.changes and plan.warnings first.
// Applying remains explicit and approval-aware.
```

The same service can sit behind MCP, a REST API, a TypeScript SDK, a future Python SDK, or a vendor-hosted integration.

## MCP transport

MCP is the first supported transport because it gives agents a standard way to discover and invoke tools.

Planned/current tool surface:

| Tool | Purpose |
|---|---|
| `list_concepts` | Discover portable tax concepts |
| `list_adapters` | See configured adapters and capabilities |
| `get_capabilities` | Inspect what an adapter can actually do |
| `create_return` | Create a return where supported |
| `get_field` | Read a concept from a return |
| `plan_changes` | Resolve proposed writes without mutation |
| `get_write_plan` | Inspect a plan before applying it |
| `apply_plan` | Explicitly apply an approved plan |
| `list_forms` | List forms where supported |
| `get_diagnostics` | Read vendor diagnostics |
| `list_returns` | List returns where supported |

## Canonical tax concepts

Instead of teaching every caller vendor-specific identifiers, fisc exposes semantic concepts:

```typescript
employment_income
interest_income
rrsp_deduction
medical_expenses
childcare_expenses
```

Concept metadata can include human labels, CRA line numbers, and common source forms. Vendor mappings remain separate and are maintained per software, return type, and tax year.

The open concept layer should stay factual and portable. Higher-order reasoning — for example, deciding whether a deduction should be claimed, by whom, and with what review policy — belongs above fisc.

## Adapters

### Taxprep

**In progress.** The adapter targets the supported CCH iFirm Taxprep Web API. The current implementation can express capability metadata and produce safe write plans from mappings, but API-backed reads/writes are not yet implemented.

### DT Max

**Planned.** The integration path is still under research. We will not claim an adapter until there is a supported and maintainable way to integrate.

### More adapters

The adapter contract is intentionally vendor-neutral. Future contributors can add other professional tax packages without changing the core tax model.

## Incubating sibling domain contracts

Tax is the first implementation, but the same open-rails idea can extend to other professional accounting systems.

This repository currently includes **non-functional contract skeletons** for two adjacent domains so the concepts can be discussed in public without pretending integrations exist.

### Compilation

The compilation skeleton models portable concepts such as:

- trial balance lines;
- accounts;
- adjusting entries;
- workpapers;
- evidence references;
- review points;
- plan-before-write journal changes.

A future adapter could translate those concepts to systems such as CaseWare while callers continue to speak accounting rather than vendor file structures.

### Assurance

The assurance skeleton models mechanics such as:

- engagement type;
- financial-statement assertions;
- procedures and procedure status;
- samples;
- evidence;
- findings;
- workpapers;
- sign-offs.

It intentionally **does not** encode audit conclusions, materiality decisions, sufficiency judgments, or other professional judgment. The interface can move evidence and workpaper state; the auditor remains responsible for the conclusion.

These contracts are incubating. They are not exposed as fisc MCP tools and they do not imply a working CaseWare integration.

## Project structure

```text
src/
  core/
    types.ts             # portable tax contracts
    service.ts           # transport-agnostic interoperability service
  concepts/
    index.ts             # canonical tax concepts
  adapters/
    types.ts             # vendor adapter contract
    taxprep/             # Taxprep adapter
  transports/
    mcp.ts               # MCP interface over the core service
  incubating/
    compilation.ts       # compilation contract skeleton
    assurance.ts         # assurance contract skeleton
  index.ts               # library exports
  cli.ts                 # stdio MCP executable
```

## Design principles

1. **Canonical concepts before vendor fields.** Callers should speak tax, not Taxprep internals.
2. **Core before transport.** MCP, REST, and SDKs should expose the same domain service.
3. **Capabilities over assumptions.** Every adapter says exactly what it supports.
4. **Plan before mutation.** Autonomous software should inspect the write before changing a professional system.
5. **Evidence travels with the value.** Interoperability should preserve provenance instead of stripping it away.
6. **Tax year is explicit.** Mappings must never silently assume the current year.
7. **Adapters translate; they do not reason.** Professional judgment belongs above the connector layer.
8. **Open the plumbing, not the firm's private context.** Client data, firm policies, and proprietary reasoning do not belong in the open standard.

## Getting started

```bash
git clone https://github.com/coalesc/fisc.git
cd fisc
npm install
npm run build
```

To run the MCP transport once an adapter is configured:

```bash
cp .env.example .env
# Add supported vendor API credentials
npm start
```

## Contributing

We welcome contributions, especially around:

- professional tax software adapters;
- tax-year mappings;
- additional return types such as T2, T3, and T5013;
- canonical concept design;
- conformance tests;
- write-safety patterns;
- compilation and assurance contract feedback.

Please keep one boundary in mind: **fisc is interoperability infrastructure, not an open-source tax brain.**

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## Who builds this?

fisc is built by [Coalesc](https://coalesc.ai), the engagement workspace for accounting firms. Coalesc uses open interoperability infrastructure to connect its workflow to the professional systems firms already rely on.

## License

[Apache License 2.0](LICENSE)
