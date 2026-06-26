import { useState } from "react"
import { useAnnouncements, useDeleteAnnouncement, type Announcement } from "@/hooks/useAnnouncements"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2 } from "lucide-react"
import CreateAnnouncementDialog from "./CreateAnnouncementDialog"
import EditAnnouncementDialog from "./EditAnnouncementDialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Props {
  userRoles: string[]
}

export default function AnnouncementsTable({ userRoles }: Props) {
  const isAdmin = userRoles.includes("ADMIN")

  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [deleting, setDeleting] = useState<Announcement | null>(null)

  const { data, isLoading, error } = useAnnouncements({ page, limit: 20 })
  const deleteMutation = useDeleteAnnouncement()

  const items = data?.items ?? []
  const totalPages = data?.totalPages ?? 1

  const handleDelete = async () => {
    if (!deleting) return
    try {
      await deleteMutation.mutateAsync(deleting.id)
      setDeleting(null)
    } catch {
    }
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus /> Nuevo aviso
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">Cargando avisos…</p>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {(error as Error).message}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          No hay avisos.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((announcement: Announcement) => (
            <div key={announcement.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm">{announcement.title}</h3>
                    {announcement.priority && (
                      <Badge variant={
                        announcement.priority === "HIGH" ? "destructive" :
                        announcement.priority === "URGENT" ? "destructive" :
                        "secondary"
                      }>
                        {announcement.priority}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {announcement.content}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                    <span>
                      {new Date(announcement.createdAt).toLocaleDateString("es-AR", {
                        year: "numeric", month: "long", day: "numeric",
                      })}
                    </span>
                    {announcement.createdBy && (
                      <span>
                        por {announcement.createdBy.firstName} {announcement.createdBy.lastName}
                      </span>
                    )}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditing(announcement)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(announcement)}>
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
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

      {isAdmin && (
        <>
          <CreateAnnouncementDialog open={createOpen} onOpenChange={setCreateOpen} />
          <EditAnnouncementDialog
            announcement={editing}
            onOpenChange={(open) => { if (!open) setEditing(null) }}
          />
          <AlertDialog open={!!deleting} onOpenChange={(open) => { if (!open) setDeleting(null) }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar aviso</AlertDialogTitle>
                <AlertDialogDescription>
                  ¿Estás seguro de eliminar "{deleting?.title}"? Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending}>
                  {deleteMutation.isPending ? "Eliminando…" : "Eliminar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  )
}
