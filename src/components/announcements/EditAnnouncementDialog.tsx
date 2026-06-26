import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useUpdateAnnouncement, type Announcement } from "@/hooks/useAnnouncements"

const editSchema = z.object({
  title: z.string().min(1, "El título es requerido").max(200, "Máximo 200 caracteres"),
  content: z.string().min(1, "El contenido es requerido"),
  priority: z.string().optional(),
})

type EditFormData = z.infer<typeof editSchema>

interface Props {
  announcement: Announcement | null
  onOpenChange: (open: boolean) => void
}

export default function EditAnnouncementDialog({ announcement, onOpenChange }: Props) {
  const [serverError, setServerError] = useState<string | null>(null)
  const updateMutation = useUpdateAnnouncement()
  const open = !!announcement

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: "",
      content: "",
      priority: "",
    },
  })

  useEffect(() => {
    if (announcement) {
      reset({
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority ?? "",
      })
      setServerError(null)
    }
  }, [announcement, reset])

  const onSubmit = async (data: EditFormData) => {
    if (!announcement) return
    setServerError(null)
    const payload: Record<string, unknown> = {
      title: data.title,
      content: data.content,
    }
    if (data.priority) payload.priority = data.priority

    try {
      await updateMutation.mutateAsync({ id: announcement.id, ...payload } as Parameters<typeof updateMutation.mutateAsync>[0])
      onOpenChange(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al actualizar aviso"
      setServerError(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar aviso</DialogTitle>
          <DialogDescription>
            Modificá el aviso seleccionado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-title">Título / Asunto</Label>
            <Input id="edit-title" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-content">Descripción</Label>
            <textarea
              id="edit-content"
              {...register("content")}
              className="h-32 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-y"
            />
            {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-priority">Prioridad</Label>
            <Select
              value={watch("priority")}
              onValueChange={(v) => setValue("priority", v, { shouldValidate: true })}
            >
              <SelectTrigger id="edit-priority">
                <SelectValue placeholder="Normal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Normal</SelectItem>
                <SelectItem value="HIGH">Alta</SelectItem>
                <SelectItem value="URGENT">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando…" : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
