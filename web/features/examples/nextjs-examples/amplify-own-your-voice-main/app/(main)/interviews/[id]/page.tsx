"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { IconArrowLeft, IconPlayerPlay, IconPencil, IconCheck, IconX } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { formatDistanceToNow } from "date-fns"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Interview {
  id: string
  jobTitle: string
  description: string
  createdAt: string
}

export default function InterviewDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [interview, setInterview] = useState<Interview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isStarting, setIsStarting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedDescription, setEditedDescription] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const response = await fetch(`/api/interviews/${id}`)
        if (!response.ok) throw new Error("Failed to fetch")
        const data = await response.json()
        setInterview(data)
        setEditedDescription(data.description)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchInterview()
  }, [id])

  const handleStartSession = async () => {
    setIsStarting(true)
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId: id }),
      })

      if (!response.ok) throw new Error("Failed to start session")

      const session = await response.json()
      router.push(`/sessions/${session.id}/run`)
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to start session. Please try again.")
    } finally {
      setIsStarting(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/interviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: editedDescription }),
      })

      if (!response.ok) throw new Error("Failed to update")

      const updatedInterview = await response.json()
      setInterview(updatedInterview)
      setIsEditing(false)
    } catch (error) {
      console.error("Error updating:", error)
      alert("Failed to save changes. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedDescription(interview?.description || "")
    setIsEditing(false)
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Loading interview details...</p>
      </div>
    )
  }

  if (!interview) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Interview not found</p>
        <Link href="/interviews">
          <Button variant="outline">Back to Interviews</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-8 pt-6">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/interviews">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <IconArrowLeft className="size-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{interview.jobTitle}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">
                  Created {formatDistanceToNow(new Date(interview.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
          <Button 
            onClick={handleStartSession} 
            disabled={isStarting || isEditing}
            className="bg-primary hover:bg-primary/90"
          >
            <IconPlayerPlay className="mr-2 size-4 fill-current" />
            {isStarting ? "Starting..." : "Start a new session"}
          </Button>
        </div>

        {/* Content */}
        <div className="grid gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Job Description</CardTitle>
              {!isEditing ? (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsEditing(true)}
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                >
                  <IconPencil className="mr-2 size-4" />
                  Edit
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleCancel}
                    className="h-8 px-2 text-muted-foreground hover:text-foreground"
                    disabled={isSaving}
                  >
                    <IconX className="mr-2 size-4" />
                    Cancel
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={handleSave}
                    className="h-8 px-2 text-primary"
                    disabled={isSaving}
                  >
                    <IconCheck className="mr-2 size-4" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="min-h-[400px] bg-muted/20 border-muted/50 p-4 font-mono text-sm leading-relaxed resize-none"
                  placeholder="Enter job description in Markdown..."
                  disabled={isSaving}
                />
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {interview.description}
                  </ReactMarkdown>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
