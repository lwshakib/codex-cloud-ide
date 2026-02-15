"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { IconDotsVertical, IconPlus, IconRobot } from "@tabler/icons-react"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getCharacter } from "@/lib/characters"
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
import { DeleteAlertDialog } from "@/components/delete-alert-dialog"
import { toast } from "sonner"

interface CustomAgent {
  id: string
  name: string
  instruction: string
  characterId?: string
  createdAt: string
  installedFromId: string | null
  installedFrom?: {
    user: {
      name: string
      image: string | null
    }
  }
}

export default function CustomAgentsPage() {
  const router = useRouter()
  const [agents, setAgents] = useState<CustomAgent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch("/api/ai-personas")
        if (!response.ok) throw new Error("Failed to fetch")
        const data = await response.json()
        setAgents(data)
      } catch (error) {
        console.error("Error fetching custom agents:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAgents()
  }, [])

  const handleRunAgent = async (id: string) => {
    try {
      const response = await fetch(`/api/ai-personas/${id}/sessions`, {
        method: "POST",
      })
      if (!response.ok) throw new Error("Failed to start session")
      const session = await response.json()
      window.location.href = `/ai-personas/sessions/${session.id}/run`
    } catch (error) {
      console.error("Error starting agent session:", error)
    }
  }

  const handleDeleteAgent = async (id: string) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/ai-personas/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete")
      setAgents(agents.filter(a => a.id !== id))
      setAgentToDelete(null)
      toast.success("AI Persona deleted")
    } catch (error) {
      console.error("Error deleting agent:", error)
      toast.error("Failed to delete AI Persona")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAddToMarketplace = async (id: string) => {
    try {
      const response = await fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "ai-persona", id }),
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Personas</h1>
          <p className="text-muted-foreground mt-1">Manage your specialized AI personas and their custom instructions.</p>
        </div>
        <Link href="/ai-personas/create">
          <Button variant="default" className="font-medium">
            <IconPlus className="mr-2 size-4" />
            Create Persona
          </Button>
        </Link>
      </div>

      <div className="overflow-hidden border-y border-muted/30">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-muted/50">
              <TableHead className="text-muted-foreground font-medium w-[250px]">Persona Name</TableHead>
              <TableHead className="text-muted-foreground font-medium">Owner</TableHead>
              <TableHead className="text-muted-foreground font-medium">Character Avatar</TableHead>
              <TableHead className="text-muted-foreground font-medium">Instructions Preview</TableHead>
              <TableHead className="text-muted-foreground font-medium">Created</TableHead>
              <TableHead className="text-right text-muted-foreground font-medium pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                  Loading personas...
                </TableCell>
              </TableRow>
            ) : agents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                  No personas found. Create your first one above!
                </TableCell>
              </TableRow>
            ) : (
              agents.map((agent) => (
                <TableRow key={agent.id} className="hover:bg-muted/30 border-muted/30">
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden relative">
                         {agent.characterId ? (
                             <img 
                                src={getCharacter(agent.characterId)?.avatarUrl} 
                                className="w-full h-full object-cover" 
                                alt={agent.name} 
                             />
                         ) : (
                             <IconRobot className="size-4 text-primary" />
                         )}
                      </div>
                      <Link 
                        href={`/ai-personas/${agent.id}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {agent.name}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell>
                    {agent.installedFrom ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="size-5 border">
                          <AvatarImage src={agent.installedFrom.user.image || ""} />
                          <AvatarFallback className="text-[8px]">{agent.installedFrom.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{agent.installedFrom.user.name}</span>
                      </div>
                    ) : (
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px]">Me</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                      <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                          {agent.characterId ? getCharacter(agent.characterId)?.firstName : "Default"}
                      </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground line-clamp-1 max-w-md">
                      {agent.instruction}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDistanceToNow(new Date(agent.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <IconDotsVertical className="size-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => router.push(`/ai-personas/${agent.id}`)}>
                          View Details
                        </DropdownMenuItem>
                        {!agent.installedFromId && (
                          <DropdownMenuItem onClick={() => handleAddToMarketplace(agent.id)}>
                            Add to Marketplace
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleRunAgent(agent.id)}>Start New Session</DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive cursor-pointer"
                          onClick={() => setAgentToDelete(agent.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DeleteAlertDialog 
        open={!!agentToDelete}
        onOpenChange={(open) => !open && setAgentToDelete(null)}
        onConfirm={() => {
          if (agentToDelete) handleDeleteAgent(agentToDelete)
        }}
        isDeleting={isDeleting}
        title="Delete Persona?"
        description="Are you sure you want to delete this AI persona? This action cannot be undone."
      />
    </div>
  )
}
