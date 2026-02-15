import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Fetch all interview sessions for the user
    const sessions = await prisma.interviewSession.findMany({
      where: {
        userId: userId,
        status: "Completed", // Only consider completed sessions for stats? Or all? User said "real data", usually means completed or all activity. Let's use all for duration/count, but maybe completed for scores? Let's use all where metrics > 0 to be safe.
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        messages: {
           where: {
             role: 'user',
             feedback: { not: null }
           },
           orderBy: {
             createdAt: 'desc'
           },
           take: 1
        }
      }
    })

    // 1. Total Interviews (from the Interview model, not sessions)
    // The user wants the count of "Interviews" created, which matches the "Interviews Page" count.
    const totalInterviews = await prisma.interview.count({
      where: {
        userId: userId
      }
    })

    // 2. Total Spoken Time
    const totalDurationSeconds = sessions.reduce((acc, curr) => acc + curr.duration, 0)
    
    // 3. Average Score (overall across all metrics)
    // We need to calculate the average of all 8 metrics for each session, then average those.
    // Actually, just sum up all metrics across all sessions and divide by count * 8.
    // But we need to handle zeros (unscored sessions).
    
    let totalScoreSum = 0
    let totalScoreCount = 0

    // For Radar Chart (Average per metric)
    const metricSums = {
      correctness: 0,
      clarity: 0,
      relevance: 0,
      detail: 0,
      efficiency: 0,
      creativity: 0,
      communication: 0,
      problemSolving: 0
    }
    let metricCounts = { ...metricSums }

    sessions.forEach(session => {
      // Check if session has metrics (sum > 0)
      const sum = session.correctness + session.clarity + session.relevance + session.detail + session.efficiency + session.creativity + session.communication + session.problemSolving
      if (sum > 0) {
        // Add to total score calculation
        totalScoreSum += (sum / 8) // Average for this session
        totalScoreCount++

        // Add to individual metrics
        metricSums.correctness += session.correctness
        metricSums.clarity += session.clarity
        metricSums.relevance += session.relevance
        metricSums.detail += session.detail
        metricSums.efficiency += session.efficiency
        metricSums.creativity += session.creativity
        metricSums.communication += session.communication
        metricSums.problemSolving += session.problemSolving

        Object.keys(metricCounts).forEach(key => {
           // @ts-ignore
           if (session[key] > 0) metricCounts[key]++
           // Or just increment count if we assume all 8 are set if one is set? 
           // Let's assume valid session has metrics.
        })
      }
    })

    const averageScore = totalScoreCount > 0 ? (totalScoreSum / totalScoreCount).toFixed(1) : "0.0"

    // Prepare Radar Data
    const radarData = Object.keys(metricSums).map(key => ({
      metric: key.charAt(0).toUpperCase() + key.slice(1),
      // @ts-ignore
      desktop: totalScoreCount > 0 ? Math.round(metricSums[key] / totalScoreCount) : 0 
      // Using totalScoreCount as divisor assuming all metrics appear together.
    }))

    // Recent Insights
    // Get the most recent feedbacks
    const recentFeedbacks = sessions
      .filter(s => s.messages.length > 0 && s.messages[0].feedback)
      .slice(0, 3)
      .map(s => ({
        title: "Feedback from " + s.createdAt.toLocaleDateString(),
        description: s.messages[0].feedback, // This might be long, but UI truncates?
        score: Math.round((s.correctness + s.clarity + s.relevance + s.detail + s.efficiency + s.creativity + s.communication + s.problemSolving) / 8)
      }))

    return NextResponse.json({
      totalInterviews,
      totalDurationSeconds,
      averageScore,
      radarData,
      recentFeedbacks
    })

  } catch (error) {
    console.error("Error fetching progress:", error)
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 })
  }
}
