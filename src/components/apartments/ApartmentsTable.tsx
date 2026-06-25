import { useState, useEffect } from "react"
import { useSearchParams } from "@/lib/use-search-params"
import { useApartments, useDeleteApartment, type Apartment } from "@/hooks/useApartments"
import { useBuildings } from "@/hooks/useBuildings"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Plus, Pencil, Trash2, AlertTriangle, User, UserCheck } from "lucide-react"
import ApartmentFormDialog from "./ApartmentFormDialog"

export default function ApartmentsTable() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const [selectedBuildingId, setSelectedBuildingId] = useState("")

  useEffect(() => {
    const id = searchParams.get("buildingId") ?? ""
    if (id) setSelectedBuildingId(id)
  }, [searchParams])
  const [formOpen, setFormOpen] = useState(false)
  const [editingApartment, setEditingApartment] = useState<Apartment | null>(null)
  const [deletingApartment, setDeletingApartment] = useState<Apartment | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const { data: buildingsData } = useBuildings({ limit: 200 })
  const params: Record<string, unknown> = { page, limit: 20 }
  if (selectedBuildingId) params.buildingId = selectedBuildingId

  const { data, isLoading, error } = useApartments(params)
  const deleteMutation = useDeleteApartment()

  const handleBuildingChange = (value: string) => {
    setSelectedBuildingId(value)
    setPage(1)
    if (value) {
      setSearchParams({ buildingId: value })
    } else {
      setSearchParams({})
    }
  }

  const handleEdit = (a: Apartment) => {
    setEditingApartment(a)
    setFormOpen(true)
  }

  const handleCreate = () => {
    setEditingApartment(null)
    setFormOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingApartment) return
    setDeleteError(null)
    try {
      await deleteMutation.mutateAsync(deletingApartment.id)
      setDeletingApartment(null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al eliminar"
      setDeleteError(message)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Cargando departamentos…</p>
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
  const totalPages = data?.totalPages ?? 1
  const buildings = buildingsData?.items ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground font-medium">Edificio</label>
          <Select value={selectedBuildingId} onValueChange={handleBuildingChange}>
            <SelectTrigger className="h-7 w-56 text-xs">
              <SelectValue placeholder="Todos los edificios" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">Todos los edificios</SelectItem>
              {buildings.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleCreate} size="sm" className="ml-auto">
          <Plus /> Nuevo departamento
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          No hay departamentos registrados{selectedBuildingId ? " para este edificio" : ""}.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unidad</TableHead>
                <TableHead>Edificio</TableHead>
                <TableHead>Piso</TableHead>
                <TableHead>Dorm.</TableHead>
                <TableHead>Baños</TableHead>
                <TableHead>Área (m²)</TableHead>
                <TableHead>Propietario</TableHead>
                <TableHead>Inquilino</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-20 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.unitNumber}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {a.building?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{a.floor ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{a.bedrooms ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{a.bathrooms ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{a.areaM2 ?? "—"}</TableCell>
                  <TableCell>
                    {a.owner ? (
                      <span className="inline-flex items-center gap-1 text-xs">
                        <UserCheck className="size-3" />
                        {a.owner.user.firstName} {a.owner.user.lastName}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {a.tenant ? (
                      <span className="inline-flex items-center gap-1 text-xs">
                        <User className="size-3" />
                        {a.tenant.user.firstName} {a.tenant.user.lastName}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                      {a.status ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(a)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => { setDeletingApartment(a); setDeleteError(null) }}>
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

      <ApartmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        apartment={editingApartment}
        buildingId={selectedBuildingId || undefined}
      />

      <AlertDialog
        open={!!deletingApartment}
        onOpenChange={(open) => { if (!open) { setDeletingApartment(null); setDeleteError(null) } }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <AlertTriangle className="size-6 text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Eliminar departamento</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de eliminar la unidad <strong>{deletingApartment?.unitNumber}</strong>?
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
