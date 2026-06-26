import { useState } from "react"
import { useOwners, useDeleteOwner, useOwnerApartments, type Owner } from "@/hooks/useOwners"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
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
import { Plus, Pencil, Trash2, AlertTriangle, Eye, Building2, UserCheck } from "lucide-react"
import OwnerFormDialog from "./OwnerFormDialog"

export default function OwnersTable() {
  const [page, setPage] = useState(1)
  const [searchFilter, setSearchFilter] = useState("")
  const debouncedSearch = useDebounce(searchFilter, 300)
  const [formOpen, setFormOpen] = useState(false)
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null)
  const [deletingOwner, setDeletingOwner] = useState<Owner | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [detailOwnerId, setDetailOwnerId] = useState<string | null>(null)

  const params: Record<string, unknown> = { page, limit: 20 }
  if (debouncedSearch) params.search = debouncedSearch

  const { data, isLoading, error } = useOwners(params)
  const deleteMutation = useDeleteOwner()
  const { data: apartments } = useOwnerApartments(detailOwnerId ?? "")

  const handleEdit = (o: Owner) => {
    setEditingOwner(o)
    setFormOpen(true)
  }

  const handleCreate = () => {
    setEditingOwner(null)
    setFormOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingOwner) return
    setDeleteError(null)
    try {
      await deleteMutation.mutateAsync(deletingOwner.id)
      setDeletingOwner(null)
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
            placeholder="Nombre, email o DNI…"
            className="h-7 w-56 text-xs"
            value={searchFilter}
            onChange={(e) => { setSearchFilter(e.target.value); setPage(1) }}
          />
        </div>
        <Button onClick={handleCreate} size="sm" className="ml-auto">
          <Plus /> Nuevo propietario
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">Cargando propietarios…</p>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {(error as Error).message}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          No hay propietarios registrados.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead className="w-28 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <UserCheck className="size-3.5 text-muted-foreground" />
                      {o.user.firstName} {o.user.lastName}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{o.user.email}</TableCell>
                  <TableCell className="text-muted-foreground">{o.dni ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => setDetailOwnerId(o.id)}>
                        <Eye className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(o)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => { setDeletingOwner(o); setDeleteError(null) }}>
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

      <OwnerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        owner={editingOwner}
      />

      <AlertDialog
        open={!!deletingOwner}
        onOpenChange={(open) => { if (!open) { setDeletingOwner(null); setDeleteError(null) } }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <AlertTriangle className="size-6 text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Eliminar propietario</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de eliminar a <strong>{deletingOwner?.user.firstName} {deletingOwner?.user.lastName}</strong>?
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

      <Dialog open={!!detailOwnerId} onOpenChange={(open) => { if (!open) setDetailOwnerId(null) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Departamentos del propietario</DialogTitle>
            <DialogDescription>
              Unidades asociadas a este propietario.
            </DialogDescription>
          </DialogHeader>
          {!apartments || apartments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Este propietario no tiene departamentos asociados.
            </p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Edificio</TableHead>
                    <TableHead>Inquilino</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(apartments as Array<{
                    id: string
                    unitNumber: string
                    building: { id: string; name: string }
                    tenant?: { user: { firstName: string; lastName: string } } | null
                  }>).map((apt) => (
                    <TableRow key={apt.id}>
                      <TableCell className="font-medium">{apt.unitNumber}</TableCell>
                      <TableCell className="text-muted-foreground">{apt.building?.name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {apt.tenant ? `${apt.tenant.user.firstName} ${apt.tenant.user.lastName}` : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
