/**
 * T2 Corporation Income Tax Return — concepts keyed on GIFI.
 *
 * ## Why GIFI is the key here and a CRA line is not
 *
 * A T1 concept is anchored by its CRA line number. A T2 has no equivalent for
 * financial-statement data: the balance sheet and income statement reach the
 * return through the **General Index of Financial Information**, where every
 * caption is a four-digit code. Those codes are what a trial balance is mapped
 * to in the working papers, what Schedules 100 and 125 are built from, and what
 * a firm's own GIFI export carries between systems.
 *
 * So GIFI is the join. A balance read out of an engagement file and a cell
 * written into a corporate return are the same concept when they carry the same
 * GIFI code, whoever made either system.
 *
 * ## Provenance — every entry here was verified twice
 *
 * Labels are CRA's own, read from RC4088 (`General Index of Financial
 * Information`), English and French editions, extracted from the published
 * tables rather than transcribed.
 *
 * Each code was then cross-checked against a **real Corporate Taxprep export
 * from a practising firm**, in which 32 cells name their GIFI code in the
 * description. 27 distinct codes, and CRA and Taxprep agree on all 27 — 25
 * character-for-character, and two where CRA's label is the longer of the two:
 *
 *   - `3740` — CRA runs the caption into its own note in the source page; the
 *     caption is the prefix, which is what both Taxprep and this file use.
 *   - `9990` — CRA writes "Current income taxes (corporations only)"; Taxprep
 *     drops the parenthetical. CRA's is used here.
 *
 * Two independent sources agreeing is the bar for adding anything below.
 *
 * ## What this deliberately is not
 *
 * **Not the whole GIFI.** RC4088 carries 767 codes; this pack has the 27 whose
 * presence in a real corporate return we can demonstrate. The repository's rule
 * is that a concept pack holds only what has been verified, and an unverified
 * caption in a tax return is worse than a missing one.
 *
 * **Not a cell map.** No vendor field identifier appears here. Which Taxprep
 * cell a GIFI code lands in is per-form and per-tax-year, is a vendor's to
 * publish rather than ours, and belongs in an operator-supplied map — see
 * `docs/security.md`.
 */

import type { TaxConcept } from "./index.js";

/** Balance sheet captions reach the return through Schedule 100. */
const SCH100 = "T2SCH100";
/** Income statement captions reach it through Schedule 125. */
const SCH125 = "T2SCH125";

export const T2_CONCEPTS: Record<string, TaxConcept> = {
	// ---- Balance sheet — assets -------------------------------------------
	cash_and_deposits: {
		label_en: "Cash and deposits",
		label_fr: "Encaisse et dépôts",
		gifi_code: "1000",
		source_form: SCH100,
	},
	cash: {
		label_en: "Cash",
		label_fr: "Encaisse",
		gifi_code: "1001",
		source_form: SCH100,
	},
	taxes_recoverable: {
		label_en: "Taxes recoverable/refundable",
		label_fr: "Impôts recouvrables/remboursables",
		gifi_code: "1483",
		source_form: SCH100,
	},
	land: {
		label_en: "Land",
		label_fr: "Terrains",
		gifi_code: "1600",
		source_form: SCH100,
	},
	buildings: {
		label_en: "Buildings",
		label_fr: "Bâtiments",
		gifi_code: "1680",
		source_form: SCH100,
	},
	due_from_related_parties: {
		label_en: "Due from/investment in related parties",
		label_fr:
			"Sommes exigibles de personnes apparentées/placements dans des personnes apparentées",
		gifi_code: "2240",
		source_form: SCH100,
	},
	long_term_loans: {
		label_en: "Long-term loans",
		label_fr: "Prêts à long terme",
		gifi_code: "2360",
		source_form: SCH100,
	},

	// ---- Balance sheet — liabilities --------------------------------------
	accounts_payable_and_accrued_liabilities: {
		label_en: "Amounts payable and accrued liabilities",
		label_fr: "Montants et charges à payer",
		gifi_code: "2620",
		source_form: SCH100,
	},
	taxes_payable: {
		label_en: "Taxes payable",
		label_fr: "Taxes et impôts à payer",
		gifi_code: "2680",
		source_form: SCH100,
	},
	deposits_received: {
		label_en: "Deposits received",
		label_fr: "Sommes reçues en dépôt",
		gifi_code: "2961",
		source_form: SCH100,
	},
	due_to_shareholders: {
		label_en: "Due to shareholder(s)/director(s)",
		label_fr: "Sommes dues à un (des) actionnaire(s)/administrateur(s)",
		gifi_code: "3260",
		source_form: SCH100,
	},
	due_to_related_parties: {
		label_en: "Due to related parties",
		label_fr: "Sommes dues à des personnes apparentées",
		gifi_code: "3300",
		source_form: SCH100,
	},

	// ---- Balance sheet — equity and retained earnings ----------------------
	common_shares: {
		label_en: "Common shares",
		label_fr: "Actions ordinaires",
		gifi_code: "3500",
		source_form: SCH100,
	},
	retained_earnings_opening: {
		label_en: "Retained earnings/deficit – Start",
		label_fr: "Bénéfices non répartis/déficit – début de l'exercice",
		gifi_code: "3660",
		source_form: SCH100,
	},
	other_items_affecting_retained_earnings: {
		label_en: "Other items affecting retained earnings",
		label_fr: "Autres éléments touchant les bénéfices non répartis",
		gifi_code: "3740",
		source_form: SCH100,
	},

	// ---- Income statement — revenue ---------------------------------------
	interest_canadian_mortgage_loans: {
		label_en: "Interest from Canadian mortgage loans",
		label_fr: "Intérêts de prêts hypothécaires canadiens",
		gifi_code: "8093",
		source_form: SCH125,
	},
	dividends_canadian_sources: {
		label_en: "Dividends from Canadian sources",
		label_fr: "Dividendes de sources canadiennes",
		gifi_code: "8096",
		source_form: SCH125,
	},
	partnership_income: {
		label_en: "Income/loss of partnerships",
		label_fr: "Revenus/pertes de sociétés de personnes",
		gifi_code: "8235",
		source_form: SCH125,
	},
	management_and_administration_fees: {
		label_en: "Management and administration fees",
		label_fr: "Honoraires de gestion et d'administration",
		gifi_code: "8239",
		source_form: SCH125,
	},

	// ---- Income statement — operating expenses ----------------------------
	interest_and_bank_charges: {
		label_en: "Interest and bank charges",
		label_fr: "Intérêts et frais bancaires",
		gifi_code: "8710",
		source_form: SCH125,
	},
	business_taxes_licences_memberships: {
		label_en: "Business taxes, licences, and memberships",
		label_fr: "Taxes d'affaires, droits d'adhésion et licences",
		gifi_code: "8760",
		source_form: SCH125,
	},
	memberships: {
		label_en: "Memberships",
		label_fr: "Droits d'adhésion",
		gifi_code: "8761",
		source_form: SCH125,
	},
	office_expenses: {
		label_en: "Office expenses",
		label_fr: "Frais de bureau",
		gifi_code: "8810",
		source_form: SCH125,
	},
	professional_fees: {
		label_en: "Professional fees",
		label_fr: "Honoraires professionnels",
		gifi_code: "8860",
		source_form: SCH125,
	},
	salaries_and_wages: {
		label_en: "Salaries and wages",
		label_fr: "Salaires et traitements",
		gifi_code: "9060",
		source_form: SCH125,
	},
	travel_expenses: {
		label_en: "Travel expenses",
		label_fr: "Frais de déplacement",
		gifi_code: "9200",
		source_form: SCH125,
	},

	// ---- Income statement — taxes -----------------------------------------
	current_income_taxes: {
		label_en: "Current income taxes (corporations only)",
		label_fr:
			"Impôts sur le revenu exigibles de l'exercice (sociétés seulement)",
		gifi_code: "9990",
		source_form: SCH125,
	},
};

/**
 * Which schedule a GIFI code reaches the return through.
 *
 * The ranges are CRA's: balance sheet captions run 1000–3849, income statement
 * captions 8000–9999. A code outside both is not a financial-statement caption
 * and does not belong in this pack.
 */
export function scheduleForGifi(code: string): typeof SCH100 | typeof SCH125 | undefined {
	const n = Number(code);
	if (n >= 1000 && n <= 3849) return SCH100;
	if (n >= 8000 && n <= 9999) return SCH125;
	return undefined;
}
