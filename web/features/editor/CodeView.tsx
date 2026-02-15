"use client";

import React, { useCallback, useMemo, useEffect, useState, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { json } from "@codemirror/lang-json";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";
import { useTheme } from "next-themes";
import { tags as t } from "@lezer/highlight";
import { createTheme } from "@uiw/codemirror-themes";
import { inlineSuggestion } from "./inlineSuggestion";
import { motion, AnimatePresence } from "motion/react";
import { EditorView } from "@codemirror/view";
import { Sparkles, MessageSquarePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getFileIcon } from "./utils";
import { LogoIcon } from "@/components/logo";
import { cn } from "@/lib/utils";

const lightTheme = createTheme({
  theme: "light",
  settings: {
    background: "var(--background)",
    foreground: "#4d4d4c",
    caret: "#aeafad",
    selection: "#d6d6d6",
    selectionMatch: "#d6d6d6",
    lineHighlight: "#efefef",
    gutterBackground: "var(--background)",
    gutterForeground: "#4d4d4c",
  },
  styles: [
    { tag: t.comment, color: "#8e908c" },
    { tag: t.variableName, color: "#c82829" },
    { tag: [t.string, t.special(t.brace)], color: "#718c00" },
    { tag: t.number, color: "#f5871f" },
    { tag: t.bool, color: "#f5871f" },
    { tag: t.null, color: "#f5871f" },
    { tag: t.keyword, color: "#8959a8" },
    { tag: t.operator, color: "#3e999f" },
    { tag: t.className, color: "#eab700" },
    { tag: t.definition(t.typeName), color: "#eab700" },
    { tag: t.typeName, color: "#eab700" },
    { tag: t.angleBracket, color: "#3e999f" },
    { tag: t.tagName, color: "#c82829" },
    { tag: t.attributeName, color: "#eab700" },
  ],
});

const darkTheme = createTheme({
  theme: "dark",
  settings: {
    background: "var(--background)",
    foreground: "#9cdcfe",
    caret: "#c6c6c6",
    selection: "#6199ff2f",
    selectionMatch: "#72a1ff59",
    lineHighlight: "#ffffff0f",
    gutterBackground: "var(--background)",
    gutterForeground: "#838383",
  },
  styles: [
    { tag: t.keyword, color: "#569cd6" },
    {
      tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName],
      color: "#9cdcfe",
    },
    { tag: [t.function(t.variableName), t.labelName], color: "#dcdcaa" },
    {
      tag: [t.color, t.constant(t.name), t.standard(t.name)],
      color: "#569cd6",
    },
    { tag: [t.definition(t.name), t.separator], color: "#9cdcfe" },
    { tag: [t.brace], color: "#9cdcfe" },
    { tag: [t.annotation], color: "#dcdcaa" },
    {
      tag: [t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace],
      color: "#b5cea8",
    },
    { tag: [t.typeName, t.className], color: "#4ec9b0" },
    { tag: [t.operator, t.operatorKeyword], color: "#d4d4d4" },
    { tag: [t.tagName], color: "#569cd6" },
    { tag: [t.squareBracket], color: "#ffd700" },
    { tag: [t.angleBracket], color: "#808080" },
    { tag: [t.attributeName], color: "#9cdcfe" },
    { tag: [t.regexp], color: "#d16969" },
    { tag: [t.quote], color: "#6a9955" },
    { tag: [t.string], color: "#ce9178" },
    { tag: t.link, color: "#569cd6", textDecoration: "underline" },
    { tag: [t.url, t.escape, t.special(t.string)], color: "#d4d4d4" },
    { tag: [t.meta], color: "#d4d4d4" },
    { tag: [t.comment], color: "#6a9955", fontStyle: "italic" },
  ],
});

export default function CodeView() {
  const {
    currentWorkspace,
    activeFile,
    updateFiles,
    openFiles,
    setActiveFile,
    closeFile,
    addSelectedContext,
    modifiedFiles,
    saveFile,
    discardChanges,
  } = useWorkspaceStore();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [selection, setSelection] = useState<{
    text: string;
    from: number;
    to: number;
    fromLine: number;
    toLine: number;
    pos: { top: number; left: number };
  } | null>(null);
  const [quickEdit, setQuickEdit] = useState<{
    instructions: string;
    isStreaming: boolean;
    selection: NonNullable<typeof selection>;
  } | null>(null);
  const [fileToClose, setFileToClose] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (activeFile) {
          saveFile(activeFile);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeFile, saveFile]);

  const handleCloseRequest = (file: string) => {
    if (modifiedFiles[file]) {
      setFileToClose(file);
    } else {
      closeFile(file);
    }
  };

  const handleSaveAndClose = async () => {
    if (fileToClose) {
      await saveFile(fileToClose);
      closeFile(fileToClose);
      setFileToClose(null);
    }
  };

  const handleDiscardAndClose = () => {
    if (fileToClose) {
      discardChanges(fileToClose);
      closeFile(fileToClose);
      setFileToClose(null);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const getLanguage = useCallback((filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "js":
      case "jsx":
      case "ts":
      case "tsx":
        return javascript({ jsx: true, typescript: true });
      case "html":
        return html();
      case "css":
        return css();
      case "json":
        return json();
      default:
        return javascript();
    }
  }, []);

  const fileContent = useMemo(() => {
    if (!currentWorkspace || !activeFile) return null;
    return currentWorkspace.files[activeFile]?.content ?? "";
  }, [currentWorkspace, activeFile]);

  const onChange = useCallback(
    (value: string) => {
      if (!currentWorkspace || !activeFile) return;

      const newFiles = { ...currentWorkspace.files };
      newFiles[activeFile] = {
        ...newFiles[activeFile],
        content: value,
      };

      updateFiles(newFiles);
    },
    [currentWorkspace, activeFile, updateFiles]
  );

  const aiCompletionExtension = useMemo(() => {
    if (!activeFile) return [];

    return inlineSuggestion(async (state) => {
      const pos = state.selection.main.head;
      const line = state.doc.lineAt(pos);
      const after = line.text.slice(pos - line.from);
      const before = line.text.slice(0, pos - line.from);

      if (before.trim().length < 3 && state.doc.length < 50) return null;
      if (after.trim().length > 0) return null;

      const prefix = state.doc.sliceString(0, pos);
      const suffix = state.doc.sliceString(pos);

      try {
        const response = await fetch("/api/completion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prefix,
            suffix,
            language: activeFile.split(".").pop() || "javascript",
            fileName: activeFile,
          }),
        });

        const data = await response.json();
        return data.completion || null;
      } catch (e) {
        console.error("AI Completion error:", e);
        return null;
      }
    });
  }, [activeFile]);

  const handleQuickEdit = async () => {
    if (!quickEdit || !activeFile || !currentWorkspace) return;
    setQuickEdit((prev) => (prev ? { ...prev, isStreaming: true } : null));

    try {
      const response = await fetch("/api/quick-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instructions: quickEdit.instructions,
          selectedText: quickEdit.selection.text,
          fileName: activeFile,
          fullContent: currentWorkspace.files[activeFile].content,
          fromLine: quickEdit.selection.fromLine,
          toLine: quickEdit.selection.toLine,
        }),
      });

      if (!response.ok) throw new Error("Quick edit failed");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      let newSelectionText = "";
      const baseContent = currentWorkspace.files[activeFile].content;
      const prefix = baseContent.slice(0, quickEdit.selection.from);
      const suffix = baseContent.slice(quickEdit.selection.to);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = new TextDecoder().decode(value);
        newSelectionText += chunk;

        const updatedContent = prefix + newSelectionText + suffix;

        const newFiles = { ...currentWorkspace.files };
        newFiles[activeFile] = {
          ...newFiles[activeFile],
          content: updatedContent,
        };
        updateFiles(newFiles);
      }
    } catch (error) {
      console.error("Quick edit error:", error);
    } finally {
      setQuickEdit(null);
    }
  };
  
  const selectionExtension = useMemo(() => {
    return EditorView.domEventHandlers({
      mouseup: (event, view) => {
        setTimeout(() => {
          const { state } = view;
          const mainSelection = state.selection.main;
          if (!mainSelection.empty) {
            const text = state.doc.sliceString(mainSelection.from, mainSelection.to);
            const coords = view.coordsAtPos(mainSelection.to);
            const editorRect = editorRef.current?.getBoundingClientRect();

            if (coords && editorRect) {
              const fromLine = state.doc.lineAt(mainSelection.from).number;
              const toLine = state.doc.lineAt(mainSelection.to).number;
              setSelection({
                text,
                from: mainSelection.from,
                to: mainSelection.to,
                fromLine,
                toLine,
                pos: {
                  top: coords.top - editorRect.top,
                  left: coords.left - editorRect.left,
                },
              });
            }
          } else {
            setSelection(null);
          }
        }, 10);
      },
      mousedown: () => {
        setSelection(null);
      },
    });
  }, []);

  if (!activeFile && openFiles.length === 0) {
    return (
      <div className="h-full w-full bg-background flex items-center justify-center text-muted-foreground select-none overflow-hidden relative">
        <div className="flex flex-col items-center gap-4 relative z-10">
          <LogoIcon 
            className="rotate-12 opacity-15 text-muted-foreground transition-all duration-500 size-24" 
          />
        </div>
      </div>
    );
  }

  const currentTheme =
    mounted && (resolvedTheme === "light" || theme === "light")
      ? lightTheme
      : darkTheme;

  return (
    <div className="h-full w-full bg-background flex flex-col">
      <div className="flex items-center h-9 border-b border-border bg-muted/20 overflow-x-auto scrollbar-hide">
        {openFiles.map((file) => (
          <div
            key={file}
            className={cn(
              "group flex items-center gap-2 px-3 h-full text-xs font-medium cursor-pointer border-r border-border/50 min-w-[120px] max-w-[200px] hover:bg-background/50 transition-colors",
              activeFile === file
                ? "bg-background text-foreground border-t-2 border-t-primary"
                : "text-muted-foreground bg-transparent border-t-2 border-t-transparent"
            )}
            onClick={() => setActiveFile(file)}
          >
            {getFileIcon(file)}
            <span className="truncate flex-1">{file.split("/").pop()}</span>
            
            <div className="flex items-center justify-center w-5 h-5 relative">
              {modifiedFiles[file] ? (
                <div 
                  className={cn(
                    "w-2 h-2 rounded-full transition-opacity group-hover:opacity-0",
                    resolvedTheme === "dark" ? "bg-white" : "bg-[#fbbf24]"
                  )}
                  style={{ 
                    boxShadow: "0 0 8px rgba(251, 191, 36, 0.4)"
                  }} 
                />
              ) : null}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseRequest(file);
                }}
                className={cn(
                  "absolute inset-0 flex items-center justify-center hover:bg-muted-foreground/20 rounded-sm transition-all opacity-0 group-hover:opacity-100",
                  !modifiedFiles[file] && activeFile === file ? "opacity-100" : ""
                )}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-hidden relative" ref={editorRef}>
        {mounted && activeFile && (
          <CodeMirror
            value={fileContent || ""}
            height="100%"
            theme={currentTheme}
            extensions={[
              getLanguage(activeFile),
              aiCompletionExtension,
              selectionExtension,
            ]}
            onChange={onChange}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: true,
              highlightSpecialChars: true,
              history: true,
              drawSelection: true,
              dropCursor: true,
              allowMultipleSelections: true,
              indentOnInput: true,
              syntaxHighlighting: true,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: false,
              rectangularSelection: true,
              crosshairCursor: true,
              highlightActiveLine: true,
              highlightSelectionMatches: true,
              closeBracketsKeymap: true,
              defaultKeymap: true,
              searchKeymap: true,
              historyKeymap: true,
              foldKeymap: true,
              completionKeymap: true,
              lintKeymap: true,
            }}
            className="h-full text-sm"
          />
        )}

        <AnimatePresence>
          {quickEdit && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              style={{
                position: "absolute",
                top:
                  quickEdit.selection.pos.top < 150
                    ? quickEdit.selection.pos.top + 30
                    : quickEdit.selection.pos.top - 160,
                left: Math.max(
                  10,
                  Math.min(
                    quickEdit.selection.pos.left - 225,
                    (editorRef.current?.offsetWidth || 0) - 460
                  )
                ),
                zIndex: 51,
              }}
              className="w-[450px] flex flex-col gap-2 p-3 bg-popover border border-border rounded-xl shadow-2xl backdrop-blur-md"
            >
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground pb-1">
                <Sparkles className="w-3 h-3 text-primary" />
                Quick Edit
              </div>
              <textarea
                autoFocus
                value={quickEdit.instructions}
                onChange={(e) =>
                  setQuickEdit((prev) =>
                    prev ? { ...prev, instructions: e.target.value } : null
                  )
                }
                placeholder="What should I change?"
                className="w-full min-h-[80px] bg-secondary/50 border border-border rounded-lg p-2 text-sm outline-none focus:border-primary/50 transition-colors resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleQuickEdit();
                  }
                  if (e.key === "Escape") setQuickEdit(null);
                }}
              />
              <div className="flex items-center justify-between gap-2 mt-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setQuickEdit(null)}
                  className="h-8 text-xs hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={
                    !quickEdit.instructions.trim() || quickEdit.isStreaming
                  }
                  className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleQuickEdit}
                >
                  {quickEdit.isStreaming ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Editing...
                    </div>
                  ) : (
                    "Submit"
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {selection && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              style={{
                position: "absolute",
                top:
                  selection.pos.top < 60
                    ? selection.pos.top + 30
                    : selection.pos.top - 50,
                left: Math.max(
                  10,
                  Math.min(
                    selection.pos.left - 100,
                    (editorRef.current?.offsetWidth || 0) - 250
                  )
                ),
                zIndex: 50,
              }}
              className="flex items-center gap-1 p-1 bg-popover border border-border rounded-lg shadow-xl"
            >
              <Button
                size="sm"
                variant="ghost"
                className="h-8 gap-2 text-xs hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={() => {
                  setQuickEdit({
                    instructions: "",
                    isStreaming: false,
                    selection: { ...selection! },
                  });
                  setSelection(null);
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Quick Edit
              </Button>
              <div className="w-px h-4 bg-border mx-1" />
              <Button
                size="sm"
                variant="ghost"
                className="h-8 gap-2 text-xs hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={() => {
                  if (activeFile) {
                    addSelectedContext({
                      path: activeFile,
                      fromLine: selection.fromLine,
                      toLine: selection.toLine,
                      content: selection.text,
                    });
                  }
                  setSelection(null);
                }}
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                Add to Chat
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {mounted && !activeFile && openFiles.length > 0 && (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
            Select a tab
          </div>
        )}
      </div>
      
      <Dialog open={!!fileToClose} onOpenChange={(open) => !open && setFileToClose(null)}>
        <DialogContent className="sm:max-w-[425px] bg-background border-border">
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Do you want to save the changes you made to <span className="font-semibold text-foreground">{fileToClose?.split('/').pop()}</span>?
              Your changes will be lost if you don't save them.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <div className="flex-1 flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleDiscardAndClose}
                className="flex-1 sm:flex-none border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
              >
                Don't Save
              </Button>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                onClick={() => setFileToClose(null)}
                className="text-muted-foreground"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveAndClose}
                className="bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              >
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
