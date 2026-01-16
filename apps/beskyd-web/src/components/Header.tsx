export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border px-6 md:px-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">
          Decision
        </span>
        <span>/</span>
        <span className="text-foreground">Risk Intelligence</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
          DM
        </div>
      </div>
    </header>
  )
}
