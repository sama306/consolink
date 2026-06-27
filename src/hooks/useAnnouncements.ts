import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { get, post, put, del } from "@/lib/browser-api-client"

const announcementsKey = "announcements"

export type Announcement = {
  id: string
  title: string
  content: string
  priority?: string | null
  consortiumId?: string | null
  buildingId?: string | null
  publishedAt?: string | null
  createdById: string
  createdAt: string
  updatedAt: string
  createdBy?: { id: string; firstName: string; lastName: string }
}

export type AnnouncementListParams = {
  page?: number
  limit?: number
  consortiumId?: string
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

export function useAnnouncements(params?: AnnouncementListParams) {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.limit) searchParams.set("limit", String(params.limit))
  if (params?.consortiumId) searchParams.set("consortiumId", params.consortiumId)
  if (params?.buildingId) searchParams.set("buildingId", params.buildingId)
  const qs = searchParams.toString()
  const path = qs ? `/announcements?${qs}` : "/announcements"
  return useQuery({
    queryKey: [announcementsKey, params],
    queryFn: () => get<ApiListResponse<Announcement>>(path),
    select: (res) => ({
      items: res.data,
      total: res.total,
      page: res.page,
      limit: res.limit,
      totalPages: res.totalPages,
    }),
  })
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      title: string
      content: string
      priority?: string
      consortiumId?: string
      buildingId?: string
      publishedAt?: string
    }) => post<ApiItemResponse<Announcement>>("/announcements", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [announcementsKey] })
    },
  })
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: {
      id: string
      title?: string
      content?: string
      priority?: string
      consortiumId?: string
      buildingId?: string
      publishedAt?: string
    }) => put<ApiItemResponse<Announcement>>(`/announcements/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [announcementsKey] })
    },
  })
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => del(`/announcements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [announcementsKey] })
    },
  })
}
