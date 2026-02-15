"use client";

import { cn } from "@/lib/utils";
import {
  ChevronRight,
  ChevronDown,
  File as FileIcon,
  Search,
  Files,
  FilePlus,
  FolderPlus,
} from "lucide-react";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";
import React, { useState, useMemo } from "react";
import { getFileIcon } from "./utils";

type FileNode = {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  isOpen?: boolean;
};

const transformFilesToTree = (files: Record<string, any>): FileNode[] => {
  const root: FileNode[] = [];

  Object.keys(files).forEach((path) => {
    const parts = path.split("/");
    let currentLevel = root;
    const isKeepFile = parts[parts.length - 1] === ".keep";

    parts.forEach((part, index) => {
      const isLastPart = index === parts.length - 1;
      if (isLastPart && isKeepFile) return;

      const isFile = isLastPart;
      let existingNode = currentLevel.find((node) => node.name === part);

      if (!existingNode) {
        existingNode = {
          id: parts.slice(0, index + 1).join("/"),
          name: part,
          type: isFile ? "file" : "folder",
          children: isFile ? undefined : [],
        };
        currentLevel.push(existingNode);
      } else if (!isFile && existingNode.type === "file") {
        existingNode.type = "folder";
        existingNode.children = [];
      }

      if (existingNode.type === "folder") {
        currentLevel = existingNode.children || [];
      }
    });
  });

  const sortNodes = (nodes: FileNode[]) => {
    nodes.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === "folder" ? -1 : 1;
    });

    nodes.forEach((node) => {
      if (node.children) {
        sortNodes(node.children);
      }
    });
  };

  sortNodes(root);
  return root;
};

const FileTreeItem = ({
  node,
  depth = 0,
  onFileClick,
  activeFile,
}: {
  node: FileNode;
  depth?: number;
  onFileClick: (path: string) => void;
  activeFile: string | null;
}) => {
  const [isOpen, setIsOpen] = useState(node.id === "src" || depth < 1);

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === "folder") {
      setIsOpen(!isOpen);
    }
  };

  const isActive = activeFile === node.id;

  return (
    <div className="relative">
      <div
        className={cn(
          "group flex items-center gap-2 py-1 px-3 cursor-pointer select-none transition-all duration-200 border-l-2",
          isActive 
            ? "bg-primary/10 border-primary text-primary" 
            : "hover:bg-muted/50 border-transparent text-muted-foreground hover:text-foreground"
        )}
        style={{ paddingLeft: `${depth * 12 + 12}px` }}
        onClick={(e) => {
          toggleOpen(e);
          if (node.type === "file") onFileClick(node.id);
        }}
      >
        <span className="shrink-0 flex items-center justify-center w-4 h-4">
          {node.type === "folder" ? (
            isOpen ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )
          ) : (
            getFileIcon(node.name)
          )}
        </span>

        <span className={cn(
          "truncate text-xs font-medium",
          isActive && "font-bold"
        )}>
          {node.name}
        </span>
      </div>

      {isOpen && node.children && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          {node.children.map((child) => (
            <FileTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              onFileClick={onFileClick}
              activeFile={activeFile}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function FileExplorer() {
  const {
    currentWorkspace,
    activeFile,
    addOpenFile,
  } = useWorkspaceStore();
  const [activeTab, setActiveTab] = useState<"files" | "search">("files");
  const [searchQuery, setSearchQuery] = useState("");

  const tree = useMemo(() => {
    if (!currentWorkspace?.files) return [];
    return transformFilesToTree(currentWorkspace.files);
  }, [currentWorkspace?.files]);

  const flattenFiles = (nodes: FileNode[]): FileNode[] => {
    let result: FileNode[] = [];
    for (const node of nodes) {
      if (node.type === "file") {
        result.push(node);
      }
      if (node.children) {
        result = result.concat(flattenFiles(node.children));
      }
    }
    return result;
  };

  const allFiles = useMemo(() => flattenFiles(tree), [tree]);

  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    return allFiles.filter((file) =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, allFiles]);

  return (
    <div className="h-full w-full bg-background/50 flex flex-col font-sans border-r border-border/5">
      <div className="flex items-center gap-1 p-2 bg-muted/30">
        <button
          onClick={() => setActiveTab("files")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-bold transition-all",
            activeTab === "files"
              ? "bg-background text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Files className="w-3.5 h-3.5" />
          <span>Files</span>
        </button>
        <button
          onClick={() => setActiveTab("search")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-bold transition-all",
            activeTab === "search"
              ? "bg-background text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search</span>
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col pt-2">
        {activeTab === "files" ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
              <span>Explorer</span>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100">
                <FilePlus className="w-3 h-3 cursor-pointer hover:text-primary transition-colors" />
                <FolderPlus className="w-3 h-3 cursor-pointer hover:text-primary transition-colors" />
              </div>
            </div>

            <div className="flex-1 overflow-auto scrollbar-hide">
              {tree.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground opacity-30 px-6 text-center">
                  <Files className="w-10 h-10 mb-2 stroke-1" />
                  <p className="text-xs">Initialyzing project tree...</p>
                </div>
              )}

              {tree.map((node) => (
                <FileTreeItem
                  key={node.id}
                  node={node}
                  onFileClick={addOpenFile}
                  activeFile={activeFile}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col p-3 gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <input
                autoFocus
                className="w-full bg-muted/50 border border-border/10 rounded-lg pl-8 pr-3 py-2 text-xs outline-none focus:border-primary/30 transition-all font-medium"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex-1 overflow-auto">
              {searchQuery && searchResults.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">No files matching "{searchQuery}"</p>
              )}
              {searchResults.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
                  onClick={() => addOpenFile(file.id)}
                >
                  {getFileIcon(file.name)}
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-medium truncate text-foreground group-hover:text-primary transition-colors">
                      {file.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate opacity-60">
                      {file.id}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
