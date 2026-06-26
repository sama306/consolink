import QueryProvider from "@/components/providers/QueryProvider"
import { Home } from "lucide-react"
import OwnersTable from "./OwnersTable"

export default function OwnersPageRoot() {
  return (
    <QueryProvider>
      <div className="space-y-6">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <a href="/dashboard" className="hover:text-foreground transition-colors">
            <Home className="size-4" />
          </a>
          <span>/</span>
          <span className="text-foreground font-medium">Propietarios</span>
        </nav>

        <div>
          <h1 className="text-2xl font-semibold">Propietarios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Listado de propietarios registrados
          </p>
        </div>

        <OwnersTable />
      </div>
    </QueryProvider>
  )
}
