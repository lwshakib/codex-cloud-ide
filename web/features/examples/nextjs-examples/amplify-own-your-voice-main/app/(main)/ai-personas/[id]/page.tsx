"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  IconArrowLeft, 
  IconRobot, 
  IconPlayerPlay, 
  IconCalendar,
  IconSparkles,
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

interface CustomAgent {
  id: string
  name: string
  instruction: string
  characterId?: string
  createdAt: string
}

export default function CustomAgentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [agent, setAgent] = useState<CustomAgent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isStarting, setIsStarting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const response = await fetch(`/api/ai-personas/${id}`)
        if (!response.ok) throw new Error("Failed to fetch")
        const data = await response.json()
        setAgent(data)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAgent()
  }, [id])

  const handleRunAgent = async () => {
    setIsStarting(true)
    try {
      const response = await fetch(`/api/ai-personas/${id}/sessions`, {
        method: "POST",
      })
      if (!response.ok) throw new Error("Failed to start session")
      const session = await response.json()
      router.push(`/ai-personas/sessions/${session.id}/run`)
    } catch (error) {
      console.error("Error starting agent session:", error)
    } finally {
      setIsStarting(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/ai-personas/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete")
      router.push("/ai-personas")
    } catch (error) {
      console.error("Error deleting agent:", error)
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
            <p className="text-zinc-500 font-medium text-sm animate-pulse tracking-widest uppercase">Initializing Persona Data...</p>
        </div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-[#020202]">
        <div className="size-16 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
            <IconRobot className="size-8 text-zinc-500" />
        </div>
        <div className="text-center space-y-2">
            <p className="text-zinc-100 font-bold text-xl uppercase tracking-tight">Persona Not Found</p>
            <p className="text-zinc-500 text-sm">The persona you are looking for does not exist or has been deleted.</p>
        </div>
        <Link href="/ai-personas">
          <Button variant="outline" className="rounded-full px-8">Back to AI Personas</Button>
        </Link>
      </div>
    )
  }

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
          <Link href="/ai-personas">
            <Button variant="ghost" className="rounded-full gap-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 group">
              <IconArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
              Back to Fleet
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
                onClick={handleRunAgent} 
                disabled={isStarting}
                className="rounded-full gap-3 px-8 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-xl shadow-primary/20"
             >
                <IconPlayerPlay size={18} className="fill-current" />
                {isStarting ? "Initializing..." : "Start New Session"}
             </Button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="flex flex-col md:flex-row gap-10 items-start">
            <div className="size-32 md:size-48 rounded-[40px] bg-gradient-to-br from-primary to-primary/40 flex items-center justify-center shadow-2xl ring-4 ring-primary/10 ring-offset-4 ring-offset-[#020202] shrink-0 overflow-hidden relative">
                 {agent.characterId ? (
                    <img 
                      src={getCharacter(agent.characterId)?.avatarUrl} 
                      className="w-full h-full object-cover" 
                      alt={agent.name} 
                    />
                 ) : (
                    <IconRobot className="size-16 md:size-24 text-primary-foreground" />
                 )}
            </div>
            <div className="flex-1 space-y-6 pt-4">
                <div className="space-y-2">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 uppercase tracking-[0.2em] font-black text-[10px] px-3">
                        Active Directive
                    </Badge>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-zinc-100 uppercase">
                        {agent.name}
                    </h1>
                </div>
                
                <div className="flex flex-wrap gap-6 items-center">
                    <div className="flex items-center gap-2 text-zinc-500">
                        <IconCalendar size={16} />
                        <span className="text-xs font-medium uppercase tracking-wider">
                           Created {formatDistanceToNow(new Date(agent.createdAt), { addSuffix: true })}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        {/* Intelligence / Instructions */}
        <div className="grid gap-8">
            <Card className="bg-zinc-950 border-zinc-900 overflow-hidden relative group">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <IconSparkles className="text-primary size-5" />
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-400">Core Intelligence instructions</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="pt-2">
                    <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800/50">
                        <div className="prose prose-invert prose-sm max-w-none text-zinc-400">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {agent.instruction}
                            </ReactMarkdown>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-6">
                 {[
                    { title: "Behavioral Logic", desc: "Persona follows the strictly defined constraints of the core instruction set." },
                    { title: "UI Capabilities", desc: "Authorized to use rich UI rendering and dialog management tools." },
                    { title: "Privacy Protocol", desc: "This persona's data and instructions are isolated to your secure workspace." }
                 ].map((item, i) => (
                    <Card key={i} className="bg-zinc-950/50 border-zinc-900 p-6 space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{item.title}</h4>
                        <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
                    </Card>
                 ))}
            </div>
        </div>
      </div>

      <DeleteAlertDialog 
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        title="Terminate Persona?"
        description={`This will permanently delete ${agent.name} and all its behavioral profiles. This action is irreversible.`}
      />
    </div>
  )
}
