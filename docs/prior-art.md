# Prior art: how others modelled tax logic

Prior art for what this repository does, gathered 2026-09-07 across five parallel searches.
Nothing here is adoptable as-is; all of it is worth taking from. Sections 1–4 are the systems that
model tax logic, 5 the theory that bears on this repository's own types, 6 the scope line,
7–8 the decision this evidence settles and how anyone would test it.

**How to read the claims.** Every citation was verified against arXiv, Crossref, OpenAlex or a
primary page. Where only metadata was read and the *characterisation* comes from general
knowledge, that is flagged in the source reports rather than repeated on every line here —
treat a specific technical detail as worth re-checking before relying on it. Searches that
failed are recorded at the end.

**The IRS and Intuit systems were found by Étienne Beaulé, 2026-09-07.** All sources
below were read and verified the same day.

---

## The idea they all landed on

Neither system's most valuable property is computing tax. It is **reasoning about what is
missing**.

Intuit says it in five words in its abstract: *"reasoned to **find missing info**."*

That is this repository's problem, restated. A firm's real question is not *what is the
refund* — it is *do I have enough to start, and if not, what exactly am I waiting for.*
A model that knows which facts are still unknown answers that; a calculator does not.

---

## 1 · The IRS Fact Graph

**`IRS-Public/fact-graph`** — Scala, ★415, last pushed 2026-09-01. A standalone tax-logic
calculator targeting both JVM and JavaScript, extracted from **Direct File**
(`IRS-Public/direct-file`, ★4,587) so other IRS applications can consume it.

Its ADR 3.1 (authored 2025-06-05, published 2025-08-15) opens on a problem statement that
lands close to home:

> *"many IRS applications contain hard-coded, application-specific tax logic that is
> difficult and error-prone to update"*

→ https://github.com/IRS-Public/fact-graph/blob/main/docs/fact-graph-3.1-adr.md

### The vocabulary is the part to take

| Their term | What it means |
| --- | --- |
| **Fact Dictionary** | the set of rules — *"to be eligible for X credit you must be Y years of age"* |
| **Fact XML (FXML)** | the markup that declares a Fact Dictionary |
| **fact graph** (lowercase) | one instantiation, for one taxpayer's scenario |

**Why the distinction is worth knowing here.** `TaxConcept` is static semantic vocabulary —
`label_en`, `label_fr`, `cra_line`, `source_form`, `gifi_code`. It carries no taxpayer-specific
value, and it is not trying to. The IRS separation is a reminder that a consumer of this
library will need something on the other side of that line, and that this repository is not
where it belongs. See §6.

They also do something this repository should copy: a `<Types>` module letting a
dictionary author define new types on top of primitives (Boolean, Integer, Double —
*"not float, for precision reasons"*, String, Object), rather than baking
vendor-specific types into the engine.

### And they already answered a question we would have asked

Their ADR contains a *"Rewrite in TypeScript or Java"* section. They considered it and
rejected it:

> *"First and foremost, we do not have the resources to do this."*

Scala buys them JVM **and** JS compile targets. So the engine is not portable to this
repository's stack without a rewrite nobody has resourced — which settles it:
**take the model, not the code.**

## 2 · Catala — the rigorous version of the same idea

**arXiv [2103.03198](https://arxiv.org/abs/2103.03198)** — Denis Merigoux, Nicolas Chataing,
Jonathan Protzenko (INRIA and Microsoft Research), March 2021.

Where the IRS built FXML to declare tax logic, Catala is a language designed from the
ground up to translate *statutory law* into an executable implementation, with formal
semantics. Its thesis, from the abstract:

> *"law... essentially aims to rigorously describe a computation, a decision procedure
> or, simply said, an algorithm. Unfortunately, prose remains a woefully inadequate tool
> for the job."*

Two things put it above a research prototype:

- **The core compilation steps are proven correct in the F\* proof assistant.**
- **Encoding French family benefits uncovered a bug in the government's own official
  implementation.** They also evaluate on **section 121 of the US federal income tax**,
  so this is tested on tax, not only on benefits.

### Two follow-ons from the same group, and one is directly ours

**[Formalizing Date Arithmetic and Statically Detecting Ambiguities for the Law](https://arxiv.org/abs/2403.08935)**
(Monat, Fromherz, Merigoux, 2024) — a formal semantics for date computation on days,
months and years, mechanised in F\*, plus a static analysis that finds ambiguities. Their
motivation:

> *"date arithmetic exhibits many corner cases, which are handled differently from one
> library to the other, making faithfully transcribing the law into code error-prone"*

Tax is dense with date rules: RRSP contributions to 1 March counting against the prior
year, fiscal year ends, residency dates, 60-day windows. Applying it to French housing
benefits surfaced several real ambiguities.

**[CUTECat: Concolic Execution for Computational Law](https://arxiv.org/abs/2410.18212)**
(Goutagny, Fromherz, Monat, 2024) — automatically finding edge cases in encoded law.
Their answer to *how do you test an encoding of law* — relevant to anyone maintaining a
concept pack against a tax code that changes annually.

### But the lesson is not rigour

**Catala is the ceiling, not the target.** This repository does not need to encode tax
law; it needs to encode which *documents and facts* a return still requires. That
dictionary is enormously smaller, and nobody will prove it correct in F\*.

What is worth taking is Catala's actual thesis: **a shared medium that the domain expert
and the programmer can both read, edit and evolve** — *"bridging a gap that often results
in dramatically incorrect implementations of the law."*

Catala argues that shared medium is achievable and shows what it looks like. For a concept
pack, the practical form of the argument is that a vocabulary a domain expert cannot read is
a vocabulary a domain expert cannot correct.

## 3 · Intuit's Tax Knowledge Graph

**"Tax Knowledge Graph for a Smarter and More Personalized TurboTax"** — Jay Yu, Kevin
McCluskey, Saikat Mukherjee. Submitted 2020-09-13.

→ https://arxiv.org/abs/2009.06103

Two things in the abstract earn it a place here.

**It covers Canadian tax.** *"complicated **U.S. and Canadian** income tax compliance
logic (calculations and rules)"* — the only one of the two precedents that touches this
jurisdiction.

**And it names the property, not the calculation:** the graph is *"used to calculate tax
refunds, **reasoned to find missing info**, and navigated to explain the calculated
results."*

Three uses, and for our purposes the middle one is the whole reason to read the paper.
It is also a paper, not a codebase — there is nothing to adopt but the approach.

---

## 4 · Rules-as-Code in Canadian government — and its lessons learned

**[`PHACDataHub/privacy_rac_demo`](https://github.com/PHACDataHub/privacy_rac_demo)** — Jason
Morris, Director of Rules as Code at the **Public Health Agency of Canada**, 2022–2023. The
README is a ~3,600-line report on encoding the Privacy Act with Blawx (Blockly over SWI-Prolog
and s(CASP)).

The tool is dormant — `blawx.com` and `lexpedite.ca` are dead, and the code moved to the
Legalese org — but the report's *lessons learned* are the most directly useful document found
anywhere in this search, because it is a government team hitting the exact walls this
repository will hit:

- **A user asked "what permits are required."** Morris shows the law has no section organised
  that way; the real question is *"what am I obliged to do before I will be permitted to do
  something"*, and bridging that "will take work on behalf of someone who understands the rule
  and the encoding." **That is "which documents are required," restated.**
- ***"Laws are Perceived as Being Determinative of Question Order."*** The law says which facts
  are *relevant*; it never says in what *order* to ask. Optimal order depends on how likely an
  answer is to be determinative — *"which information doesn't exist in the law, either."*
- ***"Ontological Terms are Confused with Questions or Inputs."*** One predicate is not one
  question. A direct warning against a 1:1 document-type-to-question mapping.
- ***"Open World Causes Friction in Validating."*** Policy experts could not distinguish *false*
  from *not stated* — which is the whole difficulty of a missing-document model.

Also relevant, and thin: the canonical Canadian formalization is **D. M. Sherman, "A Prolog
model of the income tax act of Canada," ICAIL 1987** ([10.1145/41735.41750](https://doi.org/10.1145/41735.41750)).
It is 39 years old, and essentially the whole shelf. No active CRA rules-as-code programme and
no modern formalization of the Income Tax Act were found.

### The strongest instance of "encoding the law found a government bug"

**Mlang** — Merigoux, Monat, Protzenko, *A Modern Compiler for the French Tax Code*,
[arXiv 2011.07966](https://arxiv.org/abs/2011.07966), CPP 2021. Same team as Catala, different
target: they reverse-engineered the DGFiP's 1990s income-tax engine, validated against the
private DGFiP test suite, and **the DGFiP is now officially transitioning to Mlang for their
production system.** A national tax authority replaced its production engine with the
academics' reimplementation. That is a stronger claim than finding a bug.

## 5 · Statutory rules are defeasible, and our condition type is not

**Sarah Lawsky, "A Logic for Statutes,"** Florida Tax Review (2017),
[10.5744/ftr.2017.0002](https://doi.org/10.5744/ftr.2017.0002). Using the Internal Revenue Code
as its primary example, it argues statutory reasoning is **not standard deductive logic** but
**defeasible reasoning, best modelled with default logic** — conclusions defeated by later
information.

A required-document rule is a default: *"you need a T4, unless…"*. A boolean conjunction over
conditions will misfire on exceptions, and the failure is silent. This is the sharpest available
critique of a naive `Condition` type, including this repository's.

Related: Lawsky, *Modeling Uncertainty in Tax Law* (2013); Pertierra, Lawsky & Hemberg,
*Towards Formalizing Statute Law as Default Logic through Automatic Semantic Parsing* (2017);
and Lawsky's own engagement with Catala, *Coding the Code*, SMU Law Review 75 (2022),
[10.25172/smulr.75.3.4](https://doi.org/10.25172/smulr.75.3.4).

## 6 · Out of scope here: requirement modelling and completeness

Three areas came out of the same searches and are **deliberately not in this repository**:
reasoning about incomplete knowledge, the lifecycle of a requested document, and adaptive
question ordering.

They belong to whatever consumes an adapter, not to the adapter layer. `fisc` decides how to
read from and write to a vendor's tax software; deciding *what should be asked for and whether
enough is present to proceed* is a different problem with different prior art, and putting it
here would make the interoperability contract carry opinions it should not have.

The scope line is the one the README already draws: this repository is the rails; engagement
state, methodology and review logic sit above it.

## 7 · Computing the tax — the decision, with the number that settles it

Not our job, and the reasoning is now measured rather than asserted.

**No reusable Canadian engine exists** — which is a narrower claim than it may look, and worth
stating precisely. **Canada is absent from OpenFisca's official package list** (verified: the
page names AU-NSW, CI, ES-B, FR, GB, IT, JP, ML, NZ, SN, TN, US, UY, ZZ and no Canada). Eight
community and government repositories carry the name, including the Government of Canada's own
ESDC pilot — but that pilot last saw substantive activity in **2021**, and none of the eight is
maintained at production grade. `policyengine-canada` is maintained but is a *benefits*
model wearing a tax model's name: across its variable files there is no implementation of medical
expenses, donations, capital gains, RRSP, dividends, CPP/QPP or EI, and its Quebec taxable income
is **gross income with no deductions applied**, on brackets frozen at 2023. The only genuine open
T1 is a **one-person GPL-3.0 Haskell project** whose Quebec support is the federal T1 only — **no
TP-1**. There is no open TP-1 and no GIFI dataset anywhere.

**And the accuracy number is the decisive one.** PolicyEngine US and NBER TAXSIM-35 — two mature,
well-funded engines — agree on federal income tax for only **79.6%–84.4%** of 111,347 households
within a $15 tolerance; the worst sub-national jurisdiction agrees **18.9%** of the time. The
Tax-Calculator project's own differential validation localises the divergence precisely: on
wage-only inputs the two engines differ on **one record by $0.01**; add itemized deductions,
capital income and pass-through business income and **1,000 records diverge, to a maximum of
$27,840.64**.

Professional accounting clients are exactly the second case. An independent estimate would
disagree with the firm's own software on roughly **one client in five**, concentrated on the
files that matter most.

**The regulatory gate is narrower than assumed, and it is not the binding constraint.**
Certification attaches to *producing or transmitting a return*, not to computing a number; there
is no statutory concept of a tax "estimate"; Canada has no preparer licence; and both revenue
agencies publish their own calculators behind thin disclaimers. Quebec runs a **separate** second
regime (Revenu Québec distinguishes Approval, Authorization and Certification). Three real
exposures if an estimate were ever shipped: **Competition Act s.74.01(1)(b)** reverses the burden
of proof onto whoever makes an accuracy claim; **CCQ arts. 1474–1475** make a disclaimer effective
only where the other party is *proven* to have known of it, which is why CRA gates its calculator
behind an explicit accept; and the CPA code makes the accountant own the number regardless of what
produced it.

**What is worth building instead, and it needs no engine.** CRA's **T1 Final Statistics** publish
105 named T1 line items across 19 income classes with claimant counts and totals, per province
including Quebec, under the Open Government Licence. Quebec's 2021 mean medical-expense claim is
**$2,453** overall and **$2,703** in the $60–70K income class; the mean charitable donation at
$60–70K is **$601**; the mean RRSP deduction at $100–150K is **$11,522**. A client whose medical
expenses were $251 last year and $4,800 this year sits at 0.09× and 1.8× the peer mean — both
flaggable, with **no tax computation anywhere in the path**.

## 8 · How an adapter would be shown to be correct

An adapter writes a value into someone's tax return, or reads one back out. There is almost no
published literature on verifying tax software, and what exists offers two templates.

**Metamorphic testing** (Tizpaz-Niari et al., [arXiv 2205.04998](https://arxiv.org/abs/2205.04998),
ICSE-SEIS 2023) built relations with tax experts and found *"missing eligibility conditions in the
updated versions of software"* in shipped products. For an adapter the transferable assertions are
about round-tripping and invariance: a concept written and read back must return what was written,
and a value that should not move must not move.

**Differential testing** is the other — the Tax-Calculator/TAXSIM comparison in §7 is the worked
example, premised on the idea that *independently developed models are unlikely to contain the
same bug*. For an adapter, the second implementation is the vendor's own printed output: write a
value, print the return, parse it back, compare.

Worth knowing: Jurayj, Holzenberger & Van Durme ([arXiv 2508.21051](https://arxiv.org/abs/2508.21051),
AAAI 2026) argue directly that *"because errors can incur costly penalties, any automated system
must deliver high accuracy and auditability, making modern large language models poorly suited for
this task."*

## What this changes here, and what it does not

**Scope stays narrower on purpose.** Both systems compute tax. This repository does not
need to, and should not try: the goal is knowing which *facts and documents* a return
still needs. A dictionary that stops at expected documents is enormously smaller than one
modelling the full computation, and it is already the useful part.

**Whether fisc should model the instance side at all is open, deliberately.** `TaxConcept`
defines vocabulary and does that job well. Whether this repository should also carry fact
values, requirement rules and evidence state — or whether those belong to the consumer above
the adapter layer — is a scope question, not a naming one, and it belongs with the
core/transport separation in [#5](https://github.com/coalesc/fisc/issues/5). Recorded here so
it is not rediscovered a third time.

**No precedent removes the vendor problem.** They model the tax code. None gets a figure into
the software a Canadian firm actually works in, which is what
[`dtmax-integration-research.md`](./dtmax-integration-research.md) is about, and none touches
what the tax authority will and will not hand over, which is
[`cra-landscape.md`](./cra-landscape.md).

## What nobody has published

Recorded because a gap is a finding, and because the next person will otherwise search for it
again.

**The inversion.** Targeted searches for published work on *determining required documents or
evidence from law* returned nothing. The field computes entitlements and decides eligibility;
the "what must you hand me first" question appears to be unwritten. Oracle Intelligent Advisor's
relevancy engine and the IRS Fact Graph are the only two systems that approach it, and neither
is documented as such.

**Canadian tax formalization** is a 39-year-old Prolog paper and nothing since.

## Sources that failed, across all five searches

Recorded so the same walls are not hit twice. **DBLP** is entirely unusable — an Anubis bot
check returns HTML for every JSON request. **Semantic Scholar** rate-limited on nearly every
call even at 6–15 second spacing; almost nothing here rests on it. **arXiv** is reliable in
bursts then returns 429 or empty bodies. **OpenAlex** is the best fallback for citation graphs
but has a daily budget cap. **Crossref `/works/{DOI}` never failed** and is the most reliable
verification path.

Blocked by bot protection or login: CanLII, cpacanada.ca, cpaquebec.ca, IAASB (ISA 500),
austlii, datalex.org, oecd-opsi.org, inria.hal.science, revenuquebec.ca. statcan.gc.ca was
mid-outage, so SPSD/M licence terms are unverified. Two adjacent domains — customs/trade and
grant compliance — were never reached and are unexplored rather than cleared.
