import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { get, post, put, del } from "@/lib/browser-api-client"
export { useCreateUser } from "./useOwners"

const managersKey = "managers"

export type ManagerUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string | null
}

export type Manager = {
  id: string
  userId: string
  title?: string | null
  isSupervisor: boolean
  notes?: string | null
  createdAt: string
  updatedAt: string
  user: ManagerUser
}

export type ManagerListParams = {
  page?: number
  limit?: number
  search?: string
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

export function useManagers(params?: ManagerListParams) {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.limit) searchParams.set("limit", String(params.limit))
  if (params?.search) searchParams.set("search", params.search)

  const qs = searchParams.toString()
  const path = qs ? `/managers?${qs}` : "/managers"

  return useQuery({
    queryKey: [managersKey, params],
    queryFn: () => get<ApiListResponse<Manager>>(path),
    select: (res) => ({
      items: res.data,
      total: res.total,
      page: res.page,
      limit: res.limit,
      totalPages: res.totalPages,
    }),
  })
}

export function useManager(id: string) {
  return useQuery({
    queryKey: [managersKey, id],
    queryFn: () => get<ApiItemResponse<Manager>>(`/managers/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  })
}

export function useCreateManager() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      post<ApiItemResponse<Manager>>("/managers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [managersKey] })
    },
  })
}

export function useUpdateManager(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      put<ApiItemResponse<Manager>>(`/managers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [managersKey] })
    },
  })
}

export function useDeleteManager() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => del(`/managers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [managersKey] })
    },
  })
}
