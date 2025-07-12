# WebContainer MCP System

**Run any Model Context Protocol (MCP) stdio server in your browser using WebContainers.**

---

## What is this?

This project lets you run Node.js-based MCP servers—such as AI tool servers, automation bots, or custom CLI tools—directly in your browser, powered by [WebContainers](https://webcontainers.io/).  
It provides a beautiful, interactive dashboard for starting, stopping, and interacting with MCP servers, including:

- **Process configuration**: Paste or edit JSON to define the MCP server to run (local or from npm).
- **Live system log**: See real-time output, with spinner/progress lines filtered, long lines scrollable, and one-click copy for any log line.
- **Tool discovery and invocation**: List available MCP tools, fill out forms, and call tools interactively.
- **Persistent state**: All input fields and config persist across reloads.
- **Modern UI/UX**: Responsive, theme-aware, and accessible.

---

## Key Features

- **Run any MCP stdio server** (from local code or npm) in a browser tab.
- **WebContainer-powered**: True Node.js environment, no remote backend required.
- **Interactive dashboard**: List tools, call them, and view logs.

---

## Usage

1. **Clone and install:**

   ```sh
   git clone https://github.com/ahmedrowaihi/webcontainer-mcp-browser.git
   cd webcontainer-mcp-browser
   pnpm install
   pnpm dev
   # or npm/yarn as you prefer
   ```

2. **Open in your browser:**  
   Go to [http://localhost:3000](http://localhost:3000)

3. **Configure and run an MCP server:**
   - Paste a process config JSON (e.g., to run an npm MCP server).
   - Click “Start Server”.
   - Use the dashboard to list tools, call them, and view logs.

---

## Example MCP Server Config

```json
{
  "command": "npx",
  "args": ["-y", "@yourorg/your-mcp-server"],
  "env": {
    "YOUR_API_KEY": "..."
  }
}
```

---

## Why WebContainers?

WebContainers let you run real Node.js processes in the browser, with full filesystem and process isolation.  
This project leverages that to make any MCP stdio server instantly available—no backend, no Docker, no local Node.js required.

---

## Tech Stack

- [WebContainers](https://webcontainers.io/)
- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/) (for tooltips, etc.)
- [Lucide Icons](https://lucide.dev/)

---

## Repository

[https://github.com/ahmedrowaihi/webcontainer-mcp-browser](https://github.com/ahmedrowaihi/webcontainer-mcp-browser)

---

## License

MIT
