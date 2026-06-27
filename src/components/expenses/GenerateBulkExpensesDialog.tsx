import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useGenerateBulkExpenses } from "@/hooks/useExpenses"
import { useConsortiums } from "@/hooks/useConsortiums"
import { useBuildings } from "@/hooks/useBuildings"
import { useApartments } from "@/hooks/useApartments"

const bulkSchema = z.object({
  consortiumId: z.string().min(1, "El consorcio es requerido"),
  buildingId: z.string().optional(),
  apartmentId: z.string().optional(),
  period: z.string().min(1, "El período es requerido"),
  amount: z.coerce.number().positive("El importe debe ser positivo"),
  description: z.string().min(1, "La descripción es requerida"),
  dueDate: z.string().min(1, "La fecha de vencimiento es requerida"),
})

type BulkFormData = z.infer<typeof bulkSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function GenerateBulkExpensesDialog({ open, onOpenChange }: Props) {
  const [serverError, setServerError] = useState<string | null>(null)
  const generateMutation = useGenerateBulkExpenses()
  const { data: consortiumsData, isLoading: consortiumsLoading } = useConsortiums({ limit: 100 })
  const consortiums = consortiumsData?.items ?? []

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BulkFormData>({
    resolver: zodResolver(bulkSchema),
    defaultValues: {
      consortiumId: "",
      buildingId: "",
      apartmentId: "",
      period: "",
      amount: 0,
      description: "",
      dueDate: "",
    },
  })

  const selectedConsortiumId = watch("consortiumId")
  const { data: buildingsData, isLoading: buildingsLoading } = useBuildings(
    selectedConsortiumId ? { limit: 100, consortiumId: selectedConsortiumId } : { limit: 100 }
  )
  const buildings = buildingsData?.items ?? []

  const selectedBuildingId = watch("buildingId")
  const { data: apartmentsData, isLoading: apartmentsLoading } = useApartments(
    selectedBuildingId ? { limit: 100, buildingId: selectedBuildingId } : { limit: 100 }
  )
  const apartments = apartmentsData?.items ?? []

  useEffect(() => {
    if (open) {
      reset({
        consortiumId: "",
        buildingId: "",
        apartmentId: "",
        period: "",
        amount: 0,
        description: "",
        dueDate: "",
      })
      setServerError(null)
    }
  }, [open, reset])

  const handleReset = () => {
    reset({
      consortiumId: "",
      buildingId: "",
      apartmentId: "",
      period: "",
      amount: 0,
      description: "",
      dueDate: "",
    })
    setServerError(null)
  }

  const onSubmit = async (data: BulkFormData) => {
    setServerError(null)
    try {
      await generateMutation.mutateAsync({
        consortiumId: data.consortiumId,
        buildingId: data.buildingId || undefined,
        apartmentId: data.apartmentId || undefined,
        period: data.period,
        description: data.description,
        amount: data.amount,
        dueDate: data.dueDate,
      })
      onOpenChange(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al generar expensas"
      setServerError(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleReset(); onOpenChange(v) }}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => {
          const originalEvent = (e as CustomEvent).detail as { originalEvent?: PointerEvent } | undefined
          const target = originalEvent?.originalEvent?.target as HTMLElement | null
          if (target?.closest('[data-slot="select-content"]')) e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>Generar expensas masivas</DialogTitle>
          <DialogDescription>
            Generá expensas para los departamentos de un consorcio (o un edificio específico) en un período.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="consortiumId">Consorcio</Label>
            <Select
              value={watch("consortiumId")}
              onValueChange={(v) => {
                setValue("consortiumId", v, { shouldValidate: true })
                setValue("buildingId", "")
              }}
            >
              <SelectTrigger id="consortiumId">
                <SelectValue placeholder={consortiumsLoading ? "Cargando…" : "Seleccionar consorcio"} />
              </SelectTrigger>
              <SelectContent>
                {consortiums.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.consortiumId && (
              <p className="text-xs text-destructive">{errors.consortiumId.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="buildingId">Edificio <span className="text-muted-foreground font-normal">(opcional)</span></Label>
            <Select
              value={watch("buildingId") ?? ""}
              onValueChange={(v) => {
                setValue("buildingId", v, { shouldValidate: true })
                setValue("apartmentId", "")
              }}
              disabled={!selectedConsortiumId || buildingsLoading}
            >
              <SelectTrigger id="buildingId">
                <SelectValue placeholder={
                  !selectedConsortiumId
                    ? "Primero seleccioná un consorcio"
                    : buildingsLoading
                      ? "Cargando…"
                      : "Todos los edificios"
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los edificios</SelectItem>
                {buildings.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.buildingId && (
              <p className="text-xs text-destructive">{errors.buildingId.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="apartmentId">Departamento <span className="text-muted-foreground font-normal">(opcional)</span></Label>
            <Select
              value={watch("apartmentId") ?? ""}
              onValueChange={(v) => setValue("apartmentId", v, { shouldValidate: true })}
              disabled={!selectedBuildingId || apartmentsLoading}
            >
              <SelectTrigger id="apartmentId">
                <SelectValue placeholder={
                  !selectedBuildingId
                    ? "Primero seleccioná un edificio"
                    : apartmentsLoading
                      ? "Cargando…"
                      : "Todos los departamentos"
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los departamentos</SelectItem>
                {apartments.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.unitNumber}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.apartmentId && (
              <p className="text-xs text-destructive">{errors.apartmentId.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="period">Período</Label>
            <Input id="period" type="month" {...register("period")} />
            {errors.period && (
              <p className="text-xs text-destructive">{errors.period.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="amount">Importe base</Label>
            <Input id="amount" type="number" step="0.01" min="0" {...register("amount")} />
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descripción</Label>
            <Input id="description" {...register("description")} />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dueDate">Fecha de vencimiento</Label>
            <Input id="dueDate" type="date" {...register("dueDate")} />
            {errors.dueDate && (
              <p className="text-xs text-destructive">{errors.dueDate.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Generando…" : "Generar expensas"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
