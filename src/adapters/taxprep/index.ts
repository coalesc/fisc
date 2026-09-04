/**
 * Taxprep adapter.
 *
 * This adapter intentionally does not guess the production authentication or
 * endpoint contract. It exposes verified capabilities only after the CCH
 * iFirm Taxprep API agreement and documentation are available to the operator.
 */

import {
	type Adapter,
	type AdapterCapabilities,
	type Diagnostic,
	type EvidenceRef,
	type MutationMode,
	type MutationReceipt,
	type ReturnType,
	type TaxReturnSummary,
} from "../types.js";

const CELL_MAPS: Record<number, Record<string, string>> = {
	// Populate only from verified vendor documentation for each tax year.
};

export class TaxprepAdapter implements Adapter {
	readonly name = "taxprep";

	async getCapabilities(): Promise<AdapterCapabilities> {
		return {
			return_types: ["t1", "t2", "t3", "t5013"],
			operations: {
				create_return: false,
				set_field: false,
				get_field: false,
				list_forms: false,
				list_returns: false,
				get_diagnostics: false,
			},
		};
	}

	async createReturn(_params: {
		taxpayer_ref: string;
		tax_year: number;
		return_type: ReturnType;
		mode: MutationMode;
	}): Promise<{ return_id?: string; receipt: MutationReceipt }> {
		throw this.notConfigured("create_return");
	}

	async setField(params: {
		return_id: string;
		tax_year: number;
		concept: string;
		value: string | number | boolean | null;
		evidence?: EvidenceRef;
		mode: MutationMode;
	}): Promise<{ receipt: MutationReceipt }> {
		const cellId = this.resolveCell(params.concept, params.tax_year);
		if (!cellId) {
			throw new Error(
				`No verified Taxprep mapping for concept '${params.concept}' in tax year ${params.tax_year}`,
			);
		}
		throw this.notConfigured("set_field");
	}

	async getField(params: {
		return_id: string;
		tax_year: number;
		concept: string;
	}): Promise<{ value: string | number | boolean | null }> {
		const cellId = this.resolveCell(params.concept, params.tax_year);
		if (!cellId) {
			throw new Error(
				`No verified Taxprep mapping for concept '${params.concept}' in tax year ${params.tax_year}`,
			);
		}
		throw this.notConfigured("get_field");
	}

	async listForms(_params: { return_id: string }): Promise<{ forms: string[] }> {
		throw this.notConfigured("list_forms");
	}

	async listReturns(_params?: {
		return_type?: ReturnType;
		tax_year?: number;
	}): Promise<{ returns: TaxReturnSummary[] }> {
		throw this.notConfigured("list_returns");
	}

	async getDiagnostics(_params: {
		return_id: string;
	}): Promise<{ diagnostics: Diagnostic[] }> {
		throw this.notConfigured("get_diagnostics");
	}

	private resolveCell(concept: string, taxYear: number): string | undefined {
		return CELL_MAPS[taxYear]?.[concept];
	}

	private notConfigured(operation: string): Error {
		return new Error(
			`Taxprep operation '${operation}' is not enabled. Configure this adapter only after the applicable CCH iFirm Taxprep API access and vendor contract are verified.`,
		);
	}
}
