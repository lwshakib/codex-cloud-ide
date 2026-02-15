import { create } from "zustand";
import { debounce } from "lodash";

export enum AppType {
  VITE_APP = "VITE_APP",
  NEXT_APP = "NEXT_APP",
  EXPRESS_APP = "EXPRESS_APP",
  EXPO_APP = "EXPO_APP",
}

// Helper for API calls
const saveToDb = async (id: string, files: any) => {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000"}/api/workspaces/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ files }),
    });
  } catch (error) {
    console.error("Failed to update files:", error);
  }
};

const debouncedSave = debounce(saveToDb, 2000);

export type Workspace = {
  id: string;
  name: string;
  userId: string;
  app_type: AppType;
  files: any;
  detectedPaths?: string[];
  githubRepo?: string | null;
  updatedAt: string;
  createdAt: string;
  messages?: any[];
};

export type TabType = "code-editor" | "web-preview" | "terminal";
export type StreamingStatus = "idle" | "streaming" | "finished";

interface WorkspaceStore {
  workspaces: Workspace[];
  setWorkspaces: (
    workspaces: Workspace[] | ((workspaces: Workspace[]) => Workspace[])
  ) => void;

  // State
  messages: any[];
  setMessages: (messages: any[] | ((messages: any[]) => any[])) => void;
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  streamingStatus: StreamingStatus;
  setStreamingStatus: (status: StreamingStatus) => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  activeFile: string | null;
  setActiveFile: (path: string | null) => void;
  openFiles: string[];
  setOpenFiles: (files: string[]) => void;
  addOpenFile: (path: string) => void;
  closeFile: (path: string) => void;
  updateFiles: (files: any) => Promise<void>;
  modifiedFiles: Record<string, string>;
  markFileAsDirty: (path: string, originalContent: string) => void;
  saveFile: (path: string) => Promise<void>;
  discardChanges: (path: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  chatInput: string;
  setChatInput: (input: string) => void;
  selectedContexts: any[];
  addSelectedContext: (ctx: any) => void;
  removeSelectedContext: (id: string) => void;
  syncWithGithub: (changedFile?: any, customMessage?: string) => Promise<void>;
  isSyncing: boolean;
  setIsSyncing: (status: boolean) => void;
  credits: number | null;
  fetchCredits: () => Promise<void>;
  
  // Terminal Error State
  terminalError: { message: string; exitCode?: number } | null;
  setTerminalError: (error: { message: string; exitCode?: number } | null) => void;

  activePreviewRoute: string;
  setActivePreviewRoute: (route: string) => void;
  pendingPreviewRoute: string | null;
  setPendingPreviewRoute: (route: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  workspaces: [],
  setWorkspaces: (workspaces) =>
    set((state) => ({
      workspaces:
        typeof workspaces === "function"
          ? workspaces(state.workspaces)
          : workspaces,
    })),
  
  isSidebarOpen: true,
  setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

  // Implementation
  messages: [],
  setMessages: (messages) =>
    set((state) => ({
      messages:
        typeof messages === "function" ? messages(state.messages) : messages,
    })),
  currentWorkspace: null,
  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
  streamingStatus: "idle",
  setStreamingStatus: (status) => set({ streamingStatus: status }),
  activeTab: "code-editor",
  setActiveTab: (tab) => set({ activeTab: tab }),
  activeFile: null,
  setActiveFile: (path: string | null) => set({ activeFile: path }),
  openFiles: [],
  setOpenFiles: (files) => set({ openFiles: files }),
  addOpenFile: (path: string) =>
    set((state) => {
      if (state.openFiles.includes(path)) {
        return { activeFile: path };
      }
      const newOpenFiles = [...state.openFiles, path].slice(-5);
      return {
        openFiles: newOpenFiles,
        activeFile: path,
      };
    }),
  closeFile: (path: string) =>
    set((state) => {
      const newOpenFiles = state.openFiles.filter((f) => f !== path);
      let newActiveFile = state.activeFile;
      if (state.activeFile === path) {
        newActiveFile =
          newOpenFiles.length > 0
            ? newOpenFiles[newOpenFiles.length - 1]
            : null;
      }
      return {
        openFiles: newOpenFiles,
        activeFile: newActiveFile,
      };
    }),
  updateFiles: async (files: any) => {
    const { currentWorkspace, activeFile, modifiedFiles } = useWorkspaceStore.getState();
    if (!currentWorkspace) return;

    if (activeFile && files[activeFile]) {
      if (!modifiedFiles[activeFile]) {
        const originalContent = currentWorkspace.files[activeFile]?.content || "";
        set((state) => ({
          modifiedFiles: {
            ...state.modifiedFiles,
            [activeFile]: originalContent,
          },
        }));
      }
    }

    debouncedSave(currentWorkspace.id, files);

    set((state) => ({
      currentWorkspace: state.currentWorkspace
        ? { ...state.currentWorkspace, files }
        : null,
    }));
  },
  modifiedFiles: {},
  markFileAsDirty: (path, originalContent) => 
    set((state) => ({
      modifiedFiles: {
        ...state.modifiedFiles,
        [path]: originalContent
      }
    })),
  saveFile: async (path) => {
    const state = useWorkspaceStore.getState();
    const currentWorkspace = state.currentWorkspace;
    if (!currentWorkspace) return;

    await saveToDb(currentWorkspace.id, currentWorkspace.files);
    
    set((state) => {
      const newModifiedFiles = { ...state.modifiedFiles };
      delete newModifiedFiles[path];
      return { modifiedFiles: newModifiedFiles };
    });
  },
  discardChanges: (path) => {
    set((state) => {
      if (!state.currentWorkspace || !state.modifiedFiles[path]) return state;
      
      const originalContent = state.modifiedFiles[path];
      const newFiles = { ...state.currentWorkspace.files };
      newFiles[path] = { ...newFiles[path], content: originalContent };
      
      const newModifiedFiles = { ...state.modifiedFiles };
      delete newModifiedFiles[path];
      
      return {
        currentWorkspace: { ...state.currentWorkspace, files: newFiles },
        modifiedFiles: newModifiedFiles
      };
    });
  },
  chatInput: "",
  setChatInput: (input) => set({ chatInput: input }),
  selectedContexts: [],
  addSelectedContext: (ctx) =>
    set((state) => {
      const id = `${ctx.path}-${ctx.fromLine}-${ctx.toLine}`;
      if (state.selectedContexts.some((c) => c.id === id)) return state;
      return {
        selectedContexts: [...state.selectedContexts, { ...ctx, id }],
      };
    }),
  removeSelectedContext: (id) =>
    set((state) => ({
      selectedContexts: state.selectedContexts.filter((c) => c.id !== id),
    })),
  isSyncing: false,
  setIsSyncing: (status) => set({ isSyncing: status }),
  syncWithGithub: async (changedFile?: any, customMessage?: string) => {
    const { currentWorkspace, isSyncing, setIsSyncing } = useWorkspaceStore.getState();
    if (!currentWorkspace?.githubRepo || isSyncing) return;

    try {
      setIsSyncing(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000"}/api/workspaces/${currentWorkspace.id}/github/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
            commitMessage: customMessage || "",
            changedFile 
        }), 
      });
      
      if (!res.ok) {
        console.error("Auto-sync failed");
      }
    } catch (err) {
      console.error("GitHub Sync Error:", err);
    } finally {
      setIsSyncing(false);
    }
  },
  credits: null,
  fetchCredits: async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000"}/api/user/credits`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        set({ credits: data.credits });
      }
    } catch (err) {
      console.error("Failed to fetch credits:", err);
    }
  },
  terminalError: null,
  setTerminalError: (error) => set({ terminalError: error }),
  activePreviewRoute: "/",
  setActivePreviewRoute: (route: string) => set({ activePreviewRoute: route }),
  pendingPreviewRoute: null,
  setPendingPreviewRoute: (route: string | null) => set({ pendingPreviewRoute: route }),
}));
