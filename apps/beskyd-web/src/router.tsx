import type { QueryClient } from "@tanstack/react-query"
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router"
import { AppShell } from "@/components/AppShell"
import { ExpertsFormPage } from "@/pages/ExpertsFormPage"
import { LoginPage } from "@/pages/LoginPage"
import { ModelConfigPage } from "@/pages/ModelConfigPage"
import { ParticipantsFormPage } from "@/pages/ParticipantsFormPage"
import { RegionDetailPage } from "@/pages/RegionDetailPage"
import { RegionsPage } from "@/pages/RegionsPage"
import { queryClient } from "@/queryClient"

interface RouterContext {
  queryClient: QueryClient
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: AppShell,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/regions" })
  },
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
})

const regionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/regions",
  component: RegionsPage,
})

const regionDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/regions/$regionId",
  component: RegionDetailPage,
})

const participantsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/data/participants/new",
  component: ParticipantsFormPage,
})

const expertsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/data/experts/new",
  component: ExpertsFormPage,
})

const modelConfigRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/model-config",
  component: ModelConfigPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  regionsRoute,
  regionDetailRoute,
  participantsRoute,
  expertsRoute,
  modelConfigRoute,
])

export const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
