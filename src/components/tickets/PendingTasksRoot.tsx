import QueryProvider from "@/components/providers/QueryProvider"
import { Home } from "lucide-react"
import TicketsTable from "./TicketsTable"

interface Props {
  userRoles: string[]
}

export default function PendingTasksRoot({ userRoles }: Props) {
  return (
    <QueryProvider>
      <div className="space-y-6">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <a href="/dashboard" className="hover:text-foreground transition-colors">
            <Home className="size-4" />
          </a>
          <span>/</span>
          <span className="text-foreground font-medium">Tareas Pendientes</span>
        </nav>
        <div>
          <h1 className="text-2xl font-semibold">Tareas Pendientes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tickets que está trabajando actualmente
          </p>
        </div>
        <TicketsTable userRoles={userRoles} forcedStatus="IN_PROGRESS" />
      </div>
    </QueryProvider>
  )
}
