import { useCallback, useRef, useReducer, useMemo } from "react";
import { WebContainer } from "@webcontainer/api";

// State and Action types for reducer
interface State {
  status: string;
  output: string;
  tools: any[];
  toolResult: { tool?: string; content?: string };
}

type Action =
  | { type: "SET_STATUS"; status: string }
  | { type: "SET_OUTPUT"; output: string }
  | { type: "APPEND_OUTPUT"; output: string }
  | { type: "SET_TOOLS"; tools: any[] }
  | { type: "SET_TOOL_RESULT"; toolResult: { tool?: string; content?: string } }
  | { type: "RESET" };

const initialState: State = {
  status: "idle",
  output: "",
  tools: [],
  toolResult: {},
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
    case "SET_TOOL_RESULT":
      return { ...state, toolResult: action.toolResult };
    case "RESET":
      return { ...initialState };
    default:
      return state;
  }
}

export function useWebContainerMcp({
  packageJson,
  indexJs,
}: {
  packageJson: string;
  indexJs: string;
}) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const webcontainerRef = useRef<any>(null);
  const processRef = useRef<any>(null);
  const outputBuffer = useRef<string>("");
  // Track the last called tool name
  const lastCalledToolName = useRef<string | undefined>(undefined);

  const startServer = useCallback(async () => {
    dispatch({ type: "SET_STATUS", status: "booting" });
    dispatch({ type: "SET_OUTPUT", output: "" });
    dispatch({ type: "SET_TOOLS", tools: [] });
    dispatch({ type: "SET_TOOL_RESULT", toolResult: {} });
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
        dispatch({ type: "SET_STATUS", status: "error" });
        dispatch({ type: "APPEND_OUTPUT", output: "\nError: " + err?.message });
      }
    }, 100);
  }, [packageJson, indexJs]);

  const stopServer = useCallback(() => {
    if (processRef.current) {
      processRef.current.kill && processRef.current.kill();
    }
    dispatch({ type: "SET_STATUS", status: "idle" });
  }, []);

  const sendJsonRpc = useCallback(async (msg: object) => {
    if (!processRef.current) return;
    const writer = processRef.current.input.getWriter();
    await writer.write(JSON.stringify(msg) + "\n");
    writer.releaseLock();
  }, []);

  const handleProcessOutput = useCallback((data: string) => {
    outputBuffer.current += data;
    const lines = outputBuffer.current.split(/\r?\n/);
    outputBuffer.current = lines.pop() || "";
    for (const line of lines) {
      if (!line.trim()) continue;
      dispatch({ type: "APPEND_OUTPUT", output: line + "\n" });
      try {
        const json = JSON.parse(line);
        if (json.result && json.result.tools) {
          dispatch({ type: "SET_TOOLS", tools: json.result.tools });
        } else if (json.result && json.result.content) {
          dispatch({
            type: "SET_TOOL_RESULT",
            toolResult: {
              tool: lastCalledToolName.current,
              content: json.result.content[0]?.text || "",
            },
          });
        }
      } catch {
        // Not JSON, just log
      }
    }
  }, []);

  const handleListTools = useCallback(() => {
    sendJsonRpc({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/list",
      params: {},
    });
  }, [sendJsonRpc]);

  const handleCallTool = useCallback((toolName: string, values: any) => {
    lastCalledToolName.current = toolName;
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

  // Memoized mapping of old setX methods to dispatch actions
  const setMethods = useMemo(() => ({
    setStatus: (status: string) => dispatch({ type: "SET_STATUS", status }),
    setOutput: (output: string) => dispatch({ type: "SET_OUTPUT", output }),
    setTools: (tools: any[]) => dispatch({ type: "SET_TOOLS", tools }),
    setToolResult: (toolResult: { tool?: string; content?: string }) =>
      dispatch({ type: "SET_TOOL_RESULT", toolResult }),
    reset: () => dispatch({ type: "RESET" }),
  }), []);

  return {
    status: state.status,
    output: state.output,
    tools: state.tools,
    toolResult: state.toolResult,
    startServer,
    stopServer,
    sendJsonRpc,
    handleListTools,
    handleCallTool,
    ...setMethods, // Expose setStatus, setOutput, setTools, setToolResult, reset
  };
} 