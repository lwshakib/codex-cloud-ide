"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import CodeView from "./CodeView";
import FileExplorer from "./FileExplorer";
import TerminalUI from "./TerminalUI";

export default function CodeEditor() {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full w-full bg-background"
    >
      <ResizablePanel
        defaultSize={20}
        minSize={15}
        maxSize={40}
        className="h-full"
      >
        <div className="h-full border-r border-border">
          <FileExplorer />
        </div>
      </ResizablePanel>

      <ResizableHandle className="w-1 bg-border/50 hover:bg-primary/20 transition-colors" />

      <ResizablePanel defaultSize={80} className="h-full">
        <ResizablePanelGroup direction="vertical" className="h-full">
          <ResizablePanel defaultSize={80} minSize={20}>
            <div className="h-full">
              <CodeView />
            </div>
          </ResizablePanel>

          <ResizableHandle className="h-1 bg-border/50 hover:bg-primary/20 transition-colors" />

          {/* Terminal at bottom */}
          <ResizablePanel defaultSize={20} minSize={10} maxSize={50}>
            <div className="h-full">
              <TerminalUI />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
