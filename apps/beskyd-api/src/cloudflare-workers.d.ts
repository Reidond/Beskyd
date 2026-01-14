declare module "cloudflare:workers" {
  export const env: {
    DB: import("@cloudflare/workers-types").D1Database
    BETTER_AUTH_SECRET: string
    BETTER_AUTH_URL: string
    TRUSTED_ORIGINS?: string
  }
}
