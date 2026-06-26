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
import { useCreateOwner, useUpdateOwner, useCreateUser, type Owner } from "@/hooks/useOwners"
import { useState, useEffect } from "react"

const ownerFormSchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  dni: z.string().min(1, "El DNI es requerido"),
  taxId: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
})

type OwnerFormData = z.infer<typeof ownerFormSchema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  owner?: Owner | null
}

export default function OwnerFormDialog({ open, onOpenChange, owner }: Props) {
  const createOwnerMutation = useCreateOwner()
  const updateOwnerMutation = useUpdateOwner(owner?.id ?? "")
  const createUserMutation = useCreateUser()
  const [serverError, setServerError] = useState<string | null>(null)

  const isEdit = !!owner

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OwnerFormData>({
    resolver: zodResolver(ownerFormSchema),
  })

  useEffect(() => {
    if (owner) {
      reset({
        firstName: owner.user.firstName ?? "",
        lastName: owner.user.lastName ?? "",
        email: owner.user.email ?? "",
        password: "",
        phone: owner.user.phone ?? "",
        dni: owner.dni ?? "",
        taxId: owner.taxId ?? "",
        notes: owner.notes ?? "",
      })
    } else {
      reset({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        phone: "",
        dni: "",
        taxId: "",
        notes: "",
      })
    }
    setServerError(null)
  }, [owner, open, reset])

  const onSubmit = async (data: OwnerFormData) => {
    setServerError(null)
    try {
      if (isEdit) {
        const payload: Record<string, unknown> = {
          dni: data.dni || undefined,
          taxId: data.taxId || null,
          notes: data.notes || null,
        }
        await updateOwnerMutation.mutateAsync(payload)
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
          phone: data.phone || undefined,
        })
        const userId = (userRes as { data: { id: string } }).data.id
        await createOwnerMutation.mutateAsync({
          userId,
          dni: data.dni,
          taxId: data.taxId || null,
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
          <DialogTitle>{isEdit ? "Editar propietario" : "Nuevo propietario"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Modificá los datos del propietario." : "Completá los datos para crear un nuevo propietario y su usuario asociado."}
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
              <Label htmlFor="dni">DNI</Label>
              <Input id="dni" {...register("dni")} />
              {errors.dni && <p className="text-xs text-destructive">{errors.dni.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="taxId">CUIT/CUIL</Label>
              <Input id="taxId" {...register("taxId")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notes">Notas</Label>
              <Input id="notes" {...register("notes")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear propietario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
