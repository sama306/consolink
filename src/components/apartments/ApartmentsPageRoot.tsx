import QueryProvider from "@/components/providers/QueryProvider"
import { Home } from "lucide-react"
import ApartmentsTable from "./ApartmentsTable"

export default function ApartmentsPageRoot() {
  return (
    <QueryProvider>
      <div className="space-y-6">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <a href="/dashboard" className="hover:text-foreground transition-colors">
            <Home className="size-4" />
          </a>
          <span>/</span>
          <a href="/dashboard/consorcios" className="hover:text-foreground transition-colors">
            Consorcios
          </a>
          <span>/</span>
          <a href="/dashboard/edificios" className="hover:text-foreground transition-colors">
            Edificios
          </a>
          <span>/</span>
          <span className="text-foreground font-medium">Departamentos</span>
        </nav>

        <div>
          <h1 className="text-2xl font-semibold">Departamentos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Listado de departamentos por edificio
          </p>
        </div>

        <ApartmentsTable />
      </div>
    </QueryProvider>
  )
}
