import QueryProvider from "@/components/providers/QueryProvider"
import { Home } from "lucide-react"
import ExpensesTable from "./ExpensesTable"

interface Props {
  userRoles: string[]
}

export default function ExpensesPageRoot({ userRoles }: Props) {
  const isOwnerTenant = userRoles.includes("OWNER") || userRoles.includes("TENANT")
  const title = isOwnerTenant ? "Mis Expensas" : "Expensas"
  const description = isOwnerTenant
    ? "Expensas de sus departamentos"
    : "Gestión de expensas"

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
        <ExpensesTable userRoles={userRoles} />
      </div>
    </QueryProvider>
  )
}
