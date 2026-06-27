import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useCreateAnnouncement } from "@/hooks/useAnnouncements"
import { useConsortiums } from "@/hooks/useConsortiums"

const createSchema = z.object({
  title: z.string().min(1, "El título es requerido").max(200, "Máximo 200 caracteres"),
  content: z.string().min(1, "El contenido es requerido"),
  priority: z.string().optional(),
  consortiumId: z.string().optional(),
  buildingId: z.string().optional(),
})

type CreateFormData = z.infer<typeof createSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CreateAnnouncementDialog({ open, onOpenChange }: Props) {
  const [serverError, setServerError] = useState<string | null>(null)
  const createMutation = useCreateAnnouncement()
  const { data: consortiumsData } = useConsortiums({ limit: 100 })
  const consortiums = consortiumsData?.items ?? []

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      title: "",
      content: "",
      priority: "",
      consortiumId: "",
      buildingId: "",
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        title: "",
        content: "",
        priority: "",
        consortiumId: "",
        buildingId: "",
      })
      setServerError(null)
    }
  }, [open, reset])

  const onSubmit = async (data: CreateFormData) => {
    setServerError(null)
    const payload: Record<string, unknown> = {
      title: data.title,
      content: data.content,
    }
    if (data.priority) payload.priority = data.priority
    if (data.consortiumId) payload.consortiumId = data.consortiumId
    if (data.buildingId) payload.buildingId = data.buildingId

    try {
      await createMutation.mutateAsync(payload as Parameters<typeof createMutation.mutateAsync>[0])
      onOpenChange(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al crear aviso"
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
          <DialogTitle>Nuevo aviso</DialogTitle>
          <DialogDescription>
            Creá un nuevo aviso o comunicado para el consorcio.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Título / Asunto</Label>
            <Input id="title" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="content">Descripción</Label>
            <textarea
              id="content"
              {...register("content")}
              className="h-32 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-y"
            />
            {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="priority">Prioridad</Label>
            <Select
              value={watch("priority")}
              onValueChange={(v) => setValue("priority", v, { shouldValidate: true })}
            >
              <SelectTrigger id="priority">
                <SelectValue placeholder="Normal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Normal</SelectItem>
                <SelectItem value="HIGH">Alta</SelectItem>
                <SelectItem value="URGENT">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="consortiumId">Consorcio</Label>
            <Select
              value={watch("consortiumId")}
              onValueChange={(v) => setValue("consortiumId", v, { shouldValidate: true })}
            >
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

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creando…" : "Crear aviso"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
