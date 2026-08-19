export { TaxInteroperabilityService } from "./core/service.js";
export type {
	AdapterCapabilities,
	ApplyPlanInput,
	ApplyPlanResult,
	CreateReturnInput,
	Diagnostic,
	FieldChange,
	FieldValue,
	ReturnRef,
	ReturnType,
	SourceKind,
	SourceRef,
	TaxFormRef,
	TaxValue,
	WritePlan,
} from "./core/types.js";
export type { TaxAdapter } from "./adapters/types.js";
export { CONCEPTS } from "./concepts/index.js";
export { createMcpServer, runStdioMcpServer } from "./transports/mcp.js";

// Incubating contracts are exported for discussion and experimentation only.
// They are not implemented by fisc adapters or exposed through the MCP server.
export type * from "./incubating/compilation.js";
export type * from "./incubating/assurance.js";
