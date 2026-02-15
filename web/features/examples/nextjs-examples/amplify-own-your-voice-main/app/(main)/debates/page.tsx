"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { IconDotsVertical, IconPlus, IconLoader2, IconInfoCircle, IconReport } from "@tabler/icons-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { formatDistanceToNow } from "date-fns"
import { DeleteAlertDialog } from "@/components/delete-alert-dialog"
import { cn } from "@/lib/utils"
import { toast } from "sonner"


interface Debate {
  id: string
  subject: string
  content: string | null
  status: string
  createdAt: string
  debateSessions: { id: string }[]
  installedFromId: string | null
  installedFrom?: {
    user: {
      name: string
      image: string | null
    }
  }
}

export default function DebatesPage() {
  const router = useRouter()
  const { data: authSession } = authClient.useSession()
  const [debates, setDebates] = useState<Debate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newDebate, setNewDebate] = useState({ subject: "", content: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [debateToDelete, setDebateToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchDebates = async () => {
    try {
      const response = await fetch("/api/debates")
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      setDebates(data)
    } catch (error) {
      console.error("Error fetching debates:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (authSession) {
      fetchDebates()
    }
  }, [authSession])

  const handleCreateDebate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/debates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newDebate }),
      })
      if (!response.ok) throw new Error("Failed to create")
      const debate = await response.json()
      setIsCreateModalOpen(false)
      setNewDebate({ subject: "", content: "" })
      
      // Auto-start a session
      await handleStartSession(debate.id)
    } catch (error) {
      console.error("Error creating debate:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStartSession = async (debateId: string) => {
    try {
      const response = await fetch(`/api/debates/${debateId}/sessions`, {
        method: "POST",
      })
      if (!response.ok) throw new Error("Failed to start session")
      const session = await response.json()
      router.push(`/debates/sessions/${session.id}/run`)
    } catch (error) {
      console.error("Error starting session:", error)
    }
  }

  const handleDeleteDebate = async (id: string) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/debates/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete")
      setDebates(debates.filter(d => d.id !== id))
      setDebateToDelete(null)
      toast.success("Debate deleted")
    } catch (error) {
      console.error("Error deleting debate:", error)
      toast.error("Failed to delete debate")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAddToMarketplace = async (id: string) => {
    try {
      const response = await fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "debate", id }),
      })
      if (!response.ok) throw new Error("Failed to add to marketplace")
      toast.success("Added to Marketplace!")
    } catch (error) {
      console.error("Error adding to marketplace:", error)
      toast.error("Failed to add to marketplace")
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-8 pt-6">
      <div className="flex items-center justify-between text-white">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Debates</h1>
          <p className="text-muted-foreground">
            Practice formal intellectual activities with AI judges and opponents.
          </p>
        </div>

        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button variant="default" className="font-medium">
              <IconPlus className="mr-2 size-4" />
              Create Debate
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col bg-zinc-950 border-zinc-800 text-white p-0 overflow-hidden">
            <form onSubmit={handleCreateDebate} className="flex flex-col h-full">
              <DialogHeader className="p-6 pb-2">
                <DialogTitle>Start New Debate</DialogTitle>
                <DialogDescription className="text-zinc-400">
                  Define the motion. AI Judge and Opponents will be selected automatically.
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8">
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="subject" className="text-zinc-300">Debate Motion (Subject)</Label>
                        <Input
                            id="subject"
                            placeholder="This house believes that..."
                            className="bg-zinc-900 border-zinc-800 focus:ring-primary/50"
                            value={newDebate.subject}
                            onChange={(e) => setNewDebate({ ...newDebate, subject: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="content" className="text-zinc-300">Relative Content / Extra Info</Label>
                    <IconInfoCircle className="size-3.5 text-zinc-500" />
                  </div>
                  <Textarea
                    id="content"
                    placeholder="Provide additional context, facts, or rules for the AI to consider..."
                    className="min-h-[120px] bg-zinc-900 border-zinc-800 focus:ring-primary/50 resize-none"
                    value={newDebate.content}
                    onChange={(e) => setNewDebate({ ...newDebate, content: e.target.value })}
                  />
                  <p className="text-[11px] text-zinc-500 italic">
                    This content will be used by the AI Judge and Opponents to enrich the debate.
                  </p>
                </div>
              </div>
              <DialogFooter className="p-6 pt-2 border-t border-zinc-900">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !newDebate.subject}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <IconLoader2 className="mr-2 size-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create & Start Debate"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden border-y border-muted/30">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-muted/30">
              <TableHead className="text-zinc-400 font-medium w-[300px]">Motion / Subject</TableHead>
              <TableHead className="text-zinc-400 font-medium">Owner</TableHead>
              <TableHead className="text-zinc-400 font-medium">Status</TableHead>
              <TableHead className="text-zinc-400 font-medium text-right pr-6">Created</TableHead>
              <TableHead className="text-right text-zinc-400 font-medium pr-6 w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i} className="animate-pulse border-muted/30">
                  <TableCell><div className="h-5 w-72 bg-muted/30 rounded" /></TableCell>
                  <TableCell><div className="h-5 w-20 bg-muted/30 rounded" /></TableCell>
                  <TableCell className="text-right pr-6"><div className="h-5 w-24 bg-muted/30 rounded ml-auto" /></TableCell>
                  <TableCell className="text-right pr-6"><div className="h-8 w-8 bg-muted/30 rounded ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : debates.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="h-48 text-center text-zinc-500">
                  <div className="flex flex-col items-center gap-3">
                    <IconReport className="size-10 text-zinc-800" />
                    <p>No debates found. Define your first motion to get started.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              debates.map((debate) => (
                <TableRow key={debate.id} className="hover:bg-muted/30 border-muted/30 group">
                  <TableCell className="py-5">
                    <Link href={`/debates/${debate.id}`} className="flex flex-col gap-1">
                      <span className="font-semibold text-zinc-100 group-hover:text-primary transition-colors text-lg">
                        {debate.subject}
                      </span>
                      {debate.content && (
                        <p className="text-xs text-zinc-500 line-clamp-1 max-w-md">
                          {debate.content}
                        </p>
                      )}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {debate.installedFrom ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="size-5 border border-zinc-800">
                          <AvatarImage src={debate.installedFrom.user.image || ""} />
                          <AvatarFallback className="text-[8px] bg-zinc-900">{debate.installedFrom.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-zinc-300">{debate.installedFrom.user.name}</span>
                      </div>
                    ) : (
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px]">Me</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={debate.status === "Completed" ? "default" : "secondary"} 
                      className={debate.status === "Completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-900 text-zinc-400 border-zinc-800"}
                    >
                      {debate.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-500 text-right pr-6">
                    {formatDistanceToNow(new Date(debate.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-white hover:bg-zinc-900">
                            <IconDotsVertical className="size-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-zinc-950 border-zinc-800 text-zinc-300">
                          <Link href={`/debates/${debate.id}`}>
                            <DropdownMenuItem className="cursor-pointer hover:text-white">
                              View Details
                            </DropdownMenuItem>
                          </Link>
                          {!debate.installedFromId && (
                            <DropdownMenuItem 
                              className="cursor-pointer hover:text-white"
                              onClick={() => handleAddToMarketplace(debate.id)}
                            >
                              Add to Marketplace
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            className="cursor-pointer hover:text-white"
                            onClick={() => handleStartSession(debate.id)}
                          >
                            New Session
                          </DropdownMenuItem>
                          {debate.debateSessions?.[0] && (
                             <DropdownMenuItem 
                              className="cursor-pointer hover:text-white"
                              onClick={() => router.push(`/debates/sessions/${debate.debateSessions[0].id}/run`)}
                            >
                              Restart Last Session
                            </DropdownMenuItem>
                          )}


                          <DropdownMenuItem 
                            className="text-destructive cursor-pointer focus:text-destructive focus:bg-red-500/10"
                            onClick={() => setDebateToDelete(debate.id)}
                          >
                            Delete Debate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <DeleteAlertDialog 
        open={!!debateToDelete}
        onOpenChange={(open) => !open && setDebateToDelete(null)}
        onConfirm={() => {
          if (debateToDelete) handleDeleteDebate(debateToDelete)
        }}
        isDeleting={isDeleting}
        title="Delete Debate?"
        description="Are you sure you want to delete this debate configuration? This will NOT delete past completed sessions."
      />
    </div>
  )
}


