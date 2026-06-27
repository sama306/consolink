import QueryProvider from "@/components/providers/QueryProvider"
import { Home } from "lucide-react"
import DocumentsTable from "./DocumentsTable"

interface Props {
  userRoles: string[]
}

export default function DocumentsPageRoot({ userRoles }: Props) {
  return (
    <QueryProvider>
      <div className="space-y-6">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <a href="/dashboard" className="hover:text-foreground transition-colors">
            <Home className="size-4" />
          </a>
          <span>/</span>
          <span className="text-foreground font-medium">Documentos</span>
        </nav>
        <div>
          <h1 className="text-2xl font-semibold">Documentos</h1>
          <p className="text-sm text-muted-foreground mt-1">Documentos del consorcio</p>
        </div>
        <DocumentsTable userRoles={userRoles} />
      </div>
    </QueryProvider>
  )
}
