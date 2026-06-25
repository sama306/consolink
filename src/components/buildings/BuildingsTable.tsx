import { useState, useEffect } from "react"
import { useSearchParams } from "@/lib/use-search-params"
import { useBuildings, useDeleteBuilding, type Building } from "@/hooks/useBuildings"
import { useConsortiums } from "@/hooks/useConsortiums"
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
import { Plus, Pencil, Trash2, DoorOpen, AlertTriangle } from "lucide-react"
import BuildingFormDialog from "./BuildingFormDialog"

export default function BuildingsTable() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const [selectedConsortiumId, setSelectedConsortiumId] = useState("")

  useEffect(() => {
    const id = searchParams.get("consortiumId") ?? ""
    if (id) setSelectedConsortiumId(id)
  }, [searchParams])
  const [formOpen, setFormOpen] = useState(false)
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null)
  const [deletingBuilding, setDeletingBuilding] = useState<Building | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const { data: consortiumsData } = useConsortiums({ limit: 200 })
  const params: Record<string, unknown> = { page, limit: 20 }
  if (selectedConsortiumId) params.consortiumId = selectedConsortiumId

  const { data, isLoading, error } = useBuildings(params)
  const deleteMutation = useDeleteBuilding()

  const handleConsortiumChange = (value: string) => {
    setSelectedConsortiumId(value)
    setPage(1)
    if (value) {
      setSearchParams({ consortiumId: value })
    } else {
      setSearchParams({})
    }
  }

  const handleEdit = (b: Building) => {
    setEditingBuilding(b)
    setFormOpen(true)
  }

  const handleCreate = () => {
    setEditingBuilding(null)
    setFormOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingBuilding) return
    setDeleteError(null)
    try {
      await deleteMutation.mutateAsync(deletingBuilding.id)
      setDeletingBuilding(null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al eliminar"
      setDeleteError(message)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Cargando edificios…</p>
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
  const consortiums = consortiumsData?.items ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground font-medium">Consorcio</label>
          <Select value={selectedConsortiumId} onValueChange={handleConsortiumChange}>
            <SelectTrigger className="h-7 w-56 text-xs">
              <SelectValue placeholder="Todos los consorcios" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">Todos los consorcios</SelectItem>
              {consortiums.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleCreate} size="sm" className="ml-auto">
          <Plus /> Nuevo edificio
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          No hay edificios registrados{selectedConsortiumId ? " para este consorcio" : ""}.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Consorcio</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Pisos</TableHead>
                <TableHead>Unidades</TableHead>
                <TableHead className="w-24 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <a
                      href={`/dashboard/departamentos?buildingId=${b.id}`}
                      className="font-medium hover:underline"
                    >
                      {b.name}
                    </a>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {b.consortium?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{b.address ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{b.city ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{b.totalFloors ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{b.totalUnits ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(b)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => { setDeletingBuilding(b); setDeleteError(null) }}>
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                      <a href={`/dashboard/departamentos?buildingId=${b.id}`}>
                        <Button variant="ghost" size="icon-sm">
                          <DoorOpen className="size-3.5" />
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

      <BuildingFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        building={editingBuilding}
        consortiumId={selectedConsortiumId || undefined}
      />

      <AlertDialog
        open={!!deletingBuilding}
        onOpenChange={(open) => { if (!open) { setDeletingBuilding(null); setDeleteError(null) } }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <AlertTriangle className="size-6 text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Eliminar edificio</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de eliminar <strong>{deletingBuilding?.name}</strong>?
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
