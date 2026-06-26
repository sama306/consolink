import { useState } from "react"
import { useTickets, useAssignTicket, useUpdateTicketStatus, STATUS_TRANSITIONS, STATUS_LABELS, PRIORITY_LABELS, getStatusVariant, getPriorityVariant, type Ticket } from "@/hooks/useTickets"
import { useManagers, type Manager } from "@/hooks/useManagers"
import { useDebounce } from "@/lib/use-debounce"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Plus, Eye, UserCheck } from "lucide-react"
import CreateTicketDialog from "./CreateTicketDialog"

interface Props {
  userRoles: string[]
}

const STATUS_FILTERS = ["", "OPEN", "IN_PROGRESS", "PENDING", "RESOLVED", "CLOSED"]
const PRIORITY_FILTERS = ["", "LOW", "MEDIUM", "HIGH", "URGENT"]

export default function TicketsTable({ userRoles }: Props) {
  const isAdmin = userRoles.includes("ADMIN")
  const canManage = isAdmin || userRoles.includes("MANAGER")
  const canCreate = userRoles.includes("OWNER") || userRoles.includes("TENANT")

  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")
  const debouncedStatus = useDebounce(statusFilter, 300)
  const debouncedPriority = useDebounce(priorityFilter, 300)
  const [createOpen, setCreateOpen] = useState(false)
  const [assigning, setAssigning] = useState<Ticket | null>(null)
  const [assignManagerId, setAssignManagerId] = useState("")

  const params: Record<string, unknown> = { page, limit: 20 }
  if (debouncedStatus) params.status = debouncedStatus
  if (debouncedPriority) params.priority = debouncedPriority

  const { data, isLoading, error } = useTickets(params)
  const { data: managersData } = useManagers({ limit: 100 })
  const assignMutation = useAssignTicket()
  const statusMutation = useUpdateTicketStatus()

  const items = data?.items ?? []
  const totalPages = data?.totalPages ?? 1
  const managers = managersData?.items ?? []

  const handleStatusChange = async (ticket: Ticket, newStatus: string) => {
    try {
      await statusMutation.mutateAsync({ id: ticket.id, status: newStatus })
    } catch {
    }
  }

  const handleAssign = async () => {
    if (!assigning || !assignManagerId) return
    try {
      await assignMutation.mutateAsync({ id: assigning.id, assignedToId: assignManagerId })
      setAssigning(null)
      setAssignManagerId("")
    } catch {
    }
  }

  const validTransitions = (ticket: Ticket) => STATUS_TRANSITIONS[ticket.status] ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="status-filter" className="text-xs">Estado</Label>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
            <SelectTrigger className="h-7 w-32 text-xs">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {STATUS_FILTERS.filter(Boolean).map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="priority-filter" className="text-xs">Prioridad</Label>
          <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setPage(1) }}>
            <SelectTrigger className="h-7 w-32 text-xs">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              {PRIORITY_FILTERS.filter(Boolean).map((p) => (
                <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)} size="sm" className="ml-auto">
            <Plus /> Nuevo ticket
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">Cargando tickets…</p>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {(error as Error).message}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          No hay tickets.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Creado por</TableHead>
                <TableHead>Asignado a</TableHead>
                <TableHead>Comentarios</TableHead>
                <TableHead className="w-32 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>
                    <a
                      href={`/dashboard/tickets/${ticket.id}`}
                      className="font-medium hover:underline"
                    >
                      {ticket.title}
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(ticket.status)}>
                      {STATUS_LABELS[ticket.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityVariant(ticket.priority)}>
                      {PRIORITY_LABELS[ticket.priority]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {ticket.apartment.building?.name ?? "—"} - {ticket.apartment.unitNumber}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {ticket.createdBy.firstName} {ticket.createdBy.lastName}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {ticket.assignedTo
                      ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {ticket._count?.comments ?? 0}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <a href={`/dashboard/tickets/${ticket.id}`}>
                        <Button variant="ghost" size="icon-sm">
                          <Eye className="size-3.5" />
                        </Button>
                      </a>
                      {canManage && validTransitions(ticket).length > 0 && (
                        <Select
                          value=""
                          onValueChange={(v) => handleStatusChange(ticket, v)}
                        >
                          <SelectTrigger className="h-7 w-auto text-xs gap-1">
                            <SelectValue placeholder="Estado" />
                          </SelectTrigger>
                          <SelectContent>
                            {validTransitions(ticket).map((s) => (
                              <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {isAdmin && (
                        <Button variant="ghost" size="icon-sm" onClick={() => { setAssigning(ticket); setAssignManagerId("") }}>
                          <UserCheck className="size-3.5" />
                        </Button>
                      )}
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

      <CreateTicketDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        userRoles={userRoles}
      />

      <Dialog open={!!assigning} onOpenChange={(open) => { if (!open) { setAssigning(null); setAssignManagerId("") } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Asignar ticket</DialogTitle>
            <DialogDescription>
              Seleccioná un encargado para asignarle este ticket.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="manager-select">Encargado</Label>
            <Select value={assignManagerId} onValueChange={setAssignManagerId}>
              <SelectTrigger id="manager-select">
                <SelectValue placeholder="Seleccionar encargado" />
              </SelectTrigger>
              <SelectContent>
                {managers.map((m: Manager) => (
                  <SelectItem key={m.id} value={m.userId}>
                    {m.user.firstName} {m.user.lastName} ({m.user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssigning(null)}>Cancelar</Button>
            <Button onClick={handleAssign} disabled={!assignManagerId || assignMutation.isPending}>
              {assignMutation.isPending ? "Asignando…" : "Asignar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
