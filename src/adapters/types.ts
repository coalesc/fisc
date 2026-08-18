/**
 * Every tax software adapter implements this interface.
 *
 * The MCP tools call adapter methods with vendor-neutral concept IDs.
 * Each adapter translates those into the right API calls or file writes.
 */
export interface Adapter {
	readonly name: string;

	/** Create a new return, returning a stable identifier. */
	createReturn(params: {
		taxpayer_name: string;
		sin?: string;
		tax_year: number;
		return_type: string;
	}): Promise<{ return_id: string }>;

	/** Set a field by concept ID. */
	setField(params: {
		return_id: string;
		concept: string;
		value: string | number;
		source?: string;
	}): Promise<void>;

	/** Read a field by concept ID. */
	getField(params: {
		return_id: string;
		concept: string;
	}): Promise<{ value: string | number | null }>;

	/** Retrieve diagnostics / validation errors. */
	getDiagnostics(params: {
		return_id: string;
	}): Promise<{ diagnostics: Diagnostic[] }>;
}

export interface Diagnostic {
	severity: "error" | "warning" | "info";
	code?: string;
	message: string;
	form?: string;
	field?: string;
}
