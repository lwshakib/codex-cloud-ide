import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SearchDialog } from "@/components/search-dialog"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import NextTopLoader from "nextjs-toploader";
import { Suspense } from "react"

export default function MainLayoutPage({children}: {children: React.ReactNode}) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
         <NextTopLoader 
            color="var(--primary)"
            initialPosition={0.08}
            crawlSpeed={200}
            height={2}
            crawl={true}
            showSpinner={false}
            easing="ease"
            speed={200}
            shadow="0 0 10px var(--primary), 0 0 5px var(--primary)"
          />
      <AppSidebar variant="inset" />
      <SidebarInset>
        <Suspense>
          <SiteHeader />
        </Suspense>
        {children}
      </SidebarInset>
      <Suspense>
        <SearchDialog />
      </Suspense>
    </SidebarProvider>
  )
}
