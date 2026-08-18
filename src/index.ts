#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { type Adapter } from "./adapters/types.js";
import { CONCEPTS, type ReturnType } from "./concepts/index.js";

const server = new McpServer({
	name: "fisc",
	version: "0.1.0",
});

// --- Tools ---

server.tool(
	"list_concepts",
	"List available tax concepts for a return type",
	{ return_type: z.enum(["t1"]).describe("Tax return type") },
	async ({ return_type }) => {
		const concepts = CONCEPTS[return_type as ReturnType];
		if (!concepts) {
			return { content: [{ type: "text", text: `Unknown return type: ${return_type}` }] };
		}
		const lines = Object.entries(concepts).map(
			([id, c]) => `${id}: ${c.label_en} / ${c.label_fr} (${c.cra_line ?? "—"})`,
		);
		return { content: [{ type: "text", text: lines.join("\n") }] };
	},
);

server.tool(
	"set_field",
	"Set a tax field value in a return. Uses vendor-neutral concept IDs.",
	{
		return_id: z.string().describe("Identifier of the tax return"),
		concept: z.string().describe("Tax concept ID (e.g. employment_income)"),
		value: z.union([z.string(), z.number()]).describe("Value to set"),
		source: z.string().optional().describe("Source document reference"),
	},
	async ({ return_id, concept, value, source }) => {
		// TODO: route through configured adapter
		return {
			content: [
				{
					type: "text",
					text: `[stub] Would set ${concept} = ${value} on return ${return_id}` +
						(source ? ` (from ${source})` : ""),
				},
			],
		};
	},
);

server.tool(
	"get_field",
	"Read a tax field value from a return",
	{
		return_id: z.string().describe("Identifier of the tax return"),
		concept: z.string().describe("Tax concept ID"),
	},
	async ({ return_id, concept }) => {
		return {
			content: [{ type: "text", text: `[stub] Would read ${concept} from return ${return_id}` }],
		};
	},
);

server.tool(
	"create_return",
	"Create a new tax return",
	{
		taxpayer_name: z.string().describe("Full name of the taxpayer"),
		sin: z.string().optional().describe("Social Insurance Number"),
		tax_year: z.number().describe("Tax year"),
		return_type: z.enum(["t1"]).describe("Return type"),
	},
	async ({ taxpayer_name, tax_year, return_type }) => {
		return {
			content: [
				{
					type: "text",
					text: `[stub] Would create ${return_type.toUpperCase()} return for ${taxpayer_name} (${tax_year})`,
				},
			],
		};
	},
);

server.tool(
	"get_diagnostics",
	"Retrieve validation diagnostics for a return",
	{ return_id: z.string().describe("Identifier of the tax return") },
	async ({ return_id }) => {
		return {
			content: [{ type: "text", text: `[stub] Would fetch diagnostics for return ${return_id}` }],
		};
	},
);

// --- Start ---

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
}

main().catch((err) => {
	console.error("fisc failed to start:", err);
	process.exit(1);
});
