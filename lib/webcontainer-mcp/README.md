# webcontainer-mcp

This module demonstrates running a real MCP stdio server inside a browser using [WebContainers](https://webcontainers.io/). It uses the WebContainer API to create a virtual Node.js environment, install dependencies, and run an MCP server with stdio transport—all in the browser.

## Example: Running a Node MCP Stdio App with WebContainers

You can run your MCP server example in a browser using WebContainers by following these steps. This approach leverages the WebContainer API to create a virtual Node.js environment, install dependencies, and run your code—all inside the browser.

### 1. Project Structure

Set up your project files in a virtual filesystem:

```
/package.json
/index.js
```

**package.json**

```json
{
  "name": "mcp-stdio-webcontainer",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@modelcontextprotocol/sdk": "latest",
    "zod": "latest"
  }
}
```

**index.js**

```js
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "Demo", version: "1.0.0" });

server.tool("add", { a: z.number(), b: z.number() }, async ({ a, b }) => ({
  content: [{ type: "text", text: String(a + b) }],
}));

const transport = new StdioServerTransport();
await server.connect(transport);
```

### 2. WebContainer API Example

Here's a minimal example of how to run your server using the WebContainer API in a browser app (e.g., in a Svelte or React project):

```js
import { WebContainer } from '@webcontainer/api';

const files = {
  'package.json': {
    file: { contents: /* package.json content as above */ }
  },
  'index.js': {
    file: { contents: /* index.js content as above */ }
  }
};

async function runMcpServer() {
  // Boot WebContainer instance
  const webcontainer = await WebContainer.boot();

  // Mount your files
  await webcontainer.mount(files);

  // Install dependencies
  const installProcess = await webcontainer.spawn('npm', ['install']);
  await installProcess.exit;

  // Run your MCP server
  const serverProcess = await webcontainer.spawn('node', ['index.js']);

  // Pipe output to browser console or UI
  serverProcess.output.pipeTo(new WritableStream({
    write(data) {
      console.log(data);
    }
  }));
}

runMcpServer();
```

- This code boots the WebContainer, mounts your project files, installs dependencies, then runs your MCP server using Node.js.
- You can extend this to connect the process's stdio to a terminal UI in your app for interactive use.

### 3. Notes

- WebContainers work best in Chromium-based browsers.
- You may need to adjust import paths if using TypeScript or ESM.
- For advanced UI, connect the process's input/output to a terminal emulator in the browser.

### 4. References

- [WebContainers Running Processes Guide](https://webcontainers.io/guides/running-processes)
- [Interactive Tutorials with WebContainers](https://dev.to/jxd-dev/building-interactive-tutorials-with-webcontainers-372i)
- [WebContainer API Starter Example](https://github.com/stackblitz/webcontainer-api-starter)
- [WebContainers Add Interactivity Guide](https://webcontainers.io/tutorial/7-add-interactivity)
- [Model Context Protocol Docs](https://modelcontextprotocol.io/docs/concepts/transports)
