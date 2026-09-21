/**
 * CCH iFirm Taxprep, over the vendor's own Web API.
 *
 * ## Why this adapter exists separately from `taxprep`
 *
 * Taxprep is two products with one name. The desktop application is reached
 * through a COM automation module on a Windows machine; CCH iFirm Taxprep is a
 * cloud module reached over HTTP. They share a cell-ID vocabulary and almost
 * nothing else — different transport, different authentication, different
 * entitlements. One adapter pretending to be both would have to lie about half
 * of what it reports, so there are two.
 *
 * ## Where this runs, and why that is not a deployment detail
 *
 * Wolters Kluwer's subscription agreement restricts sharing account access
 * information with third parties, and restricts use of the application to
 * authorized users within the firm's own practice. A firm's API key emailed to
 * a vendor is the situation those clauses describe.
 *
 * So this adapter is built to run **inside an environment the firm controls**,
 * with the key read from that environment and never transported. That is the
 * `ifirm.credentials_stay_in_firm_environment` entitlement below: asserting it
 * is a statement about where fisc is deployed, not about a licence.
 *
 * Read the agreement in force on the day you deploy. See `docs/entitlements.md`.
 *
 * ## What is documented and what has been run
 *
 * The endpoints below are taken from the vendor's published help. **None of it
 * has been executed against a live site.** Everything that cannot be performed
 * honestly reports `false` rather than failing at the moment of a write.
 */

import { readFileSync } from "node:fs";
import {
	type Adapter,
	type AdapterCapabilities,
	type Diagnostic,
	type Entitlement,
	type EvidenceRef,
	type MutationMode,
	type MutationReceipt,
	type OperationSupport,
	type ReturnType,
	type TaxReturnSummary,
	assertEntitlements,
	assertedEntitlements,
	reachableReturnTypes,
} from "../types.js";

/** Return types the cells endpoints accept, as vendor product segments. */
const CELL_PRODUCTS: Partial<Record<ReturnType, string>> = {
	t1: "t1",
	t2: "t2",
	t3: "t3",
};

export const IFIRM_ENTITLEMENTS: Entitlement[] = [
	{
		id: "ifirm.taxprep_module",
		description:
			"The firm subscribes to the CCH iFirm Taxprep module. An iFirm site without it has practice management but no returns, and none of these endpoints exist.",
		source: "https://support.cchifirm.ca/en/content/cch_ifirm/web_api/api_about_cch_ifirm_tax_web_api.htm",
	},
	{
		id: "ifirm.api_administration_role",
		description:
			"A user at the firm holds the Taxprep API Administration access role and has minted the key from Settings > Taxprep > Taxprep API Administration.",
		source: "https://support.cchifirm.ca/en/content/cch_ifirm/web_api/api_about_cch_ifirm_tax_web_api.htm",
	},
	{
		id: "ifirm.credentials_stay_in_firm_environment",
		description:
			"This process runs in an environment the firm controls and the API key is not transported to a third party. Confirm against the firm's own subscription agreement.",
		source: "https://support.wolterskluwer.ca/en/eula/",
	},
];

export interface IFirmConfig {
	/** The firm's own site, e.g. https://firmname.cchifirm.ca */
	site: string;
	/** Read-write or read-only Web API key, sent as `x-api-key`. */
	apiKey: string;
	/**
	 * Path to a JSON cell map, `{ "<tax_year>": { "<concept>": "<cellPath>" } }`.
	 *
	 * Deliberately a file the operator supplies rather than data in this
	 * repository. Cell vocabularies obtained under a vendor agreement are not
	 * ours to publish, and they change with the forms every year.
	 */
	cellMapPath?: string;
	timeoutSeconds?: number;
}

/** Read the adapter's configuration from the environment it is deployed in. */
export function configFromEnv(env = process.env): IFirmConfig | undefined {
	const site = env.IFIRM_SITE_URL;
	const apiKey = env.IFIRM_API_KEY;
	if (!site || !apiKey) return undefined;
	return {
		site,
		apiKey,
		cellMapPath: env.IFIRM_CELL_MAP_PATH,
		timeoutSeconds: positiveSeconds(env.IFIRM_TIMEOUT_SECONDS),
	};
}

/**
 * A timeout that is not a positive number is ignored rather than propagated.
 *
 * `Number("abc")` is NaN, `NaN ?? 30` is still NaN, and `setTimeout` treats a
 * NaN delay as 1ms — so a typo in the environment would abort every request
 * immediately and look like the vendor timing out.
 */
function positiveSeconds(raw: string | undefined): number | undefined {
	if (raw === undefined) return undefined;
	const n = Number(raw);
	return Number.isFinite(n) && n > 0 ? n : undefined;
}

type CellMaps = Record<number, Record<string, string>>;

function loadCellMaps(path: string | undefined): CellMaps {
	if (!path) return {};
	const parsed = JSON.parse(readFileSync(path, "utf8")) as Record<
		string,
		Record<string, string>
	>;
	const maps: CellMaps = {};
	for (const [year, concepts] of Object.entries(parsed)) {
		maps[Number(year)] = concepts;
	}
	return maps;
}

/** A document reference: the GUID, and which taxpayer within it. */
interface DocumentRef {
	documentId: string;
	/** 0 taxpayer, 1 spouse, 1000+ dependants — the vendor's convention. */
	returnId: number;
}

/**
 * `<guid>` addresses the main taxpayer. `<guid>#1` is the spouse, `<guid>#1001`
 * a dependant — the same numbering the vendor uses in its own import files.
 */
function parseDocumentRef(returnIdentifier: string): DocumentRef {
	const [documentId, suffix] = returnIdentifier.split("#");
	const returnId = suffix === undefined ? 0 : Number(suffix);
	if (suffix === "" || !documentId || !Number.isInteger(returnId) || returnId < 0) {
		throw new Error(
			`Invalid return_id '${returnIdentifier}'. Expected a document GUID, optionally '#<returnId>' where 0 is the taxpayer, 1 the spouse and 1000+ a dependant.`,
		);
	}
	return { documentId, returnId };
}

export class IFirmAdapter implements Adapter {
	readonly name = "ifirm";
	private readonly cellMaps: CellMaps;

	constructor(private readonly config: IFirmConfig) {
		assertEntitlements(this.name, IFIRM_ENTITLEMENTS, assertedEntitlements());
		this.cellMaps = loadCellMaps(config.cellMapPath);
	}

	async getCapabilities(): Promise<AdapterCapabilities> {
		// The cells endpoints are documented for t1/t2/t3, but an endpoint we
		// cannot address is not a capability, and there are two separate reasons
		// this adapter cannot address all three yet.
		//
		// Without a verified cell map there is no concept to turn into a
		// cellPath at all. And even with one, `productFor()` cannot yet tell
		// which product a document GUID belongs to, so every request is built
		// against t1. Claiming t2 and t3 here would be precisely the lie this
		// capability system exists to prevent — a caller would be told a
		// corporate write is supported and get a request aimed at the wrong
		// product. Both lists widen together once that lookup is verified.
		const cellOperations: OperationSupport = this.hasAnyCellMap()
			? ["t1"]
			: false;

		const operations: AdapterCapabilities["operations"] = {
			// Documented, but the contact payload contract has not been verified
			// against a live site, and a return created against the wrong contact
			// is worse than one not created.
			create_return: false,
			set_field: cellOperations,
			get_field: cellOperations,
			// No documented endpoint enumerates the forms in a return.
			list_forms: false,
			list_returns: ["t1"],
			// The vendor documents that the "Cells with diagnostics" review filter
			// is not supported. There is no diagnostics endpoint to call.
			get_diagnostics: false,
		};

		return {
			return_types: reachableReturnTypes(operations),
			operations,
			requires: IFIRM_ENTITLEMENTS,
		};
	}

	async createReturn(_params: {
		taxpayer_ref: string;
		tax_year: number;
		return_type: ReturnType;
		mode: MutationMode;
	}): Promise<{ return_id?: string; receipt: MutationReceipt }> {
		throw new Error(
			"iFirm operation 'create_return' is not enabled. The vendor documents POST /t1/documents, but the contact payload contract has not been verified against a live site.",
		);
	}

	async setField(params: {
		return_id: string;
		tax_year: number;
		concept: string;
		value: string | number | boolean | null;
		evidence?: EvidenceRef;
		mode: MutationMode;
	}): Promise<{ receipt: MutationReceipt }> {
		const { documentId, returnId } = parseDocumentRef(params.return_id);
		const cellPath = this.resolveCell(params.concept, params.tax_year);
		const product = this.productFor(documentId);
		const value = formatValue(params.value);

		if (params.mode === "validate") {
			const read = await this.getData(product, documentId, [
				{ cellPath, returnId },
			]);
			const [current] = read.cells;
			const warnings = [...read.warnings];
			if (current?.value !== undefined && current.value !== "" && current.value !== value) {
				warnings.push(
					`${cellPath} currently holds '${current.value}' and would be overwritten with '${value}'.`,
				);
			}
			return { receipt: { status: "validated", warnings } };
		}

		const { warnings } = await this.request<unknown>(
			"POST",
			`/api/partner/1.0/${product}/documents/${documentId}/cells/setdata`,
			[{ cellPath, value, returnId }],
		);
		return {
			receipt: {
				status: "committed",
				vendor_reference: `${product}/${documentId}#${returnId}/${cellPath}`,
				warnings,
			},
		};
	}

	async getField(params: {
		return_id: string;
		tax_year: number;
		concept: string;
	}): Promise<{ value: string | number | boolean | null }> {
		const { documentId, returnId } = parseDocumentRef(params.return_id);
		const cellPath = this.resolveCell(params.concept, params.tax_year);
		const read = await this.getData(this.productFor(documentId), documentId, [
			{ cellPath, returnId },
		]);
		return { value: read.cells[0]?.value ?? null };
	}

	async listForms(_params: { return_id: string }): Promise<{ forms: string[] }> {
		throw new Error(
			"iFirm operation 'list_forms' is not enabled. No documented endpoint enumerates the forms in a return.",
		);
	}

	async listReturns(params?: {
		return_type?: ReturnType;
		tax_year?: number;
	}): Promise<{ returns: TaxReturnSummary[] }> {
		if (params?.return_type && params.return_type !== "t1") {
			throw new Error(
				`iFirm operation 'list_returns' is verified for t1 only, not '${params.return_type}'.`,
			);
		}
		// ⚠️ The endpoint and its filters are documented; the exact response shape
		// is not, and has never been seen. The two field names below are the
		// plausible ones, and a live site is what settles it. An unrecognised
		// shape must say so — an empty list would read as "this firm has no
		// returns", which is a different and much more misleading answer.
		const { body } = await this.request<{
			result?: { documents?: Array<Record<string, unknown>> };
		}>("POST", "/api/partner/1.0/t1/documents/getList", {
			year: params?.tax_year,
		});
		const documents = body?.result?.documents;
		if (documents === undefined) {
			throw new Error(
				"iFirm 'list_returns' could not read the response: no `result.documents` array. The response shape of documents/getList has not been verified against a live site; correct the parser rather than assuming the firm has no returns.",
			);
		}
		return {
			returns: documents.map((document) => ({
				return_id: String(document.id ?? document.documentId ?? ""),
				return_type: "t1" as const,
				tax_year: Number(document.year ?? params?.tax_year ?? 0),
				status: document.status ? String(document.status) : undefined,
			})),
		};
	}

	async getDiagnostics(_params: {
		return_id: string;
	}): Promise<{ diagnostics: Diagnostic[] }> {
		throw new Error(
			"iFirm operation 'get_diagnostics' is not enabled. The vendor documents that the 'Cells with diagnostics' review filter is not supported, and exposes no diagnostics endpoint.",
		);
	}

	/** The configured site, for diagnostics. Never the key. */
	describe(): string {
		return `${this.name} → ${this.config.site}`;
	}

	private hasAnyCellMap(): boolean {
		return Object.values(this.cellMaps).some(
			(concepts) => Object.keys(concepts).length > 0,
		);
	}

	private resolveCell(concept: string, taxYear: number): string {
		const cellPath = this.cellMaps[taxYear]?.[concept];
		if (!cellPath) {
			throw new Error(
				`No verified iFirm cell mapping for concept '${concept}' in tax year ${taxYear}. Cell IDs are per-form and per-tax-year; a mapping verified for one year is not verified for the next.`,
			);
		}
		return cellPath;
	}

	/**
	 * Which product segment a document belongs to.
	 *
	 * Not derivable from a GUID, and guessing would address the wrong return.
	 * Until a document-to-product lookup is verified, t1 is the only product
	 * this adapter addresses — which is also the only one `list_returns` covers.
	 */
	private productFor(_documentId: string): string {
		return "t1";
	}

	private async getData(
		product: string,
		documentId: string,
		cells: Array<{ cellPath: string; returnId: number }>,
	): Promise<{
		cells: Array<{ cellPath: string; value: string | null }>;
		warnings: string[];
	}> {
		const { body, warnings } = await this.request<{
			result?: Array<{ cellPath?: string; value?: string | null }>;
		}>(
			"POST",
			`/api/partner/1.0/${product}/documents/${documentId}/cells/getdata`,
			cells,
		);
		return {
			cells: (body?.result ?? []).map((cell) => ({
				cellPath: String(cell.cellPath ?? ""),
				value: cell.value ?? null,
			})),
			warnings,
		};
	}

	private async request<T>(
		method: string,
		path: string,
		payload?: unknown,
	): Promise<{ body: T | undefined; warnings: string[] }> {
		const controller = new AbortController();
		const timeout = setTimeout(
			() => controller.abort(),
			(this.config.timeoutSeconds ?? 30) * 1000,
		);
		try {
			const response = await fetch(
				new URL(path, this.config.site).toString(),
				{
					method,
					headers: {
						"x-api-key": this.config.apiKey,
						"content-type": "application/json",
					},
					body: payload === undefined ? undefined : JSON.stringify(payload),
					signal: controller.signal,
				},
			);

			if (response.status === 429) {
				const retryAfter = response.headers.get("retry-after");
				throw new Error(
					`iFirm rate limit reached${retryAfter ? `; retry after ${retryAfter}s` : ""}. Daily allowances on this API are small — batch cells into one call rather than one call per cell.`,
				);
			}
			if (!response.ok) {
				throw new Error(
					`iFirm ${method} ${path} failed: ${response.status} ${response.statusText}`,
				);
			}

			const warnings: string[] = [];
			const left = response.headers.get("x-requests-left-day");
			// Surfaced rather than logged: a caller batching writes needs to see
			// the budget shrinking while there is still room to change course.
			if (left !== null && Number(left) < 25) {
				warnings.push(`${left} iFirm API requests remain today.`);
			}
			const raw = await response.text();
			if (!raw) return { body: undefined, warnings };
			return { body: JSON.parse(raw) as T, warnings };
		} finally {
			clearTimeout(timeout);
		}
	}
}

/**
 * The vendor stores values in its own format, which is not what the interface
 * displays. Dates are the documented example: `YYYY-MM-DD`, never the formatted
 * form a preparer sees.
 *
 * `null` is refused rather than translated. The COM interface documents passing
 * Null to clear a cell; whether the REST equivalent is an empty string, a JSON
 * null, or something else is not documented, and a guess here does not fail —
 * it writes the wrong thing into a return and looks like it worked.
 */
function formatValue(value: string | number | boolean | null): string {
	if (value === null) {
		throw new Error(
			"Clearing a cell through the iFirm Web API is not implemented: the convention for an empty value is not documented, and guessing it would write a value rather than fail.",
		);
	}
	if (typeof value === "boolean") return value ? "1" : "0";
	return String(value);
}
