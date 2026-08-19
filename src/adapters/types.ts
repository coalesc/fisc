import type {
	AdapterCapabilities,
	ApplyPlanInput,
	ApplyPlanResult,
	CreateReturnInput,
	Diagnostic,
	FieldValue,
	PlanChangesInput,
	ReturnRef,
	TaxFormRef,
	WritePlan,
} from "../core/types.js";

/**
 * Contract implemented by every professional tax software adapter.
 *
 * This interface knows nothing about MCP, HTTP, CLI, or any other transport.
 * It translates fisc's canonical tax operations into vendor-specific calls.
 */
export interface TaxAdapter {
	readonly name: string;

	/** Describe exactly what this adapter can do today. */
	getCapabilities(): AdapterCapabilities;

	/** Create a vendor return and return a portable reference to it. */
	createReturn(input: CreateReturnInput): Promise<ReturnRef>;

	/** Read one canonical tax concept from a return. */
	getField(input: { return_ref: ReturnRef; concept: string }): Promise<FieldValue>;

	/**
	 * Resolve and validate proposed writes without mutating the vendor system.
	 * Agents should plan first, then a host application can decide whether to apply.
	 */
	planChanges(input: PlanChangesInput): Promise<WritePlan>;

	/** Apply a previously inspected plan. */
	applyPlan(input: ApplyPlanInput): Promise<ApplyPlanResult>;

	listForms(input: { return_ref: ReturnRef }): Promise<TaxFormRef[]>;

	listReturns(input?: { tax_year?: number; return_type?: string }): Promise<ReturnRef[]>;

	getDiagnostics(input: { return_ref: ReturnRef }): Promise<Diagnostic[]>;
}
