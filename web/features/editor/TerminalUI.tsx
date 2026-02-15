"use client";

import React, { useState } from "react";
import "xterm/css/xterm.css";
import { 
  Terminal as TerminalIcon, 
  Play, 
  Square, 
  Download, 
  Plus,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger, 
  TooltipProvider 
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export default function TerminalUI() {
  const [tabs, setTabs] = useState<{ id: string; name: string }[]>([
    { id: "1", name: "Terminal" },
  ]);
  const [activeTabId, setActiveTabId] = useState("1");
  
  const addTab = () => {
    if (tabs.length >= 3) return;
    const newId = String(Date.now());
    setTabs([...tabs, { id: newId, name: "Terminal" }]);
    setActiveTabId(newId);
  };

  const removeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length <= 1 || id === "1") return;
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) setActiveTabId(newTabs[newTabs.length - 1].id);
  };

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
      <div className="h-full w-full bg-background flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-2 h-9 border-b border-border bg-muted/50 shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide max-w-[70%]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1 h-7 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all whitespace-nowrap border-b-2",
                  activeTabId === tab.id 
                    ? "bg-background text-primary border-primary" 
                    : "text-muted-foreground hover:bg-background/40 border-transparent"
                )}
              >
                <TerminalIcon className="w-3 h-3" />
                {tab.name}
                {tab.id !== "1" && (
                  <X
                    className="w-3 h-3 ml-1 hover:text-destructive transition-colors"
                    onClick={(e) => removeTab(tab.id, e)}
                  />
                )}
              </button>
            ))}
            {tabs.length < 3 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md"
                onClick={addTab}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <HeaderButton 
              icon={Download}
              tooltip="Install Dependencies"
              className="text-primary/70 hover:text-primary hover:bg-primary/10"
            />
            <div className="w-px h-4 bg-border mx-0.5" />
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
        <div className="flex-1 min-h-0 relative bg-background/50 overflow-hidden p-4 font-mono text-[11px] text-muted-foreground">
          <div className="space-y-1">
            <p className="text-primary font-bold opacity-80">Welcome to Codex Cloud IDE v1.0.0</p>
            <p>Initializing development environment...</p>
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Environment ready.
            </p>
            <div className="pt-4 flex gap-2">
              <span className="text-primary font-bold">codex@workspace:</span>
              <span className="text-foreground animate-pulse">_</span>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
