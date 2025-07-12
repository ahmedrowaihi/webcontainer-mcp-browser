import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Status } from "../use-webcontainer-mcp";

interface MCPConfigProps {
  status: Status;
  onSubmit: (config: {
    command: string;
    args: string[];
    env?: Record<string, string>;
  }) => void;
}

export function MCPConfig({ status, onSubmit }: MCPConfigProps) {
  const DEFAULT_JSON = `{
    "command": "npx",
    "args": ["-y", "@ahmedrowaihi/azure-mcp-fastmcp"],
    "env": {
      "AZURE_ORG_URL": "https://dev.azure.com/yourorg",
      "AZURE_PERSONAL_ACCESS_TOKEN": "your_token"
    }
  }`;
  const [jsonInput, setJsonInput] = useState<string>(DEFAULT_JSON);
  const [jsonError, setJsonError] = useState<string>("");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("mcp-process-config");
      if (stored) setJsonInput(stored);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      window.localStorage.setItem("mcp-process-config", jsonInput);
    } catch {}
  }, [jsonInput]);

  function handleSubmit() {
    setJsonError("");
    try {
      const parsed = JSON.parse(jsonInput);
      if (!parsed.command || !Array.isArray(parsed.args)) {
        setJsonError("JSON must include 'command' (string) and 'args' (array)");
        return;
      }
      onSubmit(parsed);
    } catch (e: any) {
      setJsonError("Invalid JSON: " + e.message);
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Process Configuration</CardTitle>
        <CardDescription>
          Paste or edit the process config JSON for the MCP server you want to
          run.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder={DEFAULT_JSON}
          className="p-2 border rounded w-full h-40 font-mono"
          disabled={status === "running"}
        />
        {jsonError && (
          <div className="mt-1 text-red-500 text-xs">{jsonError}</div>
        )}
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSubmit}
            disabled={
              status === "running" ||
              status === "installing" ||
              status === "booting" ||
              status === "mounting" ||
              !jsonInput.trim()
            }
            className="inline-flex justify-center items-center gap-2 bg-primary disabled:opacity-50 px-4 py-2 rounded text-primary-foreground"
          >
            Run Custom MCP Server
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
