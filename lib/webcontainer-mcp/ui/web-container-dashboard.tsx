"use client";
import { ZodProvider } from "@autoform/zod";
import { useMemo } from "react";
import { z } from "zod";
import indexJs from "../mcp-server/index.js?raw";
import packageJson from "../mcp-server/package.json?raw";
import { useWebContainerMcp } from "../use-webcontainer-mcp";
import { mcpjsonSchemaToZodSchema } from "../util/json-to-zod";
import { McpServerControl } from "./mcp-server-control";
import { McpSystemLog } from "./mcp-system-log";
import { McpToolList } from "./mcp-tool-list";

export function WebContainerDashboard() {
  const {
    status,
    output,
    tools,
    toolResult,
    startServer,
    stopServer,
    handleListTools,
    handleCallTool,
    setOutput,
  } = useWebContainerMcp({ packageJson, indexJs });

  // Memoize all tool providers at once when tools change
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
        onStart={startServer}
        onStop={stopServer}
      />
      <div className="flex flex-row flex-wrap flex-1 gap-4 py-2 w-full h-full min-h-0">
        {/* Left: Tools */}
        <div className="flex-1">
          <McpToolList
            toolForms={toolForms}
            onCallTool={handleCallTool}
            onListTools={handleListTools}
            disabled={status !== "running"}
          />
        </div>
        {/* Right: Output + Logs */}
        <div className="flex flex-col flex-1 gap-4 h-full min-h-0">
          {/* Tool Output */}
          <div className="bg-muted p-4 rounded-md h-1/2 min-h-[120px] overflow-auto">
            <h2 className="mb-2 font-semibold text-lg">Tool Output</h2>
            {toolResult.content ? (
              <div className="text-sm">
                <b>{toolResult.tool}:</b> {toolResult.content}
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">
                No output yet.
              </div>
            )}
          </div>
          {/* System Log */}
          <div className="flex-1 h-1/2 min-h-[120px] overflow-auto">
            <McpSystemLog output={output} onClear={() => setOutput("")} />
          </div>
        </div>
      </div>
    </div>
  );
}
