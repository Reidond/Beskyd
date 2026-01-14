import { cors } from "@elysiajs/cors"
import { Elysia } from "elysia"
import { CloudflareAdapter } from "elysia/adapter/cloudflare-worker"

import { getAuth } from "./auth"
import { getEnv } from "./env"
import { assessmentsRoutes } from "./routes/assessments"
import { computeRoutes } from "./routes/compute"
import { configRoutes } from "./routes/config"
import { resultsRoutes } from "./routes/results"

const resolveCorsOrigins = () => {
  const env = getEnv()
  if (!env.TRUSTED_ORIGINS) {
    return [env.BETTER_AUTH_URL]
  }

  return env.TRUSTED_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)
}

const app = new Elysia({ adapter: CloudflareAdapter })
  .use(
    cors({
      origin: resolveCorsOrigins(),
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )
  .all("/api/auth/*", ({ request }) => getAuth().handler(request))
  .get("/health", () => ({ status: "ok" }))
  .use(assessmentsRoutes)
  .use(configRoutes)
  .use(computeRoutes)
  .use(resultsRoutes)
  .compile()

export default app
