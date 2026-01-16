import { Outlet, useRouterState } from "@tanstack/react-router"

import { Header } from "@/components/Header"
import { Sidebar } from "@/components/Sidebar"

export function AppShell() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  if (pathname.startsWith("/login")) {
    return <Outlet />
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground md:flex-row">
      <aside className="hidden w-64 border-r border-border md:block">
        <Sidebar />
      </aside>
      <main className="flex min-h-screen flex-1 flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto w-full max-w-6xl space-y-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
