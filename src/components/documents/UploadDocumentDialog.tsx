import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useUploadDocument } from "@/hooks/useDocuments"
import { useConsortiums } from "@/hooks/useConsortiums"
import { useBuildings } from "@/hooks/useBuildings"
import { useApartments } from "@/hooks/useApartments"
import { Upload } from "lucide-react"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function UploadDocumentDialog({ open, onOpenChange }: Props) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [consortiumId, setConsortiumId] = useState("")
  const [buildingId, setBuildingId] = useState("")
  const [apartmentId, setApartmentId] = useState("")

  const fileRef = useRef<HTMLInputElement>(null)

  const uploadMutation = useUploadDocument()
  const { data: consortiumsData } = useConsortiums({ limit: 200 })
  const { data: buildingsData } = useBuildings(
    consortiumId ? { limit: 200, consortiumId } : { limit: 200 }
  )
  const { data: apartmentsData } = useApartments(
    buildingId ? { limit: 200, buildingId } : { limit: 200 }
  )

  const consortiums = consortiumsData?.items ?? []
  const buildings = buildingsData?.items ?? []
  const apartments = apartmentsData?.items ?? []

  useEffect(() => {
    if (open) {
      setFile(null)
      setName("")
      setCategory("")
      setConsortiumId("")
      setBuildingId("")
      setApartmentId("")
      setServerError(null)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setServerError("Debe seleccionar un archivo")
      return
    }
    setServerError(null)

    const formData = new FormData()
    formData.append("file", file)
    formData.append("name", name || file.name)
    if (category) formData.append("category", category)
    if (consortiumId) formData.append("consortiumId", consortiumId)
    if (buildingId) formData.append("buildingId", buildingId)
    if (apartmentId) formData.append("apartmentId", apartmentId)

    try {
      await uploadMutation.mutateAsync(formData)
      onOpenChange(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al subir documento"
      setServerError(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Subir documento</DialogTitle>
          <DialogDescription>
            Seleccioná un archivo y asociálo a un consorcio o departamento.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {serverError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="file-upload">Archivo</Label>
            <div
              onClick={() => fileRef.current?.click()}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-input px-3 py-6 text-sm text-muted-foreground hover:border-ring transition-colors"
            >
              <Upload className="size-4" />
              {file ? file.name : "Hacé click para seleccionar un archivo (max 10 MB)"}
            </div>
            <input
              ref={fileRef}
              id="file-upload"
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) setFile(f)
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nombre (opcional)</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Si se deja vacío, usa el nombre del archivo"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category">Categoría</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Sin categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin categoría</SelectItem>
                <SelectItem value="REGLEMENTO">Reglamento</SelectItem>
                <SelectItem value="ACTA">Acta</SelectItem>
                <SelectItem value="LIQUIDACION">Liquidación</SelectItem>
                <SelectItem value="SEGURO">Seguro</SelectItem>
                <SelectItem value="OTRO">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="consortiumId">Consorcio</Label>
            <Select value={consortiumId} onValueChange={(v) => { setConsortiumId(v); setBuildingId(""); setApartmentId("") }}>
              <SelectTrigger id="consortiumId">
                <SelectValue placeholder="Seleccionar (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Ninguno</SelectItem>
                {consortiums.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="buildingId">Edificio</Label>
            <Select value={buildingId} onValueChange={(v) => { setBuildingId(v); setApartmentId("") }}>
              <SelectTrigger id="buildingId">
                <SelectValue placeholder="Seleccionar (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Ninguno</SelectItem>
                {buildings.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="apartmentId">Departamento</Label>
            <Select value={apartmentId} onValueChange={setApartmentId}>
              <SelectTrigger id="apartmentId">
                <SelectValue placeholder="Seleccionar (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Ninguno</SelectItem>
                {apartments.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.building?.name ?? ""} - {a.unitNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={!file || uploadMutation.isPending}>
              {uploadMutation.isPending ? "Subiendo…" : "Subir documento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
