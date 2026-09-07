/**
 * DT Max adapter.
 *
 * Like the Taxprep adapter, this does not guess a contract it has not verified.
 * Unlike Taxprep, the blocker is not vendor credentials — DT Max has no API at all,
 * and that is settled rather than pending: zero hits for `API`, `SDK`, `REST`, `OAuth`,
 * COM/OLE or any scripting host across all 2,992 public knowledge-base articles.
 *
 * What DT Max does offer is asymmetric, and the adapter has to say so honestly:
 *
 *   read   — a produced return PDF opens with a `Sommaire comparatif` carrying every
 *            T1/TP1 line, with its CRA line number, across five tax years. Measured
 *            against this repo's own concept pack: 28 of 30 concepts that declare a
 *            `cra_line` are present, matched by number, with French labels identical
 *            to ours. This is buildable with no vendor relationship.
 *
 *   write  — a Standard GIFI file import, documented and explicitly built for third
 *            parties ("produced by third party software such as Caseware or Simply
 *            Accounting"). T2 only. There is no T1 write path of any kind, and CRA's
 *            Auto-fill My Return already populates T1 slips for free, so the value of
 *            one is smaller than it first appears.
 *
 * Everything therefore stays disabled until the corresponding layout is verified
 * against real files. See `docs/dtmax-integration-research.md` for sources, the
 * six-document corpus behind the read finding, and what remains unknown.
 */

import {
	type Adapter,
	type AdapterCapabilities,
	type Diagnostic,
	type EvidenceRef,
	type MutationMode,
	type MutationReceipt,
	type ReturnType,
	type TaxReturnSummary,
} from "../types.js";

/**
 * DT Max stamps every page with its own provenance:
 *
 *   Lic:33113/28.21/24  30 avr 2025  #1962
 *       │      │     │   │            └─ DT Max client number
 *       │      │     │   └─ production date
 *       │      │     └─ tax year
 *       │      └─ DT Max version
 *       └─ licence number, i.e. the firm
 *
 * Layout differs between versions — 28.21 (TY2024) and 29.12 (TY2025) were both seen
 * from one licence. Because the version is on the page, the parser can decline an
 * unrecognised one instead of mis-reading it. A wrong figure here is a wrong tax
 * return, so declining is the only acceptable failure mode.
 */
const VERIFIED_LAYOUT_VERSIONS: readonly string[] = [
	// Populate only once a version's layout has been verified against real returns.
];

export class DtMaxAdapter implements Adapter {
	readonly name = "dtmax";

	async getCapabilities(): Promise<AdapterCapabilities> {
		return {
			// GIFI import is T2-only, and reading applies to T1/T2/T3 returns. The
			// current `AdapterCapabilities` shape cannot express "this operation, for
			// these return types" — it carries one `return_types` list for the whole
			// adapter and a flat boolean per operation. DT Max is the case that breaks
			// it: claiming `set_field: true` lies about T1, `false` denies a real T2
			// capability. Both are unacceptable in a layer whose job is telling an
			// agent what it may attempt. See the research doc, §5.
			return_types: ["t1", "t2", "t3"],
			operations: {
				create_return: false,
				set_field: false,
				get_field: false,
				list_forms: false,
				list_returns: false,
				get_diagnostics: false,
			},
		};
	}

	async createReturn(_params: {
		taxpayer_ref: string;
		tax_year: number;
		return_type: ReturnType;
		mode: MutationMode;
	}): Promise<{ return_id?: string; receipt: MutationReceipt }> {
		// Nothing documented. DT Max creates clients through its own interface only.
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
		throw this.notConfigured(
			"set_field",
			params.return_id.startsWith("t1")
				? "DT Max has no T1 import path. CRA Auto-fill My Return already populates T1 slips."
				: "The Standard GIFI import layout is not published; verify it against a real GIFI file first.",
		);
	}

	async getField(_params: {
		return_id: string;
		tax_year: number;
		concept: string;
	}): Promise<{ value: string | number | boolean | null }> {
		// The read path is real and measured, but unbuilt: it needs a version-gated
		// parser for the `Sommaire comparatif` page, and `VERIFIED_LAYOUT_VERSIONS` is
		// still empty. Returning a value from an unverified layout would be worse than
		// returning nothing.
		throw this.notConfigured(
			"get_field",
			"The Sommaire comparatif parser is not implemented, and no layout version has been verified.",
		);
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
		// Unverified: whether a produced return carries DT Max's own diagnostics in a
		// parseable form has not been investigated.
		throw this.notConfigured("get_diagnostics");
	}

	private notConfigured(operation: string, because?: string): Error {
		return new Error(
			`DT Max operation '${operation}' is not enabled. ${
				because ?? "No verified mechanism exists for this operation."
			} See docs/dtmax-integration-research.md.`,
		);
	}
}
