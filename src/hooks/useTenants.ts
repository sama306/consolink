import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { get, post, put, del } from "@/lib/browser-api-client"
export { useCreateUser } from "./useOwners"

const tenantsKey = "tenants"

export type TenantUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string | null
}

export type Tenant = {
  id: string
  userId: string
  leaseStart?: string | null
  leaseEnd?: string | null
  depositAmount?: number | null
  notes?: string | null
  createdAt: string
  updatedAt: string
  user: TenantUser
}

export type TenantListParams = {
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

export function useTenants(params?: TenantListParams) {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.limit) searchParams.set("limit", String(params.limit))
  if (params?.search) searchParams.set("search", params.search)

  const qs = searchParams.toString()
  const path = qs ? `/tenants?${qs}` : "/tenants"

  return useQuery({
    queryKey: [tenantsKey, params],
    queryFn: () => get<ApiListResponse<Tenant>>(path),
    select: (res) => ({
      items: res.data,
      total: res.total,
      page: res.page,
      limit: res.limit,
      totalPages: res.totalPages,
    }),
  })
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: [tenantsKey, id],
    queryFn: () => get<ApiItemResponse<Tenant>>(`/tenants/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  })
}

export type ContractStatus = {
  tenantId: string
  leaseStart?: string | null
  leaseEnd?: string | null
  daysRemaining: number
  status: "active" | "expiring_soon" | "expired" | "no_end_date"
}

export function useTenantContractStatus(id: string) {
  return useQuery({
    queryKey: [tenantsKey, id, "contract-status"],
    queryFn: () => get<ApiItemResponse<ContractStatus>>(`/tenants/${id}/contract-status`),
    select: (res) => res.data,
    enabled: !!id,
  })
}

export function useCreateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      post<ApiItemResponse<Tenant>>("/tenants", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tenantsKey] })
    },
  })
}

export function useUpdateTenant(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      put<ApiItemResponse<Tenant>>(`/tenants/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tenantsKey] })
    },
  })
}

export function useDeleteTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => del(`/tenants/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tenantsKey] })
    },
  })
}
