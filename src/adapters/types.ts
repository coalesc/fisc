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

/**
 * Which return types an operation works for.
 *
 * `false` means the adapter cannot do it at all. A list means it can, for
 * exactly those return types and no others.
 *
 * A single boolean per operation was the earlier shape and it forced adapters
 * to lie. A vendor whose only sanctioned write path is corporate — a GIFI
 * import, say — had to choose between `set_field: true`, which promises a T1
 * write it cannot perform, and `set_field: false`, which denies a real T2 one.
 * Both answers are wrong, and a caller cannot recover from either.
 */
export type OperationSupport = false | ReturnType[];

/**
 * Something the deploying firm must already hold for an adapter to run.
 *
 * These are not configuration. They are the licence, the module, the role or
 * the deployment condition that makes a call to a vendor both possible and
 * permitted — a purchased COM module, a security role only an administrator can
 * grant, a credential that may not leave the firm's own environment.
 *
 * They are declared so they fail loudly at startup rather than quietly at the
 * first write, and so the answer to "what do we need before this works?" lives
 * next to the code instead of in someone's memory.
 */
export interface Entitlement {
	/** Stable identifier, `<adapter>.<requirement>`. */
	id: string;
	/** What the firm must hold, in plain terms. */
	description: string;
	/**
	 * Where the requirement comes from — the vendor's own documentation or
	 * agreement. A link, never a quotation: read the version in force on the
	 * day you deploy. See `docs/security.md`.
	 */
	source: string;
}

export interface AdapterCapabilities {
	/**
	 * Every return type this adapter can reach by any operation — the union of
	 * the lists below. Use `supports()` to ask about one operation.
	 */
	return_types: ReturnType[];
	operations: {
		create_return: OperationSupport;
		set_field: OperationSupport;
		get_field: OperationSupport;
		list_forms: OperationSupport;
		list_returns: OperationSupport;
		get_diagnostics: OperationSupport;
	};
	/** What the firm must hold for this adapter to be usable. May be empty. */
	requires: Entitlement[];
}

/** Whether an adapter supports one operation for one return type. */
export function supports(
	capabilities: AdapterCapabilities,
	operation: keyof AdapterCapabilities["operations"],
	returnType: ReturnType,
): boolean {
	const support = capabilities.operations[operation];
	return support !== false && support.includes(returnType);
}

/** The union of every return type any operation supports. */
export function reachableReturnTypes(
	operations: AdapterCapabilities["operations"],
): ReturnType[] {
	const seen = new Set<ReturnType>();
	for (const support of Object.values(operations)) {
		if (support === false) continue;
		for (const returnType of support) seen.add(returnType);
	}
	return ["t1", "t2", "t3", "t5013"].filter((t) =>
		seen.has(t as ReturnType),
	) as ReturnType[];
}

/**
 * Refuse to run unless the operator has asserted every entitlement an adapter
 * requires.
 *
 * `FISC_ENTITLEMENTS` is a comma-separated list of ids. Asserting one is a
 * statement by the person deploying fisc that the firm holds it — nothing here
 * can verify a licence, and nothing here pretends to. What it prevents is the
 * quieter failure: an adapter reaching a vendor it was never entitled to reach
 * because the requirement was written in a document nobody opened.
 */
export function assertEntitlements(
	adapterName: string,
	required: Entitlement[],
	asserted: string[],
): void {
	const missing = required.filter((e) => !asserted.includes(e.id));
	if (missing.length === 0) return;
	throw new Error(
		`Adapter '${adapterName}' requires entitlements that have not been asserted: ` +
			missing.map((e) => e.id).join(", ") +
			`. Each one is a thing the firm must already hold:\n` +
			missing.map((e) => `  - ${e.id}: ${e.description} (${e.source})`).join("\n") +
			`\nSet FISC_ENTITLEMENTS to a comma-separated list of ids once they are in place.`,
	);
}

/** Entitlement ids the operator has asserted, from the environment. */
export function assertedEntitlements(env = process.env): string[] {
	return (env.FISC_ENTITLEMENTS ?? "")
		.split(",")
		.map((id) => id.trim())
		.filter(Boolean);
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
