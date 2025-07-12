/**
 * useWebContainerMcp
 * Manages the lifecycle and communication with a WebContainer-based MCP server.
 * Handles local and remote (npx) server startup, tool calls, and output streaming.
 */
import { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";
import { WebContainer, WebContainerProcess } from "@webcontainer/api";
import { useCallback, useReducer, useRef } from "react";

/**
 * Status values for the MCP server lifecycle.
 */
export type Status = "idle" | "booting" | "mounting" | "installing" | "running" | "error";

interface ProcessConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

interface State {
  status: Status;
  output: string;
  tools: Tool[];
  activeToolResult: CallToolResult;
  error?: string;
}

type Action =
  | { type: "SET_STATUS"; status: Status }
  | { type: "SET_OUTPUT"; output: string }
  | { type: "APPEND_OUTPUT"; output: string }
  | { type: "SET_TOOLS"; tools: Tool[] }
  | { type: "SET_ACTIVE_TOOL_RESULT"; activeToolResult: CallToolResult }
  | { type: "SET_ERROR"; error: string }
  | { type: "RESET" };

const initialState: State = {
  status: "idle",
  output: "",
  tools: [],
  activeToolResult: {
    content: [],
  },
  error: undefined,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_STATUS":
      return { ...state, status: action.status };
    case "SET_OUTPUT":
      return { ...state, output: action.output };
    case "APPEND_OUTPUT":
      return { ...state, output: state.output + action.output };
    case "SET_TOOLS":
      return { ...state, tools: action.tools };
    case "SET_ACTIVE_TOOL_RESULT":
      return { ...state, activeToolResult: action.activeToolResult };
    case "SET_ERROR":
      return { ...state, error: action.error };
    case "RESET":
      return { ...initialState };
    default:
      return state;
  }
}

interface UseWebContainerMcpProps {
  packageJson: string;
  indexJs: string;
}

export function useWebContainerMcp({ packageJson, indexJs }: UseWebContainerMcpProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const webcontainerRef = useRef<WebContainer | null>(null);
  const processRef = useRef<WebContainerProcess | null>(null);
  const outputBuffer = useRef<string>("");
  const activeToolName = useRef<string | undefined>(undefined);

  const appendOutput = useCallback((data: string) => {
    // Strip ANSI escape codes and control characters
    data = data.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
    data = data.replace(/[\r\x1b]/g, '');
    dispatch({ type: "APPEND_OUTPUT", output: data });
  }, []);

  // Centralized error dispatching
  const setError = useCallback((error: string) => {
    dispatch({ type: "SET_STATUS", status: "error" });
    dispatch({ type: "SET_ERROR", error });
    appendOutput("\nError: " + error);
  }, [appendOutput]);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const startServer = useCallback(async () => {
    reset();
    dispatch({ type: "SET_STATUS", status: "booting" });
    setTimeout(async () => {
      try {
        dispatch({ type: "SET_STATUS", status: "mounting" });
        const files = {
          "package.json": { file: { contents: packageJson } },
          "index.js": { file: { contents: indexJs } },
        };
        if (!webcontainerRef.current) {
          webcontainerRef.current = await WebContainer.boot();
        }
        await webcontainerRef.current.mount(files);
        dispatch({ type: "SET_STATUS", status: "installing" });
        const installProcess = await webcontainerRef.current.spawn("npm", ["install"]);
        await installProcess.exit;
        dispatch({ type: "SET_STATUS", status: "running" });
        processRef.current = await webcontainerRef.current.spawn("node", ["index.js"]);
        processRef.current.output.pipeTo(
          new WritableStream({
            write(data: string) {
              handleProcessOutput(data);
            },
          })
        );
      } catch (err: any) {
        setError(err?.message || "Unknown error");
      }
    }, 100);
  }, [packageJson, indexJs, reset, setError]);

  const startServerFromNpm = useCallback(async (processConfig: ProcessConfig) => {
    reset();
    dispatch({ type: "SET_STATUS", status: "booting" });
    setTimeout(async () => {
      try {
        dispatch({ type: "SET_STATUS", status: "mounting" });
        if (!webcontainerRef.current) {
          webcontainerRef.current = await WebContainer.boot();
        }
        let finalArgs = [...processConfig.args];
        if (processConfig.env) {
          Object.keys(processConfig.env).forEach((key) => {
            finalArgs.push("-e", key);
          });
        }
        appendOutput(`\nRunning ${processConfig.command} ${finalArgs.join(" ")}...`);
        dispatch({ type: "SET_STATUS", status: "running" });
        processRef.current = await webcontainerRef.current.spawn(
          processConfig.command,
          finalArgs,
          processConfig.env ? { env: processConfig.env } : undefined
        );
        processRef.current.output.pipeTo(
          new WritableStream({
            write(data: string) {
              handleProcessOutput(data);
            },
          })
        );
      } catch (err: any) {
        setError(err?.message || "Unknown error");
      }
    }, 100);
  }, [reset, setError, appendOutput]);

  const stopServer = useCallback(() => {
    if (processRef.current) {
      processRef.current.kill && processRef.current.kill();
    }
    dispatch({ type: "SET_STATUS", status: "idle" });
  }, []);

  const sendJsonRpc = useCallback(async (msg: object) => {
    if (!processRef.current) return;
    const writer = processRef.current.input.getWriter();
    await writer.write('\n' + JSON.stringify(msg) + "\n");
    writer.releaseLock();
  }, []);

  const handleProcessOutput = useCallback((data: string) => {
    data = data.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
    data = data.replace(/[\r\x1b]/g, '');
    outputBuffer.current += data;
    const lines = outputBuffer.current.split(/\r?\n/);
    outputBuffer.current = lines.pop() || "";
    for (const line of lines) {
      if (!line.trim()) continue;
      appendOutput(line + "\n");
      try {
        const json = JSON.parse(line);
        if (json.result && json.result.tools) {
          dispatch({ type: "SET_TOOLS", tools: json.result.tools });
        } else if (json.result && json.result.content) {
          dispatch({
            type: "SET_ACTIVE_TOOL_RESULT",
            activeToolResult: json.result,
          });
        }
      } catch {
        // Not JSON, just log
        if (typeof line === "string") {
          appendOutput(line + "\n");
        }
      }
    }
  }, [appendOutput]);

  const handleListTools = useCallback(() => {
    sendJsonRpc({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/list",
      params: {},
    });
  }, [sendJsonRpc]);

  const handleCallTool = useCallback((toolName: string, values: any) => {
    activeToolName.current = toolName;
    sendJsonRpc({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: {
        name: toolName,
        arguments: values,
      },
    });
  }, [sendJsonRpc]);

  return {
    status: state.status,
    output: state.output,
    tools: state.tools,
    activeToolResult: state.activeToolResult,
    activeToolName: activeToolName.current,
    error: state.error,
    setError,
    startServer,
    startServerFromNpm,
    stopServer,
    sendJsonRpc,
    handleListTools,
    handleCallTool,
    setStatus: (status: Status) => dispatch({ type: "SET_STATUS", status }),
    setOutput: (output: string) => dispatch({ type: "SET_OUTPUT", output }),
    setTools: (tools: Tool[]) => dispatch({ type: "SET_TOOLS", tools }),
    setActiveToolResult: (activeToolResult: CallToolResult) => dispatch({ type: "SET_ACTIVE_TOOL_RESULT", activeToolResult }),
    reset,
  };
} 