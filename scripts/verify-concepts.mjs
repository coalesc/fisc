#!/usr/bin/env node
/**
 * Runtime checks on the concept packs.
 *
 * Type checking says a concept has the right shape. It does not say the GIFI
 * code is unique, that the schedule matches the code's range, or that somebody
 * pasted an English label into the French field. A wrong caption here becomes a
 * wrong figure in a return, so these are asserted rather than assumed.
 *
 * Run with `npm run verify` after `npm run build`.
 */

import { CONCEPTS } from "../dist/concepts/index.js";
import { scheduleForGifi } from "../dist/concepts/t2.js";

/**
 * The GIFI codes observed in a real Corporate Taxprep export from a practising
 * firm — the evidence the T2 pack was built from. If the pack stops covering
 * one of these, something was dropped.
 */
const OBSERVED_IN_A_REAL_T2_RETURN = [
	"1000", "1001", "1483", "1600", "1680", "2240", "2360", "2620", "2680",
	"2961", "3260", "3300", "3500", "3660", "3740", "8093", "8096", "8235",
	"8239", "8710", "8760", "8761", "8810", "8860", "9060", "9200", "9990",
];

const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };

const t1 = CONCEPTS.t1 ?? {};
const t2 = CONCEPTS.t2 ?? {};

// Every pack: labels present, and French actually translated.
for (const [returnType, pack] of Object.entries(CONCEPTS)) {
	for (const [id, concept] of Object.entries(pack)) {
		check(!!concept.label_en?.trim(), `${returnType}.${id}: empty label_en`);
		check(!!concept.label_fr?.trim(), `${returnType}.${id}: empty label_fr`);
		check(
			concept.label_en !== concept.label_fr,
			`${returnType}.${id}: label_fr is identical to label_en — likely an untranslated paste`,
		);
		check(
			/^[a-z][a-z0-9_]*$/.test(id),
			`${returnType}.${id}: concept id is not snake_case`,
		);
	}
}

// Concept ids must not collide between packs: they are the agent's vocabulary,
// and the same word meaning two things in two returns is a silent mis-write.
for (const id of Object.keys(t2)) {
	check(!(id in t1), `t2.${id}: id also exists in the T1 pack`);
}

// T2 is keyed on GIFI. Each code appears once, and its schedule follows its range.
const seen = new Map();
for (const [id, concept] of Object.entries(t2)) {
	const code = concept.gifi_code;
	check(!!code, `t2.${id}: no gifi_code`);
	if (!code) continue;
	check(/^\d{4}$/.test(code), `t2.${id}: gifi_code '${code}' is not four digits`);
	if (seen.has(code)) {
		failures.push(`t2: GIFI ${code} is on both '${seen.get(code)}' and '${id}'`);
	}
	seen.set(code, id);
	const expected = scheduleForGifi(code);
	check(
		expected !== undefined,
		`t2.${id}: GIFI ${code} is outside both financial-statement ranges`,
	);
	check(
		concept.source_form === expected,
		`t2.${id}: GIFI ${code} belongs to ${expected}, but source_form says ${concept.source_form}`,
	);
}

// The evidence the pack was built from must still be covered.
for (const code of OBSERVED_IN_A_REAL_T2_RETURN) {
	check(seen.has(code), `t2: GIFI ${code} was observed in a real return but is not in the pack`);
}

const t1WithLines = Object.values(t1).filter((c) => c.cra_line).length;
console.log(`t1: ${Object.keys(t1).length} concepts, ${t1WithLines} carrying a CRA line`);
console.log(`t2: ${Object.keys(t2).length} concepts, ${seen.size} distinct GIFI codes`);
console.log(`    ${[...seen.keys()].filter((c) => scheduleForGifi(c) === "T2SCH100").length} balance sheet, ${[...seen.keys()].filter((c) => scheduleForGifi(c) === "T2SCH125").length} income statement`);

if (failures.length) {
	console.error(`\n${failures.length} problem(s):`);
	for (const f of failures) console.error(`  - ${f}`);
	process.exit(1);
}
console.log("\nAll concept checks passed.");
