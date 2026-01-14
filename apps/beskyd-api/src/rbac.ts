export type UserRole = "decision-maker" | "analyst" | "expert" | "data-operator" | "viewer"

export interface AuthUser {
  id: string
  role?: UserRole | null
}

export const resolveRole = (user: AuthUser | null | undefined): UserRole => user?.role ?? "viewer"

export const isRoleAllowed = (role: UserRole, allowed: readonly UserRole[]): boolean =>
  allowed.includes(role)
