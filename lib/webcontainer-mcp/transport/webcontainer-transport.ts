import type { Transport, TransportSendOptions } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import { JSONRPCMessageSchema } from "@modelcontextprotocol/sdk/types.js";
import type { BootOptions, WebContainerProcess } from "@webcontainer/api";
import { WebContainer } from "@webcontainer/api";

interface BaseOptions {
  timeout?: number;
  onStatusChange?: (status: "booting" | "mounting" | "installing" | "running" | "unmounting" | "teardowned") => void;
}

// For file-based MCP servers (mount files and run)
export interface FileBasedOptions extends BaseOptions {
  type: "files";
  /**
   * The files to mount in the WebContainer.
   * @example
   * {
   *   "index.js": "console.log('Hello, world!');",
   *   "package.json": JSON.stringify({
   *     "name": "my-mcp-server",
   *     "version": "1.0.0",
   *     "main": "index.js"
   *   })
   * }
   */
  files: Record<string, string>;
  /**
   * The entrypoint to run in the WebContainer.
   * @default "index.js"
   */
  entrypoint?: string;
  /**
   * The options to pass to the WebContainer.boot method.
   * @see https://webcontainer.io/docs/api/webcontainer#boot
   */
  bootOptions?: BootOptions;
}

// For direct spawn MCP servers (run existing commands)
export interface SpawnBasedOptions extends BaseOptions {
  type: "spawn";
  /**
   * The command to run in the WebContainer.
   */
  command: string;
  /**
   * The arguments to pass to the command.
   */
  args: string[];
  /**
   * The environment variables to pass to the command.
   */
  env?: Record<string, string>;
  /**
   * The options to pass to the WebContainer.boot method.
   * @see https://webcontainer.io/docs/api/webcontainer#boot
   */
  bootOptions?: BootOptions;
}

export type WebContainerTransportOptions = FileBasedOptions | SpawnBasedOptions;

export class WebContainerTransport implements Transport {
  private _webContainer?: WebContainer;
  private _process?: WebContainerProcess;
  private _started = false;
  private _outputBuffer = "";
  private _options: WebContainerTransportOptions;
  private _initialized = false;
  private _pendingRequests = new Map<string | number, (result: any) => void>();

  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;
  sessionId?: string;

  constructor(options: WebContainerTransportOptions) {
    this._options = options;
  }

  async start(): Promise<void> {
    if (this._started) {
      throw new Error("WebContainerTransport already started!");
    }

    try {
      this._started = true;
      
      this._options.onStatusChange?.("booting");
      this._webContainer = await WebContainer.boot(this._options.bootOptions);
      
      if (this._options.type === "files") {
        this._options.onStatusChange?.("mounting");
        
        const webContainerFiles: Record<string, { file: { contents: string } }> = {};
        for (const [filename, content] of Object.entries(this._options.files)) {
          webContainerFiles[filename] = { file: { contents: content } };
        }
        
        await this._webContainer.mount(webContainerFiles);
        
        if (this._options.files["package.json"]) {
          this._options.onStatusChange?.("installing");
          const installProcess = await this._webContainer.spawn("npm", ["install"]);
          await installProcess.exit;
        }
        
        this._options.onStatusChange?.("running");
        const entrypoint = this._options.entrypoint || "index.js";
        this._process = await this._webContainer.spawn("node", [entrypoint]);
        
      } else {
        this._options.onStatusChange?.("running");
        this._process = await this._webContainer.spawn(
          this._options.command,
          this._options.args,
          this._options.env ? { env: this._options.env } : undefined
        );
      }
      
      this._process.output.pipeTo(
        new WritableStream({
          write: (data: string) => {
            this._handleProcessOutput(data);
          },
        })
      );

      this._initialized = true;

    } catch (error) {
      this._started = false;
      this.onerror?.(error as Error);
      throw error;
    }
  }

  async send(message: JSONRPCMessage, _options?: TransportSendOptions): Promise<void> {
    if (!this._process) {
      throw new Error("Transport not started");
    }

    try {
      const writer = this._process.input.getWriter();
      const serialized = JSON.stringify(message) + "\n";
      await writer.write(serialized);
      writer.releaseLock();
    } catch (error) {
      this.onerror?.(error as Error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this._started) {
      this._options.onStatusChange?.("unmounting");
    }

    if (this._process) {
      try {
        this._process.kill?.();
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
      }
      this._process = undefined;
    }
    
    if (this._webContainer) {
      try {
        this._options.onStatusChange?.("teardowned");
        
        this._webContainer.teardown();
      } catch (error) {
      }
      this._webContainer = undefined;
    }
    
    this._started = false;
    this._initialized = false;
    
    this.onclose?.();
  }

  setProtocolVersion?(version: string): void {
  }

  private _handleProcessOutput(data: string): void {
    data = data.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "");
    data = data.replace(/[\r\x1b]/g, "");
    
    this._outputBuffer += data;
    const lines = this._outputBuffer.split(/\r?\n/);
    this._outputBuffer = lines.pop() || "";
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      try {
        const parsed = JSON.parse(line);
        const message = JSONRPCMessageSchema.parse(parsed);
        
        this.onmessage?.(message);
      } catch (error) {
      }
    }
  }
} 