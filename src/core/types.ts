export type ReturnType = "t1";

export type TaxValue = string | number | boolean | null;

export type SourceKind =
	| "document"
	| "government_data"
	| "prior_return"
	| "client_answer"
	| "workpaper"
	| "other";

/** A portable reference to the evidence behind a tax value. */
export interface SourceRef {
	id: string;
	kind: SourceKind;
	label?: string;
	page?: number;
	locator?: string;
	/** Optional digest supplied by the host to identify the exact evidence version. */
	content_hash?: string;
}

/** Identifies a return without exposing vendor-specific internals to callers. */
export interface ReturnRef {
	id: string;
	adapter: string;
	tax_year: number;
	return_type: ReturnType;
}

export interface CreateReturnInput {
	taxpayer_name: string;
	sin?: string;
	tax_year: number;
	return_type: ReturnType;
}

export interface FieldChange {
	concept: string;
	value: TaxValue;
	sources?: SourceRef[];
	note?: string;
	/** Optional compare-and-set guard against overwriting a value changed since planning began. */
	expected_value?: TaxValue;
}

export interface FieldValue {
	concept: string;
	value: TaxValue;
	sources?: SourceRef[];
	native_field?: string;
}

export interface PlanChangesInput {
	return_ref: ReturnRef;
	changes: FieldChange[];
	idempotency_key?: string;
}

export interface PlannedChange extends FieldChange {
	status: "ready" | "unsupported" | "unmapped" | "conflict";
	message?: string;
	native_field?: string;
	current_value?: TaxValue;
}

/**
 * A write plan is safe to inspect. Creating it must not mutate the vendor system.
 * The plan is the boundary between agent preparation and an explicit write.
 */
export interface WritePlan {
	plan_id: string;
	created_at: string;
	return_ref: ReturnRef;
	changes: PlannedChange[];
	warnings: string[];
	idempotency_key?: string;
}

export interface ApplyPlanInput {
	plan: WritePlan;
	/** Identity supplied by the host after its approval policy has been satisfied. */
	approved_by: string;
}

export interface ApplyPlanResult {
	plan_id: string;
	applied: number;
	skipped: number;
	warnings: string[];
	vendor_revision?: string;
}

export interface Diagnostic {
	severity: "error" | "warning" | "info";
	code?: string;
	message: string;
	form?: string;
	field?: string;
	concept?: string;
}

export interface AdapterCapabilities {
	adapter: string;
	return_types: ReturnType[];
	tax_years: number[] | "dynamic";
	operations: {
		create_return: boolean;
		read_field: boolean;
		plan_changes: boolean;
		apply_changes: boolean;
		list_forms: boolean;
		get_diagnostics: boolean;
		list_returns: boolean;
	};
}

export interface TaxFormRef {
	id: string;
	label?: string;
}
