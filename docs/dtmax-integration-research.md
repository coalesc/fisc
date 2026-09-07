# DT Max — what a fisc adapter can and cannot do

**Status:** research, no implementation. Findings from 2026-09-06 and 2026-09-07.
**Companion documents:** [`cra-landscape.md`](./cra-landscape.md) for what the tax
authority opens and gates, [`prior-art.md`](./prior-art.md) for how the IRS and Intuit
modelled tax logic.

**Method:** the entire public DT Max knowledge base (2,992 articles) fetched and parsed,
the official T1 User Guide, the DT FormMax KB, CRA certification and EFILE pages, plus
direct inspection of **six real DT Max output PDFs** from a live firm (licence 33113),
spanning two software versions, a couple return, a non-resident, and two nil returns.

Every claim below is tagged **VERIFIED** (read on a primary source, or measured against
a real document) or **UNVERIFIED**.

---

## Verdict

A DT Max adapter is **read-ready today and write-undecided**, and — unlike Taxprep —
**it needs no vendor relationship to start**. Reading is proven against real returns.
Writing hangs on one unopened file: whether `Tools → Extract` produces something we
can also produce.

| Operation | DT Max | Mechanism |
| --- | --- | --- |
| `list_forms` / concepts | ✅ | vendor-neutral, already in `src/concepts` |
| **`get_field`** | ✅ **buildable today** | parse the *Sommaire comparatif* page of a produced return |
| `set_field` — **T2** | ⚠️ plausible | **Standard GIFI file import**, documented and built for third parties |
| `set_field` — **T1 / T2 / T3** | ⚠️ **the open question** | **`Tools → Merge`**, DT Max's own client interchange — reads an Extract file back into a database |
| `create_return` | ❌ | nothing documented |
| `get_diagnostics` | ❓ | UNVERIFIED — not investigated |

**This inverts the current adapter order.** Taxprep (#4) is blocked on CCH iFirm API
credentials that nobody has. DT Max is blocked on nothing.

---

## 1 · There is no API. This is settled — do not re-ask.

**VERIFIED NEGATIVE.** Corpus-wide counts across all 2,992 knowledge-base articles:

| Term | Hits |
| --- | --- |
| `API`, `APIs`, `SDK`, `REST`, `OAuth`, `JSON`, `webhook` | **0** each |
| "partner program", "developer program", `ISV` | **0** each |
| COM object / OLE automation / ActiveX | **0** |
| PowerShell / VBScript / AutoIt / AutoHotkey | **0** |
| "web service" | 33 — **every one is CRA's EFILE/AFR**, never a DT Max API |

No published import/export specification exists on Thomson Reuters' site or in the KB.

**VERIFIED — ownership.** `dtmax.ca` `301`s to `thomsonreuters.ca/en/dtprofessionalsuite`.
Legal entity: **Thomson Reuters DT Tax and Accounting Inc.** (formerly Dr Tax; the
`drtax.ca` domain still hosts all support infrastructure).

**⚠️ Correction to a common assumption: Taxprep and Cantax are Wolters Kluwer, not
Thomson Reuters.** `taxprep.com` and `cantax.com` both resolve to `support.cch.com`, and
CRA's certified-software list attributes *"Corporate Taxprep"* to **Wolters Kluwer Canada
Limited** and *"DT Max T2"* to **Thomson Reuters DT Tax and Accounting Inc.** on the same
page. Four separate vendors, not two — and **TaxCycle is owned by Xero Software (Canada)
Ltd**, per its own footer.

---

## 2 · The read path: a produced return is a TaxFact table

This is the finding that makes the adapter worth building.

**VERIFIED against six real documents.** A DT Max T1 return PDF opens with:

- **page 0 — `Sommaire principal`**: name, DT Max client number, SIN, date of birth,
  **province of residence**, marital status, full address, phone, and federal/Quebec
  refund or balance due.
- **page 1 — `Sommaire comparatif - T1`**: every T1 line, **with its official CRA line
  number**, across **five tax years**.
- **page 2 — `Sommaire comparatif - TP1`**: the same for the Quebec return.

The comparative summary was present in **5 of 5** full returns examined, across two
software versions — so it is part of the firm's standard print set, not an option
someone enabled.

### Measured against this repo's own concept pack

| | |
| --- | --- |
| `src/concepts/index.ts` T1 concepts carrying a `cra_line` | **30** |
| Numbered lines on one `Sommaire comparatif` page | **141** |
| **fisc concepts found in the DT Max PDF, matched by CRA line number** | **28 / 30** |

The two misses are `rental_income_gross` (12599) and `self_employment_income_gross`
(16199) — gross variants that the summary reports net.

French labels match exactly. `employment_income` / `"Revenus d'emploi"` / `10100` in this
repo is character-for-character what DT Max prints. **The concept pack and the vendor's
own output already agree**, which is a stronger validation of the `TaxConcept` model than
anything written from documentation.

The document also offers **141 numbered lines against our 30 concepts** — ground truth
for growing the pack, rather than transcribing a CRA publication.

### Every document is self-describing

**VERIFIED.** Each page carries a header:

```
Lic:33113/28.21/24  30 avr 2025  #1962
    │      │     │   │            └─ DT Max client number
    │      │     │   └─ production date
    │      │     └─ tax year
    │      └─ DT Max version
    └─ licence number = the firm
```

Observed: version `28.21` (TY2024) and `29.12` (TY2025) from the same licence. Layout
differs between versions.

**This is what makes a parser safe.** Because the version is stamped on the page, the
adapter can **refuse to parse an unrecognised version** rather than silently mis-read it.
A wrong number here is a wrong tax return; declining is the only acceptable failure mode.

### Real-document edge cases already observed

| Case | Document | What it proves |
| --- | --- | --- |
| Couple | `Particulier` / `Conjoint` / `Total pour le couple` as three fixed x-columns | Whose money is whose is recoverable — the individual column can be empty while the couple total is not |
| **Non-resident** | province reads `Non résident` | Jurisdiction is not merely QC-vs-other; there is a third case with entirely different slip requirements |
| Nil return | total income $4,120, no tax, no refund | "No value" and "parse failed" are different, and must stay different |
| Version drift | 28.21 vs 29.12 | Branch on the stamped version; never assume one layout |

### The PDF is the better *read* source — but the Extract file is a different question

For reading, the PDF wins. TaxCycle parses the Extract file — proof a third party can,
with no API and no vendor cooperation — but documents its own ceiling:

> *"this carryforward is limited by the data that is exported from DT Max® T2 and is not
> as comprehensive as our other competitor carryforwards."*

> *"Due to the way data is stored in DT Max®, TaxCycle cannot index the DT Max® tax
> returns in the Client Manager."*

The PDF, by contrast, is produced for every client every year and needs **no action from
the preparer** — they already print it.

**But reading was never the interesting thing about Extract.** See §3.1.

→ https://www.taxcycle.com/resources/help-topics/carryforward/dt-max-carryforward/

---

## 3 · The write path

Two candidates, not one. The first is documented and narrow. The second is undocumented
and is the one that matters.

### 3.1 · `Tools → Merge` — DT Max's own client interchange, and the open question

**This was under-rated in the first pass of this document, and the correction matters.**

`Tools → Extract` writes an interchange file containing selected families; **`Tools →
Merge` reads one back into a database.** It is DT Max's sanctioned, in-product mechanism
for moving complete client data between installations — **not limited to T2**, and not
limited to the thin slice GIFI covers.

Two things make it credible:

- **It is DT Max's own mechanism**, shipped and supported, not a hole someone found.
- **TaxCycle already parses the format** with no API and no vendor cooperation. What can
  be read can usually be written.

**What is not yet known, and settles it either way:** whether the file is text, XML, or
proprietary binary. DT Max's data model *is* keywords — the preparer enters a keyword and
a value — so if the Extract is a keyword dump, writing one is very tractable. If it is
binary, this path closes and GIFI is all there is.

**The real danger is not parsing — it is `savelevel`.** VERIFIED: Merge arbitrates by an
internal counter incremented on every save, with a force-merge override. A file written
with a higher savelevel **can overwrite a preparer's work**. Any write path must be
built around never doing that, and validated on a throwaway database before it touches a
real one. Also VERIFIED: client numbers must be unique or the merge fails, and **a T1
client cannot be extracted without their whole family unit** — consistent with the four
consecutive client numbers observed in one family in the corpus.

→ https://support.drtax.ca/dtmax/eng/kb/dtmax/DT%20Max%20help%20directory/DT%20Max%20features/Extract%20and%20merge/w275.htm

**One Extract file answers this.** `Tools → Extract`, one test family, to a file. Fifteen
seconds of a preparer's time, no vendor involved. It is the highest-value artifact named
anywhere in this document.

### 3.2 · Standard GIFI file import — documented, supported, T2 only

**VERIFIED — the only documented third-party → DT Max import.**

> *"Standard GIFI files produced by third party software such as Caseware or Simply
> Accounting can be imported into DT Max."*

Keyword `GIFI` → `Import`, `GIFI-File` = full path; or File → *Import GIFI*. Sections are
individually selectable, `NETINCOME` and `TAXONCAPITAL` can be updated, and re-import
replaces cleanly. DT Max confirms creation date, corporation name and fiscal year-end
from the file before importing.

**The layout is not published.** CRA's RC4088 publishes GIFI *codes*, not the interchange
format. It is a de-facto convention shared by CaseWare / Sage / Taxprep / DT Max. One
sample file reverse-engineered against RC4088 settles it.

→ https://support.drtax.ca/dtmax/eng/kb/dtmax/DT%20Max%20help%20directory/T2/w506.htm

### 3.3 · What we would actually push, and why AFR does not close the gap

**VERIFIED — CRA's Auto-fill My Return already populates DT Max, for free** — T4, T4A,
T5, T5008, T2202, RRSP and more, per DT Max's own page. Limits: 10 files per download,
and CRA will not deliver more than 500 T5008 slips.

**What Auto-fill is, and what it is gated on, lives in
[`cra-landscape.md`](./cra-landscape.md)** — including the open question of whether a
non-transmitting product can be certified for Auto-fill alone, which would change this
picture substantially.

So **the keying step for T1 slips is largely already eliminated by the government.** Any
business case for a T1 `set_field` must be sized against AFR, not against manual entry.

**But that sharpens the target rather than removing it.** AFR delivers *slips*. It does
not deliver anything that arrives as a receipt, a declaration, or a judgment call:

| What AFR does not deliver |
| --- |
| medical expenses — and the insured-client total that replaces the receipts |
| charitable donations |
| childcare expenses |
| self-employment income and expenses |
| rental income |
| moving expenses |
| anything the client had to be *asked* for |

That list is precisely what an intake questionnaire collects. So the write path's value
is not "type the T4 faster" — CRA already did that — it is **the non-slip half of the
return, which only whoever spoke to the client can supply.**

CRA fills the slips. fisc fills the rest. Nothing is replaced.

→ https://support.drtax.ca/dtmax/eng/kb/dtmax/DT%20Max%20help%20directory/T1/w499tdd.htm

### 3.4 · Explicitly ruled out

- **Writing client data files directly.** `12345.P02` is *"a Dr Tax proprietory format
  file"*; only the `DT1DB` index is Btrieve. The KB: *"If this file is lost or damaged it
  cannot be recovered, (except by restoring a backup)."* Never.
- **Generating a T1/T2 EFILE transmission.** No public record layout, no XSD, and the
  gate is certification rather than technology. See
  [`cra-landscape.md`](./cra-landscape.md) §2.
- **Macros as a scripting facility.** 26 text macros, A–Z, **40 characters each**, and
  *"macros cannot consist of keywords, or keywords combined with numeric or alphanumeric
  information."*

---

## 4 · A free win, unrelated to data: documented command-line arguments

**VERIFIED.**

```
DTMax.exe /T1 /Y2025 /Ujean /Pxy999 /Fd:\taxdata /c112233 /GO
```

| Arg | Meaning |
| --- | --- |
| `/T1` `/T2` `/T3` `/T4` | module (`/T4` = T5013) |
| `/U…` `/P…` | user / password |
| `/C…` | set current client number |
| `/Y…` | tax year |
| `/F…` | database path (no spaces) |
| `/GO` | bypass login |

A deep link, not a data pipe — it cannot inject values. But it drops a preparer on the
right client, year and module with no login screen, and it is free and documented.

→ https://support.drtax.ca/dtmax/eng/kb/dtmax/DT%20Max%20help%20directory/Installation%20and%20setup/Install%20program/w101par.htm

---

## 5 · A gap in `AdapterCapabilities`

`AdapterCapabilities` declares `return_types` for the adapter and a flat boolean per
operation:

```ts
return_types: ReturnType[];
operations: { set_field: boolean; /* … */ };
```

DT Max cannot describe itself in that shape. Its truth is **`set_field` is available for
`t2` (via GIFI) and unavailable for `t1`** — so the adapter must either claim
`set_field: true`, which lies about T1, or `false`, which denies a real T2 capability.

Neither is acceptable for a layer whose job is telling an agent what it may attempt.
Suggested shape, per-operation return types:

```ts
operations: {
  set_field: { supported: true, return_types: ["t2"] },
  get_field: { supported: true, return_types: ["t1", "t2"] },
  create_return: { supported: false },
}
```

Related to #5 (*MCP is a transport, not the architecture*) — capability description is a
core-service concern, not an MCP-surface one.

---

## Next steps, in order

1. **One file, fifteen seconds, no vendor — and it decides the whole write question.**
   A **DT Max Extract file**: `Tools → Extract`, one test family, to a file. Open it. If
   it is text or a keyword dump, `Tools → Merge` is a supported write path for T1/T2/T3
   and the adapter becomes bidirectional. If it is proprietary binary, that path closes
   and GIFI is all there is. Nothing else in this document is worth as much per minute
   of a customer's time.
   *(A **standard GIFI file** is worth collecting at the same time — reverse the layout
   against RC4088 — but it only ever unlocks T2.)*
2. **Build the read adapter** against the six-document corpus. Version-gated: parse only
   recognised versions, refuse the rest.
3. **Read the EULA.** **NOT DETERMINED** — the licence agreement is shown in-product only
   (Help → About DT Max → *Read licence agreement*); the KB page is a title-only stub and
   `thomsonreuters.ca/en/terms-of-use.html` governs the website, not the software. Zero
   hits for "reverse engineer" / "decompile" / "disassemble" across the KB. Note the
   posture difference: reading a **customer's own output document** is not decompiling
   software. Read the clause before authorising any binary-format work.
4. **One question to Thomson Reuters**, and only this one. DT Max advertises *"Data
   conversion from competing tax software"*, yet there are **zero** mentions of Taxprep,
   Cantax, ProFile or VisualTax across all 2,992 KB articles. If their converter reads a
   competitor's format, that is a data-injection path TR built and maintains. Ask
   `DT-sales@thomsonreuters.com`: *"Publish the GIFI import file layout, and tell us what
   the T1/T2 competitor-conversion reads."* Not *"do you have an API"* — that is settled.

## What remains undetermined

1. The GIFI import file layout.
2. **The DT Max Extract file structure — now the single most valuable unknown.** Text,
   XML or binary is not established. Nor is whether a written file survives `Merge`,
   nor how `savelevel` must be set to add data without overwriting a preparer's work.
3. The EULA's reverse-engineering clause.
4. Which competitor formats the "Data conversion" feature reads, and whether it is
   self-serve or support-performed.
5. Whether the TR-hosted (SaaS) DT Max permits local filesystem access.
6. Whether the `E_OUT` transmission artifacts (`.TEP`, `.COR`, `T3_xxx.XML`) are
   parseable for reconciliation — no sample inspected.
7. Whether any non-TR document-management or workflow vendor integrates with DT Max.
   Only TaxCycle and Doc.It/IRIS were checked.
