"use client";

import React from "react";
import { Code2, AppWindow, Terminal as TerminalIcon } from "lucide-react";

interface CustomTabsProps {
  activeTab: "code-editor" | "web-preview";
  onTabChange: (tab: "code-editor" | "web-preview") => void;
}

const CustomTabs: React.FC<CustomTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex bg-background w-full">
      <div className="flex rounded-full border border-border px-1 py-0.5 relative m-2">
        {/* Sliding indicator */}
        <div
          className={`absolute top-0.5 bottom-0.5 bg-primary/10 border border-primary/20 rounded-full transition-all duration-300 ease-in-out ${
            activeTab === "code-editor"
              ? "left-0.5 w-[calc(50%-0.125rem)]"
              : "left-[calc(50%+0.125rem)] w-[calc(50%-0.125rem)]"
          }`}
        />

        <button
          onClick={() => onTabChange("code-editor")}
          className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 ease-in-out flex items-center justify-center gap-2 rounded-full z-10 ${
            activeTab === "code-editor"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Code Editor"
        >
          <Code2 className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
        </button>
        <button
          onClick={() => onTabChange("web-preview")}
          className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 ease-in-out flex items-center justify-center gap-2 rounded-full z-10 ${
            activeTab === "web-preview"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Web Preview"
        >
          <AppWindow className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
        </button>
      </div>
    </div>
  );
};

export default CustomTabs;
