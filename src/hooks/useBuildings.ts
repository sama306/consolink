import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { get, post, put, del } from "@/lib/browser-api-client"

const buildingsKey = "buildings"

export type Building = {
  id: string
  consortiumId: string
  name: string
  address?: string | null
  city?: string | null
  province?: string | null
  zipCode?: string | null
  totalFloors?: number | null
  totalUnits?: number | null
  totalParkingSpots?: number | null
  totalStorageUnits?: number | null
  totalAreaM2?: number | null
  status?: string | null
  createdAt: string
  updatedAt: string
  consortium?: { id: string; name: string }
}

export type BuildingListParams = {
  page?: number
  limit?: number
  consortiumId?: string
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

export function useBuildings(params?: BuildingListParams) {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.limit) searchParams.set("limit", String(params.limit))
  if (params?.consortiumId) searchParams.set("consortiumId", params.consortiumId)

  const qs = searchParams.toString()
  const path = qs ? `/buildings?${qs}` : "/buildings"

  return useQuery({
    queryKey: [buildingsKey, params],
    queryFn: () => get<ApiListResponse<Building>>(path),
    select: (res) => ({
      items: res.data,
      total: res.total,
      page: res.page,
      limit: res.limit,
      totalPages: res.totalPages,
    }),
  })
}

export function useBuilding(id: string) {
  return useQuery({
    queryKey: [buildingsKey, id],
    queryFn: () => get<ApiItemResponse<Building>>(`/buildings/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  })
}

export function useCreateBuilding() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      post<ApiItemResponse<Building>>("/buildings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [buildingsKey] })
    },
  })
}

export function useUpdateBuilding(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      put<ApiItemResponse<Building>>(`/buildings/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [buildingsKey] })
    },
  })
}

export function useDeleteBuilding() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => del(`/buildings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [buildingsKey] })
    },
  })
}
