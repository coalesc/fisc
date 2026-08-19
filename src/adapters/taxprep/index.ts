/**
 * Taxprep adapter — translates fisc operations to the CCH iFirm Taxprep Web API.
 *
 * The adapter is intentionally honest about its current status. Planning can
 * resolve known mappings without mutating Taxprep; API-backed reads and writes
 * remain unavailable until the supported integration is implemented and tested.
 */

import { randomUUID } from "node:crypto";
import type { TaxAdapter } from "../types.js";
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
} from "../../core/types.js";

/** Concept → Taxprep native field mappings, keyed by tax year. */
const CELL_MAPS: Record<number, Record<string, string>> = {
	// TODO: populate only from supported/authorized Taxprep API discovery.
	// 2026: { employment_income: "..." }
};

export class TaxprepAdapter implements TaxAdapter {
	readonly name = "taxprep";

	private readonly baseUrl: string;
	private readonly apiKey: string;

	constructor() {
		const url = process.env.TAXPREP_API_URL;
		const key = process.env.TAXPREP_API_KEY;
		if (!url || !key) {
			throw new Error("TAXPREP_API_URL and TAXPREP_API_KEY are required");
		}
		this.baseUrl = url.replace(/\/+$/, "");
		this.apiKey = key;
	}

	getCapabilities(): AdapterCapabilities {
		const mappedYears = Object.keys(CELL_MAPS).map(Number);
		return {
			adapter: this.name,
			return_types: ["t1"],
			tax_years: mappedYears,
			operations: {
				create_return: false,
				read_field: false,
				plan_changes: true,
				apply_changes: false,
				list_forms: false,
				get_diagnostics: false,
				list_returns: false,
			},
		};
	}

	async createReturn(_input: CreateReturnInput): Promise<ReturnRef> {
		throw new Error("Taxprep create_return is not implemented yet");
	}

	async getField(_input: { return_ref: ReturnRef; concept: string }): Promise<FieldValue> {
		throw new Error("Taxprep read_field is not implemented yet");
	}

	async planChanges(input: PlanChangesInput): Promise<WritePlan> {
		const mappings = CELL_MAPS[input.return_ref.tax_year] ?? {};
		const changes = input.changes.map((change) => {
			const nativeField = mappings[change.concept];
			if (!nativeField) {
				return {
					...change,
					status: "unmapped" as const,
					message: `No Taxprep mapping for ${change.concept} in tax year ${input.return_ref.tax_year}`,
				};
			}
			return {
				...change,
				status: "ready" as const,
				native_field: nativeField,
			};
		});

		const unresolved = changes.filter((change) => change.status !== "ready");
		return {
			plan_id: randomUUID(),
			return_ref: input.return_ref,
			changes,
			warnings: unresolved.length > 0 ? [`${unresolved.length} change(s) are not mapped for this Taxprep version`] : [],
			idempotency_key: input.idempotency_key,
		};
	}

	async applyPlan(_input: ApplyPlanInput): Promise<ApplyPlanResult> {
		void this.baseUrl;
		void this.apiKey;
		throw new Error("Taxprep apply_changes is not implemented yet");
	}

	async listForms(_input: { return_ref: ReturnRef }): Promise<TaxFormRef[]> {
		throw new Error("Taxprep list_forms is not implemented yet");
	}

	async listReturns(_input?: { tax_year?: number; return_type?: string }): Promise<ReturnRef[]> {
		throw new Error("Taxprep list_returns is not implemented yet");
	}

	async getDiagnostics(_input: { return_ref: ReturnRef }): Promise<Diagnostic[]> {
		throw new Error("Taxprep get_diagnostics is not implemented yet");
	}
}
