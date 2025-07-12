import type { Tool } from "@modelcontextprotocol/sdk/types.js";

class SystemPromptBuilder {
  private parts: string[] = [];
  append(part: string | ((current: string) => string)) {
    if (typeof part === "function") {
      const current = this.parts.join("");
      this.parts = [part(current)];
    } else {
      this.parts.push(part);
    }
    return this;
  }
  reset() {
    this.parts = [];
    return this;
  }
  toString() {
    return this.parts.join("");
  }
}

export function buildSystemPrompt(tools: Tool[] = []): string {
  const builder = new SystemPromptBuilder();
  
  builder.append(`You are a helpful AI assistant. You can help with:\n\n`);
  builder.append(`- General questions and conversations\n`);
  builder.append(`- Coding assistance and explanations\n`);
  builder.append(`- Problem-solving and brainstorming\n`);
  builder.append(`- Writing and editing help\n`);
  builder.append(`- Educational topics and explanations\n\n`);
  
  // Tool information and instructions are only added if tools are available
  if (tools.length > 0) {
    builder.reset();
    builder.append(`You are an AI assistant with access to external tools. Your primary job is to call tools to answer user requests whenever possible.\n\n`);

    builder.append(`AVAILABLE TOOLS:\n`);
    tools.forEach((tool) => {
      builder.append(`- ${tool.name}: ${tool.description || "No description"}\n`);
      builder.append(`  inputSchema: ${JSON.stringify(tool.inputSchema, null, 2)}\n`);
    });
    builder.append(`\n`);
    builder.append(`TOOL CALLING INSTRUCTIONS:\n`);
    builder.append(`- If the user asks for a specific action, data, or function that cannot be answered conversationally, you MUST call the relevant tool using the exact format below.\n`);
    builder.append(`- DO NOT call a tool for greetings, small talk, or general conversation. Respond naturally in those cases.\n`);
    builder.append(`- DO NOT use the echo tool for greetings, small talk, or to simply repeat what the user said.\n`);
    builder.append(`- Only respond conversationally if NO tool is relevant.\n`);
    builder.append(`- If the user asks about available tools, respond with a short list of tool names and descriptions only. Do NOT include schemas or technical details in your answer.\n`);
    builder.append(`- Use this format for tool calls (no extra text):\n`);
    builder.append(`<tool_call>\n`);
    builder.append(`{"name": "tool_name", "arguments": { /* fill according to inputSchema */ }}\n`);
    builder.append(`</tool_call>\n`);
    builder.append(`- You may call multiple tools if needed, each in its own <tool_call> block.\n`);
    builder.append(`- Never include any explanation, jokes, or chit-chat when a tool call is required.\n`);
    builder.append(`\n`);
  }
  return builder.toString();
} 