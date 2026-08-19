import type { SourceRef } from "../core/types.js";

/**
 * Incubating assurance contract.
 *
 * This layer models evidence and workpaper operations only. It deliberately does
 * not encode audit conclusions, sufficiency judgments, materiality decisions,
 * or other professional judgments that belong to the accountant/auditor.
 */

export type AssuranceEngagementType = "audit" | "review";

export type Assertion =
	| "existence"
	| "completeness"
	| "accuracy"
	| "valuation"
	| "rights_and_obligations"
	| "cutoff"
	| "classification"
	| "presentation";

export interface AssuranceEngagementRef {
	id: string;
	adapter: string;
	engagement_type: AssuranceEngagementType;
	period_end: string;
	entity_name?: string;
}

export interface AssuranceWorkpaperRef {
	id: string;
	name: string;
	section?: string;
}

export interface ProcedureRef {
	id: string;
	title: string;
	assertions?: Assertion[];
	workpaper?: AssuranceWorkpaperRef;
}

export interface ProcedureStatus {
	procedure: ProcedureRef;
	status: "not_started" | "in_progress" | "ready_for_review" | "complete";
	performed_by?: string;
	performed_at?: string;
	sources?: SourceRef[];
}

export interface SampleItem {
	id: string;
	population_ref?: string;
	label?: string;
	value?: number;
	sources?: SourceRef[];
}

export interface AssuranceFinding {
	id: string;
	severity: "info" | "warning" | "significant";
	status: "open" | "resolved";
	message: string;
	procedure_id?: string;
	sources?: SourceRef[];
}

export interface Signoff {
	workpaper: AssuranceWorkpaperRef;
	role: "preparer" | "reviewer" | "partner";
	user_id: string;
	signed_at: string;
}

export interface AssuranceCapabilities {
	adapter: string;
	engagement_types: AssuranceEngagementType[];
	operations: {
		list_workpapers: boolean;
		list_procedures: boolean;
		read_procedure_status: boolean;
		attach_evidence: boolean;
		write_procedure_status: boolean;
		list_findings: boolean;
		write_findings: boolean;
		read_signoffs: boolean;
	};
}

/**
 * Future assurance adapters expose workpaper/evidence mechanics while leaving
 * professional judgment outside the interoperability layer.
 */
export interface AssuranceAdapter {
	readonly name: string;
	getCapabilities(): AssuranceCapabilities;
	listWorkpapers(input: { engagement_ref: AssuranceEngagementRef }): Promise<AssuranceWorkpaperRef[]>;
	listProcedures(input: { engagement_ref: AssuranceEngagementRef }): Promise<ProcedureRef[]>;
	getProcedureStatus(input: { engagement_ref: AssuranceEngagementRef; procedure_id: string }): Promise<ProcedureStatus>;
	listFindings(input: { engagement_ref: AssuranceEngagementRef }): Promise<AssuranceFinding[]>;
	readSignoffs(input: { engagement_ref: AssuranceEngagementRef }): Promise<Signoff[]>;
}
