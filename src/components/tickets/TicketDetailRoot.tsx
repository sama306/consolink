import QueryProvider from "@/components/providers/QueryProvider"
import { Home, ArrowLeft } from "lucide-react"
import TicketDetailView from "./TicketDetailView"

interface Props {
  ticketId: string
  userRoles: string[]
}

export default function TicketDetailRoot({ ticketId, userRoles }: Props) {
  return (
    <QueryProvider>
      <div className="space-y-6">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <a href="/dashboard" className="hover:text-foreground transition-colors">
            <Home className="size-4" />
          </a>
          <span>/</span>
          <a href="/dashboard/tickets" className="hover:text-foreground transition-colors">
            Tickets
          </a>
          <span>/</span>
          <span className="text-foreground font-medium">Detalle</span>
        </nav>
        <TicketDetailView ticketId={ticketId} userRoles={userRoles} />
      </div>
    </QueryProvider>
  )
}
