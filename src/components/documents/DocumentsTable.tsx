import { useState } from "react"
import { useDocuments, type Document } from "@/hooks/useDocuments"
import { useConsortiums } from "@/hooks/useConsortiums"
import { useDebounce } from "@/lib/use-debounce"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Download, FileText } from "lucide-react"
import UploadDocumentDialog from "./UploadDocumentDialog"

interface Props {
  userRoles: string[]
}

export default function DocumentsTable({ userRoles }: Props) {
  const isAdmin = userRoles.includes("ADMIN")

  const [page, setPage] = useState(1)
  const [consortiumFilter, setConsortiumFilter] = useState("")
  const debouncedConsortium = useDebounce(consortiumFilter, 300)
  const [uploadOpen, setUploadOpen] = useState(false)

  const params: Record<string, unknown> = { page, limit: 20 }
  if (debouncedConsortium) params.consortiumId = debouncedConsortium

  const { data, isLoading, error } = useDocuments(params)
  const { data: consortiumsData } = useConsortiums({ limit: 100 })

  const items = data?.items ?? []
  const totalPages = data?.totalPages ?? 1
  const consortiums = consortiumsData?.items ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="consortium-filter" className="text-xs">Consorcio</Label>
          <Select value={consortiumFilter} onValueChange={(v) => { setConsortiumFilter(v); setPage(1) }}>
            <SelectTrigger className="h-7 w-44 text-xs">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {consortiums.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isAdmin && (
          <Button onClick={() => setUploadOpen(true)} size="sm" className="ml-auto">
            <Plus /> Subir documento
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">Cargando documentos…</p>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {(error as Error).message}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          No hay documentos.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Subido por</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="w-20 text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((doc: Document) => (
                <TableRow key={doc.id}>
                  <TableCell className="flex items-center gap-2 text-xs font-medium">
                    <FileText className="size-3.5 text-muted-foreground shrink-0" />
                    {doc.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {doc.category ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {doc.uploadedBy
                      ? `${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {new Date(doc.createdAt).toLocaleDateString("es-AR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <a href={`${(import.meta.env.PUBLIC_API_URL ?? "http://localhost:3001/api").replace("/api", "")}/uploads/${doc.fileUrl.split("/").pop()}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon-sm">
                        <Download className="size-3.5" />
                      </Button>
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <span className="text-xs text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}

      {isAdmin && (
        <UploadDocumentDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      )}
    </div>
  )
}
