"use client";
import { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";
import { WebContainerProcess } from "@webcontainer/api";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { DEFAULT_MODEL } from "../llm/models";
import indexJs from "../mcp-server/index.js?raw";
import packageJson from "../mcp-server/package.json?raw";
import { WebContainerTransport } from "../transport/webcontainer-transport";

export type Status =
  | "idle"
  | "booting"
  | "mounting"
  | "installing"
  | "running"
  | "unmounting"
  | "teardowned"
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

function createFilesFromLegacyProps(
  packageJson: string,
  indexJs: string
): Record<string, string> {
  return {
    "package.json": packageJson,
    "index.js": indexJs,
  };
}

export function useWebContainerMcp({
  packageJson,
  indexJs,
}: UseWebContainerMcpProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const transportRef = useRef<WebContainerTransport | null>(null);
  const processRef = useRef<WebContainerProcess | null>(null);
  const activeToolName = useRef<string | null>(null);

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

    try {
      const files = createFilesFromLegacyProps(packageJson, indexJs);

      const transport = new WebContainerTransport({
        type: "files",
        files,
        entrypoint: "index.js",
        onStatusChange: (status) => {
          dispatch({ type: "SET_STATUS", status });
        },
      });
      transportRef.current = transport;

      await transport.start();

      transport.onmessage = (message) => {
        if (
          "result" in message &&
          message.result &&
          "tools" in message.result
        ) {
          dispatch({
            type: "SET_TOOLS",
            tools: message.result.tools as Tool[],
          });
        }

        if (
          "result" in message &&
          message.result &&
          "content" in message.result
        ) {
          dispatch({
            type: "SET_ACTIVE_TOOL_RESULT",
            activeToolResult: message.result as CallToolResult,
          });
        }
      };

      transport.onerror = (error) => {
        setError(error.message);
      };

      transport.onclose = () => {
        dispatch({ type: "SET_STATUS", status: "idle" });
      };

      const listToolsRequest = {
        jsonrpc: "2.0" as const,
        id: 1,
        method: "tools/list",
        params: {},
      };

      await transport.send(listToolsRequest);

      dispatch({ type: "SET_STATUS", status: "running" });
    } catch (error: any) {
      setError(error?.message || "Unknown error");
    }
  }, [packageJson, indexJs, reset, setError]);

  const startServerFromNpm = useCallback(
    async (processConfig: ProcessConfig) => {
      reset();
      dispatch({ type: "SET_STATUS", status: "booting" });

      try {
        const transport = new WebContainerTransport({
          type: "spawn",
          command: processConfig.command,
          args: processConfig.args,
          env: processConfig.env,
          onStatusChange: (status) => {
            dispatch({ type: "SET_STATUS", status });
          },
        });
        transportRef.current = transport;

        await transport.start();

        transport.onmessage = (message) => {
          if (
            "result" in message &&
            message.result &&
            "tools" in message.result
          ) {
            dispatch({
              type: "SET_TOOLS",
              tools: message.result.tools as Tool[],
            });
          }

          if (
            "result" in message &&
            message.result &&
            "content" in message.result
          ) {
            dispatch({
              type: "SET_ACTIVE_TOOL_RESULT",
              activeToolResult: message.result as CallToolResult,
            });
          }
        };

        transport.onerror = (error) => {
          setError(error.message);
        };

        transport.onclose = () => {
          dispatch({ type: "SET_STATUS", status: "idle" });
        };

        const listToolsRequest = {
          jsonrpc: "2.0" as const,
          id: 1,
          method: "tools/list",
          params: {},
        };

        await transport.send(listToolsRequest);

        dispatch({ type: "SET_STATUS", status: "running" });
      } catch (error: any) {
        setError(error?.message || "Unknown error");
      }
    },
    [reset, setError]
  );

  const startServerWithFiles = useCallback(
    async (files: Record<string, string>, entrypoint?: string) => {
      reset();
      dispatch({ type: "SET_STATUS", status: "booting" });

      try {
        const transport = new WebContainerTransport({
          type: "files",
          files,
          entrypoint: entrypoint || "index.js",
          onStatusChange: (status) => {
            dispatch({ type: "SET_STATUS", status });
          },
        });
        transportRef.current = transport;

        await transport.start();

        transport.onmessage = (message) => {
          if (
            "result" in message &&
            message.result &&
            "tools" in message.result
          ) {
            dispatch({
              type: "SET_TOOLS",
              tools: message.result.tools as Tool[],
            });
          }

          if (
            "result" in message &&
            message.result &&
            "content" in message.result
          ) {
            dispatch({
              type: "SET_ACTIVE_TOOL_RESULT",
              activeToolResult: message.result as CallToolResult,
            });
          }
        };

        transport.onerror = (error) => {
          setError(error.message);
        };

        transport.onclose = () => {
          dispatch({ type: "SET_STATUS", status: "idle" });
        };

        const listToolsRequest = {
          jsonrpc: "2.0" as const,
          id: 1,
          method: "tools/list",
          params: {},
        };

        await transport.send(listToolsRequest);

        dispatch({ type: "SET_STATUS", status: "running" });
      } catch (error: any) {
        setError(error?.message || "Unknown error");
      }
    },
    [reset, setError]
  );

  const stopServer = useCallback(async () => {
    if (transportRef.current) {
      await transportRef.current.close();
      transportRef.current = null;
    }
    if (processRef.current) {
      processRef.current.kill && processRef.current.kill();
    }
    dispatch({ type: "SET_STATUS", status: "idle" });
  }, []);

  const handleListTools = useCallback(async () => {
    if (!transportRef.current) {
      throw new Error("Transport not initialized");
    }

    try {
      const listToolsRequest = {
        jsonrpc: "2.0" as const,
        id: Date.now(),
        method: "tools/list",
        params: {},
      };

      await transportRef.current.send(listToolsRequest);
    } catch (error) {
      setError((error as Error).message);
    }
  }, [setError]);

  const handleCallTool = useCallback(
    async (toolName: string, values: any) => {
      if (!transportRef.current) {
        throw new Error("Transport not initialized");
      }

      try {
        activeToolName.current = toolName;

        const requestId = Date.now();
        const callToolRequest = {
          jsonrpc: "2.0" as const,
          id: requestId,
          method: "tools/call",
          params: {
            name: toolName,
            arguments: values,
          },
        };

        const responsePromise = new Promise<CallToolResult>(
          (resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error("Tool call timeout"));
            }, 30000);

            const originalOnMessage = transportRef.current?.onmessage;
            if (transportRef.current) {
              transportRef.current.onmessage = (message) => {
                originalOnMessage?.(message);

                if ("result" in message && message.id === requestId) {
                  clearTimeout(timeout);
                  transportRef.current!.onmessage = originalOnMessage;
                  resolve(message.result as CallToolResult);
                }

                if ("error" in message && message.id === requestId) {
                  clearTimeout(timeout);
                  transportRef.current!.onmessage = originalOnMessage;
                  reject(
                    new Error(message.error.message || "Tool call failed")
                  );
                }
              };
            }
          }
        );

        await transportRef.current.send(callToolRequest);

        const result = await responsePromise;

        dispatch({
          type: "SET_ACTIVE_TOOL_RESULT",
          activeToolResult: result,
        });

        return result.content;
      } catch (error) {
        setError((error as Error).message);
        throw error;
      }
    },
    [setError]
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
    startServerWithFiles,
    startServerFromNpm,
    stopServer,
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

type MCPContextType =
  | (ReturnType<typeof useWebContainerMcp> & {
      selectedModelId: string;
      setSelectedModelId: (modelId: string) => void;
    })
  | null;

const MCPContext = createContext<MCPContextType>(null);

export function MCPProvider({ children }: { children: React.ReactNode }) {
  const mcp = useWebContainerMcp({ packageJson, indexJs });
  const [selectedModelId, setSelectedModelId] = useState<string>(DEFAULT_MODEL);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("mcp-selected-model");
      if (saved) {
        setSelectedModelId(saved);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("mcp-selected-model", selectedModelId);
    } catch {}
  }, [selectedModelId]);

  const contextValue = {
    ...mcp,
    selectedModelId,
    setSelectedModelId,
  };

  return (
    <MCPContext.Provider value={contextValue}>{children}</MCPContext.Provider>
  );
}

export function useMCP() {
  const ctx = useContext(MCPContext);
  if (!ctx) throw new Error("useMCP must be used within an MCPProvider");
  return ctx;
}
