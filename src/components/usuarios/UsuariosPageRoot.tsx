import QueryProvider from "@/components/providers/QueryProvider"
import { Home } from "lucide-react"
import UsuariosTable from "./UsuariosTable"

export default function UsuariosPageRoot() {
  return (
    <QueryProvider>
      <div className="space-y-6">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <a href="/dashboard" className="hover:text-foreground transition-colors">
            <Home className="size-4" />
          </a>
          <span>/</span>
          <span className="text-foreground font-medium">Usuarios</span>
        </nav>
        <div>
          <h1 className="text-2xl font-semibold">Usuarios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión de cuentas de usuario del sistema
          </p>
        </div>
        <UsuariosTable />
      </div>
    </QueryProvider>
  )
}
