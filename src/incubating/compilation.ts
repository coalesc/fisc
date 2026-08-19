import type { SourceRef } from "../core/types.js";

/**
 * Incubating compilation contract.
 *
 * This is a domain skeleton, not a CaseWare integration and not part of fisc's
 * tax API. It exists so future compilation adapters can share portable concepts.
 */

export interface CompilationEngagementRef {
	id: string;
	adapter: string;
	period_start: string;
	period_end: string;
	entity_name?: string;
}

export interface AccountRef {
	id: string;
	number?: string;
	name: string;
	currency?: string;
}

export interface TrialBalanceLine {
	account: AccountRef;
	opening_balance?: number;
	debits?: number;
	credits?: number;
	ending_balance: number;
	sources?: SourceRef[];
}

export interface JournalLine {
	account: AccountRef;
	debit?: number;
	credit?: number;
	description?: string;
	sources?: SourceRef[];
}

export interface AdjustingEntry {
	id?: string;
	date: string;
	description: string;
	lines: JournalLine[];
	note?: string;
}

export interface WorkpaperRef {
	id: string;
	name: string;
	section?: string;
}

export interface CompilationReviewPoint {
	id: string;
	status: "open" | "resolved";
	severity?: "info" | "warning" | "blocking";
	message: string;
	workpaper?: WorkpaperRef;
	sources?: SourceRef[];
}

export interface CompilationWritePlan {
	plan_id: string;
	engagement_ref: CompilationEngagementRef;
	adjusting_entries: AdjustingEntry[];
	warnings: string[];
	idempotency_key?: string;
}

export interface CompilationCapabilities {
	adapter: string;
	operations: {
		read_trial_balance: boolean;
		plan_adjusting_entries: boolean;
		apply_adjusting_entries: boolean;
		attach_evidence: boolean;
		list_workpapers: boolean;
		list_review_points: boolean;
	};
}

/**
 * Future adapters should translate these accounting concepts to systems such as
 * CaseWare without forcing callers to know vendor-specific file structures.
 */
export interface CompilationAdapter {
	readonly name: string;
	getCapabilities(): CompilationCapabilities;
	getTrialBalance(input: { engagement_ref: CompilationEngagementRef }): Promise<TrialBalanceLine[]>;
	planAdjustingEntries(input: {
		engagement_ref: CompilationEngagementRef;
		entries: AdjustingEntry[];
		idempotency_key?: string;
	}): Promise<CompilationWritePlan>;
	applyPlan(input: { plan: CompilationWritePlan; approved_by: string }): Promise<{ applied: number; warnings: string[] }>;
	listWorkpapers(input: { engagement_ref: CompilationEngagementRef }): Promise<WorkpaperRef[]>;
	listReviewPoints(input: { engagement_ref: CompilationEngagementRef }): Promise<CompilationReviewPoint[]>;
}
