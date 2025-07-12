import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal } from "lucide-react";

export function McpSystemLog({
  output,
  onClear,
}: {
  output: string;
  onClear: () => void;
}) {
  return (
    <Accordion type="single" collapsible defaultValue="log">
      <AccordionItem value="log">
        <AccordionTrigger>
          <div className="flex items-center gap-2">
            <Terminal className="size-4" strokeWidth={3} />
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <Card className="bg-black text-white">
            <CardContent className="bg-black p-0 text-white">
              <div className="flex justify-end w-full">
                <Button onClick={onClear} size="sm" className="w-full">
                  Clear
                </Button>
              </div>
              <ScrollArea className="bg-black w-full h-64 text-white">
                <div className="space-y-1 py-2">
                  {output.split(/\r?\n/).map((line, idx) =>
                    line.trim() ? (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <span className="font-mono text-white text-xs">
                          {line}
                        </span>
                      </div>
                    ) : null
                  )}
                  {output.trim().length === 0 && (
                    <p className="mt-4 py-8 text-muted-foreground text-center">
                      No logs yet.
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
