"use client";
import React, { useEffect, useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import MarkdownContent from "./MarkdownContent";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";
import { parseVibeArtifact } from "@/lib/parseVibeArtifact";
import { Bot, CheckCircle, Clock, Loader2 } from "lucide-react";

interface AssistantMessageProps {
  content: string;
  isStreaming?: boolean;
}

const AssistantMessage: React.FC<AssistantMessageProps> = ({
  content,
  isStreaming = false,
}) => {
  const { currentWorkspace, updateFiles, addOpenFile, setActiveTab } = useWorkspaceStore();

  const parsedContent = useMemo(() => parseVibeArtifact(content), [content]);

  // useEffect(() => {
  //   console.log("Parsed Content:", parsedContent);
  // }, [parsedContent]);

  /* 
   * REMOVED: Redundant file sync logic that caused infinite loops.
   * File updates are handled by LeftSideView (for the streaming message)
   * and persisted to the DB (for history).
   */

  const hasProcessingFiles = parsedContent.progress.files.some(
    (file) => file.status === "PROCESSING"
  );
  const hasFiles = parsedContent.progress.files.length > 0;

  return (
    <div className="flex justify-start mb-6 group animate-in fade-in slide-in-from-left-4 duration-500 min-w-0">
      <div className="flex items-start gap-3 w-full min-w-0">
        <Avatar className="h-9 w-9 shrink-0 border border-secondary/20 shadow-sm ring-1 ring-secondary/10">
          <AvatarImage src="/ai-avatar.png" alt="AI" />
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            <Bot className="h-4.5 w-4.5" />
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-2 flex-1 min-w-0 max-w-[85%]">
          {/* Main Content Area */}
          {parsedContent.introduction ||
          hasFiles ||
          (parsedContent.conclusion && !isStreaming) ? (
            <div className="bg-muted text-foreground border border-border rounded-2xl p-4 shadow-sm break-words max-w-full overflow-hidden">
              <div className="space-y-4">
                {/* Introduction Text */}
                {parsedContent.introduction && (
                  <MarkdownContent
                    content={parsedContent.introduction}
                    className="text-sm leading-relaxed prose-p:my-2 first:prose-p:mt-0 last:prose-p:mb-0"
                  />
                )}

                {/* File Generation Progress */}
                {hasFiles && (
                  <div className="rounded-xl border border-primary/20 bg-background/40 overflow-hidden my-2 shadow-inner">
                    <Accordion
                      type="single"
                      collapsible
                      defaultValue="files"
                      className="w-full"
                    >
                      <AccordionItem value="files" className="border-none">
                        <AccordionTrigger className="hover:no-underline py-2.5 px-4 text-xs font-semibold transition-colors hover:bg-muted/30">
                          <div className="flex items-center gap-3 w-full">
                            <div className="relative flex items-center justify-center">
                              {hasProcessingFiles ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                              ) : (
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                              )}
                            </div>
                            <span className="text-foreground font-medium">
                              {parsedContent.files.title ||
                                "Vibe is working..."}
                            </span>
                            <div className="flex-1" />
                            <Badge
                              variant="secondary"
                              className="text-[10px] h-4.5 px-2 bg-primary/10 text-primary border-none font-bold"
                            >
                              {parsedContent.progress.files.length}{" "}
                              {parsedContent.progress.files.length === 1
                                ? "File"
                                : "Files"}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="px-3 pb-3 space-y-1 mt-1">
                            {parsedContent.progress.files.map((file, idx) => (
                              <div
                                key={idx}
                                onClick={() => {
                                  addOpenFile(file.fullPath);
                                  setActiveTab("code-editor");
                                }}
                                className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg hover:bg-primary/5 hover:text-primary transition-all group/file cursor-pointer active:scale-[0.98]"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {file.status === "COMPLETED" ? (
                                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                  ) : (
                                    <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
                                  )}
                                  <span className="text-muted-foreground font-mono truncate text-[11px] group-hover/file:text-primary transition-colors">
                                    {file.fullPath}
                                    {file.startLine && file.endLine && (
                                      <span className="ml-2 text-[10px] text-muted-foreground/60 shrink-0">
                                        L{file.startLine}-{file.endLine}
                                      </span>
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0 ml-4">
                                  {file.status !== "COMPLETED" ? (
                                    <span className="text-[10px] text-primary/70 font-medium animate-pulse">
                                      {file.startLine ? "Patching..." : "Writing..."}
                                    </span>
                                  ) : (
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold tabular-nums">
                                      <span className="text-emerald-500">+{file.additions ?? 0}</span>
                                      <span className="text-red-500">-{file.deletions ?? 0}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                )}

                {/* Conclusion Text */}
                {parsedContent.conclusion && (
                  <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-700">
                    <MarkdownContent
                      content={parsedContent.conclusion}
                      className="text-sm leading-relaxed border-t border-border/20 pt-4"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Fallback for plain text messages OR initial state */
            <div className="bg-muted text-foreground border border-border rounded-2xl p-4 shadow-sm break-words max-w-full overflow-hidden">
              <div className="flex flex-col gap-2">
                {isStreaming && content === "" && (
                  <div className="flex gap-1.5 p-1">
                    <div className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce"></div>
                  </div>
                )}
                <MarkdownContent
                  content={content}
                  className="text-sm leading-relaxed"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssistantMessage;
