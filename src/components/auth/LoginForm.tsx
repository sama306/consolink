import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { useState } from "react"

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
})

type LoginFormData = z.infer<typeof loginSchema>

type FieldError = {
  field: keyof LoginFormData
  message: string
}

export default function LoginForm() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const getFieldError = (field: keyof LoginFormData) => {
    const server = fieldErrors.find((e) => e.field === field)
    if (server) return server.message
    return errors[field]?.message
  }

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null)
    setFieldErrors([])

    try {
      const res = await fetch(
        `${import.meta.env.PUBLIC_API_URL}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(data),
        }
      )

      if (res.ok) {
        window.location.href = "/dashboard"
        return
      }

      const body = await res.json().catch(() => null)

      if (res.status === 401) {
        setServerError(body?.error?.message ?? "Credenciales inválidas")
        return
      }

      if (body?.details && Array.isArray(body.details)) {
        setFieldErrors(
          body.details.map((d: { field?: string; message?: string }) => ({
            field: d.field as keyof LoginFormData,
            message: d.message ?? "Error de validación",
          }))
        )
      } else {
        setServerError(body?.error?.message ?? "Error al iniciar sesión")
      }
    } catch {
      setServerError("Error de conexión. Intente nuevamente.")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-center">Iniciar sesión</h1>

      {serverError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register("email")}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        {getFieldError("email") && (
          <p className="text-xs text-destructive">{getFieldError("email")}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          {...register("password")}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        {getFieldError("password") && (
          <p className="text-xs text-destructive">
            {getFieldError("password")}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Ingresando…" : "Ingresar"}
      </Button>

    </form>
  )
}
