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
 *   write  — 🚫 FROZEN 2026-09-18. `Tools → Merge` reads back a file that
 *            `Tools → Extract` writes, it is not limited to T2, and TaxCycle parses
 *            the format — so the mechanism is real. The licence is the obstacle, not
 *            the format: §5.4.4 prohibits developing software interfacing with the
 *            product, and §1.2 defines that to reach the formats and methods, not only
 *            the executable. No work proceeds here until counsel rules on the version
 *            a firm actually accepted. See docs/dtmax-integration-research.md §3.1.
 *
 *            What remains open is the Standard GIFI file import — documented, and
 *            explicitly built for third parties — but T2 only.
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

/**
 * What a firm must hold, and — unusually for this repository — a statement of
 * what this adapter will not touch.
 *
 * DT Max publishes no API, and §5.4.4 of the Thomson Reuters licence prohibits
 * developing software that interfaces with the product. The only path that is
 * plainly outside that clause is reading a document the firm produced and owns,
 * so that boundary is declared here rather than left to a reader's goodwill.
 */
export const DTMAX_ENTITLEMENTS: Entitlement[] = [
	{
		id: "dtmax.licence_permits_the_integration",
		description:
			"The firm's DT Max licence, in the version accepted in-product (Help > About > licence agreement), has been read and permits this use. The published copy is stamped V.7/2014 and is not necessarily the binding one.",
		source: "https://support.drtax.ca/dtmax/eng/kb/dtformax/pdf/eula_e.pdf",
	},
	{
		id: "dtmax.documents_supplied_by_the_firm",
		description:
			"Anything read here is a return the firm produced and supplied. This adapter does not open a DT Max database, does not read or write its interchange files, and does not interface with the product.",
		source: "docs/dtmax-integration-research.md",
	},
];

export class DtMaxAdapter implements Adapter {
	readonly name = "dtmax";

	constructor() {
		assertEntitlements(this.name, DTMAX_ENTITLEMENTS, assertedEntitlements());
	}

	async getCapabilities(): Promise<AdapterCapabilities> {
		// Nothing is implemented, so nothing is claimed. When the produced-return
		// reader lands, `get_field` becomes ["t1"] — the Sommaire comparatif is a
		// T1/TP1 page — and the GIFI import, if it is ever verified, makes
		// `set_field` ["t2"] without denying the T1 read. That is the distinction
		// a single boolean per operation could not express.
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
			requires: DTMAX_ENTITLEMENTS,
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
			"No write path is available. The `Tools → Merge` route is frozen: the licence prohibits developing software interfacing with the product, whatever the format turns out to be. The Standard GIFI layout is unpublished and covers t2 only.",
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
