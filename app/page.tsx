import { WebContainerDashboard } from "@/lib/webcontainer-mcp/ui";
import { MCPProvider } from "@/lib/webcontainer-mcp/use-mcp";

export default function Home() {
  return (
    <MCPProvider>
      <WebContainerDashboard />
    </MCPProvider>
  );
}
