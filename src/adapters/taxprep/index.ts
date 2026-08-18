/**
 * Taxprep adapter — wraps the CCH iFirm Taxprep Web API.
 *
 * Requires:
 *   TAXPREP_API_URL  — e.g. https://your-site.cchifirm.ca
 *   TAXPREP_API_KEY  — read-write API key from iFirm settings
 *
 * Reference:
 *   https://support.cchifirm.ca/en/content/cch_ifirm/web_api/api_about_cch_ifirm_tax_web_api.htm
 */

import { type Adapter, type Diagnostic } from "../types.js";

// Concept → Taxprep cell ID mappings, keyed by tax year.
// These change every year when Wolters Kluwer updates the forms.
const CELL_MAPS: Record<number, Record<string, string>> = {
	// TODO: populate from Taxprep's API discovery tool (Swagger)
	// Example: 2025: { employment_income: "T1.Towjac134", ... }
};

export class TaxprepAdapter implements Adapter {
	readonly name = "taxprep";

	private baseUrl: string;
	private apiKey: string;

	constructor() {
		const url = process.env.TAXPREP_API_URL;
		const key = process.env.TAXPREP_API_KEY;
		if (!url || !key) {
			throw new Error("TAXPREP_API_URL and TAXPREP_API_KEY are required");
		}
		this.baseUrl = url.replace(/\/+$/, "");
		this.apiKey = key;
	}

	async createReturn(params: {
		taxpayer_name: string;
		sin?: string;
		tax_year: number;
		return_type: string;
	}): Promise<{ return_id: string }> {
		// TODO: POST to iFirm API to create a return
		throw new Error("Not yet implemented — waiting for iFirm API access");
	}

	async setField(params: {
		return_id: string;
		concept: string;
		value: string | number;
		source?: string;
	}): Promise<void> {
		const cellId = this.resolveCell(params.concept, 2025);
		if (!cellId) {
			throw new Error(`No Taxprep cell mapping for concept: ${params.concept}`);
		}
		// TODO: PUT to iFirm API to set cell value
		throw new Error("Not yet implemented — waiting for iFirm API access");
	}

	async getField(params: {
		return_id: string;
		concept: string;
	}): Promise<{ value: string | number | null }> {
		const cellId = this.resolveCell(params.concept, 2025);
		if (!cellId) {
			throw new Error(`No Taxprep cell mapping for concept: ${params.concept}`);
		}
		// TODO: GET from iFirm API
		throw new Error("Not yet implemented — waiting for iFirm API access");
	}

	async getDiagnostics(params: {
		return_id: string;
	}): Promise<{ diagnostics: Diagnostic[] }> {
		// TODO: GET diagnostics from iFirm API
		throw new Error("Not yet implemented — waiting for iFirm API access");
	}

	private resolveCell(concept: string, taxYear: number): string | undefined {
		return CELL_MAPS[taxYear]?.[concept];
	}
}
