"use client";

import React, { useState, useRef } from "react";
import { Paperclip, Sparkles, SendHorizontal, Code, X, Square, Loader2 } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AiInputProps {
  onSend: (text: string, files: File[]) => void;
  onStop?: () => void;
}

const AiInput: React.FC<AiInputProps> = ({ onSend, onStop }) => {
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentWorkspace, chatInput, setChatInput, selectedContexts, removeSelectedContext, credits, fetchCredits, streamingStatus } = useWorkspaceStore();

  React.useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (chatInput.trim() || files.length > 0) {
      onSend(chatInput, files);
      setChatInput("");
      setFiles([]);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  return (
    <div className="pb-2 bg-background">
      <div className="mx-auto w-full max-w-lg">
        {/* Token Counter Badge */}
        <div className="relative h-6.5">
          <div className="bg-muted absolute top-0 left-2 flex w-[calc(100%-1rem)] justify-between items-center rounded-t-lg border border-border px-2 py-1 text-xs opacity-100 backdrop-blur transition-opacity duration-350">
            <span className="text-muted-foreground">
              {credits !== null ? `${(credits / 1000).toFixed(1)}K` : "---"} daily tokens remaining.
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button disabled className="text-primary font-semibold opacity-50 cursor-not-allowed">
                  Upgrade to Pro
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-foreground text-background font-medium mb-1">
                This feature has not been built yet.
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Input Box */}
        <form
          onSubmit={handleSubmit}
          className="relative flex flex-col bg-muted/50 dark:bg-secondary/50 rounded-lg border border-border p-4 shadow-sm backdrop-blur"
        >
          <textarea
            rows={1}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="How can Vibe help you today?"
            className="mb-4 w-full bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground resize-none py-1 scrollbar-hide min-h-24 max-h-50"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />

          {/* Selected Context Chips */}
          {selectedContexts.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {selectedContexts.map((ctx) => (
                <div
                  key={ctx.id}
                  className="group flex items-center gap-2 bg-primary/10 border border-primary/20 px-2.5 py-1.5 rounded-lg text-xs text-primary hover:bg-primary/15 transition-colors"
                  title={`${ctx.path}\nLines ${ctx.fromLine}-${ctx.toLine}`}
                >
                  <Code size={12} className="shrink-0" />
                  <span className="truncate max-w-32 font-medium">
                    {ctx.path.split('/').pop()}
                  </span>
                  <span className="text-primary/60 text-[10px]">
                    L{ctx.fromLine}{ctx.fromLine !== ctx.toLine ? `-${ctx.toLine}` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSelectedContext(ctx.id)}
                    className="opacity-0 group-hover:opacity-100 text-primary/60 hover:text-destructive transition-all"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {files.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {files.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-secondary px-2 py-1 rounded text-xs text-foreground border border-border"
                >
                  <Paperclip size={12} />
                  <span className="truncate max-w-25">{file.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setFiles(files.filter((_, index) => index !== i))
                    }
                    className="text-muted-foreground hover:text-destructive"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-auto flex gap-4 items-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              multiple
            />
            <button
              type="button"
              onClick={handleFileClick}
              disabled={streamingStatus === "streaming"}
              className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Attach Files"
            >
              <Paperclip size={20} />
            </button>
            <button
              type="button"
              disabled={streamingStatus === "streaming"}
              className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="AI Tools"
            >
              <Sparkles size={20} />
            </button>

            <button
              type={streamingStatus === "streaming" ? "button" : "submit"}
              onClick={streamingStatus === "streaming" ? onStop : undefined}
              disabled={streamingStatus !== "streaming" && !chatInput.trim() && files.length === 0 && selectedContexts.length === 0}
              className="ml-auto flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative"
              title={streamingStatus === "streaming" ? "Stop Generating" : "Send Message"}
            >
              {streamingStatus === "streaming" ? (
                <div className="relative flex items-center justify-center">
                   <Loader2 className="h-5 w-5 animate-spin text-primary" />
                   <Square className="h-2 w-2 absolute fill-primary text-primary" />
                </div>
              ) : (
                <SendHorizontal size={20} className="group-hover:translate-x-0.5 transition-transform" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AiInput;
