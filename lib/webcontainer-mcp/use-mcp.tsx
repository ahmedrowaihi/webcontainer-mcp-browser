"use client";
import React, { createContext, useContext } from "react";
import indexJs from "./mcp-server/index.js?raw";
import packageJson from "./mcp-server/package.json?raw";

type MCPContextType = ReturnType<typeof useWebContainerMcp> | null;
const MCPContext = createContext<MCPContextType>(null);

export function MCPProvider({ children }: { children: React.ReactNode }) {
  const mcp = useWebContainerMcp({ packageJson, indexJs });
  return <MCPContext.Provider value={mcp}>{children}</MCPContext.Provider>;
}

export function useMCP() {
  const ctx = useContext(MCPContext);
  if (!ctx) throw new Error("useMCP must be used within an MCPProvider");
  return ctx;
}

import { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";
import { WebContainer, WebContainerProcess } from "@webcontainer/api";
import { useCallback, useReducer, useRef } from "react";

export type Status =
  | "idle"
  | "booting"
  | "mounting"
  | "installing"
  | "running"
  | "error";

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

export function useWebContainerMcp({
  packageJson,
  indexJs,
}: UseWebContainerMcpProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const webcontainerRef = useRef<WebContainer | null>(null);
  const processRef = useRef<WebContainerProcess | null>(null);
  const outputBuffer = useRef<string>("");
  const activeToolName = useRef<string | undefined>(undefined);
  const pendingToolResults = useRef(new Map<number, (result: any) => void>());

  const appendOutput = useCallback((data: string) => {
    data = data.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "");
    data = data.replace(/[\r\x1b]/g, "");
    dispatch({ type: "APPEND_OUTPUT", output: data });
  }, []);

  const setError = useCallback(
    (error: string) => {
      dispatch({ type: "SET_STATUS", status: "error" });
      dispatch({ type: "SET_ERROR", error });
      appendOutput("\nError: " + error);
    },
    [appendOutput]
  );

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
        const installProcess = await webcontainerRef.current.spawn("npm", [
          "install",
        ]);
        await installProcess.exit;
        dispatch({ type: "SET_STATUS", status: "running" });
        processRef.current = await webcontainerRef.current.spawn("node", [
          "index.js",
        ]);
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

  const startServerFromNpm = useCallback(
    async (processConfig: ProcessConfig) => {
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
          appendOutput(
            `\nRunning ${processConfig.command} ${finalArgs.join(" ")}...`
          );
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
    },
    [reset, setError, appendOutput]
  );

  const stopServer = useCallback(() => {
    if (processRef.current) {
      processRef.current.kill && processRef.current.kill();
    }
    dispatch({ type: "SET_STATUS", status: "idle" });
  }, []);

  const sendJsonRpc = useCallback(async (msg: object) => {
    if (!processRef.current) return;
    const writer = processRef.current.input.getWriter();
    await writer.write("\n" + JSON.stringify(msg) + "\n");
    writer.releaseLock();
  }, []);

  const handleProcessOutput = useCallback(
    (data: string) => {
      data = data.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "");
      data = data.replace(/[\r\x1b]/g, "");
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

            if (
              typeof json.id === "number" &&
              pendingToolResults.current.has(json.id)
            ) {
              const resolver = pendingToolResults.current.get(json.id);
              resolver && resolver(json.result.content);
              pendingToolResults.current.delete(json.id);
            }
          }
        } catch {
          if (typeof line === "string") {
            appendOutput(line + "\n");
          }
        }
      }
    },
    [appendOutput]
  );

  const handleListTools = useCallback(async () => {
    await sendJsonRpc({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/list",
      params: {},
    });
  }, [sendJsonRpc]);

  const handleCallTool = useCallback(
    async (toolName: string, values: any) => {
      activeToolName.current = toolName;
      const requestId = Date.now() + Math.floor(Math.random() * 1000000);
      return new Promise((resolve) => {
        pendingToolResults.current.set(requestId, resolve);
        sendJsonRpc({
          jsonrpc: "2.0",
          id: requestId,
          method: "tools/call",
          params: {
            name: toolName,
            arguments: values,
          },
        });
      });
    },
    [sendJsonRpc]
  );

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
    setActiveToolResult: (activeToolResult: CallToolResult) =>
      dispatch({ type: "SET_ACTIVE_TOOL_RESULT", activeToolResult }),
    reset,
  };
}
