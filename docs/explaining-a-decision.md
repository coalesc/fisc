# Explaining a decision, and especially a non-decision

> Researched 2026-09-07. Every claim is marked **verified** (the artifact was read in that
> session) or **inferred**. The ALEF repository was cloned in full and grepped; the Doyle memo
> and the RegelSpraak specification were downloaded and extracted; the Oracle documentation was
> crawled directly.

A consumer of this library will eventually have to answer a question the computation itself does
not answer: **not "what is the result", but "why is this still outstanding, and what would change
it".** That question has a literature, and it is older and better than the one we expected.

## The claim that sent us looking, and why it is false

We were told the Dutch tax administration's rule language has a function called **"Leg uit"**
(explain) that walks the derivation chain and, where nothing wrote a value, returns a list of
verdicts — not applicable, not valid at the calculation date, in error, or a rule that did not
fire naming the criterion that stopped it.

**No such function exists.** `belastingdienst/ALEF` (EUPL 1.2, ~140 MB, HEAD 11 Aug 2026) was
cloned and grepped for `leg uit`, `legUit`, `uitleg`, `waarom`, `onderbouw`, `verantwoording`.
The only hits are an unrelated internal method `uitlegCardinaliteit`, prose uses of "uitleggen" in
background docs, and a decision-table heading. **No `Leg uit` action, no verdict enum, no
justification object.** No source anywhere — Belastingdienst, ALEF docs, or academic — documents
that four-way verdict list. *(verified, by exhaustive grep)*

Each of the four verdicts does correspond to a real mechanism in ALEF, as engine concepts rather
than a packaged explanation API. Someone who had seen the ALEF Studio debugger could reasonably
have described it that way. **Treat "Leg uit" as plausible but unattributed, and do not tell
anyone we are implementing the Belastingdienst's explain function.**

A second correction, worth stating because it is the intuitive assumption: **ALEF's rich
explanation is design-time, not runtime.** The ✓/✗/? view lives in ALEF Studio's MPS interpreter.
The generated production service emits a flat event trace (`Executing`, `Not executing: Working
date not in validity period`, `in de Regel`, `fireOnlyOnce: not fired, was fired before`…) and,
optionally, consistency results. There is no evidence that a citizen is shown a derivation chain
in production. The Belastingdienst's **"Project Uitlegbaarheid"** is real and is the likeliest home
for such a thing, and it has **no public technical detail**. *(verified)*

## What is actually there, and it is the best idea in the file

ALEF renders each condition of a rule with an explicit legend:

> `✓` de conditie is waar · `✗` de conditie is niet waar · **`?` de conditie is niet geëvalueerd**

Not true / false / unknown — **true / false / not reached**. Short-circuit evaluation is
*recorded* rather than discarded. *(verified, by reading `docs/img/ALEF300_Testen_AnalyseRegel.png`)*

That single decision is what turns "the rule did not fire" into "the rule did not fire **because
of this criterion**": the first `✗` in a conjunction, with everything after it marked `?`, **is**
the blocking criterion, legible straight off the rule as written. No separate explanation engine
is required to produce it — only the discipline of not throwing the trace away.

Three further mechanisms are worth copying:

**Rule-firing status is reified in the language.** `regel gevuurd` — *"Voorwaarde dat de opgegeven
versie van een regel tot een toekenning heeft geleid"* — and `regel inconsistent` are **conditions
other rules can test**, scoped to a specific rule *version*. Whether a rule fired is data, not a
debugger artifact. *(verified, `docs/regels/Voorwaardendeel.md`)*

**Read-sets and write-sets per evaluation.** The debug metamodel gives each action `readSlots`,
`writtenSlots`, `readArguments`, `writtenArguments`, `subActions`, `error`, `coverage`. In the UI
an eye icon marks values the rule read, a pencil marks what it wrote. Cheap, general provenance.
*(verified, `interpreter.debug.structure.mps` and `docs/quick-start.md`)*

**The calculation date is an explicit input that selects rule versions.** A service entry point
takes a *rekendatum* which *"bepaalt de van toepassing zijnde regels en parameters"*, and validity
is a half-open `[start, end)` interval. "This rule was not in force for that period" is a
first-class verdict rather than a silent no-op. *(verified, `docs/services/service.md`,
`MValidityPeriod.java`)*

**One mistake not to repeat:** their `MProperty` holds the *candidate* rule set but **no record of
which rule actually produced the value**. Provenance in the production runtime has to be
reconstructed from the trace stream. Attach the producing rule to the value. *(verified,
`MProperty.java`)*

## The canonical answer to "why did this NOT happen": Doyle, 1979

**Doyle, J., "A Truth Maintenance System," *Artificial Intelligence* 12(3), 1979.**
[10.1016/0004-3702(79)90008-0](https://doi.org/10.1016/0004-3702(79)90008-0), open as MIT AI Memo
521 at [hdl.handle.net/1721.1/5733](http://hdl.handle.net/1721.1/5733). *(verified — the memo was
downloaded and OCR'd; the quotations below are from the primary source.)*

A support-list justification is `(SL <inlist> <outlist>)`, valid iff every node in the inlist is
**in** and every node in the outlist is **out**. The outlist nodes *"represent the specific
criteria authorizing this assumption"*. And for a conclusion that is **not** believed:

> "For the supporting-nodes of **out** nodes, the TMS picks **one node from each justification**…
> We define the supporting-nodes of out nodes in this way so that the support-status of the node
> in question cannot change without either a change in the support-status of one of the
> supporting-nodes, or without the addition of a new valid justification."

That is a precise, formally motivated, forty-seven-year-old answer: **for each candidate rule,
record exactly one blocking criterion, chosen so that the status cannot change unless that
blocker changes.** The constraint is the whole point — it rules out naming a criterion which,
once fixed, changes nothing.

Doyle §5, "Summarizing Arguments", separately argues that raw justification chains are unusable
and must be collapsed to the right level of detail. Oracle reached the same conclusion
independently, forty years later. **The explanation layer needs authoring; it is not a dump.**

Related, not read this session: de Kleer's ATMS (1986,
[10.1016/0004-3702(86)90080-9](https://doi.org/10.1016/0004-3702(86)90080-9)) generalises "why" to
"under exactly which assumptions". Clancey 1983
([10.1016/0004-3702(83)90008-5](https://doi.org/10.1016/0004-3702(83)90008-5)) is the argument
that a flat rule trace *cannot* explain, because the knowledge justifying the rule's shape was
compiled away — worth reading before building anything.

## The best production analogue: Oracle Intelligent Advisor

Deployed in tax and benefits administration, and unlike ALEF its explanation behaviour is fully
documented. *(verified, Oracle docs crawled directly.)*

Relevance is defined **counterfactually**: *"an attribute's value is relevant if changing it could
cause the conclusion of the rule to change."* Their own example: for `A if B and C` with B true
and C false, *"B is not relevant because no matter what you change it to, the false value of C
keeps A false."*

> 🚨 **Their Rule 2 is the bug anyone reimplementing this will otherwise ship.** When two criteria
> fail **together**, changing either alone flips nothing, so the naive counterfactual test returns
> **empty** — a "why" box with nothing in it. Oracle's documented fix: where values are jointly
> responsible, all of them are relevant. Decide this before shipping, not after a user reports it.

Their Decision view shows *"all the paths for a goal simultaneously, whether the goal is known or
not"*, greying irrelevant paths rather than hiding them, with a "Base only" filter listing exactly
the inputs still needing an answer. Explanations are **authored** — silent and invisible operators
suppress lower-level detail, and reference tags link a conclusion back to source authority.

**A limit worth knowing before designing around it**, quoted verbatim: *"For interviews that use
decision services, all inputs are presumed to be relevant for the outputs because decision
services do not support relevance."* The relevance machinery is an interactive-session capability;
called statelessly, it does not attribute.

## What we would not take

**Non-monotonic belief revision.** Doyle's TMS exists to *retract* conclusions and backtrack when
assumptions change. A document requirement is monotonic in practice — evidence arrives, statuses
advance. **Take the justification data structure; leave the revision machinery.**

**Why-not provenance from database theory** (Chapman & Jagadish, SIGMOD 2009; Herschel et al.'s
[survey](https://doi.org/10.1007/s00778-017-0486-1); Lee, Ludäscher & Glavic, PVLDB 2018) solves
"why is this row missing from a query over a large instance", where the hard part is searching
over data modifications. Rules here are small, enumerable and authored — evaluate them all and
record the outcomes. **Read the survey for vocabulary; do not import the machinery.**

**A rules engine or ASP** (s(CASP), ATMS, Drools). The justification quality is real; the
operational cost is not justified when an exhaustive verdict table plus a criterion trace gets
most of the value.

**A fourth truth value.** Oracle needs `uncertain` because of partially-known entity sets. Absent
a genuine source of uncertainty, three states plus "not yet evaluated" is enough.

## The smallest thing that would work

A verdict object carrying: the resolved status; the **rule id and version** that produced it; the
ordered criteria, each `satisfied | failed | not-evaluated`; the **read-set** of facts consulted;
and, when the status is negative, the blocking criterion — **or criteria**, per Oracle Rule 2 —
chosen per Doyle so that changing it would actually change the status. Rendered as one sentence,
with the detail behind a disclosure.

ALEF's tri-state, plus Doyle's out-node witness, plus Oracle's joint-relevance fix. None of it
requires machinery beyond what a rule evaluator already computes and currently discards.

## Sources

**Primary, Dutch Tax Administration** — [belastingdienst/ALEF](https://github.com/belastingdienst/ALEF)
(cloned and read: `docs/testen/Testen.md`, `docs/quick-start.md`, `docs/regels/Voorwaardendeel.md`,
`docs/regels/Actie_Initialisatie.md`, `docs/services/service.md`, the `merlin` Java runtime, and
`interpreter.debug.structure.mps`) ·
[RegelSpraak-specificatie – typeringen v1.2.0 (11-04-2024)](https://wendbarewetsuitvoering.pleio.nl/attachment/entity/87fba6cb-fd6d-4fd8-947d-c5255145d23b)
— note the code is EUPL but this PDF is all-rights-reserved ·
[Project Uitlegbaarheid](https://over-ons.belastingdienst.nl/zo-kunnen-we-onze-beslissingen-beter-uitleggen/)

**Academic on RegelSpraak** — Corsius et al., [*RegelSpraak: a CNL for Executable Tax Rules
Specification*, CNL 2021](https://aclanthology.org/2021.cnl-1.6.pdf) (read in full; **contains
nothing about explanation**) · Fokkenrood, [Business Rules Journal, 2011](https://www.brcommunity.com/articles.php?id=b622)
· [COHUBICOL typology](https://publications.cohubicol.com/typology/regelspraak/) (2022, partly
outdated — ALEF was open-sourced after their fieldwork)

**Computer science** — Doyle 1979 (read) · de Kleer 1986 · Clancey 1983 · Swartout 1983 ·
Herschel/Diestelkämper/Ben Lahmar 2017 · Pontelli/Son/El-Khatib 2009 · Arias et al. 2020

**Oracle Intelligent Advisor** — `Definition_of_relevant.htm`, `Decision_tab.htm`,
`Investigate_a_goal.htm`, `Review_reason_for_decision.htm`, `Design_an_explanation.htm`,
`Ensure_a_decision_can_be_made.htm`, under
`docs.oracle.com/en/cloud/saas/intelligent-advisor/using-policy-modeling/`

**OpenFisca** — [tracer](https://openfisca.org/doc/openfisca-python-api/tracer.html): a positive
computation tree, no why-not facility. A useful baseline for how little is needed to be helpful.

**Not verified, flagged rather than filled** — Drools, IBM ODM and IBM Cúram (all returned 403);
Catala's production status at DGFiP/CNAF; NZ/AU/EE/SG/CA programmes; `regels.overheid.nl` and
`open-regels.nl`; the main *RegelSpraak specificatie* document (JavaScript-gated).
