"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { IconArrowLeft, IconSparkles } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function CreateInterviewPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [description, setDescription] = useState("")
  const [jobTitle, setJobTitle] = useState("")

  const handleGenerateDescription = async () => {
    if (!jobTitle) {
      alert("Please enter a job title first.")
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch("/api/generate-job-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle }),
      })

      if (!response.ok) throw new Error("Failed to generate")

      const data = await response.json()
      setDescription(data.description)
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to generate job description. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }



  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, description }),
      })

      if (!response.ok) throw new Error("Failed to create interview")

      setIsSubmitting(false)
      router.push("/interviews")
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to create interview. Please try again.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-8 pt-6">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/interviews">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <IconArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Interview</h1>
            <p className="text-muted-foreground mt-1">
              Set up a new interview session. An AI interviewer will be automatically assigned.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Header already has info about AI selection */}

          {/* Job Title Section */}
          <div className="space-y-4">
            <Label htmlFor="jobTitle" className="text-lg font-semibold">
              Job title
            </Label>
            <Input
              id="jobTitle"
              name="jobTitle"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Frontend Developer"
              className="h-12 bg-muted/20 border-muted/50"
              required
            />
          </div>

          {/* Job Description Section */}
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-lg font-semibold">
                Paste the job description here
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Or generate job description</span>
                <Button 
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateDescription}
                  disabled={isGenerating}
                  className="bg-[#3D1D4C] hover:bg-[#4D2461] text-[#E0B0FF] border-none flex items-center gap-1.5 h-7 px-3 text-xs font-medium rounded-md disabled:opacity-50"
                >
                  <IconSparkles className="size-3.5 fill-[#E0B0FF]" />
                  {isGenerating ? "Generating..." : "Generate"}
                </Button>
              </div>
            </div>
            
            <Textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. We are seeking a React.js Developer to join our dynamic team in..."
              className="min-h-[300px] bg-muted/20 border-muted/50 p-4 resize-none"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <Link href="/interviews">
              <Button type="button" variant="outline" className="px-8">
                Cancel
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={isSubmitting || isGenerating}
              className="px-8 bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? "Creating..." : "Create Interview"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
