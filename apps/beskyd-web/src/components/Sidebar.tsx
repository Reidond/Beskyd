import { Link } from "@tanstack/react-router"
import { ClipboardList, FileInput, MapPin, Settings } from "lucide-react"

const navItems = [
  { to: "/regions", label: "Regions", icon: MapPin },
  { to: "/data/participants/new", label: "Participant Entry", icon: FileInput },
  { to: "/data/experts/new", label: "Expert Entry", icon: ClipboardList },
  { to: "/admin/model-config", label: "Model Config", icon: Settings },
]

export function Sidebar() {
  return (
    <div className="flex h-full flex-col gap-2 p-4">
      <div className="flex items-center gap-3 px-3 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
          B
        </div>
        <div>
          <div className="text-lg font-semibold">beskyd</div>
          <div className="text-xs text-muted-foreground">Risk platform</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground [&.active]:bg-secondary [&.active]:text-foreground"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <Link
        to="/login"
        className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        Sign out
      </Link>
    </div>
  )
}
