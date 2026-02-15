"use client"

import { useEffect, useState, use, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  IconMicrophone, 
  IconMicrophoneOff, 
  IconX, 
  IconSettings, 
  IconWaveSine,
  IconPlayerStopFilled,
  IconRobot,
  IconInfoCircle,
  IconUsers,
  IconScale,
  IconSparkles,
  IconLoader2,
  IconReport
} from "@tabler/icons-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { authClient } from "@/lib/auth-client"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { CHARACTERS, getCharacter } from "@/lib/characters"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface SessionData {
  id: string
  status: string
  messages: Message[]
  duration: number
  debate: {
    subject: string
    content: string | null
    judgeId?: string | null
    opponentId?: string | null
  }
  userSide: "PRO" | "CON" | null
}

interface Message {
  role: "user" | "assistant"
  content: string
  speakerName?: string
  speakerTitle?: string
  isUsersTurn?: boolean
}

export default function ActiveDebateSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: authSession } = authClient.useSession()
  const [session, setSession] = useState<SessionData | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState("")
  const transcriptRef = useRef("")
  const [isThinking, setIsThinking] = useState(false)
  const [isAiTalking, setIsAiTalking] = useState(false)
  const [isUserTalking, setIsUserTalking] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [recognition, setRecognition] = useState<any>(null)
  const [timer, setTimer] = useState(0)
  const { theme, setTheme } = useTheme()
  const [currentSpeaker, setCurrentSpeaker] = useState<{name: string, title: string}>({name: "Sarah", title: "Judge"})
  const [isUsersTurn, setIsUsersTurn] = useState(false)
  const [caption, setCaption] = useState("")
  const [showSideSelection, setShowSideSelection] = useState(false)
  const [displayTranscript, setDisplayTranscript] = useState("")
  const [suggestedText, setSuggestedText] = useState("")
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const captionIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Character Definitions
  const judgeChar = getCharacter(session?.debate?.judgeId || "ethan")
  
  // Opposition Team mapping (Consistent with backend)
  const allOpponents = CHARACTERS.filter((c) => c.role === "opponent")
  const leadChar = getCharacter(session?.debate?.opponentId || "sophia") || allOpponents[0]
  const otherOpponents = allOpponents.filter((c) => c.id !== (leadChar?.id || ""))
  const deputyChar = otherOpponents[0] || allOpponents[1]
  const whipChar = otherOpponents[1] || allOpponents[2]


  const isInitialized = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const rec = new SpeechRecognition()
      rec.continuous = true
      rec.interimResults = true
      rec.lang = 'en-US'

      rec.onstart = () => setIsUserTalking(true)
      rec.onend = () => setIsUserTalking(false)
      rec.onresult = (event: any) => {
        let interim = ""
        let final = ""
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            final += trans
          } else {
            interim += trans
          }
        }
        
        if (final) {
          transcriptRef.current += final + " "
        }
        const full = transcriptRef.current + interim
        setTranscript(full)
        
        // Moving window for user subtitles (last 5 words)
        const words = full.trim().split(/\s+/)
        if (words.length > 0) {
          setDisplayTranscript(words.slice(-5).join(" ") + (interim ? "..." : ""))
        } else {
          setDisplayTranscript("")
        }
      }
      setRecognition(rec)
    }
  }, [])
  
  // Suggestion Cleanup
  useEffect(() => {
    if (!isUsersTurn) {
      setSuggestedText("")
      setIsPopoverOpen(false)
    }
  }, [isUsersTurn])
 
  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (!isLoading && session?.status !== 'Completed') {
      interval = setInterval(() => {
        setTimer(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isLoading, session?.status])

  // Initial Fetch
  useEffect(() => {
    const initSession = async () => {
      if (isInitialized.current) return
      isInitialized.current = true
      
      try {
        const res = await fetch(`/api/debates/sessions/${id}`)
        if (!res.ok) throw new Error("Failed to fetch session")
        const data = await res.json()
        setSession(data)
        setTimer(data.duration || 0)

        // If no side selected, show dialog
        if (!data.userSide) {
           setShowSideSelection(true)
           setIsLoading(false)
           return
        }

        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages)
          const lastMsg = data.messages[data.messages.length - 1]
          if (lastMsg.role === "assistant") {
            const speakerName = lastMsg.speakerName || "AI"
            const speakerTitle = lastMsg.speakerTitle || "Moderator"
            setCurrentSpeaker({name: speakerName, title: speakerTitle})
            setIsUsersTurn(!!lastMsg.isUsersTurn)
            speak(lastMsg.content, false, speakerName, speakerTitle)
          }
        } else {
           startAiDebate()
        }
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setIsLoading(false)
      }
    }
    initSession()
  }, [id])

  // Auto-trigger AI moves
  useEffect(() => {
    if (isLoading || isUsersTurn || isAiTalking || isThinking || !session || session.status === 'Completed' || showSideSelection) return

    const triggerNext = async () => {
      setIsThinking(true)
      const aiData = await fetchAiResponse(messages)
      if (aiData) {
        setMessages(prev => [...prev, { role: "assistant", content: aiData.text, speakerName: aiData.speakerName, speakerTitle: aiData.speakerTitle }])
        setCurrentSpeaker({name: aiData.speakerName, title: aiData.speakerTitle})
        setIsUsersTurn(!!aiData.isUsersTurn)
        speak(aiData.text, aiData.status === 'Completed', aiData.speakerName, aiData.speakerTitle)
      } else {
        setIsThinking(false)
      }
    }

    // Small delay to ensure smooth transition
    const timeout = setTimeout(triggerNext, 500)
    return () => clearTimeout(timeout)
  }, [isLoading, isUsersTurn, isAiTalking, isThinking, session?.status, messages, showSideSelection])

  const startAiDebate = async () => {
    setIsThinking(true)
    const aiResponse = await fetchAiResponse([])
    if (aiResponse) {
      setMessages([{ role: "assistant", content: aiResponse.text, speakerName: aiResponse.speakerName, speakerTitle: aiResponse.speakerTitle }])
      setCurrentSpeaker({name: aiResponse.speakerName, title: aiResponse.speakerTitle})
      setIsUsersTurn(!!aiResponse.isUsersTurn)
      speak(aiResponse.text, aiResponse.status === 'Completed', aiResponse.speakerName, aiResponse.speakerTitle)
    } else {
      setIsThinking(false)
    }
  }

  const handleSelectSide = async (side: "PRO" | "CON") => {
    setShowSideSelection(false)
    try {
        setSession(prev => prev ? { ...prev, userSide: side } : null)
        await fetch(`/api/debates/sessions/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userSide: side })
        })
        startAiDebate()
    } catch (error) {
        console.error("Error selecting side:", error)
    }
  }

  const fetchAiResponse = async (history: Message[]) => {
    try {
      if (abortControllerRef.current) abortControllerRef.current.abort()
      abortControllerRef.current = new AbortController()

      const response = await fetch(`/api/debates/${id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, duration: timer }),
        signal: abortControllerRef.current.signal,
      })
      if (!response.ok) throw new Error("Failed to fetch AI response")
      const data = await response.json()
      
      if (data.status === 'Completed') {
        setSession(prev => prev ? { ...prev, status: 'Completed' } : null)
      }

      setIsUsersTurn(!!data.isUsersTurn)
      return data
    } catch (error: any) {
      if (error.name === 'AbortError') return null
      console.error("AI Error:", error)
      return null
    }
  }

  const handleGetSuggestion = async () => {
    if (suggestedText) {
      setIsPopoverOpen(!isPopoverOpen)
      return
    }
    if (isSuggesting) return
    setIsSuggesting(true)
    try {
      const res = await fetch(`/api/debates/sessions/${id}/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages })
      })
      if (!res.ok) throw new Error("Failed to fetch suggestion")
      const data = await res.json()
      setSuggestedText(data.suggestion)
      setIsPopoverOpen(true)
    } catch (error) {
      console.error("Suggestion error:", error)
    } finally {
      setIsSuggesting(false)
    }
  }

  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)

  const speak = async (text: string, isCompleted: boolean = false, speakerName?: string, speakerTitle?: string) => {
    if (audio) {
      audio.pause()
      audio.src = ""
    }
    
    // Determine voice based on provided speaker info or current state (fallback)
    const sName = speakerName || currentSpeaker.name
    const sTitle = speakerTitle || currentSpeaker.title

    let selectedVoice = judgeChar?.voiceId;
    if (sTitle !== "Judge") {
      // Find character by title in the teams
      const allOpponents = CHARACTERS.filter(c => c.role === "opponent")
      let opp = allOpponents.find(c => `${c.firstName} ${c.lastName}` === sName) || 
                allOpponents.find(c => c.firstName === sName);
      
      if (!opp) {
        // Fallback to title matching if Name doesn't match
        if (sTitle.includes("Deputy")) opp = allOpponents[1];
        else if (sTitle.includes("Whip") || sTitle.includes("Rebuttal")) opp = allOpponents[2];
        else opp = allOpponents[0];
      }
      
      selectedVoice = opp?.voiceId;
    }

    try {
      setIsThinking(true)
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: selectedVoice }),
        signal: abortControllerRef.current?.signal,
      })

      if (!response.ok) throw new Error("Failed to fetch audio")

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const newAudio = new Audio(url)
      
      newAudio.onplay = () => {
        setIsAiTalking(true)
        setIsThinking(false)

        // Subtitle Logic: Chunk the text and display sequentially
        const words = text.split(/\s+/)
        const wordsPerChunk = 5
        const chunks: string[] = []
        for (let i = 0; i < words.length; i += wordsPerChunk) {
          chunks.push(words.slice(i, i + wordsPerChunk).join(" "))
        }

        if (chunks.length > 0) {
          let currentChunkIdx = 0
          setCaption(chunks[0])
          
          // Estimate timing based on audio duration (now available on play)
          const totalDurationMs = newAudio.duration ? newAudio.duration * 1000 : words.length * 350
          const msPerChunk = (totalDurationMs - 200) / chunks.length 

          if (captionIntervalRef.current) clearInterval(captionIntervalRef.current)
          captionIntervalRef.current = setInterval(() => {
            currentChunkIdx++
            if (currentChunkIdx < chunks.length) {
              setCaption(chunks[currentChunkIdx])
            } else {
              if (captionIntervalRef.current) clearInterval(captionIntervalRef.current)
            }
          }, Math.max(msPerChunk, 500))
        }
      }

      newAudio.onended = () => {
        setIsAiTalking(false)
        setIsThinking(false)
        if (captionIntervalRef.current) clearInterval(captionIntervalRef.current)
        URL.revokeObjectURL(url)
        setCaption("")
        
        if (isCompleted) {
          setSession(prev => prev ? { ...prev, status: 'Completed' } : null)
          // Redirect to sessions list after a short delay
          setTimeout(() => {
            handleExit('/sessions')
          }, 3000)
        }
      }

      audioRef.current = newAudio
      setAudio(newAudio)
      newAudio.play().catch((err) => {
        if (err.name === 'AbortError') return
        console.error("Play error:", err)
        setIsAiTalking(false)
        setIsThinking(false)
        if (captionIntervalRef.current) clearInterval(captionIntervalRef.current)
      })
    } catch (error) {
      console.error("Speech error:", error)
      setIsAiTalking(false)
      setIsThinking(false)
      if (captionIntervalRef.current) clearInterval(captionIntervalRef.current)
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      const finalTranscript = transcript.trim()
      setIsRecording(false)
      recognition?.stop()
      if (finalTranscript) {
        handleUserResponse(finalTranscript)
      }
      transcriptRef.current = ""
      setTranscript("")
      setDisplayTranscript("")
    } else {
      transcriptRef.current = ""
      setTranscript("")
      setDisplayTranscript("")
      setIsRecording(true)
      try {
        recognition?.start()
      } catch (e) {}
    }
  }

  const handleUserResponse = async (text: string) => {
    const user = authSession?.user
    const isUserPro = session?.userSide === "PRO"
    const newMessages: Message[] = [...messages, { 
      role: "user", 
      content: text,
      speakerName: user?.name || "You",
      speakerTitle: isUserPro ? "Prime Minister" : "Leader of Opposition"
    }]
    setSuggestedText("")
    setIsPopoverOpen(false)
    setMessages(newMessages)
    
    setIsThinking(true)
    const aiData = await fetchAiResponse(newMessages)
    if (aiData) {
      const msg: Message = { role: "assistant", content: aiData.text, speakerName: aiData.speakerName, speakerTitle: aiData.speakerTitle }
      setMessages([...newMessages, msg])
      setCurrentSpeaker({name: aiData.speakerName, title: aiData.speakerTitle})
      setIsUsersTurn(!!aiData.isUsersTurn)
      speak(aiData.text, aiData.status === 'Completed', aiData.speakerName, aiData.speakerTitle)
    } else {
      setIsThinking(false)
    }
  }

  const stopAll = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ""
      audioRef.current = null
    }
    if (captionIntervalRef.current) {
      clearInterval(captionIntervalRef.current)
    }
    recognition?.stop()
    setIsRecording(false)
    setIsAiTalking(false)
    setIsThinking(false)
    setIsUserTalking(false)
    setCaption("")
    setDisplayTranscript("")
  }

  const handleExit = (path: string) => {
    stopAll()
    router.push(path)
  }

  useEffect(() => {
    return () => stopAll()
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center h-screen bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="size-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-white font-medium animate-pulse">Entering the Debate Floor...</p>
        </div>
      </div>
    )
  }

  const user = authSession?.user

  // Teams configuration based on userSide
  const sideSelected = session?.userSide === "PRO" || session?.userSide === "CON"
  const isUserPro = session?.userSide === "PRO"
  const isUserCon = session?.userSide === "CON"

  const affirmativeTeam = [
    { 
      name: isUserPro ? (user?.name || "You") : (sideSelected ? leadChar?.firstName : "Pending..."), 
      title: "Prime Minister", 
      active: currentSpeaker.title === "Prime Minister",
      avatar: isUserPro ? undefined : (sideSelected ? leadChar?.avatarUrl : undefined)
    },
    { 
      name: isUserPro ? (user?.name || "You") : (sideSelected ? deputyChar?.firstName : "Pending..."), 
      title: "Deputy PM", 
      active: currentSpeaker.title === "Deputy PM" || currentSpeaker.title === "Deputy Prime Minister",
      avatar: isUserPro ? undefined : (sideSelected ? deputyChar?.avatarUrl : undefined)
    },
    { 
      name: isUserPro ? (user?.name || "You") : (sideSelected ? whipChar?.firstName : "Pending..."), 
      title: "Affirmative Rebuttal", 
      active: currentSpeaker.title === "Affirmative Rebuttal" || currentSpeaker.title === "Rebuttal Speaker",
      avatar: isUserPro ? undefined : (sideSelected ? whipChar?.avatarUrl : undefined)
    },
  ]

  const negativeTeam = [
    { 
      name: isUserCon ? (user?.name || "You") : (sideSelected ? leadChar?.firstName : "Pending..."), 
      title: "Leader of Opposition", 
      active: currentSpeaker.title === "Leader of Opposition", 
      avatar: isUserCon ? undefined : (sideSelected ? leadChar?.avatarUrl : undefined) 
    },
    { 
      name: isUserCon ? (user?.name || "You") : (sideSelected ? deputyChar?.firstName : "Pending..."), 
      title: "Deputy LO", 
      active: currentSpeaker.title === "Deputy LO" || currentSpeaker.title === "Deputy Leader of Opposition", 
      avatar: isUserCon ? undefined : (sideSelected ? deputyChar?.avatarUrl : undefined) 
    },
    { 
      name: isUserCon ? (user?.name || "You") : (sideSelected ? whipChar?.firstName : "Pending..."), 
      title: "Opposition Whip", 
      active: currentSpeaker.title === "Opposition Whip", 
      avatar: isUserCon ? undefined : (sideSelected ? whipChar?.avatarUrl : undefined) 
    },
  ]


  return (
    <div className="h-screen w-screen bg-[#050505] flex flex-col overflow-hidden text-zinc-100 font-sans">
      {/* Top Bar */}
      <div className="h-16 px-8 flex items-center justify-between border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-md z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => handleExit(`/debates`)}
            className="text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-full p-2 transition-colors"
          >
            <IconX size={20} />
          </button>
          <div className="h-4 w-px bg-zinc-800" />
          <div>
            <div className="flex items-center gap-2">
              <IconScale size={16} className="text-primary" />
              <h1 className="text-sm font-bold tracking-tight uppercase truncate max-w-[300px]">{session?.debate.subject}</h1>
            </div>
            <span className="text-[10px] font-mono font-bold text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 tracking-tighter">
              {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1 animate-pulse">
            LIVE DEBATE
          </Badge>
          <Button 
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-full gap-2 px-4 h-9"
            onClick={() => handleExit(`/debates`)}
          >
            <IconPlayerStopFilled size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">End Session</span>
          </Button>
        </div>
      </div>

      {/* Debate Floor Grid */}
      <div className="flex-1 flex flex-col p-6 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[160px] pointer-events-none" />

        {/* Judge Position (Top Center) */}
        <div className="flex flex-col items-center mb-12 z-20">
          <motion.div 
            animate={currentSpeaker.title === "Judge" ? { scale: 1.1, y: 10 } : { scale: 1, y: 0 }}
            className={cn(
              "size-32 rounded-full border-4 transition-all duration-500 relative flex items-center justify-center bg-zinc-950 overflow-hidden",
              currentSpeaker.title === "Judge" ? "border-primary shadow-[0_0_50px_rgba(var(--primary),0.3)]" : "border-zinc-800"
            )}
          >
            <Avatar className="size-full">
                <AvatarImage src={judgeChar?.avatarUrl} className="object-cover" />
                <AvatarFallback>J</AvatarFallback>
            </Avatar>
            {currentSpeaker.title === "Judge" && (isAiTalking || isThinking) && (
                <div className="absolute inset-0 bg-primary/10 animate-pulse" />
            )}
          </motion.div>
          <div className="text-center mt-4">
            <h3 className="text-lg font-black tracking-tight">{judgeChar?.firstName} {judgeChar?.lastName}</h3>
            <p className="text-primary text-[9px] font-black uppercase tracking-[0.2em]">Presiding Judge</p>
          </div>
        </div>

        {/* Teams & VS (Center) */}
        <div className="flex-1 flex items-center justify-between px-12 relative">
          {/* Affirmative Team (Left) */}
          <div className="flex flex-col gap-6 w-[340px]">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/80 mb-2">Affirmative Team</h2>
            <div className="flex flex-col gap-4">
              {affirmativeTeam.map((m, i) => (
                <motion.div 
                  key={i}
                  animate={m.active ? { scale: 1.05, x: 20 } : { scale: 1, x: 0 }}
                  className={cn(
                    "p-4 rounded-2xl border transition-all duration-300 flex items-center gap-4 relative",
                    m.active 
                      ? "bg-emerald-500/10 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)] z-10" 
                      : "bg-zinc-900/40 border-zinc-800 opacity-50"
                  )}
                >
                  <Avatar className={cn("size-12 rounded-xl border-2 border-transparent", m.active && "border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]")}>
                    <AvatarImage src={m.avatar || user?.image || undefined} />
                    <AvatarFallback className="bg-emerald-500/20 text-emerald-400 font-bold">{m.title[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-bold text-zinc-100 text-sm">{m.name}</span>
                    <span className="text-[9px] uppercase font-black tracking-widest text-zinc-500">{m.title}</span>
                  </div>
                  {m.active && (isAiTalking || isUserTalking) && (
                    <div className="ml-auto flex gap-1 items-end h-4">
                      {[1, 2, 3].map(j => <motion.div key={j} animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.5, delay: j * 0.1 }} className="w-1 bg-emerald-400 rounded-full" />)}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* VS Indicator */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
               <div className="size-20 rounded-full bg-zinc-900/50 border border-zinc-800 flex items-center justify-center backdrop-blur-xl">
                  <span className="text-2xl font-black italic tracking-tighter text-white/20">VS</span>
               </div>
               
               {/* Subtitles (Centered) */}
               <AnimatePresence>
                {caption && (
                  <motion.div
                    key={caption}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute top-24 w-[400px] left-1/2 -translate-x-1/2 px-6 py-4 bg-black/80 backdrop-blur-2xl rounded-3xl border border-white/10 text-center shadow-2xl"
                  >
                    <div className="text-[8px] font-black uppercase tracking-widest text-primary mb-2">{currentSpeaker.title} {currentSpeaker.name}</div>
                    <p className="text-sm text-zinc-100 leading-relaxed font-medium italic">
                      "{caption}"
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
          </div>

          {/* Negative Team (Right) */}
          <div className="flex flex-col gap-6 w-[340px] items-end">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500/80 mb-2">Negative Team</h2>
            <div className="flex flex-col gap-4 w-full">
              {negativeTeam.map((m, i) => (
                <motion.div 
                  key={i}
                  animate={m.active ? { scale: 1.05, x: -20 } : { scale: 1, x: 0 }}
                  className={cn(
                    "p-4 rounded-2xl border transition-all duration-300 flex items-center flex-row-reverse gap-4 relative",
                    m.active 
                      ? "bg-red-500/10 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)] z-10" 
                      : "bg-zinc-900/40 border-zinc-800 opacity-50"
                  )}
                >
                  <Avatar className={cn("size-12 rounded-xl border-2 border-transparent", m.active && "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]")}>
                    <AvatarImage src={m.avatar || user?.image || undefined} />
                    <AvatarFallback className="bg-red-500/20 text-red-400 font-bold">{m.title[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-right">
                    <span className="font-bold text-zinc-100 text-sm">{m.name}</span>
                    <span className="text-[9px] uppercase font-black tracking-widest text-zinc-500">{m.title}</span>
                  </div>
                  {m.active && (isAiTalking || isUserTalking) && (
                    <div className="mr-auto flex gap-1 items-end h-4">
                      {[1, 2, 3].map(j => <motion.div key={j} animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.5, delay: j * 0.1 }} className="w-1 bg-red-400 rounded-full" />)}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>


        {/* Bottom Bar: Input Controller */}
        <div className="mt-auto h-32 flex items-center justify-center p-8 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-900 rounded-3xl z-50">
           <AnimatePresence mode="wait">
              {!isUsersTurn || isAiTalking || isThinking ? (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex flex-col items-center gap-3"
                >
                    <div className="flex gap-2">
                        {(isAiTalking || isThinking) ? (
                          [1, 2, 3, 4, 5].map(i => (
                              <motion.div 
                                  key={i}
                                  animate={{ height: [8, 24, 8] }}
                                  transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
                                  className="w-1.5 bg-primary rounded-full"
                              />
                          ))
                        ) : (
                          <div className="size-2 rounded-full bg-zinc-700" />
                        )}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 italic">
                        {isThinking ? `${currentSpeaker.name} is formulating arguments...` : 
                         isAiTalking ? `${currentSpeaker.name} is speaking...` : 
                         `Listening to the floor...`}
                    </span>
                </motion.div>
              ) : (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-xl flex flex-col items-center gap-4"
                >
                    {session?.status === 'Completed' ? (
                        <div className="flex flex-col items-center gap-6 p-8 rounded-[32px] bg-emerald-500/5 border border-emerald-500/10 backdrop-blur-xl w-full">
                            <div className="flex flex-col items-center gap-2">
                                <div className="size-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                                    <IconReport size={24} className="text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white tracking-tight">Debate Concluded</h3>
                                <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest text-center">
                                    Final duration: {Math.floor(timer / 60)}m {timer % 60}s
                                </p>
                            </div>
                            
                            <Button 
                                onClick={() => handleExit('/sessions')}
                                variant="outline"
                                className="h-12 px-8 rounded-xl border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition-all font-bold text-xs uppercase tracking-wider text-zinc-300"
                            >
                                Return to Dashboard
                            </Button>
                        </div>
                    ) : (
                        <div className="w-full flex items-center gap-4">
                        <Button
                            onClick={toggleRecording}
                            className={cn(
                                "flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs gap-3 transition-all duration-300",
                                isRecording 
                                    ? "bg-red-500 hover:bg-red-600 shadow-xl shadow-red-500/20" 
                                    : "bg-emerald-500 hover:bg-emerald-600 shadow-xl shadow-emerald-500/20"
                            )}
                        >
                            {isRecording ? <IconMicrophoneOff size={20} /> : <IconMicrophone size={20} />}
                            {isRecording ? "Stop Speech & Submit" : "Open Microphone to Speak"}
                        </Button>
                        
                        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button 
                                    onClick={handleGetSuggestion}
                                    disabled={isSuggesting}
                                    variant="outline" 
                                    className={cn(
                                        "h-14 px-6 rounded-2xl border-zinc-800 bg-zinc-900/50 gap-2 hover:bg-zinc-800 transition-all font-bold text-xs uppercase tracking-wider text-zinc-400 hover:text-white",
                                        suggestedText && "border-primary/50 text-primary bg-primary/5"
                                    )}
                                >
                                    {isSuggesting ? <IconLoader2 size={20} className="animate-spin" /> : <IconSparkles size={20} className={cn(suggestedText ? "text-primary" : "text-zinc-500")} />}
                                    {isSuggesting ? "Generating..." : "AI Suggestion"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent 
                                side="top" 
                                align="end" 
                                className="w-[450px] p-0 bg-zinc-950/90 backdrop-blur-3xl border-primary/20 rounded-[32px] shadow-2xl overflow-hidden mb-4"
                            >
                                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-zinc-900/40">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                                            <IconSparkles size={16} className="text-primary" />
                                        </div>
                                        <h3 className="text-sm font-bold text-white tracking-tight">AI Coach Suggestion</h3>
                                    </div>
                                    <button 
                                        onClick={() => setIsPopoverOpen(false)}
                                        className="size-8 rounded-full hover:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
                                    >
                                        <IconX size={16} />
                                    </button>
                                </div>
                                <div className="p-6 max-h-[300px] overflow-y-auto custom-scrollbar">
                                    <p className="text-lg text-zinc-200 leading-relaxed font-medium italic">
                                        "{suggestedText}"
                                    </p>
                                </div>
                                <div className="px-6 pb-6 mt-2">
                                     <div className="p-3 rounded-xl bg-zinc-900/40 border border-white/5 flex gap-3 items-start">
                                        <IconInfoCircle size={14} className="text-primary mt-0.5 shrink-0" />
                                        <p className="text-[10px] text-zinc-500 leading-relaxed">
                                            Read this suggestion aloud or use it to inspire your next move.
                                        </p>
                                     </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                )}
                    
                    {isRecording && displayTranscript && (
                        <p className="text-emerald-500 text-xs text-center line-clamp-2 max-w-lg font-medium italic bg-emerald-500/5 px-4 py-2 rounded-xl border border-emerald-500/10">
                            "{displayTranscript}"
                        </p>
                    )}
                </motion.div>
              )}
           </AnimatePresence>
        </div>
      </div>


      {/* Side Selection Overlay */}
      <AnimatePresence>
        {showSideSelection && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
            >
                <div className="max-w-4xl w-full flex flex-col items-center gap-12">
                    <div className="text-center space-y-4">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20"
                        >
                            <IconScale size={16} className="text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Decide the Future</span>
                        </motion.div>
                        <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white">Choose Your Position</h2>
                        <p className="text-zinc-400 text-lg max-w-xl mx-auto">
                           Select the team you wish to represent in this intellectual motion.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
                        {/* Affirmative */}
                        <motion.button
                            whileHover={{ scale: 1.02, y: -5 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSelectSide("PRO")}
                            className="group relative flex flex-col items-center gap-6 p-8 rounded-[40px] bg-zinc-900/50 border-2 border-zinc-800 hover:border-emerald-500/50 transition-all duration-500 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 transition-colors" />
                            <div className="size-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40 transition-all">
                                <IconScale size={32} className="text-emerald-500" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-2xl font-black text-white">Affirmative</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/70">Team Pro (Government)</p>
                                <p className="text-sm text-zinc-500 max-w-[200px]">Represent the motion and argue for its implementation.</p>
                            </div>
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 py-1.5 px-4 font-black">SELECT TEAM</Badge>
                        </motion.button>

                        {/* Negative */}
                        <motion.button
                            whileHover={{ scale: 1.02, y: -5 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSelectSide("CON")}
                            className="group relative flex flex-col items-center gap-6 p-8 rounded-[40px] bg-zinc-900/50 border-2 border-zinc-800 hover:border-red-500/50 transition-all duration-500 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/5 transition-colors" />
                            <div className="size-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center group-hover:bg-red-500/20 group-hover:border-red-500/40 transition-all">
                                <IconScale size={32} className="text-red-500 rotate-180" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-2xl font-black text-white">Negative</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-red-500/70">Team Con (Opposition)</p>
                                <p className="text-sm text-zinc-500 max-w-[200px]">Challenge the motion and highlight its flaws.</p>
                            </div>
                            <Badge className="bg-red-500/10 text-red-400 border-red-500/20 py-1.5 px-4 font-black">SELECT TEAM</Badge>
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
      
      {/* Side Info Panel (Floating) */}
      <div className="absolute top-24 right-8 w-64 p-4 rounded-2xl bg-zinc-950/80 border border-zinc-900 backdrop-blur-md z-40 hidden lg:block">
        <div className="flex items-center gap-2 mb-3">
            <IconInfoCircle size={16} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Debate Information</span>
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed">
            Current Stage: <strong>Opening Statements</strong>
        </p>
        <div className="mt-4 pt-4 border-t border-zinc-900">
            <h4 className="text-[9px] font-black text-zinc-500 uppercase mb-2">Instructions</h4>
            <ul className="text-[10px] text-zinc-400 space-y-2">
                <li className="flex gap-2"><span>1.</span> Wait for the Judge to invite you.</li>
                <li className="flex gap-2"><span>2.</span> You have 2 mins per speech.</li>
                <li className="flex gap-2"><span>3.</span> Be analytical and logically rigorous.</li>
            </ul>
        </div>
      </div>
    </div>
  )
}
