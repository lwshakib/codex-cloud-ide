"use client";

import React, { useState, useRef, useEffect } from "react";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";
import AiInput from "./AiInput";
import UserMessage from "./UserMessage";
import AssistantMessage from "./AssistantMessage";
import TerminalErrorCard from "./TerminalErrorCard";
import { useChat } from "@ai-sdk/react";
import { ChevronLeft, RefreshCw } from "lucide-react";
import { APP_PROMPT_SUGGESTIONS } from "@/lib/prompt-suggestions";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

import { parseVibeArtifact } from "@/lib/parseVibeArtifact";
import { LogoIcon } from "@/components/logo";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

const LeftSideView: React.FC = () => {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [suggestionsIndex, setSuggestionsIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { 
    currentWorkspace,
    updateFiles, 
    setStreamingStatus, 
    setPendingPreviewRoute, 
    selectedContexts, 
    removeSelectedContext, 
    fetchCredits,
    syncWithGithub,
    setChatInput,
    terminalError,
    setTerminalError
  } = useWorkspaceStore();

  const sessionChanges = useRef<Record<string, { path: string, oldContent: string, newContent: string }>>({});

  const {
    messages,
    sendMessage,
    setMessages: setChatMessages,
    status,
    stop,
  } = useChat({
    onFinish: () => {
      fetchCredits();
      
      const changes = Object.values(sessionChanges.current);
      if (changes.length > 0) {
        syncWithGithub(changes);
        sessionChanges.current = {}; // Reset for next time
      }
    },
    onError:()=>{
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    }
  });

  // Sync messages when workspace changes (e.g. navigating between workspaces)
  useEffect(() => {
    if (currentWorkspace?.messages) {
      setChatMessages(currentWorkspace.messages as any);
    }
  }, [currentWorkspace?.id, setChatMessages]);

  useEffect(() => {
    setStreamingStatus(
      status === "streaming" || status === "submitted" ? "streaming" : "idle"
    );
  }, [status, setStreamingStatus]);

  // Parse artifacts from streaming messages and update workspace files
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === "assistant" && currentWorkspace?.id) {
      const content = getMessageText(lastMessage);
      
      if (content.includes("<vibeArtifact")) {
        const parsed = parseVibeArtifact(content);
        const artifactFiles = parsed.files.flatFiles;

        if (parsed.activeRoute) {
          setPendingPreviewRoute(parsed.activeRoute);
        }

        if (artifactFiles && Object.keys(artifactFiles).length > 0) {
          const workspaceFiles = currentWorkspace.files || {};
          const mergedFiles = { ...workspaceFiles };
          let hasGlobalChanges = false;

          Object.entries(artifactFiles).forEach(([path, fileData]: [string, any]) => {
            const existingFile = workspaceFiles[path];
            const originalContent = existingFile?.content || "";
            let newContent = originalContent;

            if (fileData.startLine && fileData.endLine) {
              // Apply line-based patch
              const lines = originalContent.split("\n");
              const startVal = parseInt(String(fileData.startLine), 10);
              const endVal = parseInt(String(fileData.endLine), 10);
              
              const startIdx = startVal - 1;
              const deleteCount = endVal - startVal + 1;
              
              if (!isNaN(startIdx) && !isNaN(deleteCount) && startIdx >= 0) {
                  const newLines = fileData.content.split("\n");
                  lines.splice(startIdx, deleteCount, ...newLines);
                  newContent = lines.join("\n");
              }
            } else {
              // Full file replacement or creation
              newContent = fileData.content;
            }

            // Only update if content actually changed to prevent unnecessary store updates
            if (newContent !== originalContent) {
              mergedFiles[path] = { content: newContent };
              hasGlobalChanges = true;

              // Track changes for sync
              sessionChanges.current[path] = {
                path,
                oldContent: originalContent,
                newContent
              };
            }
          });

          if (hasGlobalChanges) {
             // Use immediate: false by default for streaming to allow debounced DB saves,
             // but store update is immediate for the UI and WebContainer
             updateFiles(mergedFiles);
          }
        }
      }
    }
  }, [messages, updateFiles, setPendingPreviewRoute, currentWorkspace?.id]);

  const currentName = currentWorkspace?.name || nameInput || "My Project";

  const startEditing = () => {
    setNameInput(currentName);
    setIsEditingName(true);
  };

  const submitName = async () => {
    if (nameInput.trim() && nameInput !== currentName && currentWorkspace) {
      try {
        const response = await fetch(`/api/workspaces/${currentWorkspace.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: nameInput.trim() }),
        });
        if (response.ok) {
          const data = await response.json();
          useWorkspaceStore.setState((state) => ({
            currentWorkspace: state.currentWorkspace 
              ? { ...state.currentWorkspace, name: data.name } 
              : null
          }));
        }
      } catch (e) {
        console.error("Failed to update workspace name:", e);
      }
    }
    setIsEditingName(false);
  };

  // Helper to extract text from UIMessage parts
  const getMessageText = (m: any) => {
    if (m.content) return m.content;
    if (m.parts && Array.isArray(m.parts)) {
      return m.parts
        .filter((p: any) => p.type === "text")
        .map((p: any) => p.text)
        .join("");
    }
    return "";
  };

  const handleFixError = (error: { message: string, exitCode?: number }) => {
    const fixPrompt = `I encountered a terminal error${error.exitCode ? ` (exit code ${error.exitCode})` : ""}:\n\n\`\`\`\n${error.message}\n\`\`\`\n\nPlease explain what's wrong and fix it.`;
    
    sendMessage(
      { text: fixPrompt, files: [] },
      {
        body: {
          files: currentWorkspace?.files,
          workspaceId: currentWorkspace?.id,
        },
      }
    );
    setTerminalError(null);
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, terminalError]);

  return (
    <div className="flex flex-col w-full h-full bg-background overflow-x-hidden border-r border-border/40 font-inter max-w-full">
      {/* Header with Project Name */}
      <header className="sticky top-0 z-20 h-14 px-4 flex items-center shrink-0 border-b border-border/10 bg-background/80 backdrop-blur-md transition-all">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => router.push("/workspaces")}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="w-px h-4 bg-border/20 mx-1" />
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(158,127,255,0.6)] animate-pulse" />
            {isEditingName ? (
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={submitName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitName();
                  if (e.key === "Escape") setIsEditingName(false);
                }}
                autoFocus
                className="bg-transparent border-none outline-none p-0 text-foreground text-sm font-medium w-fit focus:ring-0"
                style={{ width: `${Math.max(nameInput.length + 1, 5)}ch` }}
              />
            ) : (
              <h2
                className="text-foreground/90 text-sm font-medium cursor-text hover:text-foreground transition-colors line-clamp-1"
                onDoubleClick={startEditing}
                title="Double click to rename"
              >
                {currentName}
              </h2>
            )}
          </div>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scroll-smooth [scrollbar-gutter:stable] min-w-0 w-full"
      >
        <div className="p-2 px-3 min-h-full flex flex-col min-w-0 w-full">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-1000">
              <div className="text-center max-w-lg px-4">
                <LogoIcon size={80} className="rotate-12 text-primary/30 mx-auto mb-12 drop-shadow-sm" />
                <h1 className="mb-4 text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                  What do you <span className="text-primary italic">want</span>{" "}
                  to build?
                </h1>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Prompt, run, edit, and deploy full-stack{" "}
                  <span className="text-foreground font-medium">web</span> and{" "}
                  <span className="text-foreground font-medium">mobile</span>{" "}
                  apps.
                </p>

                {/* Prompt Suggestions */}
                {currentWorkspace?.app_type && APP_PROMPT_SUGGESTIONS[currentWorkspace.app_type] && (
                  <div className="mt-10 space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <span className="uppercase tracking-wider font-semibold">Try a Suggestion</span>
                      <button 
                        onClick={() => setSuggestionsIndex(prev => (prev + 3) % APP_PROMPT_SUGGESTIONS[currentWorkspace.app_type].length)}
                        className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>More</span>
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      {APP_PROMPT_SUGGESTIONS[currentWorkspace.app_type]
                        .slice(suggestionsIndex, suggestionsIndex + 3)
                        .map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => setChatInput(suggestion)}
                            className="text-left px-4 py-3 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 hover:border-primary/30 text-sm text-muted-foreground hover:text-foreground transition-all group"
                          >
                            <span className="line-clamp-2">{suggestion}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col py-4 w-full max-w-2xl mx-auto min-w-0 flex-1">
              {messages.map((m, idx) =>
                m.role === "user" ? (
                  <UserMessage
                    key={`${m.id}-${idx}`}
                    content={getMessageText(m)}
                    user={session?.user}
                  />
                ) : (
                  <AssistantMessage
                    key={`${m.id}-${idx}`}
                    content={getMessageText(m)}
                    isStreaming={idx === messages.length - 1}
                  />
                )
              )}
            </div>
          )}

          {terminalError && (
            <div className="w-full max-w-2xl mx-auto px-4 mt-4">
              <TerminalErrorCard 
                error={terminalError} 
                onFix={() => handleFixError(terminalError)} 
                onDismiss={() => setTerminalError(null)} 
              />
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 p-2 bg-linear-to-t from-background via-background to-transparent">
        <AiInput
          onStop={stop}
          onSend={async (text, files) => {
            // Clear terminal error when sending a new manual message
            setTerminalError(null);
            // Helper to convert file to base64
            const toBase64 = (file: File): Promise<string> =>
              new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = (error) => reject(error);
              });

            const processedFiles = await Promise.all(
              files.map(async (file) => ({
                type: "file" as const,
                mediaType: file.type,
                filename: file.name,
                data: (await toBase64(file)).split(",")[1],
              }))
            );

            // Build the message with selected contexts
            let fullText = text.trim();
            if (selectedContexts.length > 0) {
              const contextBlock = selectedContexts
                .map((ctx) => {
                  const ext = ctx.path.split('.').pop() || 'text';
                  return `Selected code from \`${ctx.path}\` (lines ${ctx.fromLine}-${ctx.toLine}):\n\`\`\`${ext}\n${ctx.content}\n\`\`\``;
                })
                .join('\n\n');
              fullText = fullText ? `${contextBlock}\n\n${fullText}` : contextBlock;
            }

            sendMessage(
              {
                text: fullText,
                files: processedFiles as any,
              },
              {
                body: {
                  files: currentWorkspace?.files,
                  workspaceId: currentWorkspace?.id,
                },
              }
            );

            // Clear selected contexts after sending
            selectedContexts.forEach((ctx) => removeSelectedContext(ctx.id));
          }}
        />
      </div>
    </div>
  );
};

export default LeftSideView;
