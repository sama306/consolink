import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQuery } from "@tanstack/react-query"
import { get } from "@/lib/browser-api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useCreateTicket, PRIORITY_LABELS } from "@/hooks/useTickets"
import { useApartments, useOwnerApartments, type Apartment } from "@/hooks/useApartments"
import { useManagers, type Manager } from "@/hooks/useManagers"
import { useState, useEffect } from "react"

const createTicketSchema = z.object({
  apartmentId: z.string().optional().default(""),
  title: z.string().min(1, "El título es requerido").max(200, "Máximo 200 caracteres"),
  description: z.string().min(1, "La descripción es requerida"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  suggestedManagerId: z.string().optional().nullable(),
})

type CreateTicketFormData = z.infer<typeof createTicketSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  userRoles: string[]
  ownerId?: string
  tenantId?: string
}

export default function CreateTicketDialog({ open, onOpenChange, userRoles, ownerId, tenantId }: Props) {
  const createMutation = useCreateTicket()
  const isOwner = userRoles.includes("OWNER")
  const isAdminManager = userRoles.includes("ADMIN") || userRoles.includes("MANAGER")

  const isTenant = userRoles.includes("TENANT")

  const { data: apartmentsData, isLoading: apartmentsLoading, error: apartmentsError } =
    isOwner && ownerId
      ? useOwnerApartments(ownerId)
      : isTenant
        ? { data: undefined, isLoading: false, error: null }
        : useApartments({ limit: 200 })

  const { data: tenantApartment, isLoading: tenantAptLoading } = useQuery({
    queryKey: ["tenant-apartment-form", tenantId],
    queryFn: () => get<{ status: string; data: any }>(`/tenants/${tenantId}/apartment`),
    select: (res) => res.data,
    enabled: !!tenantId && isTenant,
  })

  const { data: managersData, isLoading: managersLoading } = useManagers({ limit: 100 })

  const [serverError, setServerError] = useState<string | null>(null)

  const apartments = apartmentsData?.items ?? []
  const managers = managersData?.items ?? []
  const canAccessApartments = isOwner || isAdminManager

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateTicketFormData>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      apartmentId: "",
      title: "",
      description: "",
      priority: "MEDIUM",
      suggestedManagerId: null,
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        apartmentId: "",
        title: "",
        description: "",
        priority: "MEDIUM",
        suggestedManagerId: null,
      })
      setServerError(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (isTenant && tenantApartment) {
      setValue("apartmentId", tenantApartment.id, { shouldValidate: true })
    }
  }, [isTenant, tenantApartment, setValue])

  const onSubmit = async (data: CreateTicketFormData) => {
    setServerError(null)
    const apartmentId = isTenant && tenantApartment ? tenantApartment.id : data.apartmentId
    if (!apartmentId) {
      setServerError("El departamento es requerido")
      return
    }
    try {
      await createMutation.mutateAsync({
        apartmentId,
        title: data.title,
        description: data.description,
        priority: data.priority,
        suggestedManagerId: data.suggestedManagerId || null,
      })
      onOpenChange(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al crear ticket"
      setServerError(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo ticket</DialogTitle>
          <DialogDescription>
            Completá los datos para crear un nuevo ticket de soporte.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="apartmentId">Departamento</Label>
            {isTenant ? (
              <>
                {tenantAptLoading ? (
                  <div className="h-9 rounded-lg border bg-muted px-3 flex items-center text-sm text-muted-foreground">
                    Cargando departamento…
                  </div>
                ) : tenantApartment ? (
                  <div className="min-h-9 rounded-lg border bg-muted px-3 flex items-center text-sm text-muted-foreground">
                    {tenantApartment.building?.name ?? "Edificio"} - {tenantApartment.unitNumber}
                    {tenantApartment.floor ? ` (Piso ${tenantApartment.floor})` : ""}
                  </div>
                ) : (
                  <p className="text-xs text-destructive">No se encontró un departamento asignado</p>
                )}
                {errors.apartmentId && (
                  <p className="text-xs text-destructive">{errors.apartmentId.message}</p>
                )}
              </>
            ) : canAccessApartments ? (
              <>
                <Select
                  value={watch("apartmentId")}
                  onValueChange={(v) => setValue("apartmentId", v, { shouldValidate: true })}
                >
                  <SelectTrigger id="apartmentId">
                    <SelectValue placeholder={apartmentsLoading ? "Cargando…" : "Seleccionar departamento"} />
                  </SelectTrigger>
                  <SelectContent>
                    {apartmentsError ? (
                      <SelectItem value="" disabled>Error al cargar departamentos</SelectItem>
                    ) : apartments.length === 0 ? (
                      <SelectItem value="" disabled>No hay departamentos disponibles</SelectItem>
                    ) : (
                      apartments.map((apt: Apartment) => (
                        <SelectItem key={apt.id} value={apt.id}>
                          {apt.building?.name ?? "Edificio"} - {apt.unitNumber}
                          {apt.floor ? ` (Piso ${apt.floor})` : ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.apartmentId && (
                  <p className="text-xs text-destructive">{errors.apartmentId.message}</p>
                )}
              </>
            ) : (
              <>
                <Input
                  id="apartmentId"
                  placeholder="ID del departamento"
                  {...register("apartmentId")}
                />
                <p className="text-xs text-muted-foreground">
                  Ingresá el ID del departamento asociado al ticket.
                </p>
                {errors.apartmentId && (
                  <p className="text-xs text-destructive">{errors.apartmentId.message}</p>
                )}
              </>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Título</Label>
            <Input id="title" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descripción</Label>
            <textarea
              id="description"
              {...register("description")}
              className="h-24 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-y"
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="priority">Prioridad</Label>
            <Select
              value={watch("priority")}
              onValueChange={(v) => setValue("priority", v, { shouldValidate: true })}
            >
              <SelectTrigger id="priority">
                <SelectValue placeholder="Seleccionar prioridad" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.priority && <p className="text-xs text-destructive">{errors.priority.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="suggestedManager">Sugerir un encargado (opcional)</Label>
            <Select
              value={watch("suggestedManagerId") ?? ""}
              onValueChange={(v) => setValue("suggestedManagerId", v || null, { shouldValidate: true })}
            >
              <SelectTrigger id="suggestedManager">
                <SelectValue placeholder={managersLoading ? "Cargando…" : "Sin sugerencia"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin sugerencia</SelectItem>
                {managers.map((m: Manager) => (
                  <SelectItem key={m.id} value={m.userId}>
                    {m.user.firstName} {m.user.lastName} ({m.user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.suggestedManagerId && (
              <p className="text-xs text-destructive">{errors.suggestedManagerId.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || tenantAptLoading || createMutation.isPending}>
              {isSubmitting || createMutation.isPending ? "Creando…" : tenantAptLoading ? "Cargando departamento…" : "Crear ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
