import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { get, post, put, del } from "@/lib/browser-api-client"

const apartmentsKey = "apartments"

export type ApartmentOwner = {
  id: string
  dni?: string | null
  user: { id: string; firstName: string; lastName: string; email: string }
}

export type ApartmentTenant = {
  id: string
  user: { id: string; firstName: string; lastName: string; email: string }
}

export type Apartment = {
  id: string
  buildingId: string
  unitNumber: string
  floor?: number | null
  bedrooms?: number | null
  bathrooms?: number | null
  areaM2?: number | null
  parkingSpots?: number | null
  storageUnits?: number | null
  status?: string | null
  ownerId: string
  tenantId?: string | null
  createdAt: string
  updatedAt: string
  building?: { id: string; name: string }
  owner?: ApartmentOwner
  tenant?: ApartmentTenant | null
}

export type ApartmentListParams = {
  page?: number
  limit?: number
  buildingId?: string
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

type OwnerApartmentListResponse = {
  status: string
  data: (Apartment & { building: { id: string; name: string; consortiumId: string } })[]
}

export function useOwnerApartments(ownerId: string) {
  return useQuery({
    queryKey: [apartmentsKey, "owner", ownerId],
    queryFn: () => get<OwnerApartmentListResponse>(`/owners/${ownerId}/apartments`),
    select: (res) => ({
      items: res.data,
      total: res.data.length,
      page: 1,
      limit: res.data.length,
      totalPages: 1,
    }),
    enabled: !!ownerId,
  })
}

export function useApartments(params?: ApartmentListParams) {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.limit) searchParams.set("limit", String(params.limit))
  if (params?.buildingId) searchParams.set("buildingId", params.buildingId)

  const qs = searchParams.toString()
  const path = qs ? `/apartments?${qs}` : "/apartments"

  return useQuery({
    queryKey: [apartmentsKey, params],
    queryFn: () => get<ApiListResponse<Apartment>>(path),
    select: (res) => ({
      items: res.data,
      total: res.total,
      page: res.page,
      limit: res.limit,
      totalPages: res.totalPages,
    }),
  })
}

export function useApartment(id: string) {
  return useQuery({
    queryKey: [apartmentsKey, id],
    queryFn: () => get<ApiItemResponse<Apartment>>(`/apartments/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  })
}

export function useCreateApartment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      post<ApiItemResponse<Apartment>>("/apartments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apartmentsKey] })
    },
  })
}

export function useUpdateApartment(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      put<ApiItemResponse<Apartment>>(`/apartments/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apartmentsKey] })
    },
  })
}

export function useDeleteApartment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => del(`/apartments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apartmentsKey] })
    },
  })
}
