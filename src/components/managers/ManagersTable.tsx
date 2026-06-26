import { useState } from "react"
import { useManagers, useDeleteManager, type Manager } from "@/hooks/useManagers"
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
import { Plus, Pencil, Trash2, AlertTriangle, BadgeCheck, Building2 } from "lucide-react"
import ManagerFormDialog from "./ManagerFormDialog"

export default function ManagersTable() {
  const [page, setPage] = useState(1)
  const [searchFilter, setSearchFilter] = useState("")
  const debouncedSearch = useDebounce(searchFilter, 300)
  const [formOpen, setFormOpen] = useState(false)
  const [editingManager, setEditingManager] = useState<Manager | null>(null)
  const [deletingManager, setDeletingManager] = useState<Manager | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const params: Record<string, unknown> = { page, limit: 20 }
  if (debouncedSearch) params.search = debouncedSearch

  const { data, isLoading, error } = useManagers(params)
  const deleteMutation = useDeleteManager()

  const handleEdit = (m: Manager) => {
    setEditingManager(m)
    setFormOpen(true)
  }

  const handleCreate = () => {
    setEditingManager(null)
    setFormOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingManager) return
    setDeleteError(null)
    try {
      await deleteMutation.mutateAsync(deletingManager.id)
      setDeletingManager(null)
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
          <Label htmlFor="search-filter" className="text-xs">Buscar</Label>
          <Input
            id="search-filter"
            placeholder="Nombre o email…"
            className="h-7 w-56 text-xs"
            value={searchFilter}
            onChange={(e) => { setSearchFilter(e.target.value); setPage(1) }}
          />
        </div>
        <Button onClick={handleCreate} size="sm" className="ml-auto">
          <Plus /> Nuevo encargado
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">Cargando encargados…</p>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {(error as Error).message}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          No hay encargados registrados.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Supervisor</TableHead>
                <TableHead className="w-24 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="size-3.5 text-muted-foreground" />
                      {m.user.firstName} {m.user.lastName}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{m.user.email}</TableCell>
                  <TableCell className="text-muted-foreground">{m.title ?? "—"}</TableCell>
                  <TableCell>
                    {m.isSupervisor ? (
                      <BadgeCheck className="size-4 text-emerald-500" />
                    ) : (
                      <span className="text-xs text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(m)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => { setDeletingManager(m); setDeleteError(null) }}>
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
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

      <ManagerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        manager={editingManager}
      />

      <AlertDialog
        open={!!deletingManager}
        onOpenChange={(open) => { if (!open) { setDeletingManager(null); setDeleteError(null) } }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <AlertTriangle className="size-6 text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Eliminar encargado</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de eliminar a <strong>{deletingManager?.user.firstName} {deletingManager?.user.lastName}</strong>?
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
