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
import { useCreateConsortium, useUpdateConsortium, type Consortium } from "@/hooks/useConsortiums"
import { useState, useEffect } from "react"

const consortiumSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  taxId: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  province: z.string().optional().or(z.literal("")),
  zipCode: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  logoUrl: z.string().url("URL inválida").optional().or(z.literal("")),
})

type ConsortiumFormData = z.infer<typeof consortiumSchema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  consortium?: Consortium | null
}

export default function ConsortiumFormDialog({ open, onOpenChange, consortium }: Props) {
  const createMutation = useCreateConsortium()
  const updateMutation = useUpdateConsortium(consortium?.id ?? "")
  const [serverError, setServerError] = useState<string | null>(null)

  const isEdit = !!consortium

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ConsortiumFormData>({
    resolver: zodResolver(consortiumSchema),
  })

  useEffect(() => {
    if (consortium) {
      reset({
        name: consortium.name ?? "",
        taxId: consortium.taxId ?? "",
        address: consortium.address ?? "",
        city: consortium.city ?? "",
        province: consortium.province ?? "",
        zipCode: consortium.zipCode ?? "",
        phone: consortium.phone ?? "",
        email: consortium.email ?? "",
        logoUrl: consortium.logoUrl ?? "",
      })
    } else {
      reset({
        name: "",
        taxId: "",
        address: "",
        city: "",
        province: "",
        zipCode: "",
        phone: "",
        email: "",
        logoUrl: "",
      })
    }
    setServerError(null)
  }, [consortium, open, reset])

  const onSubmit = async (data: ConsortiumFormData) => {
    setServerError(null)
    try {
      if (isEdit) {
        await updateMutation.mutateAsync(data as Record<string, unknown>)
      } else {
        await createMutation.mutateAsync(data as Record<string, unknown>)
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
          <DialogTitle>{isEdit ? "Editar consorcio" : "Nuevo consorcio"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Modificá los datos del consorcio." : "Completá los datos para crear un nuevo consorcio."}
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
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="taxId">CUIT/CUIL</Label>
              <Input id="taxId" {...register("taxId")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" {...register("phone")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="zipCode">Código Postal</Label>
              <Input id="zipCode" {...register("zipCode")} />
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

            <div className="flex flex-col gap-1.5 col-span-2">
              <Label htmlFor="logoUrl">URL del logo</Label>
              <Input id="logoUrl" {...register("logoUrl")} />
              {errors.logoUrl && <p className="text-xs text-destructive">{errors.logoUrl.message}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear consorcio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
