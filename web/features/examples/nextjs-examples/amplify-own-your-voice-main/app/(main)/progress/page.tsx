"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { TrendingUp } from "lucide-react"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"
import { IconPlus, IconUsers, IconClock, IconChartBar } from "@tabler/icons-react"

import { authClient } from "@/lib/auth-client"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Button } from "@/components/ui/button"

const chartConfig = {
  desktop: {
    label: "Score",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

interface ProgressData {
  totalInterviews: number
  totalDurationSeconds: number
  averageScore: string
  radarData: { metric: string; desktop: number }[]
  recentFeedbacks: { title: string; description: string; score: number }[]
}

export default function ProgressPage() {
  const session = authClient.useSession()
  const user = session.data?.user
  const [data, setData] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await fetch("/api/progress")
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (error) {
        console.error("Failed to fetch progress", error)
      } finally {
        setLoading(false)
      }
    }
    fetchProgress()
  }, [])

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${h}h ${m}m`
  }

  if (loading) {
    return <div className="p-8 text-muted-foreground">Loading progress...</div>
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-8 pt-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Hello, {user?.name?.split(' ')[0] || "there"}!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s an overview of your progress and upcoming goals.
          </p>
        </div>
        <Link href="/interviews/create">
          <Button variant="default" className="w-fit font-medium">
            <IconPlus className="mr-2 size-4" />
            Create interview
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card/30 backdrop-blur-sm border-muted/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Interviews</CardTitle>
            <IconUsers className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalInterviews || 0}</div>
            <p className="text-xs text-muted-foreground">Created interviews</p>
          </CardContent>
        </Card>
        <Card className="bg-card/30 backdrop-blur-sm border-muted/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Spoken Time</CardTitle>
            <IconClock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(data?.totalDurationSeconds || 0)}</div>
            <p className="text-xs text-muted-foreground">Active speaking time</p>
          </CardContent>
        </Card>
        <Card className="bg-card/30 backdrop-blur-sm border-muted/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <IconChartBar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.averageScore || "0.0"}/100</div>
            <p className="text-xs text-muted-foreground">Overall performance</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="items-center pb-0">
            <CardTitle>Skills Overview</CardTitle>
            <CardDescription>
              Detailed breakdown of your speaking performance
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-0">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[350px]"
            >
              <RadarChart data={data?.radarData || []}>
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <PolarAngleAxis dataKey="metric" />
                <PolarGrid />
                <Radar
                  dataKey="desktop"
                  fill="var(--color-primary)"
                  fillOpacity={0.4}
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={{
                    r: 4,
                    fillOpacity: 1,
                    fill: "var(--color-primary)"
                  }}
                />
              </RadarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col gap-2 text-sm">
            <div className="flex items-center gap-2 leading-none font-medium text-emerald-500">
              Your average skills profile based on all sessions <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              Keep practicing to improve specific areas
            </div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Insights</CardTitle>
            <CardDescription>Latest AI-generated feedback</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data?.recentFeedbacks && data.recentFeedbacks.length > 0 ? (
              data.recentFeedbacks.map((item, i) => (
                <div key={i} className="space-y-2">
                  <p className="text-sm font-medium leading-none">{item.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2" title={item.description}>
                    {item.description}
                  </p>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${item.score}%` }} 
                    />
                  </div>
                </div>
              ))
            ) : (
               <div className="text-sm text-muted-foreground">No feedback available yet.</div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="w-full text-xs" size="sm" disabled>
              View all insights
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}