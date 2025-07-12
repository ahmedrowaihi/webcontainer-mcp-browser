"use client";
import { ZodProvider } from "@autoform/zod";
import { useMemo } from "react";
import { z } from "zod";
import indexJs from "../mcp-server/index.js?raw";
import packageJson from "../mcp-server/package.json?raw";
import { useWebContainerMcp } from "../use-webcontainer-mcp";
import { mcpjsonSchemaToZodSchema } from "../util/json-to-zod";
import { MCPConfig } from "./mcp-config";
import { McpServerControl } from "./mcp-server-control";
import { McpSystemLog } from "./mcp-system-log";
import { McpToolList } from "./mcp-tool-list";
import { ToolOutput } from "./tool-output";

export function WebContainerDashboard() {
  const {
    status,
    output,
    tools,
    activeToolResult,
    activeToolName,
    startServer,
    startServerFromNpm,
    stopServer,
    handleListTools,
    handleCallTool,
    setOutput,
  } = useWebContainerMcp({ packageJson, indexJs });

  const handleStartConfig = async (processConfig?: {
    command: string;
    args: string[];
    env?: Record<string, string>;
  }) => {
    if (processConfig && processConfig.command && processConfig.args) {
      await startServerFromNpm(processConfig);
    } else {
      await startServer();
    }
  };

  const toolForms = useMemo(() => {
    return tools.map((tool: any) => {
      let zodSchema: any = undefined;
      try {
        zodSchema = mcpjsonSchemaToZodSchema(
          tool.inputSchema,
          tool.inputSchema.required || [],
          tool.name
        );
      } catch (e) {
        zodSchema = undefined;
      }
      const isZodObject = zodSchema instanceof z.ZodObject;
      const isZodEffectsObject =
        zodSchema instanceof z.ZodEffects &&
        zodSchema._def.schema instanceof z.ZodObject;
      let provider: ZodProvider<any> | undefined = undefined;
      if (isZodObject || isZodEffectsObject) {
        provider = new ZodProvider(zodSchema as any);
      }
      return {
        name: tool.name,
        description: tool.description,
        badge: tool.name,
        provider,
      };
    });
  }, [tools]);

  return (
    <div className="flex flex-col gap-2 mx-auto p-2 h-[90vh] container">
      <McpServerControl
        status={status}
        toolCount={tools.length}
        onStart={handleStartConfig}
        onStop={stopServer}
      />
      <div className="flex flex-row flex-wrap flex-1 gap-4 py-2 w-full min-w-0 h-full min-h-0">
        <div className="flex flex-col flex-1 gap-4 min-w-0 h-full min-h-0">
          <MCPConfig status={status} onSubmit={handleStartConfig} />
          <McpToolList
            toolForms={toolForms}
            onCallTool={handleCallTool}
            onListTools={handleListTools}
            disabled={status !== "running"}
          />
        </div>
        <div className="flex flex-col flex-1 gap-4 min-w-0 h-full min-h-0">
          <div className="bg-muted p-4 rounded-md h-1/2 min-h-[120px] overflow-auto">
            <h2 className="mb-2 font-semibold text-lg">Tool Output</h2>
            <ToolOutput toolName={activeToolName} output={activeToolResult} />
          </div>
          <div className="flex-1 min-w-0 h-1/2 min-h-[120px] overflow-auto">
            <McpSystemLog output={output} onClear={() => setOutput("")} />
          </div>
        </div>
      </div>
    </div>
  );
}
