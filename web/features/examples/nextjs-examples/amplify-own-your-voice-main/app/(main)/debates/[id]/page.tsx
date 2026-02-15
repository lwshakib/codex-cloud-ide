"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  IconArrowLeft, 
  IconPlayerPlay, 
  IconScale, 
  IconCalendar,
  IconGavel,
  IconTrash
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { DeleteAlertDialog } from "@/components/delete-alert-dialog"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { getCharacter } from "@/lib/characters"

interface Debate {
  id: string
  subject: string
  content: string | null
  status: string
  judgeId: string
  opponentId: string
  createdAt: string
}

export default function DebateDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [debate, setDebate] = useState<Debate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isStarting, setIsStarting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchDebate = async () => {
      try {
        const response = await fetch(`/api/debates/${id}`)
        if (!response.ok) throw new Error("Failed to fetch")
        const data = await response.json()
        setDebate(data)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchDebate()
  }, [id])

  const handleStartSession = async () => {
    setIsStarting(true)
    try {
      const response = await fetch(`/api/debates/${id}/sessions`, {
        method: "POST",
      })
      if (!response.ok) throw new Error("Failed to start session")
      const session = await response.json()
      router.push(`/debates/sessions/${session.id}/run`)
    } catch (error) {
      console.error("Error starting debate session:", error)
    } finally {
      setIsStarting(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/debates/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete")
      router.push("/debates")
    } catch (error) {
      console.error("Error deleting debate:", error)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#020202]">
        <div className="flex flex-col items-center gap-4">
            <div className="size-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-500 font-medium text-sm animate-pulse tracking-widest uppercase">Preparing Debate Arena...</p>
        </div>
      </div>
    )
  }

  if (!debate) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-[#020202]">
        <div className="size-16 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
            <IconScale className="size-8 text-zinc-500" />
        </div>
        <div className="text-center space-y-2">
            <p className="text-zinc-100 font-bold text-xl uppercase tracking-tight">Debate Not Found</p>
            <p className="text-zinc-500 text-sm">The debate you are looking for does not exist or has been deleted.</p>
        </div>
        <Link href="/debates">
          <Button variant="outline" className="rounded-full px-8">Back to Debates</Button>
        </Link>
      </div>
    )
  }

  const judge = getCharacter(debate.judgeId)
  const opponent = getCharacter(debate.opponentId)

  return (
    <div className="flex flex-1 flex-col bg-[#020202] text-zinc-100 min-h-screen">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-8 py-12 space-y-12">
        {/* Navigation & Actions */}
        <div className="flex items-center justify-between">
          <Link href="/debates">
            <Button variant="ghost" className="rounded-full gap-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 group">
              <IconArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
              Arena Hall
            </Button>
          </Link>
          <div className="flex items-center gap-3">
             <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full text-zinc-500 hover:text-red-500 hover:bg-red-500/10"
                onClick={() => setShowDeleteDialog(true)}
            >
                <IconTrash size={18} />
             </Button>
             <Button 
                onClick={handleStartSession} 
                disabled={isStarting}
                className="rounded-full gap-3 px-8 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-xl shadow-primary/20"
             >
                <IconPlayerPlay size={18} className="fill-current" />
                {isStarting ? "Initializing Arena..." : "Start New Session"}
             </Button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="space-y-6">
            <div className="space-y-2">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 uppercase tracking-[0.2em] font-black text-[10px] px-3">
                    Formal Debate Motion
                </Badge>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-zinc-100 uppercase leading-none">
                    {debate.subject}
                </h1>
            </div>
            
            <div className="flex flex-wrap gap-6 items-center">
                <div className="flex items-center gap-2 text-zinc-500">
                    <IconCalendar size={16} />
                    <span className="text-xs font-medium uppercase tracking-wider">
                       Proposed {formatDistanceToNow(new Date(debate.createdAt), { addSuffix: true })}
                    </span>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Participants */}
            <Card className="bg-zinc-950 border-zinc-900">
                <CardHeader>
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-zinc-500">Debate Panel</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
                        <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <IconGavel className="text-primary size-6" />
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-0.5">The Judge</div>
                            <div className="font-bold text-zinc-100">{judge?.firstName} {judge?.lastName}</div>
                            <div className="text-xs text-zinc-500 line-clamp-1">{judge?.tagline}</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
                        <div className="size-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                            <IconScale className="text-orange-500 size-6" />
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-0.5">The Opponent</div>
                            <div className="font-bold text-zinc-100">{opponent?.firstName} {opponent?.lastName}</div>
                            <div className="text-xs text-zinc-500 line-clamp-1">{opponent?.tagline}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Motion Context */}
            <Card className="bg-zinc-950 border-zinc-900">
                <CardHeader>
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-zinc-500">Motion Context</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 min-h-[160px]">
                        {debate.content ? (
                            <div className="prose prose-invert prose-sm text-zinc-400">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {debate.content}
                                </ReactMarkdown>
                            </div>
                        ) : (
                            <p className="text-zinc-500 text-sm italic">No additional context provided for this motion.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

      <DeleteAlertDialog 
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        title="Dissolve Debate?"
        description={`This will permanently remove "${debate.subject}" from your records.`}
      />
    </div>
  )
}
