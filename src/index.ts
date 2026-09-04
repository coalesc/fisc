#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { TaxprepAdapter } from "./adapters/taxprep/index.js";
import {
	type Adapter,
	type EvidenceRef,
	type MutationMode,
	type ReturnType,
} from "./adapters/types.js";
import { CONCEPTS, RETURN_TYPES } from "./concepts/index.js";

const server = new McpServer({ name: "fisc", version: "0.2.0" });
const returnTypeSchema = z.enum(["t1", "t2", "t3", "t5013"]);
const modeSchema = z.enum(["validate", "commit"]);

function loadAdapter(): Adapter | undefined {
	switch (process.env.FISC_ADAPTER) {
		case "taxprep":
			return new TaxprepAdapter();
		case undefined:
		case "":
			return undefined;
		default:
			throw new Error(`Unknown FISC_ADAPTER: ${process.env.FISC_ADAPTER}`);
	}
}

const adapter = loadAdapter();

function text(value: unknown) {
	return {
		content: [
			{
				type: "text" as const,
				text: typeof value === "string" ? value : JSON.stringify(value, null, 2),
			},
		],
	};
}

function failure(error: unknown) {
	return text({
		ok: false,
		error: error instanceof Error ? error.message : String(error),
	});
}

function requireAdapter(): Adapter {
	if (!adapter) {
		throw new Error(
			"No vendor adapter is configured. Set FISC_ADAPTER after obtaining supported vendor access.",
		);
	}
	return adapter;
}

server.tool("get_capabilities", "Describe the configured adapter and supported operations", {}, async () => {
	if (!adapter) {
		return text({
			protocol_version: "0.2.0",
			configured_adapter: null,
			return_types: RETURN_TYPES,
			default_mutation_mode: "validate",
		});
	}
	try {
		return text({
			protocol_version: "0.2.0",
			configured_adapter: adapter.name,
			default_mutation_mode: "validate",
			...(await adapter.getCapabilities()),
		});
	} catch (error) {
		return failure(error);
	}
});

server.tool(
	"list_concepts",
	"List verified vendor-neutral tax concepts for a return type",
	{ return_type: returnTypeSchema.describe("Tax return type") },
	async ({ return_type }) => {
		const concepts = CONCEPTS[return_type as ReturnType];
		if (!concepts) {
			return text({
				return_type,
				concepts: [],
				note: "No verified concept pack has been published for this return type yet.",
			});
		}
		return text(
			Object.entries(concepts).map(([id, concept]) => ({ id, ...concept })),
		);
	},
);

server.tool(
	"create_return",
	"Create or validate creation of a tax return. Mutations default to validate-only.",
	{
		taxpayer_ref: z
			.string()
			.describe("Opaque taxpayer reference. Do not pass a SIN directly through the MCP tool."),
		tax_year: z.number().int().min(2000).max(2100),
		return_type: returnTypeSchema,
		mode: modeSchema.optional().describe("validate (default) or commit"),
	},
	async ({ taxpayer_ref, tax_year, return_type, mode }) => {
		try {
			return text(
				await requireAdapter().createReturn({
					taxpayer_ref,
					tax_year,
					return_type: return_type as ReturnType,
					mode: (mode ?? "validate") as MutationMode,
				}),
			);
		} catch (error) {
			return failure(error);
		}
	},
);

server.tool(
	"set_field",
	"Set or validate a tax field using a vendor-neutral concept. Mutations default to validate-only.",
	{
		return_id: z.string(),
		tax_year: z.number().int().min(2000).max(2100),
		concept: z.string(),
		value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
		evidence_source_id: z.string().optional(),
		evidence_source_type: z.string().optional(),
		evidence_page: z.number().int().positive().optional(),
		evidence_checksum: z.string().optional(),
		mode: modeSchema.optional().describe("validate (default) or commit"),
	},
	async ({
		return_id,
		tax_year,
		concept,
		value,
		evidence_source_id,
		evidence_source_type,
		evidence_page,
		evidence_checksum,
		mode,
	}) => {
		try {
			const evidence: EvidenceRef | undefined = evidence_source_id
				? {
					source_id: evidence_source_id,
					source_type: evidence_source_type,
					page: evidence_page,
					checksum: evidence_checksum,
				}
				: undefined;
			return text(
				await requireAdapter().setField({
					return_id,
					tax_year,
					concept,
					value,
					evidence,
					mode: (mode ?? "validate") as MutationMode,
				}),
			);
		} catch (error) {
			return failure(error);
		}
	},
);

server.tool(
	"get_field",
	"Read a tax field using a vendor-neutral concept",
	{
		return_id: z.string(),
		tax_year: z.number().int().min(2000).max(2100),
		concept: z.string(),
	},
	async ({ return_id, tax_year, concept }) => {
		try {
			return text(await requireAdapter().getField({ return_id, tax_year, concept }));
		} catch (error) {
			return failure(error);
		}
	},
);

server.tool(
	"list_forms",
	"List forms in a tax return",
	{ return_id: z.string() },
	async ({ return_id }) => {
		try {
			return text(await requireAdapter().listForms({ return_id }));
		} catch (error) {
			return failure(error);
		}
	},
);

server.tool(
	"list_returns",
	"List tax returns visible to the configured vendor adapter",
	{
		return_type: returnTypeSchema.optional(),
		tax_year: z.number().int().min(2000).max(2100).optional(),
	},
	async ({ return_type, tax_year }) => {
		try {
			return text(
				await requireAdapter().listReturns({
					return_type: return_type as ReturnType | undefined,
					tax_year,
				}),
			);
		} catch (error) {
			return failure(error);
		}
	},
);

server.tool(
	"get_diagnostics",
	"Retrieve validation diagnostics for a return",
	{ return_id: z.string() },
	async ({ return_id }) => {
		try {
			return text(await requireAdapter().getDiagnostics({ return_id }));
		} catch (error) {
			return failure(error);
		}
	},
);

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
}

main().catch((error) => {
	console.error("fisc failed to start:", error);
	process.exit(1);
});
