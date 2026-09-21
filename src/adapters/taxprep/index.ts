/**
 * Taxprep on the desktop, over the vendor's COM automation module.
 *
 * The cloud module is a different product with a different transport and lives
 * in `../ifirm`. This adapter is the on-premise one: Taxprep installed on a
 * Windows machine, automated through the COM interface the vendor documents in
 * its Development Toolkit.
 *
 * That places this process **on the firm's own Windows host, beside the
 * installation** — there is no endpoint to call from anywhere else — and it
 * makes the firm's entitlement to the COM module a precondition rather than a
 * configuration detail. See `requires` below and `docs/entitlements.md`.
 *
 * This adapter intentionally does not guess the production automation contract.
 * Every operation reports `false` and every call throws until a transport has
 * been built and verified against a real installation.
 */

import {
	type Adapter,
	type AdapterCapabilities,
	type Diagnostic,
	type Entitlement,
	type EvidenceRef,
	type MutationMode,
	type MutationReceipt,
	type ReturnType,
	type TaxReturnSummary,
	assertEntitlements,
	assertedEntitlements,
	reachableReturnTypes,
} from "../types.js";

export const TAXPREP_ENTITLEMENTS: Entitlement[] = [
	{
		id: "taxprep.com_module",
		description:
			"The firm's Taxprep installation has the COM module purchased and activated, or the deployment holds an Integration Partner runtime licence key from the vendor.",
		source: "https://www.taxprep.com/assistance/T2/2021/v10/en-ca/content/Downloadable%20Files/About_dev_toolkit.htm",
	},
	{
		id: "taxprep.windows_host_in_firm_environment",
		description:
			"This process runs on a Windows host the firm controls, beside the Taxprep installation, and no credential or client file leaves that host.",
		source: "https://support.wolterskluwer.ca/en/eula/",
	},
];

const CELL_MAPS: Record<number, Record<string, string>> = {
	// Populate only from verified vendor documentation for each tax year.
};

export class TaxprepAdapter implements Adapter {
	readonly name = "taxprep";

	constructor() {
		assertEntitlements(this.name, TAXPREP_ENTITLEMENTS, assertedEntitlements());
	}

	async getCapabilities(): Promise<AdapterCapabilities> {
		// No transport is implemented, so nothing is supported for any return
		// type. The `requires` list is still reported: an operator needs to know
		// what to obtain before any of this can become true.
		const operations: AdapterCapabilities["operations"] = {
			create_return: false,
			set_field: false,
			get_field: false,
			list_forms: false,
			list_returns: false,
			get_diagnostics: false,
		};
		return {
			return_types: reachableReturnTypes(operations),
			operations,
			requires: TAXPREP_ENTITLEMENTS,
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
			`Taxprep operation '${operation}' is not enabled. This adapter needs a COM transport built and verified against a real installation. For the cloud module, use the 'ifirm' adapter instead.`,
		);
	}
}
