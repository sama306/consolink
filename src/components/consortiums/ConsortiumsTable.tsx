import { useConsortiums } from "@/hooks/useConsortiums"

export default function ConsortiumsTable() {
  const { data, isLoading, error } = useConsortiums({ limit: 20 })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Cargando consorcios…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {(error as Error).message}
      </div>
    )
  }

  const items = data?.items ?? []

  if (items.length === 0) {
    return (
      <div className="rounded-lg border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        No hay consorcios registrados.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Nombre</th>
            <th className="px-4 py-3 text-left font-medium">Ciudad</th>
            <th className="px-4 py-3 text-left font-medium">Provincia</th>
            <th className="px-4 py-3 text-left font-medium">Teléfono</th>
            <th className="px-4 py-3 text-left font-medium">Email</th>
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">{c.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{c.city ?? "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{c.province ?? "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{c.phone ?? "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{c.email ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
