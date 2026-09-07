# Prior art: how others modelled tax logic

Two systems solved a problem close to this repository's, and both are public. Neither is
adoptable as-is. Both are worth stealing from — one for its architecture, one for its
vocabulary, and both for the same load-bearing idea.

**Found by Étienne Beaulé, 2026-09-07.** Read and verified the same day.

---

## The idea both landed on

Neither system's most valuable property is computing tax. It is **reasoning about what is
missing**.

Intuit says it in five words in their abstract: *"reasoned to **find missing info**."*

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

**That distinction is worth adopting.** This repository currently has one word,
`TaxConcept`, doing both jobs — the rule and the instance. Separating them names
something real: *the dictionary is a firm's policy about what it asks; the graph is one
client's file.*

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

## 2 · Intuit's Tax Knowledge Graph

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

## What this changes here, and what it does not

**Scope stays narrower on purpose.** Both systems compute tax. This repository does not
need to, and should not try: the goal is knowing which *facts and documents* a return
still needs. A dictionary that stops at expected documents is enormously smaller than one
modelling the full computation, and it is already the useful part.

**The naming question is open, deliberately.** Whether `TaxConcept` should be restated as
a Fact Dictionary — with a per-taxpayer fact graph as its instance — is a change to this
repository's public surface, and it belongs with the core/transport separation in
[#5](https://github.com/coalesc/fisc/issues/5) rather than being decided in a research
document. Recorded here so it is not rediscovered a third time.

**Neither precedent removes the vendor problem.** Both model the tax code. Neither gets a
figure into the software a Canadian firm actually works in, which is what
[`dtmax-integration-research.md`](./dtmax-integration-research.md) is about, and neither
touches what the tax authority will and will not hand over, which is
[`cra-landscape.md`](./cra-landscape.md).
