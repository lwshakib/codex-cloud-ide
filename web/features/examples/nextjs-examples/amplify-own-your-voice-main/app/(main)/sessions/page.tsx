"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { IconDotsVertical, IconPlus, IconExternalLink } from "@tabler/icons-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
import { formatDistanceToNow } from "date-fns"
import { authClient } from "@/lib/auth-client"
import { DeleteAlertDialog } from "@/components/delete-alert-dialog"

interface Session {
  id: string
  status: string
  createdAt: string
  type: 'interview' | 'debate' | 'ai-persona'
  interview?: {
    jobTitle: string
  }
  debate?: {
    subject: string
  }
  customAgent?: {
    name: string
  }
}

export default function SessionsPage() {
  const { data: authSession } = authClient.useSession()
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sessionToDelete, setSessionToDelete] = useState<{ id: string, type: 'interview' | 'debate' | 'ai-persona' } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch("/api/sessions")
        if (!response.ok) throw new Error("Failed to fetch sessions")
        const data = await response.json()
        setSessions(data)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (authSession) {
      fetchSessions()
    }
  }, [authSession])

  const handleDeleteSession = async (sessionId: string, type: string) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/sessions/${sessionId}?type=${type}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete")
      setSessions(sessions.filter((s) => s.id !== sessionId))
      setSessionToDelete(null)
    } catch (error) {
      console.error("Error deleting session:", error)
      alert("Failed to delete session")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Practice Sessions</h1>
          <p className="text-muted-foreground">
            Track your progress and review previous results from interviews and debates.
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="/interviews">
            <Button variant="outline" className="font-medium">
              <IconPlus className="mr-2 size-4" />
              New Interview
            </Button>
          </Link>
          <Link href="/debates">
            <Button variant="default" className="font-medium">
              <IconPlus className="mr-2 size-4" />
              New Debate
            </Button>
          </Link>
        </div>
      </div>

      <div className="overflow-hidden border-y border-muted/30">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-muted/50">
              <TableHead className="text-muted-foreground font-medium w-[100px]">Type</TableHead>
              <TableHead className="text-muted-foreground font-medium w-[300px]">Subject</TableHead>
              <TableHead className="text-muted-foreground font-medium">Status</TableHead>
              <TableHead className="text-muted-foreground font-medium">Started</TableHead>
              <TableHead className="text-right text-muted-foreground font-medium pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i} className="animate-pulse">
                  <TableCell><div className="h-5 w-16 bg-muted rounded" /></TableCell>
                  <TableCell><div className="h-5 w-40 bg-muted rounded" /></TableCell>
                  <TableCell><div className="h-5 w-20 bg-muted rounded" /></TableCell>
                  <TableCell><div className="h-5 w-24 bg-muted rounded" /></TableCell>
                  <TableCell className="text-right pr-6"><div className="h-8 w-8 bg-muted rounded ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No sessions found. Start a new session to see it here.
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((session) => (
                <TableRow key={session.id} className="hover:bg-muted/30 border-muted/30 group">
                  <TableCell className="py-4">
                    <Badge variant="outline" className="capitalize">
                      {session.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {session.type === 'interview' ? session.interview?.jobTitle : 
                         session.type === 'debate' ? session.debate?.subject : 
                         session.customAgent?.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={session.status === "Completed" ? "default" : "secondary"} 
                      className={session.status === "Completed" ? "bg-[#1a2e1a] text-[#4ade80] border-[#22c55e]/20" : ""}
                    >
                      {session.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                       <Link href={`/sessions/${session.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5 hidden md:flex">
                           View Report
                           <IconExternalLink className="size-3.5" />
                         </Button>
                       </Link>
                       
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                             <IconDotsVertical className="size-4" />
                             <span className="sr-only">Actions</span>
                           </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end" className="w-44">
                           <Link href={`/sessions/${session.id}`}>
                             <DropdownMenuItem className="cursor-pointer">
                               View Detailed Report
                             </DropdownMenuItem>
                           </Link>
                           {session.status !== "Completed" && (
                             <Link href={session.type === 'interview' ? `/sessions/${session.id}/run` : 
                                session.type === 'debate' ? `/debates/sessions/${session.id}/run` : 
                                `/ai-personas/sessions/${session.id}/run`}>
                               <DropdownMenuItem className="cursor-pointer">
                                 Continue {session.type === 'interview' ? 'Interview' : session.type === 'debate' ? 'Debate' : 'Persona Session'}
                               </DropdownMenuItem>
                             </Link>
                           )}
                           <DropdownMenuItem 
                             className="text-destructive cursor-pointer"
                             onClick={() => setSessionToDelete({ id: session.id, type: session.type })}
                           >
                             Delete Session
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
      
      {!isLoading && sessions.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{sessions.length}</span> session{sessions.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      <DeleteAlertDialog 
        open={!!sessionToDelete}
        onOpenChange={(open) => !open && setSessionToDelete(null)}
         onConfirm={() => {
          if (sessionToDelete) {
             handleDeleteSession(sessionToDelete.id, sessionToDelete.type)
          }
        }}
        isDeleting={isDeleting}
        title="Delete Session?"
        description="Are you sure you want to delete this session? This will permanently remove all chat history and analytics associated with it."
      />
    </div>
  )
}
