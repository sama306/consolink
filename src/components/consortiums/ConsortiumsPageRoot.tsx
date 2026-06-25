import QueryProvider from "@/components/providers/QueryProvider"
import ConsortiumsTable from "./ConsortiumsTable"

export default function ConsortiumsPageRoot() {
  return (
    <QueryProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Consorcios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Listado de consorcios administrados
          </p>
        </div>
        <ConsortiumsTable />
      </div>
    </QueryProvider>
  )
}
