import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { get, post, put, del } from "@/lib/browser-api-client"

const consortiumsKey = "consortiums"

export type Consortium = {
  id: string
  name: string
  taxId?: string | null
  address?: string | null
  city?: string | null
  province?: string | null
  zipCode?: string | null
  phone?: string | null
  email?: string | null
  logoUrl?: string | null
  createdAt: string
  updatedAt: string
}

export type ConsortiumListParams = {
  page?: number
  limit?: number
  city?: string
  province?: string
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

export function useConsortiums(params?: ConsortiumListParams) {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.limit) searchParams.set("limit", String(params.limit))
  if (params?.city) searchParams.set("city", params.city)
  if (params?.province) searchParams.set("province", params.province)

  const qs = searchParams.toString()
  const path = qs ? `/consortiums?${qs}` : "/consortiums"

  return useQuery({
    queryKey: [consortiumsKey, params],
    queryFn: () => get<ApiListResponse<Consortium>>(path),
    select: (res) => ({
      items: res.data,
      total: res.total,
      page: res.page,
      limit: res.limit,
      totalPages: res.totalPages,
    }),
  })
}

export function useConsortium(id: string) {
  return useQuery({
    queryKey: [consortiumsKey, id],
    queryFn: () => get<ApiItemResponse<Consortium>>(`/consortiums/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  })
}

export function useCreateConsortium() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      post<ApiItemResponse<Consortium>>("/consortiums", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [consortiumsKey] })
    },
  })
}

export function useUpdateConsortium(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      put<ApiItemResponse<Consortium>>(`/consortiums/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [consortiumsKey] })
    },
  })
}

export function useDeleteConsortium() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => del(`/consortiums/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [consortiumsKey] })
    },
  })
}
