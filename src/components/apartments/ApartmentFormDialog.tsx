import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  useCreateApartment,
  useUpdateApartment,
  type Apartment,
} from "@/hooks/useApartments"
import { useBuildings } from "@/hooks/useBuildings"
import { useState, useEffect } from "react"

const apartmentSchema = z.object({
  buildingId: z.string().min(1, "El edificio es requerido"),
  unitNumber: z.string().min(1, "La unidad es requerida"),
  floor: z.string().optional().or(z.literal("")),
  bedrooms: z.string().optional().or(z.literal("")),
  bathrooms: z.string().optional().or(z.literal("")),
  areaM2: z.string().optional().or(z.literal("")),
  parkingSpots: z.string().optional().or(z.literal("")),
  storageUnits: z.string().optional().or(z.literal("")),
  status: z.string().optional().or(z.literal("")),
  ownerId: z.string().min(1, "El propietario es requerido"),
  tenantId: z.string().optional().or(z.literal("")),
})

type ApartmentFormData = z.infer<typeof apartmentSchema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  apartment?: Apartment | null
  buildingId?: string
}

export default function ApartmentFormDialog({ open, onOpenChange, apartment, buildingId }: Props) {
  const createMutation = useCreateApartment()
  const updateMutation = useUpdateApartment(apartment?.id ?? "")
  const { data: buildingsData } = useBuildings({ limit: 200 })
  const [serverError, setServerError] = useState<string | null>(null)

  const isEdit = !!apartment
  const buildings = buildingsData?.items ?? []

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ApartmentFormData>({
    resolver: zodResolver(apartmentSchema),
  })

  const watchBuildingId = watch("buildingId")

  useEffect(() => {
    if (apartment) {
      reset({
        buildingId: apartment.buildingId ?? "",
        unitNumber: apartment.unitNumber ?? "",
        floor: apartment.floor?.toString() ?? "",
        bedrooms: apartment.bedrooms?.toString() ?? "",
        bathrooms: apartment.bathrooms?.toString() ?? "",
        areaM2: apartment.areaM2?.toString() ?? "",
        parkingSpots: apartment.parkingSpots?.toString() ?? "",
        storageUnits: apartment.storageUnits?.toString() ?? "",
        status: apartment.status ?? "",
        ownerId: apartment.ownerId ?? "",
        tenantId: apartment.tenantId ?? "",
      })
    } else {
      reset({
        buildingId: buildingId ?? "",
        unitNumber: "",
        floor: "",
        bedrooms: "",
        bathrooms: "",
        areaM2: "",
        parkingSpots: "",
        storageUnits: "",
        status: "",
        ownerId: "",
        tenantId: "",
      })
    }
    setServerError(null)
  }, [apartment, open, reset, buildingId])

  const onSubmit = async (data: ApartmentFormData) => {
    setServerError(null)
    const payload: Record<string, unknown> = {
      ...data,
      floor: data.floor ? Number(data.floor) : undefined,
      bedrooms: data.bedrooms ? Number(data.bedrooms) : undefined,
      bathrooms: data.bathrooms ? Number(data.bathrooms) : undefined,
      areaM2: data.areaM2 ? Number(data.areaM2) : undefined,
      parkingSpots: data.parkingSpots ? Number(data.parkingSpots) : undefined,
      storageUnits: data.storageUnits ? Number(data.storageUnits) : undefined,
      status: data.status || undefined,
      tenantId: data.tenantId || null,
    }
    try {
      if (isEdit) {
        await updateMutation.mutateAsync(payload)
      } else {
        await createMutation.mutateAsync(payload)
      }
      onOpenChange(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al guardar"
      setServerError(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar departamento" : "Nuevo departamento"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Modificá los datos del departamento." : "Completá los datos para crear un nuevo departamento."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 col-span-2">
              <Label htmlFor="buildingId">Edificio</Label>
              <Select
                value={watchBuildingId}
                onValueChange={(v) => setValue("buildingId", v)}
                disabled={!!buildingId}
              >
                <SelectTrigger id="buildingId">
                  <SelectValue placeholder="Seleccionar edificio" />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.buildingId && <p className="text-xs text-destructive">{errors.buildingId.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="unitNumber">Unidad</Label>
              <Input id="unitNumber" {...register("unitNumber")} />
              {errors.unitNumber && <p className="text-xs text-destructive">{errors.unitNumber.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="floor">Piso</Label>
              <Input id="floor" type="number" {...register("floor")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bedrooms">Dormitorios</Label>
              <Input id="bedrooms" type="number" {...register("bedrooms")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bathrooms">Baños</Label>
              <Input id="bathrooms" type="number" {...register("bathrooms")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="areaM2">Área (m²)</Label>
              <Input id="areaM2" type="number" step="0.01" {...register("areaM2")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="parkingSpots">Cocheras</Label>
              <Input id="parkingSpots" type="number" {...register("parkingSpots")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="storageUnits">Bauleras</Label>
              <Input id="storageUnits" type="number" {...register("storageUnits")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="status">Estado</Label>
              <Input id="status" {...register("status")} placeholder="occupied" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ownerId">ID del Propietario</Label>
              <Input id="ownerId" {...register("ownerId")} />
              {errors.ownerId && <p className="text-xs text-destructive">{errors.ownerId.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tenantId">ID del Inquilino</Label>
              <Input id="tenantId" {...register("tenantId")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear departamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
