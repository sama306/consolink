import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { useState } from "react"

const registerSchema = z
  .object({
    firstName: z.string().min(1, "El nombre es requerido"),
    lastName: z.string().min(1, "El apellido es requerido"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirmá la contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

type RegisterFormData = z.infer<typeof registerSchema>

type FieldError = {
  field: keyof RegisterFormData
  message: string
}

export default function RegisterForm() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const getFieldError = (field: keyof RegisterFormData) => {
    const server = fieldErrors.find((e) => e.field === field)
    if (server) return server.message
    return errors[field]?.message
  }

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null)
    setFieldErrors([])

    try {
      const res = await fetch(
        `${import.meta.env.PUBLIC_API_URL}/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            password: data.password,
          }),
        }
      )

      if (res.ok) {
        window.location.href = "/dashboard"
        return
      }

      const body = await res.json().catch(() => null)

      if (body?.details && Array.isArray(body.details)) {
        setFieldErrors(
          body.details.map((d: { field?: string; message?: string }) => ({
            field: d.field as keyof RegisterFormData,
            message: d.message ?? "Error de validación",
          }))
        )
      } else {
        setServerError(body?.error?.message ?? "Error al registrarse")
      }
    } catch {
      setServerError("Error de conexión. Intente nuevamente.")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-center">Crear cuenta</h1>

      {serverError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="firstName" className="text-sm font-medium">
          Nombre
        </label>
        <input
          id="firstName"
          type="text"
          {...register("firstName")}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        {getFieldError("firstName") && (
          <p className="text-xs text-destructive">
            {getFieldError("firstName")}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="lastName" className="text-sm font-medium">
          Apellido
        </label>
        <input
          id="lastName"
          type="text"
          {...register("lastName")}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        {getFieldError("lastName") && (
          <p className="text-xs text-destructive">
            {getFieldError("lastName")}
          </p>
        )}
      </div>

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

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-medium">
          Confirmar contraseña
        </label>
        <input
          id="confirmPassword"
          type="password"
          {...register("confirmPassword")}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        {getFieldError("confirmPassword") && (
          <p className="text-xs text-destructive">
            {getFieldError("confirmPassword")}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tenés cuenta?{" "}
        <a href="/login" className="text-primary underline-offset-4 hover:underline">
          Iniciá sesión
        </a>
      </p>
    </form>
  )
}
