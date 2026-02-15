"use client"

import * as React from "react"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
  IconClock,
  IconTerminal,
  IconShoppingCart,
  IconScale,
  IconRobot,
} from "@tabler/icons-react"

import { Github, X } from "lucide-react"
import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { Logo } from "@/components/logo"
import { HelpDialog } from "@/components/search-dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Progress",
      url: "/progress",
      icon: IconChartBar,
    },
    {
      title: "Sessions",
      url: "/sessions",
      icon: IconClock,
    },
    {
      title: "Interviews",
      url: "/interviews",
      icon: IconUsers,
    },
    {
      title: "Debates",
      url: "/debates",
      icon: IconReport,
    },
    {
      title: "AI Personas",
      url: "/ai-personas",
      icon: IconRobot,
    },
    {
      title: "Marketplace",
      url: "/marketplace",
      icon: IconShoppingCart,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "?search=true",
      icon: IconSearch,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isMobile, setOpenMobile } = useSidebar()
  const [isHelpOpen, setIsHelpOpen] = React.useState(false)
  const [recommendedItems, setRecommendedItems] = React.useState<any[]>([])

  React.useEffect(() => {
    const fetchRecommended = async () => {
      try {
        const res = await fetch("/api/marketplace/recommended")
        if (res.ok) {
          const items = await res.json()
          setRecommendedItems(items.map((item: any) => ({
            name: item.name,
            url: `/marketplace/items/${item.id}`,
            icon: item.type === 'interview' ? IconUsers : item.type === 'debate' ? IconScale : IconRobot
          })))
        }
      } catch (error) {
        console.error("Failed to fetch recommended items:", error)
      }
    }
    fetchRecommended()
  }, [])

  const filteredNavSecondary = isMobile
    ? data.navSecondary.filter((item) => item.title !== "Search").map(item => 
        item.title === "Get Help" ? { ...item, onClick: () => setIsHelpOpen(true) } : item
      )
    : data.navSecondary.map(item => 
        item.title === "Get Help" ? { ...item, onClick: () => setIsHelpOpen(true) } : item
      )

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <div className="flex items-center justify-between p-2">
          <a href="#" className="hover:bg-transparent transition-none">
            <Logo className="!p-0" />
          </a>
          {isMobile ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpenMobile(false)}
              className="h-8 w-8 hover:bg-transparent"
            >
              <X className="size-5" />
              <span className="sr-only">Close Sidebar</span>
            </Button>
          ) : (
            <Button variant="ghost" asChild size="icon">
              <a
                href="https://github.com/lwshakib/amplify-own-your-voice"
                rel="noopener noreferrer"
                target="_blank"
                className="text-muted-foreground hover:text-foreground"
              >
                <Github className="size-4" />
                <span className="sr-only">GitHub</span>
              </a>
            </Button>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="overflow-visible">
        <NavMain items={data.navMain} />
        <NavDocuments items={recommendedItems} title="Recommended" />
        <NavSecondary items={filteredNavSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>{!isMobile && <NavUser user={data.user} />}</SidebarFooter>
      <HelpDialog open={isHelpOpen} onOpenChange={setIsHelpOpen} />
    </Sidebar>
  )
}
