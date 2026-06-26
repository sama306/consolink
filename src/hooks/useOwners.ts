import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { get, post, put, del } from "@/lib/browser-api-client"

const ownersKey = "owners"

export type OwnerUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string | null
}

export type Owner = {
  id: string
  userId: string
  dni?: string | null
  taxId?: string | null
  bankInfo?: Record<string, unknown> | null
  notes?: string | null
  createdAt: string
  updatedAt: string
  user: OwnerUser
}

export type OwnerListParams = {
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

export function useOwners(params?: OwnerListParams) {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.limit) searchParams.set("limit", String(params.limit))
  if (params?.search) searchParams.set("search", params.search)

  const qs = searchParams.toString()
  const path = qs ? `/owners?${qs}` : "/owners"

  return useQuery({
    queryKey: [ownersKey, params],
    queryFn: () => get<ApiListResponse<Owner>>(path),
    select: (res) => ({
      items: res.data,
      total: res.total,
      page: res.page,
      limit: res.limit,
      totalPages: res.totalPages,
    }),
  })
}

export function useOwner(id: string) {
  return useQuery({
    queryKey: [ownersKey, id],
    queryFn: () => get<ApiItemResponse<Owner>>(`/owners/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  })
}

export function useOwnerApartments(id: string) {
  return useQuery({
    queryKey: [ownersKey, id, "apartments"],
    queryFn: () => get<ApiItemResponse<unknown[]>>(`/owners/${id}/apartments`),
    select: (res) => res.data,
    enabled: !!id,
  })
}

export function useCreateOwner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      post<ApiItemResponse<Owner>>("/owners", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ownersKey] })
    },
  })
}

export function useUpdateOwner(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      put<ApiItemResponse<Owner>>(`/owners/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ownersKey] })
    },
  })
}

export function useDeleteOwner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => del(`/owners/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ownersKey] })
    },
  })
}

export function useCreateUser() {
  return useMutation({
    mutationFn: (data: {
      email: string
      password: string
      firstName: string
      lastName: string
      phone?: string
    }) => post<ApiItemResponse<{ id: string }>>("/users", data),
  })
}
