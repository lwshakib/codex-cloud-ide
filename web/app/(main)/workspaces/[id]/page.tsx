"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import LeftSideView from "@/components/workspaces/LeftSideView";
import RightSideView from "@/components/workspaces/RightSideView";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";
import { ExpoQRDialog } from "@/components/workspaces/ExpoQRDialog";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";

export default function WorkspacePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const workspaceId = params.id as string;
  const { currentWorkspace, setCurrentWorkspace, setMessages, isSidebarOpen } =
    useWorkspaceStore();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const fetchWorkspace = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/api/workspaces/${workspaceId}`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch workspace");
        }
        const data = await response.json();
        if (data.workspace) {
          setCurrentWorkspace(data.workspace);
          if (data.workspace.messages) {
            setMessages(data.workspace.messages);
          }
        }
      } catch (err: any) {
        console.error("Failed to fetch workspace:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspace();
  }, [workspaceId, setCurrentWorkspace, setMessages]);

  if (!mounted || loading) return null;

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-foreground bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen relative flex text-foreground overflow-hidden">
        {/* Left Side: Chat & File Tree */}
        <div 
          className={`shrink-0 transition-all duration-300 ease-in-out ${
            isSidebarOpen ? "w-full md:w-112.5 translate-x-0" : "w-0 -translate-x-full overflow-hidden"
          }`}
        >
          <div className="h-full w-full overflow-hidden">
            <LeftSideView />
          </div>
        </div>

        {/* Right Side: Preview/Editor */}
        <div className="flex-1 min-w-0 transition-all duration-300">
          <RightSideView />
        </div>
        <ExpoQRDialog />
      </div>
  );
}
