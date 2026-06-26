import { useState } from "react"
import { useConsortiums, useDeleteConsortium, type Consortium } from "@/hooks/useConsortiums"
import { useDebounce } from "@/lib/use-debounce"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Pencil, Trash2, Building2, AlertTriangle } from "lucide-react"
import ConsortiumFormDialog from "./ConsortiumFormDialog"

export default function ConsortiumsTable() {
  const [page, setPage] = useState(1)
  const [cityFilter, setCityFilter] = useState("")
  const [provinceFilter, setProvinceFilter] = useState("")
  const debouncedCity = useDebounce(cityFilter, 300)
  const debouncedProvince = useDebounce(provinceFilter, 300)
  const [formOpen, setFormOpen] = useState(false)
  const [editingConsortium, setEditingConsortium] = useState<Consortium | null>(null)
  const [deletingConsortium, setDeletingConsortium] = useState<Consortium | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const params: Record<string, unknown> = { page, limit: 20 }
  if (debouncedCity) params.city = debouncedCity
  if (debouncedProvince) params.province = debouncedProvince

  const { data, isLoading, error } = useConsortiums(params)
  const deleteMutation = useDeleteConsortium()

  const handleEdit = (c: Consortium) => {
    setEditingConsortium(c)
    setFormOpen(true)
  }

  const handleCreate = () => {
    setEditingConsortium(null)
    setFormOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingConsortium) return
    setDeleteError(null)
    try {
      await deleteMutation.mutateAsync(deletingConsortium.id)
      setDeletingConsortium(null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al eliminar"
      setDeleteError(message)
    }
  }

  const items = data?.items ?? []
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="city-filter" className="text-xs">Ciudad</Label>
          <Input
            id="city-filter"
            placeholder="Filtrar por ciudad"
            className="h-7 w-40 text-xs"
            value={cityFilter}
            onChange={(e) => { setCityFilter(e.target.value); setPage(1) }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="province-filter" className="text-xs">Provincia</Label>
          <Input
            id="province-filter"
            placeholder="Filtrar por provincia"
            className="h-7 w-40 text-xs"
            value={provinceFilter}
            onChange={(e) => { setProvinceFilter(e.target.value); setPage(1) }}
          />
        </div>
        <Button onClick={handleCreate} size="sm" className="ml-auto">
          <Plus /> Nuevo consorcio
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">Cargando consorcios…</p>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {(error as Error).message}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          No hay consorcios registrados.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Provincia</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-24 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <a
                      href={`/dashboard/edificios?consortiumId=${c.id}`}
                      className="font-medium hover:underline"
                    >
                      {c.name}
                    </a>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.city ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.province ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.phone ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.email ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(c)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => { setDeletingConsortium(c); setDeleteError(null) }}>
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                      <a href={`/dashboard/edificios?consortiumId=${c.id}`}>
                        <Button variant="ghost" size="icon-sm">
                          <Building2 className="size-3.5" />
                        </Button>
                      </a>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <span className="text-xs text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}

      <ConsortiumFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        consortium={editingConsortium}
      />

      <AlertDialog
        open={!!deletingConsortium}
        onOpenChange={(open) => { if (!open) { setDeletingConsortium(null); setDeleteError(null) } }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <AlertTriangle className="size-6 text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Eliminar consorcio</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de eliminar <strong>{deletingConsortium?.name}</strong>?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {deleteError}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Eliminando…" : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
