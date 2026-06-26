import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useCreateTenant, useUpdateTenant, useCreateUser, type Tenant } from "@/hooks/useTenants"
import { useState, useEffect } from "react"

const tenantFormSchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  leaseStart: z.string().optional().or(z.literal("")),
  leaseEnd: z.string().optional().or(z.literal("")),
  depositAmount: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
})

type TenantFormData = z.infer<typeof tenantFormSchema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenant?: Tenant | null
}

export default function TenantFormDialog({ open, onOpenChange, tenant }: Props) {
  const createTenantMutation = useCreateTenant()
  const updateTenantMutation = useUpdateTenant(tenant?.id ?? "")
  const createUserMutation = useCreateUser()
  const [serverError, setServerError] = useState<string | null>(null)

  const isEdit = !!tenant

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TenantFormData>({
    resolver: zodResolver(tenantFormSchema),
  })

  useEffect(() => {
    if (tenant) {
      reset({
        firstName: tenant.user.firstName ?? "",
        lastName: tenant.user.lastName ?? "",
        email: tenant.user.email ?? "",
        password: "",
        phone: tenant.user.phone ?? "",
        leaseStart: tenant.leaseStart ? tenant.leaseStart.slice(0, 10) : "",
        leaseEnd: tenant.leaseEnd ? tenant.leaseEnd.slice(0, 10) : "",
        depositAmount: tenant.depositAmount?.toString() ?? "",
        notes: tenant.notes ?? "",
      })
    } else {
      reset({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        phone: "",
        leaseStart: "",
        leaseEnd: "",
        depositAmount: "",
        notes: "",
      })
    }
    setServerError(null)
  }, [tenant, open, reset])

  const onSubmit = async (data: TenantFormData) => {
    setServerError(null)
    try {
      if (isEdit) {
        const leaseStart = data.leaseStart ? new Date(data.leaseStart + "T00:00:00.000Z").toISOString() : null
        const leaseEnd = data.leaseEnd ? new Date(data.leaseEnd + "T00:00:00.000Z").toISOString() : null
        const payload: Record<string, unknown> = {
          leaseStart: leaseStart ?? null,
          leaseEnd: leaseEnd ?? null,
          depositAmount: data.depositAmount ? Number(data.depositAmount) : null,
          notes: data.notes || null,
        }
        if (data.password) {
          payload.password = data.password
        }
        await updateTenantMutation.mutateAsync(payload)
      } else {
        if (!data.password) {
          setServerError("La contraseña es requerida para crear un nuevo usuario")
          return
        }
        const userRes = await createUserMutation.mutateAsync({
          email: data.email,
          password: data.password ?? "",
          firstName: data.firstName,
          lastName: data.lastName,
          roleName: "TENANT",
          phone: data.phone || undefined,
        })
        const userId = (userRes as { data: { id: string } }).data.id
        const leaseStart = data.leaseStart ? new Date(data.leaseStart + "T00:00:00.000Z").toISOString() : null
        const leaseEnd = data.leaseEnd ? new Date(data.leaseEnd + "T00:00:00.000Z").toISOString() : null
        await createTenantMutation.mutateAsync({
          userId,
          leaseStart,
          leaseEnd,
          depositAmount: data.depositAmount ? Number(data.depositAmount) : null,
          notes: data.notes || null,
        })
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
          <DialogTitle>{isEdit ? "Editar inquilino" : "Nuevo inquilino"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Modificá los datos del inquilino." : "Completá los datos para crear un nuevo inquilino y su usuario asociado."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="firstName">Nombre</Label>
              <Input id="firstName" {...register("firstName")} />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lastName">Apellido</Label>
              <Input id="lastName" {...register("lastName")} />
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">
                {isEdit ? "Contraseña (dejar vacío para no cambiar)" : "Contraseña"}
              </Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" {...register("phone")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="leaseStart">Inicio de contrato</Label>
              <Input id="leaseStart" type="date" {...register("leaseStart")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="leaseEnd">Fin de contrato</Label>
              <Input id="leaseEnd" type="date" {...register("leaseEnd")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="depositAmount">Depósito</Label>
              <Input id="depositAmount" type="number" step="0.01" {...register("depositAmount")} />
            </div>

            <div className="flex flex-col gap-1.5 col-span-2">
              <Label htmlFor="notes">Notas</Label>
              <Input id="notes" {...register("notes")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear inquilino"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
