import QueryProvider from "@/components/providers/QueryProvider"
import { Home } from "lucide-react"
import TicketsTable from "./TicketsTable"
import type { Ticket } from "@/hooks/useTickets"

interface Props {
  userRoles: string[]
}

export default function TicketsPageRoot({ userRoles }: Props) {
  const isAdmin = userRoles.includes("ADMIN")
  const isManager = userRoles.includes("MANAGER")
  const isOwnerTenant = userRoles.includes("OWNER") || userRoles.includes("TENANT")

  const title = isAdmin ? "Tickets" : isManager ? "Tickets Asignados" : "Mis Tickets"
  const description =
    isAdmin
      ? "Todos los tickets del sistema"
      : isManager
        ? "Tickets asignados a usted"
        : "Tickets creados por usted"

  return (
    <QueryProvider>
      <div className="space-y-6">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <a href="/dashboard" className="hover:text-foreground transition-colors">
            <Home className="size-4" />
          </a>
          <span>/</span>
          <span className="text-foreground font-medium">{title}</span>
        </nav>
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <TicketsTable userRoles={userRoles} />
      </div>
    </QueryProvider>
  )
}
