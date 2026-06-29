import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { get, put, patch, post } from "@/lib/browser-api-client"

const usersKey = "users"

export type UserRole = {
  id: string
  roleId: string
  userId: string
  role: { id: string; name: string }
}

export type AppUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string | null
  avatarUrl?: string | null
  isActive: boolean
  emailVerifiedAt?: string | null
  createdAt: string
  updatedAt: string
  userRoles: UserRole[]
}

type ApiListResponse<T> = {
  status: string
  data: T[]
}

type ApiItemResponse<T> = {
  status: string
  data: T
}

export function useUsers() {
  return useQuery({
    queryKey: [usersKey],
    queryFn: () => get<ApiListResponse<AppUser>>("/users"),
    select: (res) => res.data,
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: [usersKey, id],
    queryFn: () => get<ApiItemResponse<AppUser>>(`/users/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  })
}

export function useUpdateUser(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      patch<ApiItemResponse<AppUser>>(`/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [usersKey] })
    },
  })
}

export function useUpdateUserRoles(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { roles: { roleName: string; action: "add" | "remove" }[] }) =>
      put<ApiItemResponse<AppUser>>(`/users/${id}/roles`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [usersKey] })
    },
  })
}

export function useResetPassword(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { password: string }) =>
      post<ApiItemResponse<{ message: string }>>(`/users/${id}/reset-password`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [usersKey] })
    },
  })
}
