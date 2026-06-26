import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { get, post, put } from "@/lib/browser-api-client"

const ticketsKey = "tickets"

export type TicketUser = {
  id: string
  firstName: string
  lastName: string
  email: string
}

export type TicketApartmentBuilding = {
  id: string
  name: string
  consortiumId?: string
}

export type TicketApartment = {
  id: string
  unitNumber: string
  floor?: number | null
  building?: TicketApartmentBuilding
}

export type TicketComment = {
  id: string
  content: string
  createdAt: string
  author: TicketUser
}

export type Ticket = {
  id: string
  apartmentId: string
  createdById: string
  assignedToId?: string | null
  title: string
  description: string
  status: "OPEN" | "IN_PROGRESS" | "PENDING" | "RESOLVED" | "CLOSED"
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  resolvedAt?: string | null
  closedAt?: string | null
  createdAt: string
  updatedAt: string
  createdBy: TicketUser
  assignedTo?: TicketUser | null
  apartment: TicketApartment
  comments?: TicketComment[]
  _count?: { comments: number }
}

export type TicketListParams = {
  page?: number
  limit?: number
  status?: string
  priority?: string
}

export const STATUS_TRANSITIONS: Record<string, string[]> = {
  OPEN: ["IN_PROGRESS"],
  IN_PROGRESS: ["PENDING", "RESOLVED"],
  PENDING: ["IN_PROGRESS"],
  RESOLVED: ["CLOSED"],
}

export const STATUS_LABELS: Record<string, string> = {
  OPEN: "Abierto",
  IN_PROGRESS: "En Progreso",
  PENDING: "Pendiente",
  RESOLVED: "Resuelto",
  CLOSED: "Cerrado",
}

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  URGENT: "Urgente",
}

export function getStatusVariant(status: string) {
  switch (status) {
    case "OPEN": return "warning" as const
    case "IN_PROGRESS": return "info" as const
    case "PENDING": return "warning" as const
    case "RESOLVED": return "success" as const
    case "CLOSED": return "secondary" as const
    default: return "secondary" as const
  }
}

export function getPriorityVariant(priority: string) {
  switch (priority) {
    case "LOW": return "secondary" as const
    case "MEDIUM": return "info" as const
    case "HIGH": return "warning" as const
    case "URGENT": return "destructive" as const
    default: return "secondary" as const
  }
}

type ApiListResponse<T> = {
  status: string
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

type ApiItemResponse<T> = {
  status: string
  data: T
}

export function useTickets(params?: TicketListParams) {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.limit) searchParams.set("limit", String(params.limit))
  if (params?.status) searchParams.set("status", params.status)
  if (params?.priority) searchParams.set("priority", params.priority)
  const qs = searchParams.toString()
  const path = qs ? `/tickets?${qs}` : "/tickets"
  return useQuery({
    queryKey: [ticketsKey, params],
    queryFn: () => get<ApiListResponse<Ticket>>(path),
    select: (res) => ({
      items: res.data,
      total: res.total,
      page: res.page,
      limit: res.limit,
      totalPages: res.totalPages,
    }),
  })
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: [ticketsKey, id],
    queryFn: () => get<ApiItemResponse<Ticket>>(`/tickets/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  })
}

export function useCreateTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      apartmentId: string
      title: string
      description: string
      priority?: string
    }) => post<ApiItemResponse<Ticket>>("/tickets", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ticketsKey] })
    },
  })
}

export function useAssignTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, assignedToId }: { id: string; assignedToId: string }) =>
      put<ApiItemResponse<Ticket>>(`/tickets/${id}/assign`, { assignedToId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ticketsKey] })
    },
  })
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      put<ApiItemResponse<Ticket>>(`/tickets/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ticketsKey] })
    },
  })
}

export function useAddComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ ticketId, content }: { ticketId: string; content: string }) =>
      post<ApiItemResponse<TicketComment>>(`/tickets/${ticketId}/comments`, { content }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [ticketsKey, variables.ticketId] })
    },
  })
}
