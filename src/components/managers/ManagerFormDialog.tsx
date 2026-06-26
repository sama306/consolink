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
import { useCreateManager, useUpdateManager, useCreateUser, type Manager } from "@/hooks/useManagers"
import { useState, useEffect } from "react"
import { Checkbox } from "@/components/ui/checkbox"

const managerFormSchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  title: z.string().optional().or(z.literal("")),
  isSupervisor: z.boolean().default(false),
  notes: z.string().optional().or(z.literal("")),
})

type ManagerFormData = z.infer<typeof managerFormSchema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  manager?: Manager | null
}

export default function ManagerFormDialog({ open, onOpenChange, manager }: Props) {
  const createManagerMutation = useCreateManager()
  const updateManagerMutation = useUpdateManager(manager?.id ?? "")
  const createUserMutation = useCreateUser()
  const [serverError, setServerError] = useState<string | null>(null)

  const isEdit = !!manager

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ManagerFormData>({
    resolver: zodResolver(managerFormSchema),
  })

  const watchIsSupervisor = watch("isSupervisor")

  useEffect(() => {
    if (manager) {
      reset({
        firstName: manager.user.firstName ?? "",
        lastName: manager.user.lastName ?? "",
        email: manager.user.email ?? "",
        password: "",
        phone: manager.user.phone ?? "",
        title: manager.title ?? "",
        isSupervisor: manager.isSupervisor ?? false,
        notes: manager.notes ?? "",
      })
    } else {
      reset({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        phone: "",
        title: "",
        isSupervisor: false,
        notes: "",
      })
    }
    setServerError(null)
  }, [manager, open, reset])

  const onSubmit = async (data: ManagerFormData) => {
    setServerError(null)
    try {
      if (isEdit) {
        const payload: Record<string, unknown> = {
          title: data.title || null,
          isSupervisor: data.isSupervisor,
          notes: data.notes || null,
        }
        if (data.password) {
          payload.password = data.password
        }
        await updateManagerMutation.mutateAsync(payload)
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
          roleName: "MANAGER",
          phone: data.phone || undefined,
        })
        const userId = (userRes as { data: { id: string } }).data.id
        await createManagerMutation.mutateAsync({
          userId,
          title: data.title || null,
          isSupervisor: data.isSupervisor,
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
          <DialogTitle>{isEdit ? "Editar encargado" : "Nuevo encargado"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Modificá los datos del encargado." : "Completá los datos para crear un nuevo encargado y su usuario asociado."}
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
              <Label htmlFor="title">Cargo</Label>
              <Input id="title" {...register("title")} placeholder="Ej: Encargado general" />
            </div>

            <div className="flex flex-col gap-1.5 col-span-2">
              <Label htmlFor="notes">Notas</Label>
              <Input id="notes" {...register("notes")} />
            </div>

            <div className="flex items-center gap-2 col-span-2">
              <Checkbox
                id="isSupervisor"
                checked={watchIsSupervisor}
                onCheckedChange={(v) => setValue("isSupervisor", v === true)}
              />
              <Label htmlFor="isSupervisor" className="text-sm cursor-pointer">Supervisor</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear encargado"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
