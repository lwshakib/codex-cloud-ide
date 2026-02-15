"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { IconArrowLeft } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface Message {
  role: "user" | "assistant"
  content: string
  feedback?: string
  correctness?: number
  clarity?: number
  relevance?: number
  detail?: number
  efficiency?: number
  creativity?: number
  communication?: number
  problemSolving?: number
}

interface SessionData {
  id: string
  status: string
  createdAt: string
  correctness: number
  clarity: number
  relevance: number
  detail: number
  efficiency: number
  creativity: number
  communication: number
  problemSolving: number
  messages: Message[]
  duration: number
  interview: {
    jobTitle: string
    description: string
    type: string
  }
}

const MetricGauge = ({ label, value = 0 }: { label: string; value?: number }) => {
  const displayValue = value ?? 0
  const radius = 35
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (displayValue / 100) * circumference

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-base font-bold text-foreground">{label}</h3>
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="56"
            cy="56"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/20"
          />
          <motion.circle
            cx="56"
            cy="56"
            r={radius}
            fill="none"
            stroke="#f43f5e" 
            strokeWidth="8"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "circOut" }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold tracking-tight">{displayValue}%</span>
        </div>
      </div>
    </div>
  )
}

export default function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [session, setSession] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch(`/api/sessions/${id}`)
        if (!response.ok) throw new Error("Failed to fetch session")
        const data = await response.json()
        setSession(data)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSession()
  }, [id])

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-muted-foreground animate-pulse">Loading report...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <p className="text-muted-foreground text-lg">Session not found</p>
        <Link href="/sessions">
          <Button variant="outline">Back to Sessions</Button>
        </Link>
      </div>
    )
  }

  const isInterview = session.type === 'interview'
  const isDebate = session.type === 'debate'
  const isAiPersona = session.type === 'ai-persona'
  const isCompleted = session.status === "Completed"
  
  const title = isInterview ? session.interview?.jobTitle : 
                isDebate ? session.debate?.subject : 
                session.customAgent?.name
                
  const backLink = "/sessions"
  const backLabel = "Back to Sessions"
                    
  const runPath = isInterview ? `/sessions/${session.id}/run` : 
                  isDebate ? `/debates/sessions/${session.id}/run` : 
                  `/ai-personas/sessions/${session.id}/run`

  return (
    <div className="flex flex-1 flex-col p-8 max-w-6xl mx-auto w-full gap-8">
      {/* Back Button */}
      <Link 
        href={backLink} 
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <IconArrowLeft size={20} />
        <span>{backLabel}</span>
      </Link>

      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <Badge 
              variant={isCompleted ? "default" : "secondary"}
              className={isCompleted ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1" : ""}
            >
              {session.status}
            </Badge>
            <Badge variant="outline" className="capitalize">{session.type}</Badge>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <p className="text-lg">
              {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
            </p>
            <div className="h-4 w-px bg-muted" />
            <p className="text-lg font-mono">
              Duration: {Math.floor(session.duration / 60)}m {session.duration % 60}s
            </p>
          </div>
        </div>
        
        {!isCompleted && (
          <Link href={runPath}>
            <Button className="bg-primary hover:bg-primary/90 px-8">
              Continue {isInterview ? 'Interview' : isDebate ? 'Debate' : 'Session'}
            </Button>
          </Link>
        )}
      </div>

      <div className="w-full h-px bg-muted/50" />

      {(isInterview || isDebate || isAiPersona) && (
        <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-16">
                <MetricGauge label="Correctness" value={session.correctness} />
                <MetricGauge label="Clarity" value={session.clarity} />
                <MetricGauge label="Relevance" value={session.relevance} />
                <MetricGauge label="Detail" value={session.detail} />
                <MetricGauge label="Efficiency" value={session.efficiency} />
                <MetricGauge label="Creativity" value={session.creativity} />
                <MetricGauge label="Communication" value={session.communication} />
                <MetricGauge label="Problem Solving" value={session.problemSolving} />
            </div>
            <div className="w-full h-px bg-muted/30 my-8" />
        </>
      )}

      {/* Conversation Transcript */}
      <div className="space-y-8">
        <h2 className="text-2xl font-bold">
            {isInterview ? 'Interview' : isDebate ? 'Debate' : 'Persona'} conversation
        </h2>
        
        <div className="space-y-12">
          {(() => {
            if (isDebate) {
              if (!session.messages || session.messages.length === 0) {
                return (
                  <div className="text-muted-foreground italic bg-muted/20 rounded-xl p-8 border border-border/50 text-center">
                    No debate conversation recorded yet.
                  </div>
                )
              }

              return session.messages.map((msg: any, idx: number) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    "p-8 rounded-3xl border space-y-8 shadow-2xl shadow-black/20",
                    msg.role === 'assistant' ? "bg-zinc-900/10 border-zinc-800/30" : "bg-[#121212] border-zinc-800/50"
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-white">
                        {msg.speakerName || (msg.role === 'assistant' ? 'AI' : 'You')}
                      </h3>
                      {msg.speakerTitle && (
                        <Badge variant="outline" className="text-[10px] uppercase font-black text-rose-500 border-rose-500/20 px-2 py-0">
                          {msg.speakerTitle}
                        </Badge>
                      )}
                    </div>
                    <div className="text-zinc-400 leading-relaxed text-lg whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>

                  {msg.role === 'user' && (msg.feedback || msg.correctness !== undefined) && (
                    <div className="space-y-4 pt-4 border-t border-zinc-800/30">
                      <h4 className="text-lg font-bold text-[#a3e635]">
                        Feedback
                      </h4>
                      {msg.feedback && (
                        <p className="text-zinc-400 leading-relaxed text-lg whitespace-pre-wrap">
                          {msg.feedback}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-3 pt-2">
                        {[
                          { label: 'Correctness', val: msg.correctness },
                          { label: 'Clarity', val: msg.clarity },
                          { label: 'Relevance', val: msg.relevance },
                          { label: 'Detail', val: msg.detail },
                          { label: 'Efficiency', val: msg.efficiency },
                          { label: 'Creativity', val: msg.creativity },
                          { label: 'Communication', val: msg.communication },
                          { label: 'Problem-solving', val: msg.problemSolving },
                        ].map((m, i) => (
                          <div 
                            key={i} 
                            className="px-3 py-1.5 rounded-lg bg-[#2a1a1c] border border-rose-500/20 flex items-center"
                          >
                            <span className="text-[#fb7185] text-xs font-bold whitespace-nowrap">
                              {m.label} {m.val ?? 0}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))
            }

            const interchanges: { question?: string; answer: any }[] = []
            let accumulatedAssistant: string[] = []
            
            session.messages?.forEach((msg: any) => {
              if (msg.role === 'assistant') {
                accumulatedAssistant.push(msg.content)
              } else if (msg.role === 'user') {
                interchanges.push({ 
                  question: accumulatedAssistant.length > 0 ? accumulatedAssistant.join('\n\n') : undefined, 
                  answer: msg 
                })
                accumulatedAssistant = []
              }
            })

            const finalComment = accumulatedAssistant.join('\n\n')

            if (interchanges.length === 0 && !finalComment) {
              return (
                <div className="text-muted-foreground italic bg-muted/20 rounded-xl p-8 border border-border/50 text-center">
                  No conversation recorded yet.
                </div>
              )
            }

            return (
              <>
                {interchanges.map((pair, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-8 rounded-3xl bg-[#121212] border border-zinc-800/50 space-y-8 shadow-2xl shadow-black/20"
                  >
                    {/* Question */}
                    {pair.question && (
                      <div className="space-y-3">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          Question: {idx + 1}
                        </h3>
                        <div className="text-zinc-400 leading-relaxed text-lg whitespace-pre-wrap">
                          {pair.question}
                        </div>
                      </div>
                    )}

                    {/* Answer */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-white">
                        Answer
                      </h3>
                      <div className="text-zinc-400 leading-relaxed text-lg whitespace-pre-wrap">
                        {pair.answer.content}
                      </div>
                    </div>

                    {/* Feedback */}
                    {(pair.answer.feedback || pair.answer.correctness !== undefined) && (
                      <div className="space-y-4 pt-4">
                        <h4 className="text-lg font-bold text-[#a3e635]">
                          Feedback
                        </h4>
                        {pair.answer.feedback && (
                          <p className="text-zinc-400 leading-relaxed text-lg whitespace-pre-wrap">
                            {pair.answer.feedback}
                          </p>
                        )}
                        
                        {/* Metrics Badges */}
                        <div className="flex flex-wrap gap-3 pt-2">
                          {[
                            { label: 'Correctness', val: pair.answer.correctness },
                            { label: 'Clarity', val: pair.answer.clarity },
                            { label: 'Relevance', val: pair.answer.relevance },
                            { label: 'Detail', val: pair.answer.detail },
                            { label: 'Efficiency', val: pair.answer.efficiency },
                            { label: 'Creativity', val: pair.answer.creativity },
                            { label: 'Communication', val: pair.answer.communication },
                            { label: 'Problem-solving', val: pair.answer.problemSolving },
                          ].map((m, i) => (
                            <div 
                              key={i} 
                              className="px-3 py-1.5 rounded-lg bg-[#2a1a1c] border border-rose-500/20 flex items-center"
                            >
                              <span className="text-[#fb7185] text-xs font-bold whitespace-nowrap">
                                {m.label} {m.val ?? 0}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}

                {finalComment && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 rounded-3xl bg-muted/20 border border-zinc-800/50"
                  >
                    <div className="text-zinc-400 leading-relaxed text-lg whitespace-pre-wrap">
                      {finalComment}
                    </div>
                  </motion.div>
                )}
              </>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
