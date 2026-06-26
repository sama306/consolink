import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { get, put, post } from "@/lib/browser-api-client"

const expensesKey = "expenses"

export type ExpenseApartment = {
  id: string
  unitNumber: string
  floor?: number | null
  building?: { id: string; name: string }
}

export type Expense = {
  id: string
  apartmentId: string
  period: string
  description: string
  amount: number
  status: "PENDING" | "PAID" | "OVERDUE"
  dueDate: string
  paidAt?: string | null
  createdAt: string
  updatedAt: string
  apartment: ExpenseApartment
}

export type ExpenseListParams = {
  page?: number
  limit?: number
  apartmentId?: string
  consortiumId?: string
  buildingId?: string
  period?: string
  status?: string
}

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  PAID: "Pagada",
  OVERDUE: "Vencida",
}

export function getStatusVariant(status: string) {
  switch (status) {
    case "PENDING": return "warning" as const
    case "PAID": return "success" as const
    case "OVERDUE": return "destructive" as const
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

export function useExpenses(params?: ExpenseListParams) {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.limit) searchParams.set("limit", String(params.limit))
  if (params?.apartmentId) searchParams.set("apartmentId", params.apartmentId)
  if (params?.consortiumId) searchParams.set("consortiumId", params.consortiumId)
  if (params?.buildingId) searchParams.set("buildingId", params.buildingId)
  if (params?.period) searchParams.set("period", params.period)
  if (params?.status) searchParams.set("status", params.status)
  const qs = searchParams.toString()
  const path = qs ? `/expenses?${qs}` : "/expenses"
  return useQuery({
    queryKey: [expensesKey, params],
    queryFn: () => get<ApiListResponse<Expense>>(path),
    select: (res) => ({
      items: res.data,
      total: res.total,
      page: res.page,
      limit: res.limit,
      totalPages: res.totalPages,
    }),
  })
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: [expensesKey, id],
    queryFn: () => get<ApiItemResponse<Expense>>(`/expenses/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  })
}

export function useMarkExpensePaid() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      put<ApiItemResponse<Expense>>(`/expenses/${id}/mark-paid`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [expensesKey] })
    },
  })
}

export function useGenerateBulkExpenses() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      consortiumId: string
      period: string
      description: string
      amount: number
      dueDate?: string
    }) => post<ApiItemResponse<{ count: number }>>("/expenses/generate", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [expensesKey] })
    },
  })
}
