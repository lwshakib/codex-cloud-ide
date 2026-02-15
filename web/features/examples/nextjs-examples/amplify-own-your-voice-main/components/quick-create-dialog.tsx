"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  IconUsers,
  IconScale,
  IconRobot,
  IconArrowLeft,
  IconSearch,
  IconMessageDots,
  IconDeviceGamepad2,
  IconBuildingCommunity
} from "@tabler/icons-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

type Category = "interviews" | "debates" | "ai-personas"

interface Item {
  id: string
  title: string
  subtitle?: string
}

export function QuickCreateDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [step, setStep] = React.useState<"category" | "items">("category")
  const [category, setCategory] = React.useState<Category | null>(null)
  const [items, setItems] = React.useState<Item[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const fetchItems = async (cat: Category) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/${cat}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.map((item: any) => ({
          id: item.id,
          title: cat === "interviews" ? item.jobTitle : item.name || item.subject,
          subtitle: cat === "interviews" ? "Interview Template" : cat === "debates" ? "Debate Template" : "AI Persona"
        })))
      }
    } catch (error) {
      console.error(`Failed to fetch ${cat}:`, error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCategorySelect = (cat: Category) => {
    setCategory(cat)
    setStep("items")
    fetchItems(cat)
  }

  const handleBack = () => {
    setStep("category")
    setCategory(null)
    setItems([])
    setSearchQuery("")
  }

  const handleItemSelect = (id: string) => {
    onOpenChange(false)
    router.push(`/${category}/${id}`)
  }

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-zinc-950 border-zinc-900 shadow-2xl">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-2">
            {step === "items" && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground mr-1" onClick={handleBack}>
                <IconArrowLeft className="size-4" />
              </Button>
            )}
            <DialogTitle className="text-xl">
              {step === "category" ? "Quick Create" : `Select ${category === "interviews" ? "Interview" : category === "debates" ? "Debate" : "Persona"}`}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="p-6 pt-4">
          {step === "category" ? (
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => handleCategorySelect("interviews")}
                className="group flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-primary/50 transition-all text-left"
              >
                <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <IconMessageDots className="size-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">Interviews</div>
                  <div className="text-sm text-muted-foreground">Practice for your next job</div>
                </div>
              </button>

              <button
                onClick={() => handleCategorySelect("debates")}
                className="group flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-primary/50 transition-all text-left"
              >
                <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                  <IconDeviceGamepad2 className="size-5 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">Debates</div>
                  <div className="text-sm text-muted-foreground">Challenge yourself with argumentation</div>
                </div>
              </button>

              <button
                onClick={() => handleCategorySelect("ai-personas")}
                className="group flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-primary/50 transition-all text-left"
              >
                <div className="size-10 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                  <IconRobot className="size-5 text-purple-500" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">AI Personas</div>
                  <div className="text-sm text-muted-foreground">Talk to unique personalities</div>
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  className="pl-9 bg-zinc-900 border-zinc-800 focus-visible:ring-primary/50"
                  placeholder={`Search ${category}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <ScrollArea className="h-[300px] -mx-1 px-1">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-10 text-center text-muted-foreground">
                    <IconBuildingCommunity className="size-10 mb-2 opacity-20" />
                    <div className="text-sm">No {category} found.</div>
                    <Button 
                      variant="link" 
                      className="text-primary text-xs"
                      onClick={() => {
                        onOpenChange(false)
                        router.push(`/${category}`)
                      }}
                    >
                      Go create one
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {filteredItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleItemSelect(item.id)}
                        className="flex flex-col items-start gap-0.5 p-3 rounded-lg border border-transparent bg-zinc-900/30 hover:bg-zinc-900 hover:border-zinc-800 transition-all text-left"
                      >
                        <div className="font-medium flex items-center gap-2">
                          {item.title}
                        </div>
                        <div className="text-xs text-muted-foreground">{item.subtitle}</div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
