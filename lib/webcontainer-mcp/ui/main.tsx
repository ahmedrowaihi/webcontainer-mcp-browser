"use client";
import { ZodProvider } from "@autoform/zod";
import { useMemo } from "react";
import { z } from "zod";
import { useMCP } from "../use-mcp";
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
    selectedModelId,
    setSelectedModelId,
  } = useMCP();

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
    <div className="flex flex-col gap-4 mx-auto p-4 w-full max-w-7xl min-h-screen">
      <div className="top-0 z-10 sticky flex flex-col gap-4">
        <McpServerControl
          status={status}
          toolCount={tools.length}
          selectedModelId={selectedModelId}
          onModelChange={setSelectedModelId}
          onStart={handleStartConfig}
          onStop={stopServer}
        />
      </div>

      <div className="flex-1 gap-4 grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-2 lg:h-[calc(100vh-200px)] min-h-[80vh]">
        <div className="lg:h-full lg:max-h-full lg:overflow-hidden">
          <MCPConfig status={status} onSubmit={handleStartConfig} />
        </div>

        <div className="lg:h-full lg:max-h-full lg:overflow-hidden">
          <ToolOutput toolName={activeToolName} output={activeToolResult} />
        </div>

        <div className="lg:h-full lg:max-h-full lg:overflow-hidden">
          <McpToolList
            toolForms={toolForms}
            onCallTool={handleCallTool}
            onListTools={handleListTools}
            disabled={status !== "running"}
          />
        </div>

        <div className="lg:h-full lg:max-h-full lg:overflow-hidden">
          <McpSystemLog output={output} onClear={() => setOutput("")} />
        </div>
      </div>
    </div>
  );
}
