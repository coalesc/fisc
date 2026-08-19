import type { TaxAdapter } from "../adapters/types.js";
import { CONCEPTS } from "../concepts/index.js";
import type {
	AdapterCapabilities,
	ApplyPlanResult,
	CreateReturnInput,
	Diagnostic,
	FieldChange,
	FieldValue,
	ReturnRef,
	ReturnType,
	TaxFormRef,
	WritePlan,
} from "./types.js";

/**
 * The durable core of fisc.
 *
 * Transports such as MCP, REST, or SDKs call this service. Vendor adapters sit
 * underneath it. Neither side owns the tax workflow or professional judgment.
 */
export class TaxInteroperabilityService {
	private readonly adapters = new Map<string, TaxAdapter>();
	private readonly plans = new Map<string, WritePlan>();

	constructor(adapters: TaxAdapter[] = []) {
		for (const adapter of adapters) this.registerAdapter(adapter);
	}

	registerAdapter(adapter: TaxAdapter): void {
		if (this.adapters.has(adapter.name)) {
			throw new Error(`Adapter already registered: ${adapter.name}`);
		}
		this.adapters.set(adapter.name, adapter);
	}

	listAdapters(): AdapterCapabilities[] {
		return [...this.adapters.values()].map((adapter) => adapter.getCapabilities());
	}

	getCapabilities(adapterName: string): AdapterCapabilities {
		return this.getAdapter(adapterName).getCapabilities();
	}

	listConcepts(returnType: ReturnType) {
		return CONCEPTS[returnType];
	}

	async createReturn(adapterName: string, input: CreateReturnInput): Promise<ReturnRef> {
		this.assertReturnType(input.return_type);
		return this.getAdapter(adapterName).createReturn(input);
	}

	async getField(returnRef: ReturnRef, concept: string): Promise<FieldValue> {
		this.assertConcept(returnRef.return_type, concept);
		return this.getAdapter(returnRef.adapter).getField({ return_ref: returnRef, concept });
	}

	async planChanges(returnRef: ReturnRef, changes: FieldChange[], idempotencyKey?: string): Promise<WritePlan> {
		for (const change of changes) this.assertConcept(returnRef.return_type, change.concept);

		const plan = await this.getAdapter(returnRef.adapter).planChanges({
			return_ref: returnRef,
			changes,
			idempotency_key: idempotencyKey,
		});
		this.plans.set(plan.plan_id, plan);
		return plan;
	}

	getPlan(planId: string): WritePlan {
		const plan = this.plans.get(planId);
		if (!plan) throw new Error(`Unknown or expired plan: ${planId}`);
		return plan;
	}

	async applyPlan(planId: string, approvedBy: string): Promise<ApplyPlanResult> {
		const plan = this.getPlan(planId);
		const blocked = plan.changes.filter((change) => change.status !== "ready");
		if (blocked.length > 0) {
			throw new Error(`Plan ${planId} has ${blocked.length} unresolved change(s)`);
		}

		const result = await this.getAdapter(plan.return_ref.adapter).applyPlan({
			plan,
			approved_by: approvedBy,
		});
		this.plans.delete(planId);
		return result;
	}

	async listForms(returnRef: ReturnRef): Promise<TaxFormRef[]> {
		return this.getAdapter(returnRef.adapter).listForms({ return_ref: returnRef });
	}

	async listReturns(adapterName: string, input?: { tax_year?: number; return_type?: string }): Promise<ReturnRef[]> {
		return this.getAdapter(adapterName).listReturns(input);
	}

	async getDiagnostics(returnRef: ReturnRef): Promise<Diagnostic[]> {
		return this.getAdapter(returnRef.adapter).getDiagnostics({ return_ref: returnRef });
	}

	private getAdapter(name: string): TaxAdapter {
		const adapter = this.adapters.get(name);
		if (!adapter) {
			throw new Error(`Adapter is not configured: ${name}`);
		}
		return adapter;
	}

	private assertReturnType(returnType: ReturnType): void {
		if (!CONCEPTS[returnType]) throw new Error(`Unsupported return type: ${returnType}`);
	}

	private assertConcept(returnType: ReturnType, concept: string): void {
		this.assertReturnType(returnType);
		if (!CONCEPTS[returnType][concept]) {
			throw new Error(`Unknown ${returnType.toUpperCase()} concept: ${concept}`);
		}
	}
}
