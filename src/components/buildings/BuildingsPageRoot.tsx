import QueryProvider from "@/components/providers/QueryProvider"
import { Home } from "lucide-react"
import BuildingsTable from "./BuildingsTable"

export default function BuildingsPageRoot() {
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
          <span className="text-foreground font-medium">Edificios</span>
        </nav>

        <div>
          <h1 className="text-2xl font-semibold">Edificios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Listado de edificios por consorcio
          </p>
        </div>

        <BuildingsTable />
      </div>
    </QueryProvider>
  )
}
