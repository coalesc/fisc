#!/usr/bin/env node

import { runStdioMcpServer } from "./transports/mcp.js";

runStdioMcpServer().catch((error) => {
	console.error("fisc failed to start:", error);
	process.exit(1);
});
