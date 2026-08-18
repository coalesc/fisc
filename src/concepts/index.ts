/**
 * Vendor-neutral tax concept definitions.
 *
 * Each concept maps a semantic idea (e.g. "employment income") to metadata
 * that adapters use to find the right field in Taxprep, DT Max, etc.
 */

export interface TaxConcept {
	/** Human-readable label (English) */
	label_en: string;
	/** Human-readable label (French) */
	label_fr: string;
	/** CRA line number, if applicable */
	cra_line?: string;
	/** The CRA form this typically comes from */
	source_form?: string;
}

export type ReturnType = "t1";

/**
 * T1 Personal Income Tax Return — core concepts.
 *
 * This is intentionally a starter set. Each concept here has a known
 * CRA line number and maps cleanly to both Taxprep and DT Max fields.
 */
const T1_CONCEPTS: Record<string, TaxConcept> = {
	// --- Income ---
	employment_income: {
		label_en: "Employment income",
		label_fr: "Revenus d'emploi",
		cra_line: "10100",
		source_form: "T4",
	},
	other_employment_income: {
		label_en: "Other employment income",
		label_fr: "Autres revenus d'emploi",
		cra_line: "10400",
	},
	old_age_security: {
		label_en: "Old Age Security pension",
		label_fr: "Pension de la Sécurité de la vieillesse",
		cra_line: "11300",
		source_form: "T4A(OAS)",
	},
	cpp_qpp_benefits: {
		label_en: "CPP or QPP benefits",
		label_fr: "Prestations du RPC ou du RRQ",
		cra_line: "11400",
		source_form: "T4A(P)",
	},
	ei_benefits: {
		label_en: "Employment Insurance benefits",
		label_fr: "Prestations d'assurance-emploi",
		cra_line: "11900",
		source_form: "T4E",
	},
	interest_income: {
		label_en: "Interest and other investment income",
		label_fr: "Intérêts et autres revenus de placements",
		cra_line: "12100",
		source_form: "T5",
	},
	dividend_income_eligible: {
		label_en: "Taxable amount of eligible dividends",
		label_fr: "Montant imposable des dividendes déterminés",
		cra_line: "12000",
		source_form: "T5",
	},
	rental_income_gross: {
		label_en: "Gross rental income",
		label_fr: "Revenus de location bruts",
		cra_line: "12599",
	},
	rental_income_net: {
		label_en: "Net rental income",
		label_fr: "Revenus nets de location",
		cra_line: "12600",
	},
	self_employment_income_gross: {
		label_en: "Gross business income",
		label_fr: "Revenus d'entreprise bruts",
		cra_line: "16199",
		source_form: "T2125",
	},
	self_employment_income_net: {
		label_en: "Net business income",
		label_fr: "Revenus nets d'entreprise",
		cra_line: "13500",
		source_form: "T2125",
	},
	capital_gains: {
		label_en: "Taxable capital gains",
		label_fr: "Gains en capital imposables",
		cra_line: "12700",
	},
	rrsp_income: {
		label_en: "RRSP income",
		label_fr: "Revenus de REER",
		cra_line: "12900",
		source_form: "T4RSP",
	},
	total_income: {
		label_en: "Total income",
		label_fr: "Revenu total",
		cra_line: "15000",
	},

	// --- Deductions ---
	rrsp_deduction: {
		label_en: "RRSP deduction",
		label_fr: "Déduction pour REER",
		cra_line: "20800",
	},
	union_dues: {
		label_en: "Annual union, professional, or like dues",
		label_fr: "Cotisations annuelles syndicales, professionnelles ou semblables",
		cra_line: "21200",
		source_form: "T4",
	},
	childcare_expenses: {
		label_en: "Child care expenses",
		label_fr: "Frais de garde d'enfants",
		cra_line: "21400",
		source_form: "T778",
	},
	moving_expenses: {
		label_en: "Moving expenses",
		label_fr: "Frais de déménagement",
		cra_line: "21900",
		source_form: "T1-M",
	},
	support_payments_deduction: {
		label_en: "Support payments made",
		label_fr: "Pension alimentaire payée",
		cra_line: "22000",
	},
	net_income: {
		label_en: "Net income",
		label_fr: "Revenu net",
		cra_line: "23600",
	},

	// --- Non-refundable tax credits ---
	basic_personal_amount: {
		label_en: "Basic personal amount",
		label_fr: "Montant personnel de base",
		cra_line: "30000",
	},
	age_amount: {
		label_en: "Age amount",
		label_fr: "Montant en raison de l'âge",
		cra_line: "30100",
	},
	spouse_amount: {
		label_en: "Amount for an eligible dependant / spouse",
		label_fr: "Montant pour époux ou conjoint de fait",
		cra_line: "30300",
	},
	cpp_qpp_contributions_employment: {
		label_en: "CPP/QPP contributions (employment)",
		label_fr: "Cotisations au RPC/RRQ (emploi)",
		cra_line: "30800",
		source_form: "T4",
	},
	ei_premiums: {
		label_en: "Employment insurance premiums",
		label_fr: "Cotisations d'assurance-emploi",
		cra_line: "31200",
		source_form: "T4",
	},
	medical_expenses: {
		label_en: "Medical expenses",
		label_fr: "Frais médicaux",
		cra_line: "33099",
	},
	donation_credits: {
		label_en: "Donations and gifts",
		label_fr: "Dons et cadeaux",
		cra_line: "34900",
	},

	// --- Tax payable / refund ---
	total_federal_tax: {
		label_en: "Net federal tax",
		label_fr: "Impôt fédéral net",
		cra_line: "42000",
	},
	total_tax_deducted: {
		label_en: "Total income tax deducted",
		label_fr: "Total de l'impôt sur le revenu retenu",
		cra_line: "43700",
		source_form: "T4",
	},
	refund_or_balance_owing: {
		label_en: "Refund or balance owing",
		label_fr: "Remboursement ou solde dû",
		cra_line: "48400",
	},
} as const;

export const CONCEPTS: Record<ReturnType, Record<string, TaxConcept>> = {
	t1: T1_CONCEPTS,
};
