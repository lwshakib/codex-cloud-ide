"use client";

import { authClient } from "@/lib/auth-client";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";

import { UserMenu } from "@/components/user-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";
import { Download, ExternalLink, Github, Lock, Plus, RefreshCw, Sparkles, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import { uniqueNamesGenerator, adjectives, animals } from "unique-names-generator";
import { toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";
import React, { useState } from "react";
import CodeEditor from "@/features/editor/CodeEditor";
import { CustomSearchBar } from "./CustomSearchBar";
import CustomTabs from "./CustomTabs";
import WebPreview from "./WebPreview";
import { downloadProjectAsZip } from "@/lib/download";
import { cn } from "@/lib/utils";

type ResponsiveMode = "desktop" | "tablet" | "mobile";

const RightSideView: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentWorkspace,
    activePreviewRoute,
    pendingPreviewRoute,
    setPendingPreviewRoute,
    isSyncing,
    syncWithGithub,
    isSidebarOpen,
    setIsSidebarOpen
  } = useWorkspaceStore();
  
  // WebContainer logic removed as requested
  const previewUrl = "/"; 
  const port = null;
  const setPort = (_port: number | null) => {};
  const instance = null;
  const startDevServer = (_instance: any) => {};
  const stopDevServer = () => {};

  const [repos, setRepos] = useState<any[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [isGithubConnected, setIsGithubConnected] = useState(true);

  // GitHub Popover State
  const [isGithubPopoverOpen, setIsGithubPopoverOpen] = useState(false);
  const [isCreatingRepo, setIsCreatingRepo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingRepo, setIsDeletingRepo] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [repoName, setRepoName] = useState("");
  const [repoDescription, setRepoDescription] = useState("");
  const [repoPrivate, setRepoPrivate] = useState(true);

  const fetchRepos = async () => {
    try {
      setIsLoadingRepos(true);
      const res = await fetch(`${SERVER_URL}/api/github/repos`, {
        credentials: "include"
      });
      const data = await res.json();

      if (data.error === "GitHub not connected") {
        setIsGithubConnected(false);
        return;
      }

      if (data.repos) {
        setRepos(data.repos);
        setIsGithubConnected(true);
      }
    } catch (err) {
      console.error("Failed to fetch repos", err);
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const handleConnectGithub = async () => {
    await authClient.signIn.social({
      provider: "github",
      callbackURL: window.location.href,
    });
  };

  const handlePopoverOpenChange = (open: boolean) => {
    setIsGithubPopoverOpen(open);
    if (open) {
      if (!currentWorkspace?.githubRepo) {
        setIsCreatingRepo(true); // Default to creation form as requested
        fetchRepos();
      }
    }
  };

  const handleGenerateRepoName = () => {
    const randomName = uniqueNamesGenerator({
      dictionaries: [adjectives, animals],
      length: 2,
      separator: '-',
      style: 'lowerCase'
    });
    setRepoName(randomName);
  };

  const handleCreateRepo = async () => {
    if (!repoName.trim() || !currentWorkspace) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`${SERVER_URL}/api/github/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: repoName.trim(),
          description: repoDescription,
          isPrivate: repoPrivate,
          workspaceId: currentWorkspace.id,
        }),
      });
      const data = await res.json();
      if (data.repo) {
        useWorkspaceStore.getState().setCurrentWorkspace({
          ...currentWorkspace,
          githubRepo: data.repo.full_name,
        });
        
        // Trigger initial sync for the newly created repo
        syncWithGithub(undefined, "Initial commit: project setup");
        
        setIsGithubPopoverOpen(false);
        setRepoName("");
        setRepoDescription("");
        toast.success("Repository created and sync initiated!");
      } else {
        toast.error(data.error || "Failed to create repository");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkRepo = async (full_name: string) => {
    if (!currentWorkspace) return;
    try {
      if (full_name === "") setIsUnlinking(true);
      const res = await fetch(`${SERVER_URL}/api/github/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ full_name, workspaceId: currentWorkspace.id }),
      });
      const data = await res.json();
      if (data.workspace) {
        useWorkspaceStore.getState().setCurrentWorkspace(data.workspace);
        if (full_name === "") {
            setIsGithubPopoverOpen(false);
            toast.success("GitHub repository unlinked");
        } else {
            // New connection, trigger initial sync with a descriptive message
            syncWithGithub(undefined, "Initial commit: project setup");
            toast.success("GitHub repository linked successfully");
        }
      } else if (data.error) {
          toast.error(data.error);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to link repository");
    } finally {
        setIsUnlinking(false);
    }
  };

  const handleDeleteRepo = async () => {
    if (!currentWorkspace) return;
    try {
      setIsDeletingRepo(true);
      const res = await fetch(`${SERVER_URL}/api/github/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ workspaceId: currentWorkspace.id }),
      });
      const data = await res.json();
      if (res.status === 403) {
          toast.error("Permission denied", {
              description: "Please sign out and sign back in to grant 'delete_repo' permission."
          });
          return;
      }

      if (data.workspace) {
        useWorkspaceStore.getState().setCurrentWorkspace(data.workspace);
        setIsGithubPopoverOpen(false);
        toast.success("Repository deleted and unlinked successfully");
      } else if (data.error) {
          toast.error(data.error);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete repository");
    } finally {
        setIsDeletingRepo(false);
    }
  };



  const [url, setUrl] = useState("/");

  React.useEffect(() => {
    if (activePreviewRoute) {
      setUrl(activePreviewRoute);
    }
  }, [activePreviewRoute]);
  const [responsiveMode, setResponsiveMode] =
    useState<ResponsiveMode>("desktop");
  const [reloadKey, setReloadKey] = useState(0);

  // WebContainer logic removed
  const state = "idle";
  const hasAutoSwitchedRef = React.useRef(false);

  React.useEffect(() => {
    if ((state as string) === "ready") {
      if (!hasAutoSwitchedRef.current) {
        setActiveTab("web-preview");
        hasAutoSwitchedRef.current = true;
      }
      
      // Apply pending route after mount/install is finished
      if (pendingPreviewRoute) {
        setUrl(pendingPreviewRoute);
        setPendingPreviewRoute(null);
      }
    } else {
      hasAutoSwitchedRef.current = false;
    }
  }, [state, setActiveTab, pendingPreviewRoute, setPendingPreviewRoute]);

  const handleRefresh = () => {
    setReloadKey((prev) => prev + 1);
  };

  const handleResponsiveModeToggle = () => {
    const modes: ResponsiveMode[] = ["desktop", "tablet", "mobile"];
    const currentIndex = modes.indexOf(responsiveMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setResponsiveMode(modes[nextIndex]);
  };

  const getResponsiveIcon = () => {
    switch (responsiveMode) {
      case "desktop":
        return <Monitor className="h-3 w-3" />;
      case "tablet":
        return <Tablet className="h-3 w-3" />;
      case "mobile":
        return <Smartphone className="h-3 w-3" />;
    }
  };

  const handleExternalLink = () => {
    if (previewUrl) {
      const cleanPath = url.startsWith("/") ? url : `/${url}`;
      window.open(`${previewUrl}${cleanPath}`, "_blank");
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-full h-full rounded-xl flex flex-col overflow-hidden">
        <header className="sticky top-0 z-20 h-14 flex items-center justify-between shrink-0 gap-4 px-4 bg-background/50 backdrop-blur-md border-b border-border/5 transition-all">
          <div className="flex items-center gap-4 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </Button>
            <CustomTabs activeTab={activeTab} onTabChange={setActiveTab} />

            <AnimatePresence>
              {activeTab === "web-preview" && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 max-w-3xl w-full"
                >
                  <CustomSearchBar
                    value={url}
                    onChange={setUrl}
                    onSubmit={() => {}}
                    onRefresh={handleRefresh}
                    onExternalLink={previewUrl ? handleExternalLink : undefined}
                    onToggleResponsive={handleResponsiveModeToggle}
                    responsiveIcon={getResponsiveIcon()}
                    placeholder="Search or enter path..."
                    port={port || 3000}
                    onPortChange={(newPort) => {
                      setPort(newPort);
                    }}
                    onRestartServer={() => instance && startDevServer(instance)}
                    onStopServer={() => stopDevServer()}
                    onStartServer={() => instance && startDevServer(instance)}
                    files={currentWorkspace?.files}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center space-x-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-popover border-border text-popover-foreground">
                <AlertDialogHeader>
                  <AlertDialogTitle>Download Project Files</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">
                    This will download all your project files and folders as a
                    ZIP file.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-transparent border-border text-foreground hover:bg-accent">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => {
                      if (currentWorkspace?.files) {
                        downloadProjectAsZip(
                          currentWorkspace.name || "project",
                          currentWorkspace.files as Record<
                            string,
                            { content: string }
                          >
                        );
                      }
                    }}
                  >
                    Download ZIP
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Popover
              open={isGithubPopoverOpen}
              onOpenChange={handlePopoverOpenChange}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent",
                    currentWorkspace?.githubRepo && "text-primary hover:text-primary"
                  )}
                >
                  <Github className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 bg-popover border-border text-popover-foreground shadow-2xl rounded-2xl overflow-hidden" align="end" sideOffset={12}>
                {currentWorkspace?.githubRepo ? (
                  <div className="flex flex-col">
                    <div className="p-4 bg-primary/5 border-b border-primary/10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 rounded-lg bg-primary/10">
                            <Github className="size-4 text-primary" />
                          </div>
                          <span className="text-xs font-bold uppercase tracking-widest text-primary/80">GitHub Synced</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                           <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                           <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tight">Active</span>
                        </div>
                      </div>
                      <div 
                        className="flex items-center justify-between p-2.5 rounded-xl bg-background/50 border border-primary/10 cursor-pointer hover:bg-background/80 transition-colors group"
                        onClick={() => window.open(`https://github.com/${currentWorkspace.githubRepo}`, "_blank")}
                      >
                         <div className="flex items-center space-x-2 min-w-0">
                            <span className="text-xs font-semibold truncate text-foreground/90">{currentWorkspace.githubRepo.split('/')[1]}</span>
                         </div>
                         <ExternalLink className="size-3 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                    
                    <div className="p-4 space-y-4">
                        <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/50">
                            <div className="flex items-start space-x-3">
                                <RefreshCw className={cn("size-3.5 mt-0.5 text-primary", isSyncing && "animate-spin")} />
                                 <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-foreground">
                                        {isSyncing ? "Syncing changes..." : "Auto-Sync Enabled"}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                                        {isSyncing 
                                            ? "AI is documenting your changes and pushing to GitHub..." 
                                            : "Your changes are automatically committed and pushed to GitHub on every save."}
                                    </p>
                                </div>
                            </div>
                        </div>

                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    className="w-full h-9 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                                >
                                    Disconnect Repository
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-background border-border">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-foreground">Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-muted-foreground">
                                        This will unlink the GitHub repository from your workspace.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                    <AlertDialogCancel disabled={isUnlinking || isDeletingRepo} className="bg-muted border-border text-foreground hover:bg-muted/80 mt-0">Cancel</AlertDialogCancel>
                                    <div className="flex flex-col sm:flex-row gap-2 flex-1">
                                        <AlertDialogAction 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleLinkRepo("");
                                            }}
                                            disabled={isUnlinking || isDeletingRepo}
                                            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 flex-1 h-9 rounded-xl"
                                        >
                                            {isUnlinking ? <RefreshCw className="size-3.5 animate-spin mr-2" /> : null}
                                            {isUnlinking ? "Unlinking..." : "Disconnect Only"}
                                        </AlertDialogAction>
                                        <AlertDialogAction 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleDeleteRepo();
                                            }}
                                            disabled={isUnlinking || isDeletingRepo}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 flex-1 h-9 rounded-xl"
                                        >
                                            {isDeletingRepo ? <RefreshCw className="size-3.5 animate-spin mr-2" /> : null}
                                            {isDeletingRepo ? "Deleting..." : "Disconnect & Delete Repo"}
                                        </AlertDialogAction>
                                    </div>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 space-y-5">
                    <div className="space-y-1.5">
                        <h3 className="text-sm font-bold text-foreground">Connect to GitHub</h3>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Initialize version control for your project.
                        </p>
                    </div>

                    {!isGithubConnected ? (
                        <div className="py-4 text-center border border-dashed border-border rounded-2xl bg-muted/5 px-4">
                            <Github className="size-8 mx-auto text-muted-foreground/30 mb-3" />
                            <p className="text-[11px] text-muted-foreground mb-5">
                                Authorize Vibe to manage your repositories.
                            </p>
                            <Button 
                                size="sm"
                                className="w-full bg-primary text-primary-foreground font-bold rounded-xl h-10 shadow-lg shadow-primary/20"
                                onClick={handleConnectGithub}
                            >
                                Authorize GitHub
                            </Button>
                        </div>
                    ) : isCreatingRepo ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                             <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between px-1">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Repository Name</Label>
                                        <button 
                                            onClick={handleGenerateRepoName}
                                            className="text-primary hover:text-primary/80 transition-colors p-0.5"
                                            title="Magic Suggestion"
                                        >
                                            <Sparkles className="size-3" />
                                        </button>
                                    </div>
                                    <Input
                                        placeholder="my-awesome-project"
                                        value={repoName}
                                        onChange={(e) => setRepoName(e.target.value)}
                                        className="h-10 rounded-xl bg-muted/50 border-border"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Description</Label>
                                    <Textarea
                                        placeholder="Brief description..."
                                        value={repoDescription}
                                        onChange={(e) => setRepoDescription(e.target.value)}
                                        className="rounded-xl bg-muted/50 border-border min-h-20 text-xs"
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                                    <div className="space-y-0.5">
                                        <p className="text-[11px] font-bold text-foreground">Private Repository</p>
                                        <p className="text-[9px] text-muted-foreground uppercase tracking-tighter">Recommended</p>
                                    </div>
                                    <Switch
                                        checked={repoPrivate}
                                        onCheckedChange={setRepoPrivate}
                                    />
                                </div>
                             </div>

                             <div className="flex gap-2">
                                 <Button 
                                    className="w-full h-10 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 uppercase text-[11px]"
                                    onClick={handleCreateRepo}
                                    disabled={!repoName.trim() || isSubmitting}
                                >
                                    {isSubmitting ? <RefreshCw className="size-3.5 animate-spin" /> : "Create Repo"}
                                </Button>
                             </div>
                        </div>
                    ) : (
                        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Select Repository</h4>
                            </div>
                            <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin">
                                {isLoadingRepos ? (
                                    <div className="py-12 text-center">
                                        <RefreshCw className="size-6 animate-spin mx-auto text-primary/30" />
                                    </div>
                                ) : repos.length > 0 ? (
                                    repos.map(repo => (
                                        <button
                                            key={repo.id}
                                            onClick={() => handleLinkRepo(repo.full_name)}
                                            className="w-full p-3 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/50 hover:border-primary/30 transition-all flex items-center justify-between group"
                                        >
                                            <div className="flex items-center space-x-3 min-w-0">
                                                <Github className="size-3.5 text-muted-foreground" />
                                                <span className="text-xs font-semibold truncate text-foreground/80">{repo.name}</span>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Plus className="size-3.5 text-primary" />
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="py-12 text-center rounded-2xl border border-dashed border-border/60">
                                        <p className="text-[11px] text-muted-foreground">No repositories found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                  </div>
                )}
              </PopoverContent>
            </Popover>

            <div className="pl-2 border-l border-border h-8 flex items-center">
              <UserMenu />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative rounded-md border-border border m-2">
          <motion.div
            initial={false}
            animate={{
              opacity: activeTab === "code-editor" ? 1 : 0,
              x: activeTab === "code-editor" ? 0 : -20,
              pointerEvents: activeTab === "code-editor" ? "auto" : "none",
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute inset-0 h-full w-full"
          >
            <CodeEditor />
          </motion.div>

          <motion.div
            initial={false}
            animate={{
              opacity: activeTab === "web-preview" ? 1 : 0,
              x: activeTab === "web-preview" ? 0 : 20,
              pointerEvents: activeTab === "web-preview" ? "auto" : "none",
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute inset-0 h-full w-full"
          >
            <WebPreview
              url={url}
              setUrl={setUrl}
              responsiveMode={responsiveMode}
              reloadKey={reloadKey}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RightSideView;
