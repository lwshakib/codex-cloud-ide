"use client"

import { useState } from "react"
import { IconRobot, IconArrowLeft, IconSparkles, IconLoader2 } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CHARACTERS, getCharacter } from "@/lib/characters"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export default function CreateCustomAgentPage() {
  const [loading, setLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [name, setName] = useState("")
  const [instruction, setInstruction] = useState("")
  const [aiPrompt, setAiPrompt] = useState("")
  const [characterId, setCharacterId] = useState<string>("olivia")
  const router = useRouter()

  const handleCreate = async () => {
    if (!name || !instruction) {
      toast.error("Please fill in all fields")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/ai-personas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, instruction, characterId }),
      })

      if (!response.ok) throw new Error("Failed to create agent")

      const agent = await response.json()
      toast.success("AI Persona created successfully")
      router.push(`/ai-personas/${agent.id}`)
      router.refresh()
    } catch (error) {
      console.error("Error creating agent:", error)
      toast.error("Failed to create agent")
    } finally {
      setLoading(false)
    }
  }

  const handleAiGenerate = async () => {
    if (!aiPrompt) {
      toast.error("Please describe what you want the agent to do first.")
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch("/api/ai-personas/generate-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description: aiPrompt }),
      })

      if (!response.ok) throw new Error("Generation failed")

      const data = await response.json()
      setName(data.name)
      setInstruction(data.instruction)
      toast.success("Agent profile generated with AI!")
    } catch (error) {
      console.error("AI Generation error:", error)
      toast.error("Failed to generate agent info")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-8 pt-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Link href="/ai-personas">
           <Button variant="ghost" size="icon">
             <IconArrowLeft className="size-5" />
           </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create AI Persona</h1>
          <p className="text-muted-foreground mt-1">Design your own specialized AI persona with custom capabilities.</p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {/* AI Helper Card */}
          <Card className="bg-primary/5 border-primary/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <IconSparkles size={80} className="text-primary" />
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconSparkles className="size-5 text-primary" />
                AI-Powered Builder
              </CardTitle>
              <CardDescription>Describe your goal and let AI draft the agent's identity and instructions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-2">
                 <Label htmlFor="ai-goal">What is this agent's goal?</Label>
                 <Textarea 
                    id="ai-goal"
                    placeholder="e.g., An assistant that helps me analyze medical reports and presents findings in organized tables."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="bg-background/50 resize-none h-24"
                 />
               </div>
               <Button 
                onClick={handleAiGenerate} 
                className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 gap-2" 
                variant="outline"
                disabled={isGenerating || loading}
               >
                 {isGenerating ? (
                   <>
                     <IconLoader2 className="size-4 animate-spin" />
                     Generating...
                   </>
                 ) : (
                   <>
                     <IconSparkles className="size-4" />
                     Generate with Magic
                   </>
                 )}
               </Button>
            </CardContent>
          </Card>

          <Card className="border-primary/20 shadow-lg shadow-primary/5 bg-background/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Persona Identity</CardTitle>
              <CardDescription>Define how your persona identifies and its core mission.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Persona Name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g., UI Architect / Research Assistant" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-3">
                <Label>Select Character Avatar</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {CHARACTERS.map((char) => (
                        <button
                            key={char.id}
                            type="button"
                            onClick={() => setCharacterId(char.id)}
                            className={cn(
                                "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all hover:bg-muted/50",
                                characterId === char.id 
                                    ? "bg-primary/10 border-primary ring-2 ring-primary/20" 
                                    : "bg-background/50 border-zinc-800"
                            )}
                        >
                            <Avatar className="size-10 rounded-xl">
                                <AvatarImage src={char.avatarUrl} className="object-cover" />
                                <AvatarFallback>{char.firstName[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-[10px] font-bold uppercase tracking-widest truncate w-full text-center">
                                {char.firstName}
                            </span>
                        </button>
                    ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instruction">Instructions & Capabilities</Label>
                <Textarea 
                  id="instruction" 
                  placeholder="Describe what the persona should do. You can specify that it has access to UI generation and dialog management..." 
                  className="min-h-[250px] bg-background/50 resize-none"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Detailed instructions help the persona understand complex tasks like generating UI or managing dialogs.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/30 border-dashed">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-primary">Capabilities Note</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                By default, your AI persona will have access to context-aware tools including dialog management and real-time UI rendering. Use the instructions above to define when and how it should use these tools.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-xs font-medium uppercase tracking-widest text-primary/70">Persona Preview</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-8 text-center space-y-4">
              <div className="size-24 rounded-full bg-gradient-to-br from-primary to-primary/40 flex items-center justify-center shadow-2xl ring-4 ring-primary/20 ring-offset-2 ring-offset-background overflow-hidden relative group">
                 {characterId ? (
                     <img 
                        src={getCharacter(characterId)?.avatarUrl} 
                        className="w-full h-full object-cover" 
                        alt="Preview" 
                     />
                 ) : (
                     <IconRobot className="size-10 text-primary-foreground" />
                 )}
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-xl">{name || "Unnamed Persona"}</h3>
                <p className="text-sm text-muted-foreground">
                    {characterId ? `${getCharacter(characterId)?.firstName} Avatar` : "AI Persona"}
                </p>
              </div>
              <Badge variant="outline" className="mt-2 bg-primary/10 text-primary border-primary/20">Active • Private</Badge>
            </CardContent>
          </Card>

          <Button 
            className="w-full h-12 text-lg font-semibold shadow-xl shadow-primary/20 gap-2" 
            size="lg" 
            disabled={loading || isGenerating}
            onClick={handleCreate}
          >
            {loading ? (
              <>
                <IconLoader2 className="size-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <IconSparkles className="size-5" />
                Build Persona
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
