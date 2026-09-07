# Security and vendor boundaries

This library writes into tax returns a firm signs. A wrong value here is not a bug report, it is a filing. Four boundaries matter more than anything else in the code.

## 1. Nothing is written without a decision

Every mutation takes a `mode`.

- `validate` — **the default**. Returns what *would* change, and the diagnostics a reviewer should see. Changes nothing.
- `commit` — performs the write.

`mode` is optional on every mutating tool and resolves to `validate` when absent (`src/index.ts`), so a caller that never passes `commit` cannot alter a return, whatever else it does. `get_capabilities` reports `default_mutation_mode` so a client can confirm this rather than assume it.

Automation is expected to plan in `validate` and hand the result to a person. The preparer's approval is what turns a plan into a write — not the model's confidence.

An adapter must explicitly declare support for a write before fisc exposes it as available. An adapter that claims what it cannot do turns a clean refusal into a half-finished return.

## 2. No taxpayer secrets through the tool surface

`create_return` and the field tools take an **opaque `taxpayer_ref`**, not a SIN. The schema says so in the tool description the model reads:

> `Opaque taxpayer reference. Do not pass a SIN directly through the MCP tool.`

MCP arguments travel through an agent's context, and anything in that context may be logged, cached, or replayed by software neither you nor we control. A SIN is the one identifier a taxpayer cannot rotate after a leak. Keep the mapping from `taxpayer_ref` to a real person in the application, on your side of the boundary.

The same reasoning applies to anything else you would not want in a transcript: full addresses, dates of birth, account numbers. Pass references, resolve them where the credentials already live.

## 3. Credentials stay with the customer

fisc holds no vendor credentials of its own and ships none. A vendor adapter reads its configuration from the environment the customer controls, under the terms that customer has with that vendor.

```
                                customer environment
                          ┌────────────────────────────────┐
agent  →  fisc (MCP)  →   │  adapter  →  vendor API        │
                          │      ↑                         │
                          │  credentials, entitlements,    │
                          │  vendor terms                  │
                          └────────────────────────────────┘
```

`describe()` on an adapter returns the configured endpoint **and never the credentials**, so diagnostics can be pasted into an issue without leaking anything.

## 4. Vendor terms are a prerequisite, not a formality

The Taxprep adapter is **intentionally disabled for production operations**. Every mutating call throws until the applicable CCH iFirm Taxprep API access, authentication model, endpoint contract, and vendor terms have been verified — and that verification has not been done.

This is deliberate. Tax software vendors govern API access through agreements that typically distinguish a customer integrating for its own internal use from a third party offering an integration to many firms, and those two situations are not interchangeable.

**Before enabling any vendor adapter, read that vendor's own API terms and confirm, in writing where the vendor requires it:**

- whether your intended use is a customer's own internal use, or an offering to multiple organizations;
- whether the credentials you hold may be used for more than one organization;
- what the vendor requires before an integration is commercialized or broadly promoted;
- what the vendor's terms say about storing, caching, or transmitting return data.

We deliberately do not paraphrase any vendor's policy here. Read the vendor's, for the version in force on the day you deploy.

## 5. What belongs in this repository

**Here:** vendor-neutral concepts, the adapter contract, the adapters we write, and documentation.

**Not here:** vendor SDKs or binaries, code that links one, credentials, tokens, connection strings, taxpayer data, client data, or cell-ID maps obtained under an agreement that does not permit publishing them.

`.env.example` documents shape only. Real values belong in the customer's environment.

## Running it safely

- **Least privilege.** Use the narrowest vendor permission set that does the job. A read-only credential is the right default until a write has been reviewed end to end.
- **Preview, then commit.** Treat `validate` output as the thing a person reviews, not as a formality before an automatic `commit`.
- **Record every production mutation** — actor, engagement, evidence, requested action, approval, and vendor result. fisc does not keep this for you; the application around it must.
- **Carry evidence.** `set_field` accepts an `EvidenceRef` with a source document, page, and checksum. A number in a return that cannot be traced to a document is a number nobody can defend in a review.
- **Cell IDs move.** Vendor field identifiers change when forms change, typically yearly. A mapping verified for one tax year is not verified for the next.

## What this document does not claim

fisc holds **no certification of any kind** — not SOC 2, not ISO 27001, not any vendor's partner accreditation. Nothing here should be read as a statement that a deployment built on fisc meets a regulatory or professional standard. That assessment belongs to the firm deploying it, against its own obligations.

## Reporting a vulnerability

<hello@coalesc.ai>. Please do not open a public issue for a security report.
