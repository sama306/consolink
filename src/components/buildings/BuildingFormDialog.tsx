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
  useCreateBuilding,
  useUpdateBuilding,
  type Building,
} from "@/hooks/useBuildings"
import { useConsortiums } from "@/hooks/useConsortiums"
import { useState, useEffect } from "react"

const buildingSchema = z.object({
  consortiumId: z.string().min(1, "El consorcio es requerido"),
  name: z.string().min(1, "El nombre es requerido"),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  province: z.string().optional().or(z.literal("")),
  zipCode: z.string().optional().or(z.literal("")),
  totalFloors: z.string().optional().or(z.literal("")),
  totalUnits: z.string().optional().or(z.literal("")),
  totalParkingSpots: z.string().optional().or(z.literal("")),
  totalStorageUnits: z.string().optional().or(z.literal("")),
  totalAreaM2: z.string().optional().or(z.literal("")),
  status: z.string().optional().or(z.literal("")),
})

type BuildingFormData = z.infer<typeof buildingSchema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  building?: Building | null
  consortiumId?: string
}

export default function BuildingFormDialog({ open, onOpenChange, building, consortiumId }: Props) {
  const createMutation = useCreateBuilding()
  const updateMutation = useUpdateBuilding(building?.id ?? "")
  const { data: consortiumsData } = useConsortiums({ limit: 100 })
  const [serverError, setServerError] = useState<string | null>(null)

  const isEdit = !!building
  const consortiums = consortiumsData?.items ?? []

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BuildingFormData>({
    resolver: zodResolver(buildingSchema),
  })

  const watchConsortiumId = watch("consortiumId")

  useEffect(() => {
    if (building) {
      reset({
        consortiumId: building.consortiumId ?? "",
        name: building.name ?? "",
        address: building.address ?? "",
        city: building.city ?? "",
        province: building.province ?? "",
        zipCode: building.zipCode ?? "",
        totalFloors: building.totalFloors?.toString() ?? "",
        totalUnits: building.totalUnits?.toString() ?? "",
        totalParkingSpots: building.totalParkingSpots?.toString() ?? "",
        totalStorageUnits: building.totalStorageUnits?.toString() ?? "",
        totalAreaM2: building.totalAreaM2?.toString() ?? "",
        status: building.status ?? "",
      })
    } else {
      reset({
        consortiumId: consortiumId ?? "",
        name: "",
        address: "",
        city: "",
        province: "",
        zipCode: "",
        totalFloors: "",
        totalUnits: "",
        totalParkingSpots: "",
        totalStorageUnits: "",
        totalAreaM2: "",
        status: "",
      })
    }
    setServerError(null)
  }, [building, open, reset, consortiumId])

  const onSubmit = async (data: BuildingFormData) => {
    setServerError(null)
    const payload: Record<string, unknown> = {
      ...data,
      totalFloors: data.totalFloors === "" ? undefined : Number(data.totalFloors),
      totalUnits: data.totalUnits === "" ? undefined : Number(data.totalUnits),
      totalParkingSpots: data.totalParkingSpots === "" ? undefined : Number(data.totalParkingSpots),
      totalStorageUnits: data.totalStorageUnits === "" ? undefined : Number(data.totalStorageUnits),
      totalAreaM2: data.totalAreaM2 === "" ? undefined : Number(data.totalAreaM2),
      status: data.status || undefined,
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
      <DialogContent
        className="sm:max-w-lg"
        onPointerDownOutside={(e) => {
          const originalEvent = (e as CustomEvent).detail as { originalEvent?: PointerEvent } | undefined
          const target = originalEvent?.originalEvent?.target as HTMLElement | null
          if (target?.closest('[data-slot="select-content"]')) e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar edificio" : "Nuevo edificio"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Modificá los datos del edificio." : "Completá los datos para crear un nuevo edificio."}
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
              <Label htmlFor="consortiumId">Consorcio</Label>
              <Select
                value={watchConsortiumId}
                onValueChange={(v) => setValue("consortiumId", v)}
                disabled={!!consortiumId}
              >
                <SelectTrigger id="consortiumId">
                  <SelectValue placeholder="Seleccionar consorcio" />
                </SelectTrigger>
                <SelectContent>
                  {consortiums.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.consortiumId && <p className="text-xs text-destructive">{errors.consortiumId.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5 col-span-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" {...register("address")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="city">Ciudad</Label>
              <Input id="city" {...register("city")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="province">Provincia</Label>
              <Input id="province" {...register("province")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="zipCode">Código Postal</Label>
              <Input id="zipCode" {...register("zipCode")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="totalFloors">Pisos</Label>
              <Input id="totalFloors" type="number" {...register("totalFloors")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="totalUnits">Unidades</Label>
              <Input id="totalUnits" type="number" {...register("totalUnits")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="totalParkingSpots">Cocheras</Label>
              <Input id="totalParkingSpots" type="number" {...register("totalParkingSpots")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="totalStorageUnits">Bauleras</Label>
              <Input id="totalStorageUnits" type="number" {...register("totalStorageUnits")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="totalAreaM2">Área (m²)</Label>
              <Input id="totalAreaM2" type="number" step="0.01" {...register("totalAreaM2")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="status">Estado</Label>
              <Input id="status" {...register("status")} placeholder="active" />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear edificio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
