import { useState } from "react"
import { useTenants, useDeleteTenant, useTenantContractStatus, type Tenant } from "@/hooks/useTenants"
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
import { Plus, Pencil, Trash2, AlertTriangle, Eye, Users } from "lucide-react"
import TenantFormDialog from "./TenantFormDialog"

function ContractBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
    expiring_soon: "bg-amber-500/10 text-amber-600 border-amber-200",
    expired: "bg-red-500/10 text-red-600 border-red-200",
    no_end_date: "bg-muted text-muted-foreground border-border",
  }
  const labels: Record<string, string> = {
    active: "Activo",
    expiring_soon: "Por vencer",
    expired: "Vencido",
    no_end_date: "Sin fecha",
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${colors[status] ?? colors.no_end_date}`}>
      {labels[status] ?? status}
    </span>
  )
}

export default function TenantsTable() {
  const [page, setPage] = useState(1)
  const [searchFilter, setSearchFilter] = useState("")
  const debouncedSearch = useDebounce(searchFilter, 300)
  const [formOpen, setFormOpen] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [detailTenantId, setDetailTenantId] = useState<string | null>(null)

  const params: Record<string, unknown> = { page, limit: 20 }
  if (debouncedSearch) params.search = debouncedSearch

  const { data, isLoading, error } = useTenants(params)
  const deleteMutation = useDeleteTenant()
  const { data: contractStatus } = useTenantContractStatus(detailTenantId ?? "")

  const handleEdit = (t: Tenant) => {
    setEditingTenant(t)
    setFormOpen(true)
  }

  const handleCreate = () => {
    setEditingTenant(null)
    setFormOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingTenant) return
    setDeleteError(null)
    try {
      await deleteMutation.mutateAsync(deletingTenant.id)
      setDeletingTenant(null)
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
          <Plus /> Nuevo inquilino
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">Cargando inquilinos…</p>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {(error as Error).message}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          No hay inquilinos registrados.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead className="w-28 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-3.5 text-muted-foreground" />
                      {t.user.firstName} {t.user.lastName}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{t.user.email}</TableCell>
                  <TableCell>
                    {t.leaseEnd ? (
                      <span className="text-xs text-muted-foreground">
                        Hasta {new Date(t.leaseEnd).toLocaleDateString("es-AR")}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin contrato</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => setDetailTenantId(t.id)}>
                        <Eye className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(t)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => { setDeletingTenant(t); setDeleteError(null) }}>
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

      <TenantFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        tenant={editingTenant}
      />

      <AlertDialog
        open={!!deletingTenant}
        onOpenChange={(open) => { if (!open) { setDeletingTenant(null); setDeleteError(null) } }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <AlertTriangle className="size-6 text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Eliminar inquilino</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de eliminar a <strong>{deletingTenant?.user.firstName} {deletingTenant?.user.lastName}</strong>?
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

      <Dialog open={!!detailTenantId} onOpenChange={(open) => { if (!open) setDetailTenantId(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Estado del contrato</DialogTitle>
            <DialogDescription>
              Información detallada del contrato del inquilino.
            </DialogDescription>
          </DialogHeader>
          {!contractStatus ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Cargando…</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                <span className="text-sm text-muted-foreground">Estado</span>
                <ContractBadge status={contractStatus.status} />
              </div>
              <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                <span className="text-sm text-muted-foreground">Inicio</span>
                <span className="text-sm font-medium">
                  {contractStatus.leaseStart
                    ? new Date(contractStatus.leaseStart).toLocaleDateString("es-AR")
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                <span className="text-sm text-muted-foreground">Fin</span>
                <span className="text-sm font-medium">
                  {contractStatus.leaseEnd
                    ? new Date(contractStatus.leaseEnd).toLocaleDateString("es-AR")
                    : "—"}
                </span>
              </div>
              {contractStatus.status !== "no_end_date" && (
                <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                  <span className="text-sm text-muted-foreground">Días restantes</span>
                  <span className="text-sm font-medium">{contractStatus.daysRemaining}</span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
