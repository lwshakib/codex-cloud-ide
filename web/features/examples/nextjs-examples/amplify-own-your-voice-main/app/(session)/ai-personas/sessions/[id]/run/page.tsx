"use client"

import { useEffect, useState, use, useRef } from "react"
import { useRouter } from "next/navigation"
import { 
  IconMicrophone, 
  IconMicrophoneOff, 
  IconX, 
  IconSettings, 
  IconWaveSine,
  IconPlayerStopFilled,
  IconRobot,
  IconCode,
  IconTerminal,
  IconSun,
  IconMoon,
  IconSparkles,
  IconSend,
  IconLoader2,
  IconInfoCircle
} from "@tabler/icons-react"
import { useTheme } from "next-themes"

import CodeMirror from "@uiw/react-codemirror"
import { javascript } from "@codemirror/lang-javascript"
import { python } from "@codemirror/lang-python"
import { cpp } from "@codemirror/lang-cpp"
import { githubLight, githubDark } from "@uiw/codemirror-theme-github"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { authClient } from "@/lib/auth-client"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { getCharacter, Character } from "@/lib/characters"
import ReactMarkdown from "react-markdown"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface Message {
  role: "user" | "assistant"
  content: string

  codingChallenge?: any
  code?: string
}

interface SessionData {
  id: string
  status: string
  messages: Message[]
  duration: number
  customAgent: {
    name: string
    instruction: string
    characterId: string | null
  }
}

export default function AIPersonaRunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: authSession } = authClient.useSession()
  const { theme, setTheme } = useTheme()
  
  const [session, setSession] = useState<SessionData | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [persona, setPersona] = useState<Character | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [timer, setTimer] = useState(0)
  const [suggestedText, setSuggestedText] = useState("")
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState("")
  const transcriptRef = useRef("")
  const [isThinking, setIsThinking] = useState(false)
  const [isAiTalking, setIsAiTalking] = useState(false)
  const [isUserTalking, setIsUserTalking] = useState(false)
  
  const [recognition, setRecognition] = useState<any>(null)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isInitialized = useRef(false)

  // Coding State
  const [codingChallenge, setCodingChallenge] = useState<{
    title: string;
    description: string;
    initialCode: string;
    language: "javascript" | "python" | "cpp";
  } | null>(null)
  const [isCodingModalOpen, setIsCodingModalOpen] = useState(false)
  const [currentCode, setCurrentCode] = useState("")


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
          if (event.results[i].isFinal) final += trans
          else interim += trans
        }
        if (final) transcriptRef.current += final + " "
        setTranscript(transcriptRef.current + interim)
      }
      setRecognition(rec)
    }
  }, [])

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (!isLoading && session?.status !== 'Completed') {
      interval = setInterval(() => setTimer(prev => prev + 1), 1000)
    }
    return () => clearInterval(interval)
  }, [isLoading, session?.status])

  // Suggestion Cleanup
  useEffect(() => {
    const isUsersTurn = messages.length > 0 && messages[messages.length - 1].role === 'assistant'
    if (!isUsersTurn) {
      setSuggestedText("")
      setIsPopoverOpen(false)
    }
  }, [messages])

  // Initial Fetch
  useEffect(() => {
    const init = async () => {
      if (isInitialized.current) return
      isInitialized.current = true
      
      try {
        const res = await fetch(`/api/ai-personas/sessions/${id}`)
        if (!res.ok) throw new Error("Failed to fetch session")
        const data = await res.json()
        setSession(data)
        setTimer(data.duration || 0)
        setMessages(data.messages || [])
        
        if (data.customAgent.characterId) {
          setPersona(getCharacter(data.customAgent.characterId))
        }

        if (data.messages && data.messages.length > 0) {
          const lastMsg = data.messages[data.messages.length - 1]
          if (lastMsg.role === "assistant") {
            if (lastMsg.codingChallenge) {
              setCodingChallenge(lastMsg.codingChallenge)
              const userHasCode = data.messages.some((m: Message) => m.role === 'user' && m.code)
              if (!userHasCode) setIsCodingModalOpen(true)
            }
            speak(lastMsg.content)
          }
        } else {
            // AI Starts first if no history
            setIsThinking(true)
            const aiData = await fetchAiResponse([])
            if (aiData) {
              const aiMsg: Message = { role: "assistant", content: aiData.text }
              setMessages([aiMsg])
              speak(aiData.text, aiData.isCompleted)
            } else {
              setIsThinking(false)
            }
        }
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [id])

  const fetchAiResponse = async (history: Message[], extras?: { code?: string }) => {
    try {
      if (abortControllerRef.current) abortControllerRef.current.abort()
      abortControllerRef.current = new AbortController()

      const res = await fetch(`/api/ai-personas/sessions/${id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: history, 
          duration: timer,
          ...extras
        }),
        signal: abortControllerRef.current.signal,
      })
      if (!res.ok) throw new Error("API Error")
      const data = await res.json()
      
      if (data.codingChallenge) {
        setCodingChallenge(data.codingChallenge)
        setCurrentCode(data.codingChallenge.initialCode)
        setIsCodingModalOpen(true)
      }

      if (data.status === 'Completed') {        setSession(prev => prev ? { ...prev, status: 'Completed' } : null)
      }

      return {
        text: data.text,
        isCompleted: data.status === 'Completed'
      }
    } catch (e: any) {
      if (e.name === 'AbortError') return null
      console.error(e)
      return null
    }
  }

  const speak = async (text: string, isCompleted: boolean = false) => {
    if (audio) {
      audio.pause()
      audio.src = ""
    }
    
    try {
      setIsThinking(true)
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: persona?.voiceId }),
        signal: abortControllerRef.current?.signal,
      })

      if (!res.ok) throw new Error("TTS Error")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const newAudio = new Audio(url)
      
      newAudio.onplay = () => {
        setIsAiTalking(true)
        setIsThinking(false)
      }

      newAudio.onended = () => {
        setIsAiTalking(false)
        setIsThinking(false)
        URL.revokeObjectURL(url)
        if (isCompleted) handleExit(`/ai-personas`)
      }

      audioRef.current = newAudio
      setAudio(newAudio)
      newAudio.play().catch(e => {
        if (e.name === 'AbortError') return
        setIsAiTalking(false)
        setIsThinking(false)
      })
    } catch (e) {
      console.error(e)
      setIsAiTalking(false)
      setIsThinking(false)
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
      const res = await fetch(`/api/ai-personas/sessions/${id}/suggest`, {
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

  const handleSend = async (text: string, extras?: { code?: string }) => {
    setSuggestedText("") // Clear suggestion on send
    setIsPopoverOpen(false)
    const newMessages: Message[] = [...messages, { role: "user", content: text, code: extras?.code }]
    setMessages(newMessages)
    setIsThinking(true)
    
    const aiData = await fetchAiResponse(newMessages, extras)
    if (aiData) {
      setMessages([...newMessages, { role: "assistant", content: aiData.text }])
      speak(aiData.text, aiData.isCompleted)
    } else {
      setIsThinking(false)
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      const final = transcript.trim()
      setIsRecording(false)
      recognition?.stop()
      if (final) handleSend(final)
      transcriptRef.current = ""
      setTranscript("")
    } else {
      transcriptRef.current = ""
      setTranscript("")
      setIsRecording(true)
      try { recognition?.start() } catch (e) {}
    }
  }

  const stopAll = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort()
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ""
    }
    recognition?.stop()
    setIsRecording(false)
    setIsAiTalking(false)
    setIsThinking(false)
    setIsUserTalking(false)
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
          <p className="text-white font-medium animate-pulse uppercase tracking-widest">Booting Persona...</p>
        </div>
      </div>
    )
  }

  const user = authSession?.user
  const lastAiMessage = [...messages].reverse().find(m => m.role === 'assistant')

  return (
    <div className="h-screen w-screen bg-background flex flex-col overflow-hidden text-foreground font-sans selection:bg-primary/30">
      {/* Top Bar */}
      <div className="absolute top-0 inset-x-0 h-20 px-8 flex items-center justify-between z-50 bg-gradient-to-b from-background/80 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => handleExit(`/ai-personas`)}
            className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full p-2 transition-colors"
          >
            <IconX size={20} />
          </button>
          <div className="h-4 w-px bg-border mx-2" />
          <div>
            <h1 className="text-sm font-semibold">{session?.customAgent.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex items-center gap-1.5 ">
                <div className="size-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest text-primary font-bold">Neural Link Active</span>
              </div>
              <div className="h-2 w-px bg-border" />
              <span className="text-[10px] font-mono font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border tracking-tighter">
                {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button 
                onClick={handleGetSuggestion}
                disabled={isSuggesting || isLoading}
                variant="ghost" 
                size="sm" 
                className={cn(
                  "text-muted-foreground hover:text-foreground hover:bg-muted rounded-full gap-2 px-3 transition-all",
                  suggestedText && "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                )}
              >
                {isSuggesting ? (
                  <IconLoader2 size={18} className="animate-spin" />
                ) : (
                  <IconSparkles size={18} className={cn(suggestedText && "text-primary")} />
                )}
                <span className="text-xs font-semibold">{suggestedText ? "Suggestion" : "AI Suggest"}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent 
                side="bottom" 
                align="end" 
                className="w-[400px] p-0 bg-card/90 backdrop-blur-3xl border-primary/20 rounded-[32px] shadow-2xl overflow-hidden mt-2"
            >
                <div className="p-4 border-b border-border/50 flex items-center justify-between bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                        <IconSparkles size={16} className="text-primary" />
                      </div>
                      <h3 className="text-sm font-bold tracking-tight">AI Coach Suggestion</h3>
                    </div>
                    <button 
                      onClick={() => setIsPopoverOpen(false)}
                      className="size-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <IconX size={16} />
                    </button>
                </div>
                
                <div className="max-h-60 overflow-y-auto p-6 custom-scrollbar text-foreground">
                    <p className="text-lg leading-relaxed font-medium italic">
                      "{suggestedText}"
                    </p>
                </div>

                <div className="px-6 pb-6 flex gap-4">
                    <div className="flex-1 p-3 rounded-xl bg-muted/50 border border-border flex gap-3 items-start">
                       <IconInfoCircle size={14} className="text-primary mt-0.5 shrink-0" />
                       <p className="text-[10px] text-muted-foreground leading-relaxed">
                          Use this suggestion as a guide to formulate your response professionally.
                       </p>
                    </div>
                </div>
            </PopoverContent>
          </Popover>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full text-muted-foreground hover:text-foreground"
          >
            {theme === "dark" ? <IconSun size={20} /> : <IconMoon size={20} />}
          </Button>

          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full gap-2 px-3">
            <IconSettings size={18} />
            <span className="text-xs font-semibold">Config</span>
          </Button>

          <Button 
            className="bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 rounded-full gap-2 px-4 h-9"
            onClick={() => handleExit(`/ai-personas`)}
          >
            <IconPlayerStopFilled size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">End Session</span>
          </Button>

          {codingChallenge && (
            <Button 
              className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-full gap-2 px-4 h-9 animate-in fade-in zoom-in duration-300"
              onClick={() => setIsCodingModalOpen(true)}
            >
              <IconCode size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">Open Editor</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-12 overflow-hidden relative">
        {/* Background Ambient Glow */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none animate-pulse" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl relative z-10">
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent pointer-events-none" />


          {/* User Side */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "aspect-square relative group transition-all duration-500",
              isUserTalking && "ring-4 ring-emerald-500/30 rounded-[2.5rem]"
            )}
          >
            <div className="absolute inset-0 bg-card/50 rounded-[2.5rem] border border-border backdrop-blur-xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                <div className="relative">
                  <Avatar className={cn(
                    "size-48 rounded-[2rem] border-2 border-border shadow-2xl transition-all duration-500",
                    isUserTalking ? "ring-8 ring-emerald-500/20 scale-105" : "ring-4 ring-primary/20"
                  )}>
                    <AvatarImage src={user?.image || undefined} className="object-cover" />
                    <AvatarFallback className="bg-muted text-foreground text-6xl font-bold uppercase">
                      {user?.name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <AnimatePresence>
                    {isUserTalking && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute -bottom-4 -right-4 bg-emerald-500 p-2.5 rounded-2xl shadow-xl ring-4 ring-background"
                      >
                        <IconWaveSine size={20} className="text-white animate-pulse" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <div className="mt-8 text-center">
                  <h3 className="text-2xl font-bold tracking-tight">{user?.name || 'You'}</h3>
                  <p className="text-muted-foreground text-sm mt-1 uppercase tracking-widest font-bold">Candidate</p>
                </div>

                <AnimatePresence>
                  {isRecording && transcript && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-4 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
                    >
                      <p className="text-xs text-emerald-500 italic leading-relaxed line-clamp-2 text-center">
                        "{transcript}"
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="absolute bottom-12 w-full flex justify-center px-8">
                  <AnimatePresence mode="wait">
                    {isRecording || (!isAiTalking && !isThinking) ? (
                      <motion.div
                        layoutId="action-button-user"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="w-full"
                      >
                        <Button
                          onClick={toggleRecording}
                          disabled={isThinking}
                          className={cn(
                            "w-full h-12 rounded-xl border transition-all duration-300 font-bold uppercase tracking-widest text-xs gap-2 shadow-xl",
                            isRecording 
                              ? "bg-red-500 hover:bg-red-600 border-red-400 text-white shadow-red-500/20 shadow-lg" 
                              : "bg-emerald-500 hover:bg-emerald-600 border-emerald-400 text-white shadow-emerald-500/20 shadow-lg"
                          )}
                        >
                          {isRecording ? (
                            <>
                              <IconMicrophoneOff size={18} />
                              Close Mic
                            </>
                          ) : (
                            <>
                              <IconMicrophone size={18} />
                              Open Microphone
                            </>
                          )}
                        </Button>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>

          {/* AI Side */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className={cn(
              "aspect-square relative group transition-all duration-500",
              isAiTalking && "ring-4 ring-primary/30 rounded-[2.5rem]"
            )}
          >
            <div className="absolute inset-0 bg-card rounded-[2.5rem] border border-border backdrop-blur-xl overflow-hidden shadow-2xl">
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                <div className="relative">
                  <div className={cn(
                    "size-48 rounded-[2rem] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-2xl overflow-hidden transition-all duration-500 border border-primary/20",
                    isAiTalking ? "ring-8 ring-primary/20 scale-105" : "ring-4 ring-primary/10"
                  )}>
                    {persona?.avatarUrl ? (
                      <img src={persona.avatarUrl} alt={persona.firstName} className="w-full h-full object-cover" />
                    ) : (
                      <IconRobot size={80} className="text-primary/40" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent h-1/2 w-full animate-scan" style={{ animation: 'scan 3s linear infinite' }} />
                  </div>
                  
                  {isAiTalking && (
                    <div className="absolute -inset-4 rounded-[3rem] border-2 border-primary/30 animate-ping opacity-20 pointer-events-none" />
                  )}
                </div>

                <div className="mt-8 text-center flex flex-col items-center">
                  <h3 className="text-2xl font-bold tracking-tight">{persona?.firstName || session?.customAgent.name}</h3>
                  <p className="text-primary/60 text-sm mt-1 uppercase tracking-widest font-bold">Interviewer</p>
                </div>

                <div className="absolute bottom-12 w-full flex justify-center px-8">
                  <AnimatePresence mode="wait">
                    {isAiTalking || isThinking ? (
                      <motion.div
                        layoutId="action-button-ai"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="w-full"
                      >
                        <Button
                          disabled
                          className="w-full h-12 rounded-xl bg-primary/20 border border-primary/40 text-primary font-bold uppercase tracking-widest text-xs gap-3 opacity-100 shadow-xl shadow-lg"
                        >
                          <div className="flex gap-1 items-center">
                            {[1, 2, 3].map((i) => (
                              <motion.div
                                key={i}
                                animate={{ height: [4, 12, 4] }}
                                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                  className="w-1 bg-primary rounded-full"
                              />
                            ))}
                          </div>
                          {isThinking ? `${persona?.firstName || 'Agent'} is thinking...` : `${persona?.firstName || 'Agent'} is speaking...`}
                        </Button>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Decorative Bottom */}
      <div className="h-12 px-8 flex items-center justify-center relative z-50 bg-gradient-to-t from-background/80 to-transparent">
          <p className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-[0.4em]">Integrated Intelligence Interface v2.4.0</p>
      </div>

      {/* Coding Modal */}
      <AnimatePresence>
        {isCodingModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCodingModalOpen(false)}
              className="absolute inset-0 bg-background/60 backdrop-blur-3xl"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-[98vw] h-[96vh] bg-background border border-border rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
            >
              <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                {/* Problem Desc */}
                <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-border p-10 flex flex-col gap-6 overflow-y-auto bg-muted/20">
                    <div className="flex items-center gap-3 text-primary mb-2">
                        <IconSparkles size={24} className="animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Agent Assignment</span>
                    </div>
                    <h2 className="text-4xl font-black tracking-tighter leading-none">{codingChallenge?.title || 'System Protocol'}</h2>
                    <div className="prose prose-sm prose-invert opacity-80 leading-relaxed max-w-none">
                        <ReactMarkdown>{codingChallenge?.description || 'Waiting for agent instructions...'}</ReactMarkdown>
                    </div>
                    
                    <div className="mt-auto pt-10 border-t border-primary/10">
                        <div className="flex items-center gap-3 text-emerald-500 mb-2">
                        <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] uppercase font-black tracking-widest">Compiler Operational</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground/60 uppercase font-bold tracking-widest">Env: {codingChallenge?.language || 'universal'} core</p>
                    </div>
                </div>

                {/* Editor */}
                <div className="flex-1 flex flex-col bg-background relative">
                  <div className="h-14 border-b border-border flex items-center px-8 justify-between bg-muted/10">
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2">
                        <div className="size-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
                        <div className="size-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
                        <div className="size-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
                      </div>
                      <div className="h-4 w-px bg-border mx-2" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Source Interaction Layer</span>
                    </div>
                    <button onClick={() => setIsCodingModalOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
                      <IconX size={20} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-auto font-mono text-base p-4">
                    <CodeMirror
                      value={currentCode}
                      height="100%"
                      theme={theme === "dark" ? githubDark : githubLight}
                      extensions={[
                        codingChallenge?.language === 'javascript' ? javascript({ jsx: true }) : 
                        codingChallenge?.language === 'python' ? python() : 
                        cpp()
                      ]}
                      onChange={(val) => setCurrentCode(val)}
                      className="h-full rounded-2xl overflow-hidden border border-border/50"
                    />
                  </div>
                </div>
              </div>

              <div className="h-24 border-t border-border px-12 flex items-center justify-between bg-muted/5">
                <div className="hidden sm:block">
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Sychronous Uplink</p>
                  <p className="text-[10px] text-muted-foreground/40 italic">Code changes are mirrored to the persona's neural buffer.</p>
                </div>
                
                <div className="flex gap-4">
                  <Button variant="ghost" size="lg" onClick={() => setIsCodingModalOpen(false)} className="text-muted-foreground uppercase font-black text-[10px] tracking-widest">
                    Continue Drafting
                  </Button>
                  <Button 
                    size="lg"
                    onClick={() => {
                        setIsCodingModalOpen(false)
                        handleSend("I've updated the code. Please review it.", { code: currentCode })
                    }}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-[0.2em] text-[10px] px-12 h-14 rounded-2xl shadow-2xl shadow-primary/20"
                  >
                    Commit Logic
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }
        .cm-editor {
          outline: none !important;
        }
        .cm-scroller {
          font-family: var(--font-mono) !important;
        }
      `}</style>
    </div>
  )
}
