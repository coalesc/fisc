import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { TaxprepAdapter } from "../adapters/taxprep/index.js";
import { TaxInteroperabilityService } from "../core/service.js";
import type { ReturnRef, SourceKind } from "../core/types.js";

function json(value: unknown) {
	return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

function buildService(): TaxInteroperabilityService {
	const service = new TaxInteroperabilityService();
	if (process.env.TAXPREP_API_URL && process.env.TAXPREP_API_KEY) {
		service.registerAdapter(new TaxprepAdapter());
	}
	return service;
}

const returnRefSchema = z.object({
	id: z.string(),
	adapter: z.string(),
	tax_year: z.number().int(),
	return_type: z.literal("t1"),
});

const sourceSchema = z.object({
	id: z.string(),
	kind: z.enum(["document", "government_data", "prior_return", "client_answer", "workpaper", "other"]),
	label: z.string().optional(),
	page: z.number().int().positive().optional(),
	locator: z.string().optional(),
});

export function createMcpServer(service = buildService()): McpServer {
	const server = new McpServer({ name: "fisc", version: "0.2.0" });

	server.tool(
		"list_concepts",
		"List vendor-neutral tax concepts supported by fisc.",
		{ return_type: z.literal("t1") },
		async ({ return_type }) => json(service.listConcepts(return_type)),
	);

	server.tool(
		"list_adapters",
		"List configured tax software adapters and the operations each supports.",
		{},
		async () => json(service.listAdapters()),
	);

	server.tool(
		"get_capabilities",
		"Describe the exact operations supported by a configured adapter.",
		{ adapter: z.string() },
		async ({ adapter }) => json(service.getCapabilities(adapter)),
	);

	server.tool(
		"create_return",
		"Create a tax return through a configured adapter when that adapter supports it.",
		{
			adapter: z.string(),
			taxpayer_name: z.string(),
			sin: z.string().optional(),
			tax_year: z.number().int(),
			return_type: z.literal("t1"),
		},
		async ({ adapter, taxpayer_name, sin, tax_year, return_type }) =>
			json(await service.createReturn(adapter, { taxpayer_name, sin, tax_year, return_type })),
	);

	server.tool(
		"get_field",
		"Read a vendor-neutral tax concept from an existing return.",
		{ return_ref: returnRefSchema, concept: z.string() },
		async ({ return_ref, concept }) => json(await service.getField(return_ref as ReturnRef, concept)),
	);

	server.tool(
		"plan_changes",
		"Resolve and validate proposed tax writes without mutating the tax software. Always plan before applying changes.",
		{
			return_ref: returnRefSchema,
			changes: z.array(
				z.object({
					concept: z.string(),
					value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
					sources: z.array(sourceSchema).optional(),
					note: z.string().optional(),
				}),
			),
			idempotency_key: z.string().optional(),
		},
		async ({ return_ref, changes, idempotency_key }) =>
			json(
				await service.planChanges(
					return_ref as ReturnRef,
					changes.map((change) => ({
						...change,
						sources: change.sources?.map((source) => ({ ...source, kind: source.kind as SourceKind })),
					})),
					idempotency_key,
				),
			),
	);

	server.tool(
		"get_write_plan",
		"Inspect a previously created write plan before any mutation occurs.",
		{ plan_id: z.string() },
		async ({ plan_id }) => json(service.getPlan(plan_id)),
	);

	server.tool(
		"apply_plan",
		"Apply a fully resolved write plan. Host applications should call this only after their approval policy is satisfied.",
		{ plan_id: z.string(), approved_by: z.string().min(1) },
		async ({ plan_id, approved_by }) => json(await service.applyPlan(plan_id, approved_by)),
	);

	server.tool(
		"list_forms",
		"List forms in an existing return when supported by the adapter.",
		{ return_ref: returnRefSchema },
		async ({ return_ref }) => json(await service.listForms(return_ref as ReturnRef)),
	);

	server.tool(
		"get_diagnostics",
		"Retrieve validation diagnostics from the tax software when supported.",
		{ return_ref: returnRefSchema },
		async ({ return_ref }) => json(await service.getDiagnostics(return_ref as ReturnRef)),
	);

	server.tool(
		"list_returns",
		"List returns known to a configured adapter when supported.",
		{ adapter: z.string(), tax_year: z.number().int().optional(), return_type: z.literal("t1").optional() },
		async ({ adapter, tax_year, return_type }) => json(await service.listReturns(adapter, { tax_year, return_type })),
	);

	return server;
}

export async function runStdioMcpServer(): Promise<void> {
	const server = createMcpServer();
	await server.connect(new StdioServerTransport());
}
