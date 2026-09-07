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
 *   write  — two candidates. `Tools → Merge`, DT Max's own in-product client
 *            interchange, reads back a file that `Tools → Extract` writes; it is not
 *            limited to T2, and TaxCycle already parses that format with no API and no
 *            vendor cooperation, so what can be read can probably be written. Whether
 *            the file is text, XML or proprietary binary is NOT established, and one
 *            Extract file settles it. Failing that, a Standard GIFI file import is
 *            documented and explicitly built for third parties — but T2 only.
 *
 *            What we would push is not slips: CRA's Auto-fill My Return already
 *            populates those for free. It is the half AFR cannot deliver — medical
 *            totals, donations, childcare, self-employment, rental, moving — everything
 *            that arrives as a receipt or a declaration rather than a slip, and which
 *            only whoever spoke to the client can supply.
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
			// The current `AdapterCapabilities` shape cannot express "this operation,
			// for these return types" — one `return_types` list for the whole adapter,
			// a flat boolean per operation. DT Max breaks it: GIFI import is t2-only,
			// while `Tools → Merge` would cover t1/t2/t3 if the format proves writable.
			// Claiming `set_field: true` would lie about whichever half is unsupported;
			// `false` denies a real capability. Both are unacceptable in a layer whose
			// job is telling an agent what it may attempt. See the research doc, §5.
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

	async setField(_params: {
		return_id: string;
		tax_year: number;
		concept: string;
		value: string | number | boolean | null;
		evidence?: EvidenceRef;
		mode: MutationMode;
	}): Promise<{ receipt: MutationReceipt }> {
		// Neither candidate path is verified, so neither is offered. `Tools → Merge` is
		// the one that would cover T1, and it carries a specific hazard beyond parsing:
		// it arbitrates by a `savelevel` counter incremented on every save, with a
		// force-merge override, so a file written with a higher level can overwrite a
		// preparer's work. Any implementation has to be proven on a throwaway database
		// before it is pointed at a real one.
		throw this.notConfigured(
			"set_field",
			"No write path is verified. `Tools → Merge` would cover this return type, but the Extract file format is unexamined; the Standard GIFI layout is unpublished and covers t2 only.",
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
