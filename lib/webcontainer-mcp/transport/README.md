# WebContainer MCP Transport

This directory contains the official WebContainer transport implementation for the Model Context Protocol (MCP). This transport allows you to run MCP servers inside a WebContainer environment in the browser.

## Overview

The `WebContainerTransport` class implements the MCP `Transport` interface, providing a way to run Node.js MCP servers directly in the browser using WebContainer technology. This enables client-side MCP applications without requiring a separate server process.

The transport supports two modes:

1. **File-based**: Mount custom files and run your own MCP server code
2. **Spawn-based**: Run existing MCP servers via commands (e.g., npx packages)

## Important: Wait for "running" Status

⚠️ **Critical**: You must wait for the status to become `"running"` before sending any tool requests or listing tools. Sending requests too early will result in errors.

## Installation

```bash
npm install @modelcontextprotocol/sdk @webcontainer/api
```

## Simple Example

```typescript
import { WebContainerTransport } from "./webcontainer-transport";

async function runMCPServer() {
  const transport = new WebContainerTransport({
    type: "files",
    files: {
      "index.js": `
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
      `,
      "package.json": JSON.stringify({
        name: "webcontainer-mcp-server",
        version: "1.0.0",
        type: "module",
        dependencies: {
          "@modelcontextprotocol/sdk": "latest",
          zod: "latest",
        },
      }),
    },
    onStatusChange: (status) => {
      console.log("Status:", status);
      if (status === "running") {
        console.log("✅ Server ready - you can now send requests!");
      }
    },
  });

  // Handle responses
  transport.onmessage = (message) => {
    if ("result" in message) {
      console.log("Response:", message.result);
    } else if ("error" in message) {
      console.log("Error:", message.error);
    }
  };

  transport.onerror = (error) => {
    console.error("Transport error:", error);
  };

  // Start the server
  await transport.start();

  // Wait for server to be ready
  await new Promise((resolve) => {
    const checkStatus = () => {
      if (transport._initialized) {
        // Or listen to onStatusChange for "running"
        resolve();
      } else {
        setTimeout(checkStatus, 100);
      }
    };
    checkStatus();
  });

  // Now it's safe to send requests
  console.log("📤 Listing tools...");
  await transport.send({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {},
  });

  // Call a tool
  console.log("📤 Calling add tool...");
  await transport.send({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "add",
      arguments: { a: 5, b: 3 },
    },
  });

  // Cleanup after some time
  setTimeout(() => {
    transport.close();
  }, 5000);
}

// Run the example
runMCPServer();
```

## API Reference

### WebContainerTransport

#### Constructor

```typescript
new WebContainerTransport(options: WebContainerTransportOptions)
```

#### File-based Options

```typescript
{
  type: "files";
  files: Record<string, string>;        // filename -> content mapping
  entrypoint?: string;                  // defaults to "index.js"
  onStatusChange?: (status) => void;    // status callback
  bootOptions?: BootOptions;            // WebContainer boot options
}
```

#### Spawn-based Options

```typescript
{
  type: "spawn";
  command: string;                      // e.g., "npx"
  args: string[];                       // e.g., ["-y", "@modelcontextprotocol/server-filesystem"]
  env?: Record<string, string>;         // environment variables
  onStatusChange?: (status) => void;    // status callback
  bootOptions?: BootOptions;            // WebContainer boot options
}
```

#### Methods

- `start()`: Initialize and start the server
- `send(message)`: Send JSON-RPC message (only after status is "running")
- `close()`: Stop server and cleanup

#### Status Values

- `"booting"`: WebContainer starting
- `"mounting"`: Mounting files (file-based only)
- `"installing"`: Installing dependencies (file-based only)
- `"running"`: Server ready for requests ✅
- `"unmounting"`: Unmounting files (file-based only)
- `"teardowned"`: WebContainer torn down

## Multi-file Support

You can provide unlimited files:

```typescript
const transport = new WebContainerTransport({
  type: "files",
  files: {
    "package.json": "...",
    "server.js": "...",
    "tools/math.js": "...",
    "tools/string.js": "...",
    "lib/utils.js": "...",
    "README.md": "...",
  },
  entrypoint: "server.js",
});
```

## Spawn-based Example

```typescript
const transport = new WebContainerTransport({
  type: "spawn",
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-everything"],
  env: {
    NODE_ENV: "development",
  },
  onStatusChange: (status) => console.log("Status:", status),
});
```

## Browser Compatibility

Requires modern browsers with WebContainer support (Chrome, Edge recommended).
