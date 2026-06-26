import { useState } from "react"
import { useTicket, useUpdateTicketStatus, useAddComment, STATUS_TRANSITIONS, STATUS_LABELS, PRIORITY_LABELS, getStatusVariant, getPriorityVariant, type Ticket } from "@/hooks/useTickets"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Send, MessageSquare } from "lucide-react"

interface Props {
  ticketId: string
  userRoles: string[]
}

export default function TicketDetailView({ ticketId, userRoles }: Props) {
  const isAdmin = userRoles.includes("ADMIN")
  const canManageStatus = isAdmin || userRoles.includes("MANAGER")
  const canComment = isAdmin || userRoles.includes("MANAGER") || userRoles.includes("OWNER") || userRoles.includes("TENANT")

  const { data: ticket, isLoading, error } = useTicket(ticketId)
  const statusMutation = useUpdateTicketStatus()
  const addCommentMutation = useAddComment()
  const [commentText, setCommentText] = useState("")
  const [statusError, setStatusError] = useState<string | null>(null)
  const [commentError, setCommentError] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Cargando ticket…</p>
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

  if (!ticket) {
    return (
      <div className="rounded-lg border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        Ticket no encontrado.
      </div>
    )
  }

  const validTransitions = STATUS_TRANSITIONS[ticket.status] ?? []

  const handleStatusChange = async (newStatus: string) => {
    setStatusError(null)
    try {
      await statusMutation.mutateAsync({ id: ticket.id, status: newStatus })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cambiar estado"
      setStatusError(msg)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return
    setCommentError(null)
    try {
      await addCommentMutation.mutateAsync({ ticketId: ticket.id, content: commentText.trim() })
      setCommentText("")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al enviar comentario"
      setCommentError(msg)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <a
          href="/dashboard/tickets"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Volver a tickets
        </a>
      </div>

      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">{ticket.title}</h2>
            <p className="text-sm text-muted-foreground">
              Creado por {ticket.createdBy.firstName} {ticket.createdBy.lastName}
              {" — "}
              {new Date(ticket.createdAt).toLocaleDateString("es-AR", {
                year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={getStatusVariant(ticket.status)}>{STATUS_LABELS[ticket.status]}</Badge>
            <Badge variant={getPriorityVariant(ticket.priority)}>{PRIORITY_LABELS[ticket.priority]}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Departamento: </span>
            <span className="font-medium">
              {ticket.apartment.building?.name ?? "—"} - {ticket.apartment.unitNumber}
              {ticket.apartment.floor ? ` (Piso ${ticket.apartment.floor})` : ""}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Asignado a: </span>
            <span className="font-medium">
              {ticket.assignedTo
                ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}`
                : "Sin asignar"}
            </span>
          </div>
        </div>

        <div className="rounded-lg bg-muted/30 p-4">
          <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
        </div>

        {canManageStatus && validTransitions.length > 0 && (
          <div className="flex items-center gap-3 pt-2 border-t">
            <span className="text-sm font-medium">Cambiar estado:</span>
            <div className="flex items-center gap-2">
              {validTransitions.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange(s)}
                  disabled={statusMutation.isPending}
                >
                  {STATUS_LABELS[s]}
                </Button>
              ))}
            </div>
            {statusError && (
              <p className="text-xs text-destructive">{statusError}</p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="size-4" />
          Comentarios
        </h3>

        {(!ticket.comments || ticket.comments.length === 0) ? (
          <div className="rounded-lg border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
            No hay comentarios todavía.
          </div>
        ) : (
          <div className="space-y-3">
            {ticket.comments.map((comment) => (
              <div key={comment.id} className="rounded-lg border bg-card p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {comment.author.firstName} {comment.author.lastName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.createdAt).toLocaleDateString("es-AR", {
                      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{comment.content}</p>
              </div>
            ))}
          </div>
        )}

        {canComment && (
          <form onSubmit={handleAddComment} className="flex items-end gap-2">
            <div className="flex-1 flex flex-col gap-1.5">
              <Label htmlFor="comment-input" className="text-xs">Agregar comentario</Label>
              <Input
                id="comment-input"
                placeholder="Escribí un comentario…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              {commentError && (
                <p className="text-xs text-destructive">{commentError}</p>
              )}
            </div>
            <Button type="submit" size="sm" disabled={!commentText.trim() || addCommentMutation.isPending}>
              <Send className="size-3.5" />
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
