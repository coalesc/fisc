# Entitlements

An adapter needs two different things to work, and only one of them is code.

The first is configuration — a URL, a key, a path. The second is an **entitlement**: a licence, a purchased module, a security role, or a condition about where the software runs. Configuration is something you set. An entitlement is something a firm either holds or does not, and no amount of code makes up for its absence.

fisc declares entitlements so they fail at startup with a sentence you can act on, instead of failing at the first write with a vendor error nobody can read.

## How it works

Every adapter reports a `requires` list in `get_capabilities`. Before it will construct, each id in that list must appear in `FISC_ENTITLEMENTS`:

```bash
FISC_ENTITLEMENTS=ifirm.taxprep_module,ifirm.api_administration_role,ifirm.credentials_stay_in_firm_environment \
FISC_ADAPTER=ifirm npm start
```

Asserting an entitlement is a statement by the person deploying fisc. **Nothing here verifies a licence and nothing here pretends to.** What the mechanism prevents is the quieter failure: an adapter reaching a vendor it was never entitled to reach, because the requirement lived in a document nobody opened.

If one is missing, the process refuses to start and names it:

```
Adapter 'ifirm' requires entitlements that have not been asserted: ifirm.taxprep_module.
Each one is a thing the firm must already hold:
  - ifirm.taxprep_module: The firm subscribes to the CCH iFirm Taxprep module…
```

## `ifirm` — CCH iFirm Taxprep, cloud

| Entitlement | What it means |
|---|---|
| `ifirm.taxprep_module` | The firm subscribes to the Taxprep **module**, not only iFirm practice management. This is the most common reason an integration that looks obviously possible is not: an iFirm site without the module holds no returns, and none of these endpoints exist on it. |
| `ifirm.api_administration_role` | Somebody at the firm holds the Taxprep API Administration access role and has minted a key. Keys are self-serve from within the firm's own site; they are not something a third party can obtain. |
| `ifirm.credentials_stay_in_firm_environment` | fisc is deployed where the firm controls it and the key is not transported elsewhere. **This one is about your architecture, not the firm's purchase order** — see below. |

Configuration: `IFIRM_SITE_URL`, `IFIRM_API_KEY`, optionally `IFIRM_CELL_MAP_PATH` and `IFIRM_TIMEOUT_SECONDS`.

## `taxprep` — Taxprep, desktop

| Entitlement | What it means |
|---|---|
| `taxprep.com_module` | The COM module is purchased and activated on that installation, or the deployment holds an Integration Partner runtime licence key. The vendor documents both routes; the second is a commercial conversation with the vendor, not a setting. |
| `taxprep.windows_host_in_firm_environment` | fisc runs on the firm's own Windows host, beside the installation. There is no remote endpoint for desktop Taxprep, so this is a description of the only architecture that works as much as it is a boundary. |

No transport is implemented yet, so every operation reports `false`.

## The one that is about us

`ifirm.credentials_stay_in_firm_environment` and `taxprep.windows_host_in_firm_environment` are not the firm's obligations. They are ours.

Vendor agreements in this market routinely restrict who may hold account access information and who counts as an authorized user of a practice's software. A firm that emails its API key to a supplier may be in breach of its own subscription agreement, and it will not be the supplier who hears about it.

So fisc is built to run where the credential already lives. Reaching a firm's tax software from a multi-tenant service holding many firms' keys is a different architecture with different permissions, and it is not this one.

## Reading the terms

Every `source` in an entitlement is a link to the vendor's own documentation or agreement. **Follow it, in the version in force on the day you deploy.**

fisc deliberately does not quote or paraphrase vendor terms — a paraphrase ages badly, and a quotation in a public repository reads as authoritative long after the clause has changed. The vendor's text is the text.

| Vendor | Where the terms live |
|---|---|
| Wolters Kluwer (Taxprep, Cantax, CCH iFirm) | <https://support.wolterskluwer.ca/en/eula/> |
| Thomson Reuters (DT Max) | in-product: Help → About → licence agreement |

## Adding an entitlement to an adapter

Declare it where the adapter is, not in a README:

```ts
export const MYVENDOR_ENTITLEMENTS: Entitlement[] = [
  {
    id: "myvendor.api_licence",
    description: "What the firm must hold, in plain terms.",
    source: "https://vendor.example/the-page-that-says-so",
  },
];
```

Then call `assertEntitlements(this.name, MYVENDOR_ENTITLEMENTS, assertedEntitlements())` in the constructor and return the list as `requires` from `getCapabilities()`.

Three rules for writing one:

1. **Describe what the firm holds, not what we want.** "The COM module is activated on that installation" is checkable by the person reading it. "Vendor access is in place" is not.
2. **Link the page that states the requirement.** If no such page exists, say so in the description rather than inventing a citation.
3. **One entitlement per thing that can independently be missing.** A firm can hold the module and lack the role. Bundling them produces an error message that does not say what to go and do.
