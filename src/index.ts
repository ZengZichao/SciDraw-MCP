#!/usr/bin/env node

/**
 * SciDraw MCP Server — entry point.
 *
 * An MCP (Model Context Protocol) server that provides tools for searching,
 * browsing, and downloading scientific illustrations from SciDraw.io.
 *
 * Usage:
 *   npx scidraw-mcp                    # run via npx
 *   node dist/index.js                 # run directly after build
 *
 * Stdio transport is used by default, making this server compatible with
 * Claude Desktop, Cursor, and any other MCP-compatible client.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SciDrawClient, SCIDRAW_API_BASE } from "./client.js";
import { registerTools } from "./tools.js";

const SERVER_NAME = "scidraw-mcp";
const SERVER_VERSION = "0.1.0";

async function main(): Promise<void> {
  // Create the SciDraw API client.
  const client = new SciDrawClient();

  // Create the MCP server.
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  // Register all SciDraw tools.
  registerTools(server, client);

  // Connect via stdio transport.
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (stdout is reserved for MCP protocol messages).
  console.error(`[${SERVER_NAME} v${SERVER_VERSION}] Server started — connected via stdio.`);
  console.error(`[${SERVER_NAME}] SciDraw API base: ${SCIDRAW_API_BASE}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
