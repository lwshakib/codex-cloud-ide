"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Terminal as XTerm } from "xterm";
import { FitAddon } from "@xterm/addon-fit";
import "xterm/css/xterm.css";
import { 
  Terminal as TerminalIcon, 
  Play, 
  Square, 
  Download, 
  Plus,
  X,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger, 
  TooltipProvider 
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";
import { socket } from "@/lib/socket";
import { debounce } from "lodash";

interface TerminalTab {
  id: string;
  name: string;
}

export default function TerminalUI() {
  const [tabs, setTabs] = useState<TerminalTab[]>([
    { id: "default", name: "Terminal" },
  ]);
  const [activeTabId, setActiveTabId] = useState("default");
  const [isContainerReady, setIsContainerReady] = useState(false);
  const { currentWorkspace } = useWorkspaceStore();
  
  const terminals = useRef<Map<string, { term: XTerm; fitAddon: FitAddon }>>(new Map());
  const containers = useRef<Map<string, HTMLDivElement>>(new Map());

  const createTerminal = useCallback((tabId: string) => {
    if (!currentWorkspace) return;

    const term = new XTerm({
      cursorBlink: true,
      theme: {
        background: "#0a0a0a",
        foreground: "#ffffff",
        cursor: "#ffffff",
        selectionBackground: "rgba(255, 255, 255, 0.3)",
        black: "#000000",
        red: "#ff5555",
        green: "#50fa7b",
        yellow: "#f1fa8c",
        blue: "#bd93f9",
        magenta: "#ff79c6",
        cyan: "#8be9fd",
        white: "#bfbfbf",
        brightBlack: "#4d4d4d",
        brightRed: "#ff6e67",
        brightGreen: "#5af78e",
        brightYellow: "#f4f99d",
        brightBlue: "#caa9fa",
        brightMagenta: "#ff92d0",
        brightCyan: "#9aedfe",
        brightWhite: "#e6e6e6",
      },
      fontSize: 12,
      fontFamily: "JetBrains Mono, Menlo, Monaco, Courier New, monospace",
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    const container = containers.current.get(tabId);
    if (container) {
      term.open(container);
      term.write("\x1b[2m[Terminal] Connecting to container shell...\x1b[0m\r\n");
      setTimeout(() => fitAddon.fit(), 0);
    }

    term.onData((data) => {
      socket.emit("terminal:input", { terminalId: tabId, data });
    });

    terminals.current.set(tabId, { term, fitAddon });
    console.log(`[Terminal] Emitting terminal:create for ${tabId}`);
    socket.emit("terminal:create", tabId);

    return { term, fitAddon };
  }, [currentWorkspace]);

  const addTab = () => {
    if (tabs.length >= 5 || !isContainerReady) return;
    const newId = String(Date.now());
    const newTab = { id: newId, name: `Terminal ${tabs.length + 1}` };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
  };

  const removeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length <= 1) return;
    
    const termObj = terminals.current.get(id);
    if (termObj) {
      termObj.term.dispose();
      terminals.current.delete(id);
    }
    socket.emit("terminal:kill", id);
    
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) setActiveTabId(newTabs[newTabs.length - 1].id);
  };

  useEffect(() => {
    if (!currentWorkspace) return;

    const onWorkspaceReady = () => {
      console.log("[Terminal] Workspace ready received");
      setIsContainerReady(true);
    };

    socket.on("workspace:ready", onWorkspaceReady);

    // Re-check and create terminals for all tabs if ready
    if (isContainerReady) {
      tabs.forEach(tab => {
        const termObj = terminals.current.get(tab.id);
        const container = containers.current.get(tab.id);

        if (!termObj) {
            console.log(`[Terminal] Creating terminal for tab ${tab.id} after readiness`);
            createTerminal(tab.id);
        } else if (container) {
            // Check if it's attached to the CORRECT container
            if (termObj.term.element !== container) {
                console.log(`[Terminal] Container changed for ${tab.id}, re-attaching...`);
                // If it was already opened, we need to be careful. 
                // XTerm doesn't like being opened multiple times on different elements easily.
                // But we can try open() again.
                termObj.term.open(container);
                setTimeout(() => termObj.fitAddon.fit(), 0);
            }
        }
      });
    }

    const onTerminalData = ({ terminalId, data }: { terminalId: string, data: string }) => {
      console.log(`%c[Terminal] 📥 DATA RECEIVED: id=${terminalId}, len=${data.length}`, "color: #00ff00; font-weight: bold;");
      let targetId: string = terminalId;
      
      if (!terminals.current.has(targetId) && terminals.current.size === 1) {
          const firstKey = terminals.current.keys().next().value;
          if (firstKey) {
            console.warn(`[Terminal] Data ID mismatch: '${terminalId}' -> '${firstKey}'`);
            targetId = firstKey;
          }
      }

      const termObj = terminals.current.get(targetId);
      if (termObj) {
        termObj.term.write(data);
        if (targetId === activeTabId) termObj.term.focus();
      } else {
        console.error(`%c[Terminal] ❌ DROP DATA: No terminal for ID ${targetId}`, "color: #ff0000; font-weight: bold;");
      }
    };

    const onTerminalExit = (terminalId: string) => {
      const termObj = terminals.current.get(terminalId);
      if (termObj) {
        termObj.term.write("\r\n\x1b[31m[Process exited]\x1b[0m\r\n");
      }
    };

    socket.on("terminal:data", onTerminalData);
    socket.on("terminal:exit", onTerminalExit);

    return () => {
      socket.off("workspace:ready", onWorkspaceReady);
      socket.off("terminal:data", onTerminalData);
      socket.off("terminal:exit", onTerminalExit);
    };
  }, [currentWorkspace, createTerminal, isContainerReady, tabs]);

  useEffect(() => {
    const handleGlobalResize = debounce(() => {
      terminals.current.forEach((obj, id) => {
        obj.fitAddon.fit();
        socket.emit("terminal:resize", {
          terminalId: id,
          cols: obj.term.cols,
          rows: obj.term.rows,
        });
      });
    }, 100);

    const resizeObserver = new ResizeObserver(() => {
      handleGlobalResize();
    });

    const mainContainer = document.getElementById("terminal-main-container");
    if (mainContainer) resizeObserver.observe(mainContainer);

    return () => {
      resizeObserver.disconnect();
      handleGlobalResize.cancel();
    };
  }, []);

  useEffect(() => {
    const activeObj = terminals.current.get(activeTabId);
    if (activeObj) {
      setTimeout(() => activeObj.fitAddon.fit(), 0);
    }
  }, [activeTabId]);

  const HeaderButton = ({ 
    icon: Icon, 
    onClick, 
    tooltip, 
    className, 
    disabled, 
    iconClassName 
  }: { 
    icon: any, 
    onClick?: () => void, 
    tooltip: string, 
    className?: string, 
    disabled?: boolean,
    iconClassName?: string
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost" 
          size="icon"
          className={cn("h-7 w-7 transition-all rounded-md", className)}
          onClick={onClick}
          disabled={disabled}
        >
          <Icon className={cn("w-3.5 h-3.5", iconClassName)} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <TooltipProvider delayDuration={400}>
      <div className="h-full w-full bg-[#0a0a0a] flex flex-col overflow-hidden" id="terminal-main-container">
        <div className="flex items-center justify-between px-2 h-9 border-b border-white/5 bg-black/40 shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide max-w-[70%]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1 h-7 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all whitespace-nowrap border-b-2",
                  activeTabId === tab.id 
                    ? "bg-white/5 text-primary border-primary" 
                    : "text-muted-foreground hover:bg-white/5 border-transparent"
                )}
              >
                <TerminalIcon className="w-3 h-3" />
                {tab.name}
                {tabs.length > 1 && (
                  <X
                    className="w-3 h-3 ml-1 hover:text-destructive transition-colors"
                    onClick={(e) => removeTab(tab.id, e)}
                  />
                )}
              </button>
            ))}
            {tabs.length < 5 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md text-muted-foreground hover:text-primary"
                onClick={addTab}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <HeaderButton 
              icon={RefreshCw}
              tooltip="Reconnect Terminal"
              className="text-muted-foreground hover:text-primary hover:bg-primary/10"
              onClick={() => {
                if (currentWorkspace) {
                    setIsContainerReady(false);
                    socket.emit("workspace:join", currentWorkspace.id);
                }
              }}
            />
            <div className="w-px h-4 bg-white/10 mx-0.5" />
            <HeaderButton 
              icon={Download}
              tooltip="Install Dependencies"
              className="text-primary/70 hover:text-primary hover:bg-primary/10"
            />
            <div className="w-px h-4 bg-white/10 mx-0.5" />
            <HeaderButton 
              icon={Play}
              tooltip="Start Server"
              className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
              iconClassName="fill-current"
            />
            <HeaderButton 
              icon={Square}
              tooltip="Stop Server"
              className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
              iconClassName="fill-current"
            />
          </div>
        </div>
        
        <div className="flex-1 relative overflow-hidden bg-[#0a0a0a]">
          {!isContainerReady && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 text-white gap-3 animate-in fade-in duration-500">
               <RefreshCw className="size-6 animate-spin text-primary/60" />
               <p className="text-[11px] font-bold uppercase tracking-widest text-primary/80">Connecting to Container...</p>
               <p className="text-[10px] text-muted-foreground">This may take a few seconds during initialization</p>
            </div>
          )}
          {tabs.map((tab) => (
            <div
              key={tab.id}
              ref={(el) => {
                if (el) {
                  containers.current.set(tab.id, el);
                  if (!terminals.current.has(tab.id) && isContainerReady) {
                    createTerminal(tab.id);
                  }
                }
              }}
              className={cn(
                "absolute inset-0 p-2 transition-opacity duration-300",
                activeTabId === tab.id && isContainerReady ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              )}
            />
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
