# What the CRA opens, what it gates, and where the line falls

Every adapter in this repository has two ends: a vendor's software on one side, and the
Canada Revenue Agency on the other. This document covers the CRA end, because it
constrains every adapter equally and is easy to get wrong in the same way twice.

**Every claim below was read on a primary CRA page and is dated 2026-09-07.** URLs are
given so the next reader can re-check rather than trust.

---

## The short version

| | Status | Consequence for an adapter |
| --- | --- | --- |
| Information-return (slip) XML schemas | **open, published, versioned** | a third party can generate a compliant T4/T5/T5008 file |
| T1/T2 **return** format | **not published** | nobody outside certified software can produce one |
| Transmitting a return (EFILE) | **gated on certification** | certification is the gate, not technology |
| **Auto-fill My Return** | **a capability of the EFILE certification programme** | ⚠️ see the open question below |

---

## 1 · Slip schemas are genuinely open

CRA publishes full XML specifications for information returns filed via Internet File
Transfer and Web Forms — T4, T4A, T5, T5008, T5018, T2202, NR4, T3, AGR-1 and the rest,
each with a linked current-year spec, alongside the **T619** electronic transmittal.

**Verified:** the page loads and names T4, T5, T5008, T2202 and T619.
→ https://www.canada.ca/en/revenue-agency/services/e-services/filing-information-returns-electronically-t4-t5-other-types-returns-overview/xml-specs.html

**But note the direction.** T619 is for *issuing* slips as a payer — an employer filing
T4s for its staff. It is not a path to filing a T1 or T2, and it does not route through
professional tax software. Useful if fisc ever needs to emit slips; irrelevant to
populating a return.

## 2 · The return format is not published, and the lock is certification

CRA's RC4018 *Electronic Filers Manual* is preparer guidance. It leaks structure — SFD
record types, occurrence caps, free-format line limits — but publishes **no record
layout**. Verified by absence: the chapter contains **zero** occurrences of `XSD`,
`schema` or `record layout`.

What it does state, verbatim:

> *"You must use a software product certified for EFILE to transmit the returns using a
> web service."*

**Verified:** that sentence is present character-for-character.
→ https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/rc4018/chapter-1.html

So the barrier is **regulatory, not technical**. CRA does not want arbitrary software
transmitting returns, which is defensible. Certification is annual — the certified list
is published per year, product by product.

## 3 · Auto-fill My Return is inside the certification programme

This is the finding that matters most, and it is easy to miss.

Auto-fill delivers a taxpayer's slips and history straight into the preparer's software:
T4, T4A, T5, T5008, T2202, RRSP contributions and limits, loss carryforwards and more.
For any T1 practice this means **CRA already eliminates most slip keying, for free** —
so no business case for writing slips into tax software should be sized against manual
entry.

**But Auto-fill is not an open service.** On CRA's EFILE-certified software list, each
product carries a *Services Available* column, and `Auto-fill` appears there beside
`T1135`, `ReFILE` and `PAD`. It is a **capability granted through EFILE certification**,
not an API anyone may call.

**Verified:** the certified-software page lists products with `Auto-fill` under *Services
Available*.
→ https://www.canada.ca/en/revenue-agency/services/e-services/digital-services-individuals/efile-electronic-filers/efile-certified-software-efile-program.html

DT Max's own documentation confirms the consumption side: its Auto-fill page names T4,
T4A, T5, T5008, T2202, RRSP, T4E and T5007.
→ https://support.drtax.ca/dtmax/eng/kb/dtmax/DT%20Max%20help%20directory/T1/w499tdd.htm

### ⚠️ The open question, and it decides a whole product direction

**Can a product be certified for Auto-fill alone, without transmitting returns?**

**NOT DETERMINED.** It was not settled by reading the certified-software list, which
shows the two capabilities together but does not say whether they can be separated.

Why it matters: if a non-transmitting product can obtain Auto-fill access, then a
document-collection layer can see **what CRA holds** for a taxpayer and derive exactly
what is still missing — without waiting for the preparer to run Auto-fill inside their
tax software. That is completeness reasoning fed directly by the tax authority, and it
is a materially different product from one that only reads what a vendor already wrote.

If it cannot be separated, the only route to that data is through the firm's own
certified software, and the adapter model in this repository is the right shape.

**How to settle it:** ask CRA's EFILE Helpdesk directly. This is a question about the
certification programme, not about any vendor, and it has a definite answer.

---

## What this means for adapters

**Do not confuse "CRA is closed" with "the integration is blocked."** They are different
statements, and only the second one is about us.

Even with a fully open CRA, a firm still works inside DT Max, Taxprep or ProFile. Data
has to reach *their* software, not the CRA. Conversely, the half of a return that CRA can
never supply — anything arriving as a receipt or a declaration rather than a slip:
medical expenses, donations, childcare, self-employment, rental, moving — is precisely
the half a client has to be *asked* for.

**CRA fills the slips. An adapter fills the rest.**
