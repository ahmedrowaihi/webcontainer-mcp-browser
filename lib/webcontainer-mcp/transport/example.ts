import { WebContainerTransport } from "./webcontainer-transport";

/**
 * Simple example demonstrating WebContainerTransport
 */

// Basic MCP server code
const serverCode = `
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "Demo Server", version: "1.0.0" });

server.tool("echo", { message: z.string() }, async ({ message }) => ({
  content: [{ type: "text", text: message }],
}));

server.tool("add", { a: z.number(), b: z.number() }, async ({ a, b }) => ({
  content: [{ type: "text", text: String(a + b) }],
}));

const transport = new StdioServerTransport();
await server.connect(transport);
`;

export async function runExample() {
  const transport = new WebContainerTransport({
    type: "files",
    files: {
      "index.js": serverCode,
      "package.json": JSON.stringify({
        name: "webcontainer-mcp-server",
        version: "1.0.0",
        type: "module",
        dependencies: {
          "@modelcontextprotocol/sdk": "latest",
          "zod": "latest"
        }
      }, null, 2)
    },
    onStatusChange: (status) => console.log("Status:", status)
  });

  // Handle messages
  transport.onmessage = (message) => {
    if ("result" in message) {
      console.log("Response:", message.result);
    }
  };

  // Start and test
  await transport.start();
  await new Promise(resolve => setTimeout(resolve, 2000));

  // List tools
  await transport.send({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {}
  });

  // Call tool
  await transport.send({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "add",
      arguments: { a: 5, b: 3 }
    }
  });

  // Cleanup
  setTimeout(() => transport.close(), 3000);
} 