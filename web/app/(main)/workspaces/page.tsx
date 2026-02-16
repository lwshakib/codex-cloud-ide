"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserMenu } from "@/components/user-menu";

import { Button } from "@/components/ui/button";
import { Logo, LogoIcon } from "@/components/logo";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useWorkspaceStore, Workspace, AppType } from "@/hooks/use-workspace-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Edit2,
  Github,
  MoreVertical,
  RefreshCw,
  Sparkles,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { uniqueNamesGenerator, adjectives, animals } from "unique-names-generator";
import { cn } from "@/lib/utils";
import {
  WORKSPACE_REGISTRY,
  getTemplateByType,
} from "@/lib/workspace-registry";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";

const generateGradientThumbnail = () => {
  const gradients = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
    "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  ];

  const randomGradient =
    gradients[Math.floor(Math.random() * gradients.length)];
  const svgContent = `
    <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${
            randomGradient.match(/#[a-fA-F0-9]{6}/g)?.[0] || "#667eea"
          }" />
          <stop offset="100%" style="stop-color:${
            randomGradient.match(/#[a-fA-F0-9]{6}/g)?.[1] || "#764ba2"
          }" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
      <circle cx="150" cy="100" r="30" fill="white" opacity="0.8" />
      <path d="M140 90 L160 90 L160 110 L140 110 Z" fill="white" opacity="0.6" />
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svgContent)}`;
};

const WorkspacesSkeleton = () => (
  <div className="w-full">
    <Table className="border-collapse">
      <TableHeader>
        <TableRow className="border-t border-b border-border/10">
          <TableHead className="w-[45%] pl-4 text-[11px] uppercase tracking-wider font-bold text-muted-foreground/60">Project</TableHead>
          <TableHead className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground/60">Stack</TableHead>
          <TableHead className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground/60">Updated</TableHead>
          <TableHead className="text-right pr-4"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(5)].map((_, idx) => (
          <TableRow key={idx} className="h-16 border-b border-border/10">
            <TableCell className="pl-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-lg bg-muted/50" />
                <Skeleton className="h-4 w-32 bg-muted/50" />
              </div>
            </TableCell>
            <TableCell><Skeleton className="h-4 w-20 bg-muted/50" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24 bg-muted/50" /></TableCell>
            <TableCell className="pr-4"><div className="flex justify-end"><Skeleton className="size-8 rounded-full bg-muted/50" /></div></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

export default function WorkspacesPage() {
  const { workspaces, setWorkspaces, credits, fetchCredits } = useWorkspaceStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [appType, setAppType] = useState<AppType>(AppType.VITE_APP);
  const [step, setStep] = useState(0);
  const [createError, setCreateError] = useState<string | null>(null);
  const [suggestedNames, setSuggestedNames] = useState<string[]>([]);
  
  // Pagination state
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // Workspace management state
  const [renamingWorkspace, setRenamingWorkspace] = useState<Workspace | null>(
    null
  );
  const [renameInput, setRenameInput] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [deletingWorkspace, setDeletingWorkspace] = useState<Workspace | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const router = useRouter();
  const { data: session } = authClient.useSession();

  const handleRename = async () => {
    if (!renamingWorkspace || !renameInput.trim()) return;

    try {
      setIsRenaming(true);
      const res = await fetch(`${SERVER_URL}/api/workspaces/${renamingWorkspace.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameInput.trim() }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to rename workspace");

      const data = await res.json();
      setWorkspaces((prev) =>
        prev.map((w) => (w.id === data.workspace.id ? data.workspace : w))
      );
      setRenamingWorkspace(null);
      toast.success("Workspace renamed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to rename workspace");
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingWorkspace) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`${SERVER_URL}/api/workspaces/${deletingWorkspace.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to delete workspace");

      setWorkspaces((prev) => prev.filter((w) => w.id !== deletingWorkspace.id));
      setDeletingWorkspace(null);
      toast.success("Workspace deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete workspace");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDisconnectRepo = async () => {
    if (!deletingWorkspace) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`${SERVER_URL}/api/github/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: "", workspaceId: deletingWorkspace.id }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to disconnect repository");
      
      const data = await res.json();
      setWorkspaces((prev) =>
        prev.map((w) => (w.id === data.workspace.id ? data.workspace : w))
      );
      setDeletingWorkspace(data.workspace);
      toast.success("Repository disconnected successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to disconnect repository");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDisconnectAndDeleteRepo = async () => {
    if (!deletingWorkspace) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`${SERVER_URL}/api/github/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: deletingWorkspace.id }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete repository from GitHub");

      const data = await res.json();
      setWorkspaces((prev) =>
        prev.map((w) => (w.id === data.workspace.id ? data.workspace : w))
      );
      setDeletingWorkspace(data.workspace);
      toast.success("Repository deleted from GitHub and unlinked");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete repository from GitHub");
    } finally {
      setIsDeleting(false);
    }
  };

  const generateNames = () => {
    const names = Array.from({ length: 3 }, () => 
      uniqueNamesGenerator({
        dictionaries: [adjectives, animals],
        length: 2,
        separator: ' ',
        style: 'capital'
      })
    );
    setSuggestedNames(names);
  };

  const workspaceThumbnails = useMemo(() => {
    const thumbnails = new Map<string, string>();
    workspaces.forEach((workspace: Workspace) => {
      thumbnails.set(workspace.id, generateGradientThumbnail());
    });
    return thumbnails;
  }, [workspaces]);

  const loadWorkspaces = async (cursor?: string | null) => {
    try {
      if (!cursor) {
        setLoading(true);
      } else {
        setIsFetchingMore(true);
      }
      
      setError(null);
      const url = new URL(`${SERVER_URL}/api/workspaces`, window.location.origin);
      url.searchParams.set("limit", "12");
      if (cursor) url.searchParams.set("cursor", cursor);
      
      const res = await fetch(url.toString(), {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to load workspaces");
      }
      const data = await res.json();
      
      if (cursor) {
        setWorkspaces((prev) => {
          const newWorkspaces = data.workspaces ?? [];
          // Filter out any workspaces that might already be in the list
          const existingIds = new Set(prev.map(w => w.id));
          const filteredNew = newWorkspaces.filter((w: Workspace) => !existingIds.has(w.id));
          return [...prev, ...filteredNew];
        });
      } else {
        setWorkspaces(data.workspaces ?? []);
      }
      
      setNextCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch (err) {
      console.error(err);
      toast.error("Unable to load workspaces right now.");
      setError(null);
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  };

  const createWorkspace = async () => {
    try {
      setCreating(true);
      setError(null);
      setCreateError(null);

      // Fetch initial files for the selected app type
      let initialFiles = {};
      try {
        const starterRes = await fetch(`/api/starters?type=${appType}`);
        if (starterRes.ok) {
           const starterData = await starterRes.json();
           initialFiles = starterData.files || {};
        }
      } catch (e) {
        console.error("Failed to fetch starter files", e);
      }

      const fallbackName = `Workspace ${new Date().toLocaleString()}`;
      const name = newWorkspaceName.trim() || fallbackName;
      const res = await fetch(`${SERVER_URL}/api/workspaces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            name, 
            app_type: appType,
            files: initialFiles 
        }),
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to create workspace");
      }
      const data = await res.json();
      setWorkspaces((prev: Workspace[]) => [
        data.workspace as Workspace,
        ...prev,
      ]);
      setCreateDialogOpen(false);
      setNewWorkspaceName("");
      setStep(0);
      toast.success("Workspace created");
      router.push(`/workspaces/${data.workspace.id}`);
    } catch (err) {
      console.error(err);
      setCreateError("Unable to create workspace.");
    } finally {
      setCreating(false);
    }
  };

  // Import GitHub state
  const [importingFromGithub, setImportingFromGithub] = useState(false);
  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  const [isLoadingGithubRepos, setIsLoadingGithubRepos] = useState(false);
  const [isGithubConnected, setIsGithubConnected] = useState(true);
  const [selectedRepo, setSelectedRepo] = useState<any | null>(null);
  const [importWorkspaceName, setImportWorkspaceName] = useState("");
  const [importProgress, setImportProgress] = useState(0);

  const fetchGithubRepos = async () => {
    try {
      setIsLoadingGithubRepos(true);
      const res = await fetch(`${SERVER_URL}/api/github/repos`, {
        credentials: "include",
      });
      const data = await res.json();
      
      if (data.error === "GitHub not connected") {
        setIsGithubConnected(false);
        return;
      }

      if (data.repos) {
        setGithubRepos(data.repos);
        setIsGithubConnected(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingGithubRepos(false);
    }
  };

  const handleConnectGithub = async () => {
    await authClient.signIn.social({
      provider: "github",
      callbackURL: window.location.href,
    });
  };

  const detectAppType = (files: Record<string, { content: string }>): AppType | null => {
    const filePaths = Object.keys(files);
    let packageJson: any = null;
    
    try {
      if (files["package.json"]) {
        packageJson = JSON.parse(files["package.json"].content);
      }
    } catch (e) {
      console.error("Failed to parse package.json", e);
    }

    // Helper to check if any file has a certain name (ignoring path)
    const hasFile = (name: string) => filePaths.some(p => p === name || p.endsWith("/" + name));
    const hasConfigStartingWith = (prefix: string) => filePaths.some(p => {
        const name = p.split("/").pop() || "";
        return name.startsWith(prefix);
    });

    // 1. Next.js
    if (
      hasConfigStartingWith("next.config") || 
      packageJson?.dependencies?.next || 
      packageJson?.devDependencies?.next
    ) {
      return AppType.NEXT_APP;
    }

    // 2. Expo / React Native
    if (
      hasFile("app.json") || 
      packageJson?.dependencies?.expo || 
      packageJson?.devDependencies?.expo
    ) {
      return AppType.EXPO_APP;
    }

    // 3. Express
    if (
      packageJson?.dependencies?.express || 
      packageJson?.devDependencies?.express
    ) {
      return AppType.EXPRESS_APP;
    }

    // 4. Vite / React (Fallback check)
    if (
      hasConfigStartingWith("vite.config") || 
      hasFile("webpack.config.js") || 
      hasFile("rollup.config.js") ||
      packageJson?.dependencies?.react || 
      packageJson?.devDependencies?.react ||
      packageJson?.dependencies?.vite ||
      packageJson?.devDependencies?.vite ||
      packageJson?.dependencies?.["react-scripts"]
    ) {
      return AppType.VITE_APP;
    }

    return null;
  };

  const handleImportRepo = async (repo: any) => {
    try {
      setCreating(true);
      setCreateError(null);
      setImportProgress(10);
      
      const [owner, name] = repo.full_name.split("/");
      setImportProgress(20);
      
      // We fetch files from our own API which handles the GitHub logic
      const res = await fetch(`${SERVER_URL}/api/github/files?owner=${owner}&repo=${name}`, {
        credentials: "include",
      });
      setImportProgress(40);
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      console.log(`[GitHub Import] Received files:`, Object.keys(data.files));
      console.log(`[GitHub Import] Full data:`, data);

      // Detect project type automatically from files
      const detectedType = detectAppType(data.files);
      if (!detectedType) {
        throw new Error(
          "Unsupported project type. Vibe currently supports Next.js, Vite-React, Express, and Expo. No supported framework was detected in this repository."
        );
      }
      
      setImportProgress(70);

      // Create workplace from files with detected type
      const createRes = await fetch(`${SERVER_URL}/api/workspaces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: importWorkspaceName.trim() || data.name || repo.name,
          app_type: detectedType,
          files: data.files,
        }),
        credentials: "include",
      });

      if (!createRes.ok) throw new Error("Failed to create workspace");
      const workspaceData = await createRes.json();
      const newWorkspace = workspaceData.workspace;
      
      setImportProgress(85);

      // Link it to the repo
      await fetch(`${SERVER_URL}/api/github/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: repo.full_name, workspaceId: newWorkspace.id }),
        credentials: "include",
      });

      setImportProgress(100);

      setWorkspaces((prev: Workspace[]) => [newWorkspace, ...prev]);
      setCreateDialogOpen(false);
      toast.success("Repository imported");
      router.push(`/workspaces/${newWorkspace.id}`);
    } catch (err: any) {
      console.error(err);
      setCreateError(err.message || "Failed to import repository");
    } finally {
      setCreating(false);
      setImportProgress(0);
    }
  };

  useEffect(() => {
    loadWorkspaces();
    generateNames();
    fetchCredits();
  }, []);

  useEffect(() => {
    if (!hasMore || loading || isFetchingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadWorkspaces(nextCursor);
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    const target = document.getElementById("infinite-scroll-trigger");
    if (target) observer.observe(target);

    return () => observer.disconnect();
  }, [hasMore, loading, isFetchingMore, nextCursor]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground w-full">
      {/* Top chrome */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 sm:px-10 lg:px-16 bg-background/80 backdrop-blur-md border-b border-border/10">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Logo className="text-foreground" />
          </Link>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="hidden text-[11px] sm:inline">
            {credits !== null ? `${(credits / 1000).toFixed(1)}k credits remaining` : "Limited credits"}
          </span>
          <UserMenu />
          <Dialog
            open={createDialogOpen}
            onOpenChange={(open) => {
              setCreateDialogOpen(open);
              if (open) {
                generateNames();
                setImportingFromGithub(false);
                setSelectedRepo(null);
                setImportWorkspaceName("");
              } else {
                setStep(0);
                setNewWorkspaceName("");
                setCreateError(null);
                setImportWorkspaceName("");
                setSelectedRepo(null);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                size="sm"
                disabled={creating}
                className="h-8 rounded-full bg-primary px-4 text-[11px] font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 disabled:opacity-60"
              >
                New Workspace
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background border-border sm:max-w-md overflow-hidden max-h-[90vh] flex flex-col p-0">
              <div className="p-6 pb-2">
                <DialogHeader>
                  <DialogTitle className="text-foreground">
                    {importingFromGithub 
                        ? "Import Repository" 
                        : (step === 0 ? "Create workspace" : "Choose your stack")}
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    {importingFromGithub
                        ? "Select a GitHub repository to import."
                        : (step === 0
                            ? "Give your workspace a name. You can change it later."
                            : "Select the framework you want to use for this project.")}
                  </DialogDescription>
                </DialogHeader>

                {!importingFromGithub && (
                    <div className="mt-4 h-1 w-full bg-muted overflow-hidden rounded-full">
                        <motion.div
                            className="h-full bg-primary transition-all duration-300"
                            initial={{ width: "0%" }}
                            animate={{ width: step === 0 ? "50%" : "100%" }}
                        />
                    </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-2 pb-6 min-h-[300px]">
                <AnimatePresence mode="wait">
                  {importingFromGithub ? (
                    <motion.div
                      key="import"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                        <div className="space-y-4">
                             <div className="space-y-3">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
                                    Workspace Name (Optional)
                                </label>
                                <Input
                                    value={importWorkspaceName}
                                    onChange={(e) => setImportWorkspaceName(e.target.value)}
                                    placeholder="Enter custom name or leave blank for repo name"
                                    className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/50 h-11 rounded-xl focus:ring-primary/20"
                                />

                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {suggestedNames.slice(0, 3).map((name, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setImportWorkspaceName(name)}
                                            className={cn(
                                                "px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all duration-200",
                                                importWorkspaceName === name 
                                                    ? "bg-primary/10 border-primary text-primary" 
                                                    : "bg-muted/30 border-border/50 text-muted-foreground hover:border-primary/30 hover:bg-muted/50"
                                            )}
                                        >
                                            {name}
                                        </button>
                                    ))}
                                    <button
                                        onClick={generateNames}
                                        className="p-1 text-primary hover:bg-primary/5 rounded-full transition-colors"
                                        title="Refresh suggestions"
                                    >
                                        <RefreshCw className="size-3" />
                                    </button>
                                </div>
                             </div>

                             {creating && importProgress > 0 && (
                                 <div className="space-y-2">
                                     <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-primary">
                                         <span>Importing files...</span>
                                         <span>{importProgress}%</span>
                                     </div>
                                     <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                         <motion.div 
                                             className="h-full bg-primary"
                                             initial={{ width: 0 }}
                                             animate={{ width: `${importProgress}%` }}
                                         />
                                     </div>
                                 </div>
                             )}

                            {!creating && (
                              <>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground pt-2">
                                    Your Repositories
                                </h3>
                                <div className="space-y-2">
                                    {isLoadingGithubRepos ? (
                                        <div className="py-20 text-center">
                                            <RefreshCw className="size-6 animate-spin mx-auto text-primary/40" />
                                        </div>
                                    ) : !isGithubConnected ? (
                                        <div className="py-16 text-center border border-dashed border-border rounded-2xl bg-muted/5 px-6">
                                            <div className="flex justify-center mb-4">
                                                <div className="p-3 rounded-full bg-primary/10 ring-8 ring-primary/5">
                                                    <Github className="size-8 text-primary" />
                                                </div>
                                            </div>
                                            <h3 className="text-sm font-bold text-foreground mb-2">GitHub Not Connected</h3>
                                            <p className="text-[11px] text-muted-foreground mb-6 leading-relaxed">
                                                You need to authorize Vibe to access your repositories before you can import them.
                                            </p>
                                            <Button 
                                                className="bg-primary text-primary-foreground font-bold w-full rounded-xl h-11 shadow-lg shadow-primary/20"
                                                onClick={handleConnectGithub}
                                            >
                                                Authorize GitHub
                                            </Button>
                                            <p className="text-[10px] text-muted-foreground/60 mt-4 italic">
                                                You'll be redirected to GitHub to complete the process.
                                            </p>
                                        </div>
                                    ) : githubRepos.length > 0 ? (
                                        githubRepos.map(repo => (
                                            <button
                                                key={repo.id}
                                                disabled={creating}
                                                onClick={() => handleImportRepo(repo)}
                                                className="w-full p-3.5 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/50 hover:border-primary/30 transition-all flex items-center justify-between group disabled:opacity-50"
                                            >
                                                <div className="flex items-center space-x-3 text-foreground">
                                                    <Github className="size-4 text-muted-foreground" />
                                                    <div className="flex flex-col items-start min-w-0">
                                                        <span className="text-sm font-semibold truncate max-w-[200px]">
                                                            {repo.name}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                                                            {repo.full_name}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-[10px] font-bold uppercase text-primary">Import</span>
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="py-20 text-center border border-dashed border-border rounded-2xl bg-muted/5">
                                            <p className="text-sm text-muted-foreground">No repositories found</p>
                                            <Button variant="link" className="mt-2 text-primary text-xs" onClick={fetchGithubRepos}>
                                                Try again
                                            </Button>
                                        </div>
                                    )}
                                </div>
                              </>
                            )}
                            
                            {createError && (
                              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 mt-4 animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-start gap-3">
                                  <div className="mt-0.5">
                                    <div className="size-4 rounded-full bg-destructive flex items-center justify-center text-[10px] font-bold text-white">!</div>
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-[11px] font-bold text-destructive uppercase tracking-wider mb-1">Import Error</p>
                                    <p className="text-xs text-destructive/90 leading-relaxed font-medium">
                                        {createError}
                                    </p>
                                    <Button 
                                      variant="link" 
                                      className="h-auto p-0 text-[10px] font-bold text-destructive hover:text-destructive/80 mt-2 h-auto block"
                                      onClick={() => setCreateError(null)}
                                    >
                                      Dismiss
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                        </div>
                    </motion.div>
                  ) : step === 0 ? (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6 pt-2"
                    >
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                            Workspace name
                          </label>
                          <Input
                            autoFocus
                            value={newWorkspaceName}
                            onChange={(e) => {
                              setNewWorkspaceName(e.target.value);
                              if (createError) setCreateError(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && newWorkspaceName.trim()) {
                                setStep(1);
                              }
                            }}
                            placeholder="e.g. My Awesome Project"
                            className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/50 h-12 rounded-xl focus:ring-primary/20"
                          />
                        </div>

                        <div className="space-y-3">
                        <div className="flex items-center justify-between">
                             <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
                               <Sparkles className="size-3 text-primary" />
                               Magic Suggestions
                             </div>
                             <button
                               onClick={generateNames}
                               className="text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5"
                             >
                               <RefreshCw className="size-3" />
                               Refresh
                             </button>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {suggestedNames.map((name, i) => (
                              <button
                                key={i}
                                onClick={() => setNewWorkspaceName(name)}
                                className={cn(
                                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200",
                                  newWorkspaceName === name 
                                    ? "bg-primary/10 border-primary text-primary" 
                                    : "bg-muted/30 border-border/50 text-muted-foreground hover:border-primary/30 hover:bg-muted/50"
                                )}
                              >
                                {name}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-border/40" />
                                </div>
                                <div className="relative flex justify-center text-[10px] uppercase">
                                    <span className="bg-background px-4 text-muted-foreground font-bold tracking-widest">Or</span>
                                </div>
                            </div>
                            
                            <Button 
                                variant="outline"
                                className="w-full mt-4 h-12 rounded-xl border-border/60 hover:bg-muted/50 hover:border-primary/30 transition-all font-semibold group"
                                onClick={() => {
                                    setImportingFromGithub(true);
                                    fetchGithubRepos();
                                }}
                            >
                                <Github className="size-4 mr-2.5 transition-transform group-hover:scale-110" />
                                Import from GitHub
                            </Button>
                        </div>

                        {createError ? (
                          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 mt-2">
                            <p className="text-xs text-destructive font-medium">
                                {createError}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4 pt-2"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        {WORKSPACE_REGISTRY.map((template) => (
                          <button
                            key={template.type}
                            type="button"
                            onClick={() => setAppType(template.type)}
                            className={cn(
                              "group flex flex-col items-center justify-center gap-3 rounded-2xl border p-6 transition-all",
                              appType === template.type
                                ? "border-primary bg-accent ring-1 ring-primary/20"
                                : "border-border bg-card hover:bg-accent/50 hover:border-primary/20"
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-10 w-10 items-center justify-center transition-transform group-hover:scale-110",
                                template.logoStyling
                              )}
                            >
                              <img
                                src={template.logo}
                                alt={template.label}
                                className="h-full w-full"
                              />
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-medium text-foreground">
                                {template.label}
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-0.5 capitalize">
                                {template.category}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="p-6 pt-2 border-t border-border/5">
                <DialogFooter>
                    <div className="flex w-full items-center justify-between">
                    {step === 1 || importingFromGithub ? (
                        <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                            if (importingFromGithub) setImportingFromGithub(false);
                            else setStep(0);
                        }}
                        className="text-muted-foreground hover:text-foreground px-2"
                        >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                        </Button>
                    ) : (
                        <div />
                    )}
                    <div className="flex gap-3">
                        <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setCreateDialogOpen(false)}
                        className="text-muted-foreground hover:text-foreground px-4"
                        >
                        Cancel
                        </Button>
                        {!importingFromGithub && (
                            <>
                                {step === 0 ? (
                                <Button
                                    type="button"
                                    disabled={!newWorkspaceName.trim()}
                                    onClick={() => setStep(1)}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 font-semibold"
                                >
                                    Next
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                                ) : (
                                <Button
                                    type="button"
                                    disabled={creating}
                                    onClick={createWorkspace}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 font-semibold shadow-lg"
                                >
                                    {creating ? (
                                        <>
                                            <RefreshCw className="size-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : "Create Workspace"}
                                </Button>
                                )}
                            </>
                        )}
                    </div>
                    </div>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Content */}
      <main className="flex flex-1 items-start justify-center px-4 pb-10 pt-10 sm:px-8 lg:px-20">
        <div className="w-full max-w-5xl">
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-foreground">
              Your Workspaces
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Manage your workspaces and continue where you left off.
            </p>
            {error ? (
              <p className="mt-2 text-xs text-red-300">{error}</p>
            ) : null}
          </div>

          {loading ? (
            <WorkspacesSkeleton />
          ) : (
            <div className="w-full">
              {workspaces.length === 0 ? (
                <div className="text-center py-24 bg-muted/20 rounded-2xl border border-dashed border-border">
                  <div className="inline-flex size-14 items-center justify-center mb-4">
                    <LogoIcon size={32} className="opacity-20 grayscale" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">No workspaces yet</h3>
                  <p className="text-xs text-muted-foreground mt-1 px-10">
                    Get started by creating your first workspace.
                  </p>
                </div>
              ) : (
                <>
                  <Table className="border-collapse">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-t border-b border-border/10">
                        <TableHead className="w-[45%] pl-4 text-[11px] uppercase tracking-wider font-bold text-muted-foreground/60">Project</TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground/60">Stack</TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground/60">Last Updated</TableHead>
                        <TableHead className="text-right pr-4"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...workspaces]
                        .map((workspace: Workspace, idx: number) => {
                          const template = getTemplateByType(workspace.app_type);
                          return (
                            <TableRow 
                              key={`${workspace.id}-${idx}`} 
                              className="group cursor-pointer h-16 transition-colors hover:bg-muted/30 border-b border-border/10"
                              onClick={() => router.push(`/workspaces/${workspace.id}`)}
                            >
                              <TableCell className="pl-4 font-medium">
                                <div className="flex items-center gap-3">
                                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-transform group-hover:scale-105">
                                    <img
                                      src={template?.logo || "/logos/react.svg"}
                                      alt={template?.label || "Workspace"}
                                      className={cn("size-5", template?.logoStyling)}
                                    />
                                  </div>
                                  <span className="truncate max-w-[200px] md:max-w-xs">{workspace.name}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="text-[9px] uppercase tracking-wider font-extrabold bg-primary/5 text-primary border-none px-2 pr-2.5">
                                  {template?.label || "Vite"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(workspace.updatedAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </TableCell>
                              <TableCell className="text-right pr-4">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/10 hover:text-primary"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(`/workspaces/${workspace.id}`);
                                    }}
                                  >
                                    <ChevronRight className="size-4" />
                                  </Button>

                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-muted"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <MoreVertical className="size-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-40 rounded-xl border-border/50 bg-background/95 backdrop-blur-sm">
                                      <DropdownMenuItem
                                        className="flex items-center gap-2 text-xs font-semibold cursor-pointer"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setRenamingWorkspace(workspace);
                                          setRenameInput(workspace.name);
                                        }}
                                      >
                                        <Edit2 className="size-3.5" />
                                        Rename
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="flex items-center gap-2 text-xs font-semibold text-destructive focus:text-destructive cursor-pointer"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeletingWorkspace(workspace);
                                        }}
                                      >
                                        <Trash2 className="size-3.5" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                  {hasMore && (
                    <div id="infinite-scroll-trigger" className="w-full h-20 flex items-center justify-center">
                      {isFetchingMore && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <RefreshCw className="size-3 animate-spin" />
                          Loading more workspaces...
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Rename Dialog */}
      <Dialog
        open={!!renamingWorkspace}
        onOpenChange={(open) => !open && setRenamingWorkspace(null)}
      >
        <DialogContent className="sm:max-w-md rounded-2xl border-border bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Rename Workspace</DialogTitle>
            <DialogDescription>
              Enter a new name for your workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              placeholder="Workspace name"
              autoFocus
              className="h-11 rounded-xl bg-muted/30 border-border/50 focus:ring-primary/20"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setRenamingWorkspace(null)}
              className="rounded-xl font-bold text-xs uppercase tracking-wider"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={isRenaming || !renameInput.trim()}
              className="rounded-xl font-bold text-xs uppercase tracking-wider bg-primary shadow-lg shadow-primary/20"
            >
              {isRenaming ? "Renaming..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingWorkspace}
        onOpenChange={(open) => !open && setDeletingWorkspace(null)}
      >
        <AlertDialogContent className="rounded-2xl border-border bg-background/95 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {deletingWorkspace?.githubRepo ? (
                <div className="space-y-4">
                  <p>
                    The workspace <span className="font-bold text-foreground">"{deletingWorkspace?.name}"</span> is currently connected to a GitHub repository: <span className="font-mono text-primary">{deletingWorkspace?.githubRepo}</span>.
                  </p>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3 items-start">
                    <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed text-amber-200/80">
                      You must disconnect or delete the GitHub repository association before you can permanently delete this workspace from Vibe.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  This will permanently delete the workspace{" "}
                  <span className="font-bold text-foreground">
                    "{deletingWorkspace?.name}"
                  </span>{" "}
                  and all of its associated data including files and messages. This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={cn(deletingWorkspace?.githubRepo && "flex-col sm:flex-row gap-2")}>
            <AlertDialogCancel className="rounded-xl font-bold text-xs uppercase tracking-wider border-border/50">
              Cancel
            </AlertDialogCancel>
            
            {deletingWorkspace?.githubRepo ? (
              <>
                <Button
                  onClick={handleDisconnectRepo}
                  disabled={isDeleting}
                  variant="outline"
                  className="rounded-xl font-bold text-xs uppercase tracking-wider border-border/60 hover:bg-muted/50"
                >
                  {isDeleting ? <RefreshCw className="size-3 mr-2 animate-spin" /> : null}
                  Disconnect Repo
                </Button>
                <Button
                  onClick={handleDisconnectAndDeleteRepo}
                  disabled={isDeleting}
                  variant="destructive"
                  className="rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-destructive/20"
                >
                  {isDeleting ? <RefreshCw className="size-3 mr-2 animate-spin" /> : null}
                  Disconnect & Delete Repo
                </Button>
              </>
            ) : (
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-xl font-bold text-xs uppercase tracking-wider bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20"
              >
                {isDeleting ? "Deleting..." : "Delete Permanently"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
