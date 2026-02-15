"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, RotateCcw, Globe, ChevronRight, Sparkles, Loader2, RefreshCw, Search, Rocket } from "lucide-react";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "motion/react";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";
import { toast } from "sonner";

interface CustomSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onRefresh?: () => void;
  onExternalLink?: () => void;
  onToggleResponsive?: () => void;
  responsiveIcon?: React.ReactNode;
  placeholder?: string;
  port?: number;
  onPortChange?: (port: number) => void;
  onRestartServer?: () => void;
  onStopServer?: () => void;
  onStartServer?: () => void;
  disabled?: boolean;
  files?: any;
}

export const CustomSearchBar: React.FC<CustomSearchBarProps> = ({
  value,
  onChange,
  onSubmit,
  onRefresh,
  onExternalLink,
  onToggleResponsive,
  responsiveIcon,
  placeholder = "Search or enter path...",
  port = 3000,
  onPortChange,
  onRestartServer,
  onStopServer,
  onStartServer,
  disabled,
  files,
}) => {
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();
  const wcState = "ready"; // WebContainer logic removed
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const [localPort, setLocalPort] = useState(port.toString());
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(value);
    }
  }, [value, isFocused]);

  useEffect(() => {
    setLocalPort(port.toString());
  }, [port]);

  const detectedPaths = currentWorkspace?.detectedPaths || [];
  
  const groupedSuggestions = useMemo(() => {
    const filter = localValue.toLowerCase().trim();
    const activePaths = detectedPaths.length > 0 
      ? detectedPaths 
      : ["/"];

    // Filter paths based on search input
    const filtered = activePaths.filter(p => 
      !filter || p.toLowerCase().includes(filter)
    );

    const groups: Record<string, string[]> = {};
    
    filtered.forEach(path => {
      if (path === "/") {
        if (!groups["Application Root"]) groups["Application Root"] = [];
        groups["Application Root"].push(path);
        return;
      }
      
      const parts = path.split('/').filter(Boolean);
      const groupName = parts.length > 0 ? `/${parts[0]}` : "Application Root";
      
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(path);
    });
    
    // Sort groups: "Application Root" first, then alphabetical
    const sortedGroupNames = Object.keys(groups).sort((a, b) => {
      if (a === "Application Root") return -1;
      if (b === "Application Root") return 1;
      return a.localeCompare(b);
    });
    
    return sortedGroupNames.map(name => ({
      name,
      paths: groups[name].sort((a, b) => a.length - b.length || a.localeCompare(b))
    }));
  }, [detectedPaths, localValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSubmit(localValue);
      onChange(localValue);
      setShowSuggestions(false);
      (e.target as HTMLInputElement).blur();
    }
    if (e.key === "Escape") {
      setShowSuggestions(false);
      (e.target as HTMLInputElement).blur();
    }
  };

  const handlePortSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPort = parseInt(localPort);
    if (!isNaN(newPort) && newPort > 0 && newPort <= 65535 && onPortChange) {
      onPortChange(newPort);
    }
    setIsPopoverOpen(false);
  };

  const handleSelectPath = (path: string) => {
    setLocalValue(path);
    onChange(path);
    onSubmit(path);
    setShowSuggestions(false);
  };

  const handleAnalyzePaths = async () => {
    if (!currentWorkspace) return;
    
    setIsAnalyzing(true);
    try {
      const res = await fetch(`/api/workspaces/${currentWorkspace.id}/analyze-paths`, {
        method: "POST",
      });
      
      if (!res.ok) throw new Error("Failed to analyze paths");
      
      const data = await res.json();
      setCurrentWorkspace({
        ...currentWorkspace,
        detectedPaths: data.paths,
      });
      toast.success(`${data.paths.length} routes discovered`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to analyze project structure");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle click outside for suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex items-center w-full max-w-4xl h-11 rounded-lg border bg-background/95 backdrop-blur-sm shadow-sm transition-all duration-200",
        isFocused 
          ? "border-primary/60 ring-2 ring-primary/10 shadow-md" 
          : "border-border/60 hover:border-border/80",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {/* Left Area: Port Indicator */}
      <div className="flex items-center shrink-0 h-full pl-3 pr-2 border-r border-border/40">
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <button
                  disabled={disabled}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-md transition-all hover:bg-muted/60 active:bg-muted group/port cursor-pointer disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                  <div className="relative flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
                    <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-30" />
                  </div>
                  <span className="text-xs font-semibold tracking-wide text-muted-foreground transition-colors group-hover/port:text-foreground">
                    {port}
                  </span>
                </button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Change Port</p>
            </TooltipContent>
          </Tooltip>
          <PopoverContent className="w-64 p-4 shadow-2xl rounded-2xl border-border bg-popover/95 backdrop-blur-xl" align="start" sideOffset={12}>
            <form onSubmit={handlePortSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="port-input" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                  Development Port
                </Label>
                <p className="text-[10px] text-muted-foreground leading-none">
                  Manual entry (1-65535)
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  id="port-input"
                  type="number"
                  min="1"
                  max="65535"
                  value={localPort}
                  onChange={(e) => setLocalPort(e.target.value)}
                  className="h-9 text-sm rounded-xl border-border/60 bg-muted/20 focus:bg-background"
                  autoFocus
                  placeholder="3000"
                />
                <Button 
                  type="submit" 
                  size="sm" 
                  className="h-9 px-4 text-xs font-bold rounded-xl shadow-lg"
                >
                  Apply
                </Button>
              </div>

              <div className="pt-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60 mb-3 ml-1">Suggested Ports</p>
                <div className="grid grid-cols-2 gap-2">
                  {[3000, 8000, 4000, 8080, 5173].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setLocalPort(p.toString());
                        if (onPortChange) onPortChange(p);
                        setIsPopoverOpen(false);
                      }}
                      className={cn(
                        "flex items-center justify-center h-8 px-2 rounded-lg text-xs font-bold border transition-all",
                        port === p 
                          ? "bg-primary/10 border-primary text-primary shadow-sm" 
                          : "border-border/40 hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-border/40">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60 mb-3 ml-1">Server Controls</p>
                <div className="grid grid-cols-1 gap-2">
                   {wcState === "stopped" || wcState === "idle" || wcState === "error" ? (
                      <Button 
                        size="sm" 
                        variant="default"
                        className="h-9 w-full rounded-xl font-bold text-[11px] uppercase tracking-wider"
                        onClick={() => {
                          if (onStartServer) onStartServer();
                          setIsPopoverOpen(false);
                        }}
                      >
                        <Rocket className="w-3.5 h-3.5 mr-2" />
                        Start Server
                      </Button>
                   ) : (
                      <div className="flex gap-2">
                         <Button 
                            size="sm" 
                            variant="outline"
                            className="h-9 flex-1 rounded-xl font-bold text-[11px] uppercase tracking-wider border-border/60 hover:bg-muted/60"
                            onClick={() => {
                              if (onStopServer) onStopServer();
                              setIsPopoverOpen(false);
                            }}
                          >
                            <div className="size-2 rounded-full bg-destructive mr-2" />
                            Stop
                          </Button>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            className="h-9 flex-1 rounded-xl font-bold text-[11px] uppercase tracking-wider"
                            onClick={() => {
                              if (onRestartServer) onRestartServer();
                              setIsPopoverOpen(false);
                            }}
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-2" />
                            Restart
                          </Button>
                      </div>
                   )}
                </div>
              </div>
            </form>
          </PopoverContent>
        </Popover>
      </div>

      {/* Center Area: Editable Path */}
      <div className="flex-1 flex items-center h-full px-4 overflow-hidden relative">
        <div className="flex items-center gap-2 w-full max-w-2xl mx-auto">
          <Globe className={cn(
            "h-4 w-4 shrink-0 transition-colors",
            isFocused ? "text-primary/70" : "text-muted-foreground/50"
          )} />
          <input
            value={localValue}
            onChange={(e) => {
              let val = e.target.value;
              if (!val.startsWith("/")) {
                val = "/" + val;
              }
              setLocalValue(val);
              setShowSuggestions(true);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsFocused(true);
              setShowSuggestions(true);
            }}
            onBlur={(e) => {
              setIsFocused(false);
            }}
            disabled={disabled}
            className={cn(
              "flex-1 h-full text-sm bg-transparent border-none focus:outline-none transition-all font-medium",
              isFocused 
                ? "text-foreground placeholder:text-muted-foreground/40" 
                : "text-muted-foreground/80 placeholder:text-muted-foreground/30",
              "disabled:cursor-not-allowed"
            )}
            spellCheck={false}
            autoComplete="off"
            placeholder={placeholder}
          />
        </div>
      </div>

      {/* Popover / Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="absolute top-full left-0 right-0 mt-3 py-3 bg-background/98 backdrop-blur-xl border border-border/60 rounded-xl shadow-2xl z-[100] overflow-hidden"
          >
            <div className="px-4 pb-3 mb-2 border-b border-border/40 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                Route Navigator
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAnalyzePaths();
                }}
                disabled={isAnalyzing}
                className={cn(
                  "flex items-center justify-center p-1.5 transition-all text-primary hover:opacity-80 active:scale-90",
                  "bg-transparent border-none shadow-none outline-none focus:ring-0",
                  isAnalyzing && "opacity-50 cursor-not-allowed"
                )}
                title={detectedPaths.length > 0 ? "Re-analyze Routes" : "Analyze Routes"}
              >
                {isAnalyzing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : detectedPaths.length > 0 ? (
                  <RefreshCw className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="max-h-[300px] overflow-y-auto overflow-x-hidden custom-scrollbar">
              {detectedPaths.length === 0 && !isAnalyzing ? (
                <div className="py-12 px-8 text-center animate-in fade-in zoom-in-95 duration-500">
                  <h3 className="text-lg font-bold text-foreground mb-3">Ready to Discover?</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-10 max-w-[240px] mx-auto">
                    Use our AI to scan your workspace and build a live map of your application routes.
                  </p>
                  <Button
                    className="w-full h-11 rounded-xl font-bold text-xs uppercase tracking-widest bg-primary shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all group"
                    onClick={handleAnalyzePaths}
                  >
                    <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                    Start AI Analysis
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {groupedSuggestions.length > 0 ? (
                    groupedSuggestions.map((group) => (
                      <div key={group.name} className="space-y-1">
                        <div className="px-4 py-1.5 flex items-center gap-2 sticky top-0 bg-background/98 backdrop-blur-sm z-10 border-y border-border/10">
                          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary/70">
                            {group.name}
                          </span>
                          <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                        </div>
                        
                        <div className="space-y-0.5">
                          {group.paths.map((path) => (
                            <button
                              key={path}
                              onClick={() => handleSelectPath(path)}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-muted/60 transition-all group relative border-l-2 border-transparent hover:border-primary/40"
                            >
                              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/5 text-primary/40 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                <Globe className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold truncate text-foreground/80 group-hover:text-foreground">
                                  {path}
                                </span>
                                {path === "/" && (
                                  <span className="text-[10px] text-muted-foreground/50">
                                    Primary Entry Point
                                  </span>
                                )}
                              </div>
                              <ChevronRight className="ml-auto w-3.5 h-3.5 text-muted-foreground/20 group-hover:text-primary/60 transition-colors" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 px-4 text-center">
                      <div className="size-12 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                        <Search className="w-6 h-6 text-muted-foreground/40" />
                      </div>
                      <p className="text-sm font-semibold text-foreground/60">No matching paths</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Try a different search term or re-analyze.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Area: Action Buttons */}
      <div className="flex items-center gap-1 pr-2 shrink-0 h-full border-l border-border/40 pl-2">
        {onRefresh && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRefresh}
                disabled={disabled}
                className="h-8 w-8 text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 transition-all rounded-md"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Refresh Preview</p>
            </TooltipContent>
          </Tooltip>
        )}

        {onExternalLink && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onExternalLink}
                disabled={disabled}
                className="h-8 w-8 text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 transition-all rounded-md"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Open in New Tab</p>
            </TooltipContent>
          </Tooltip>
        )}

        {onToggleResponsive && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleResponsive}
                disabled={disabled}
                className="h-8 w-8 text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 transition-all rounded-md"
              >
                {responsiveIcon}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
               <p>Responsive Mode</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
};