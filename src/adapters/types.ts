/**
 * Vendor-neutral adapter contracts for professional tax software.
 *
 * MCP is the agent-facing interface. Adapters translate these semantic
 * operations into vendor APIs or other supported integration mechanisms.
 */

export type ReturnType = "t1" | "t2" | "t3" | "t5013";
export type MutationMode = "validate" | "commit";

export interface EvidenceRef {
	source_id: string;
	source_type?: string;
	page?: number;
	checksum?: string;
	note?: string;
}

export interface MutationReceipt {
	status: "validated" | "committed";
	vendor_reference?: string;
	warnings?: string[];
}

export interface AdapterCapabilities {
	return_types: ReturnType[];
	operations: {
		create_return: boolean;
		set_field: boolean;
		get_field: boolean;
		list_forms: boolean;
		list_returns: boolean;
		get_diagnostics: boolean;
	};
}

export interface Adapter {
	readonly name: string;

	getCapabilities(): Promise<AdapterCapabilities>;

	createReturn(params: {
		taxpayer_ref: string;
		tax_year: number;
		return_type: ReturnType;
		mode: MutationMode;
	}): Promise<{ return_id?: string; receipt: MutationReceipt }>;

	setField(params: {
		return_id: string;
		tax_year: number;
		concept: string;
		value: string | number | boolean | null;
		evidence?: EvidenceRef;
		mode: MutationMode;
	}): Promise<{ receipt: MutationReceipt }>;

	getField(params: {
		return_id: string;
		tax_year: number;
		concept: string;
	}): Promise<{ value: string | number | boolean | null }>;

	listForms(params: {
		return_id: string;
	}): Promise<{ forms: string[] }>;

	listReturns(params?: {
		return_type?: ReturnType;
		tax_year?: number;
	}): Promise<{ returns: TaxReturnSummary[] }>;

	getDiagnostics(params: {
		return_id: string;
	}): Promise<{ diagnostics: Diagnostic[] }>;
}

export interface TaxReturnSummary {
	return_id: string;
	return_type: ReturnType;
	tax_year: number;
	status?: string;
}

export interface Diagnostic {
	severity: "error" | "warning" | "info";
	code?: string;
	message: string;
	form?: string;
	field?: string;
}
