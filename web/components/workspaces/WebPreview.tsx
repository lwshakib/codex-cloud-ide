"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Package, Rocket, Zap, AlertCircle, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ResponsiveMode = "desktop" | "tablet" | "mobile";

interface WebPreviewProps {
  url: string;
  setUrl: (url: string) => void;
  responsiveMode: ResponsiveMode;
  reloadKey: number;
}

export default function WebPreview({
  url,
  setUrl,
  responsiveMode,
  reloadKey,
}: WebPreviewProps) {
  const { currentWorkspace } = useWorkspaceStore();
  const { theme, resolvedTheme } = useTheme();

  // WebContainer logic removed
  const state = "ready"; 
  const webPreviewUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";
  const error = null;
  const instance = null;
  const startDevServer = () => {};

  const getStateIcon = (state: string) => {
    switch (state) {
      case "booting":
        return <Rocket className="h-12 w-12 text-primary/40 animate-pulse" />;
      case "mounting":
        return <Rocket className="h-12 w-12 text-blue-400/40" />;
      case "installing":
        return <Package className="h-12 w-12 text-primary/40 animate-bounce" />;
      case "starting":
        return <Zap className="h-12 w-12 text-primary/40 animate-pulse" />;
      case "ready":
        return <CheckCircle className="h-12 w-12 text-green-500/40" />;
      case "error":
        return <AlertCircle className="h-12 w-12 text-destructive/40" />;
      default:
        return <Rocket className="h-12 w-12 text-primary/40" />;
    }
  };

  const getStateTitle = (state: string) => {
    switch (state) {
      case "booting":
        return "Booting System";
      case "mounting":
        return "Mounting Files";
      case "installing":
        return "Installing Dependencies";
      case "starting":
        return "Starting Dev Server";
      case "ready":
        return "Preview Ready";
      case "error":
        return "System Error";
      default:
        return "Initializing...";
    }
  };

  const getStateDescription = (state: string) => {
    switch (state) {
      case "booting":
        return "Initializing in-browser Node.js environment...";
      case "mounting":
        return "Transferring project files...";
      case "installing":
        return "Installing project dependencies (npm install)...";
      case "starting":
        return "Launching your application server... (this may take a moment)";
      case "ready":
        return "Your live preview is active!";
      case "error":
        return error || "An unexpected error occurred.";
      default:
        return "Please wait...";
    }
  };

  const getProgressValue = (state: string) => {
    switch (state) {
      case "idle":
        return 0;
      case "booting":
        return 15;
      case "mounting":
        return 30;
      case "installing":
        return 60;
      case "starting":
        return 90;
      case "ready":
        return 100;
      case "error":
        return 100;
      default:
        return 0;
    }
  };

  const getIframeStyles = () => {
    switch (responsiveMode) {
      case "desktop":
        return "w-full h-full border-none bg-background";
      case "tablet":
        return "w-full max-w-[820px] h-full mx-auto border border-border rounded-lg shadow-2xl bg-background transition-all duration-300";
      case "mobile":
        return "w-full max-w-[320px] h-full mx-auto border border-border rounded-lg shadow-2xl bg-background transition-all duration-300";
    }
  };

  const getContainerStyles = () => {
    switch (responsiveMode) {
      case "desktop":
        return "flex-1 bg-background overflow-hidden";
      case "tablet":
      case "mobile":
        return "flex-1 bg-muted/30 flex items-center justify-center p-4 md:p-8 overflow-auto transition-colors duration-300";
    }
  };

  const getFullUrl = (path: string) => {
    if (!webPreviewUrl) return "about:blank";
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    const baseUrl = webPreviewUrl.endsWith("/")
      ? webPreviewUrl.slice(0, -1)
      : webPreviewUrl;

    // Append theme and timestamp to force refresh and sync appearance
    const currentTheme = resolvedTheme || theme || "dark";
    return `${baseUrl}/preview/${currentWorkspace?.id}${cleanPath}?theme=${currentTheme}&t=${reloadKey}`;
  };

  return (
    <div className="h-full w-full flex flex-col bg-background overflow-hidden animate-in fade-in duration-500">
      <div className={getContainerStyles()}>
        <iframe
          key={reloadKey}
          src={getFullUrl(url)}
          className={getIframeStyles()}
          title="Project Preview"
          allow="cross-origin-isolated"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
      </div>
    </div>
  );
}
