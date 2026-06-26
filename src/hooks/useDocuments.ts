import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { get, postFormData } from "@/lib/browser-api-client"

const documentsKey = "documents"

export type Document = {
  id: string
  name: string
  category?: string | null
  fileUrl: string
  consortiumId?: string | null
  buildingId?: string | null
  apartmentId?: string | null
  ticketId?: string | null
  uploadedById: string
  createdAt: string
  uploadedBy?: { id: string; firstName: string; lastName: string }
}

export type DocumentListParams = {
  page?: number
  limit?: number
  apartmentId?: string
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

export function useDocuments(params?: DocumentListParams) {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.limit) searchParams.set("limit", String(params.limit))
  if (params?.apartmentId) searchParams.set("apartmentId", params.apartmentId)
  if (params?.consortiumId) searchParams.set("consortiumId", params.consortiumId)
  const qs = searchParams.toString()
  const path = qs ? `/documents?${qs}` : "/documents"
  return useQuery({
    queryKey: [documentsKey, params],
    queryFn: () => get<ApiListResponse<Document>>(path),
    select: (res) => ({
      items: res.data,
      total: res.total,
      page: res.page,
      limit: res.limit,
      totalPages: res.totalPages,
    }),
  })
}

export function useUploadDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) =>
      postFormData<ApiItemResponse<Document>>("/documents", formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [documentsKey] })
    },
  })
}
