import { useQuery } from "@tanstack/react-query"
import { get } from "@/lib/browser-api-client"
import QueryProvider from "@/components/providers/QueryProvider"
import { Home, Building2, MapPin, User as UserIcon, FileText, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Props {
  ownerId?: string
}

type OwnerApartment = {
  id: string
  unitNumber: string
  floor?: number | null
  bedrooms?: number | null
  bathrooms?: number | null
  areaM2?: number | null
  status?: string | null
  building: { id: string; name: string; consortiumId: string }
  tenant?: {
    id: string
    user: { id: string; firstName: string; lastName: string; email: string }
  } | null
}

type ApiResponse = {
  status: string
  data: OwnerApartment[]
}

const STATUS_LABELS: Record<string, string> = {
  occupied: "Ocupado",
  vacant: "Vacante",
  maintenance: "Mantenimiento",
}

function ApartmentCard({ apt }: { apt: OwnerApartment }) {
  const statusLabel = STATUS_LABELS[apt.status ?? ""] ?? apt.status ?? "—"
  const statusVariant = apt.status === "vacant" ? "secondary" as const
    : apt.status === "maintenance" ? "warning" as const
    : "default" as const

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold">
            {apt.building.name} - {apt.unitNumber}
          </h3>
          {apt.floor != null && (
            <p className="text-xs text-muted-foreground mt-0.5">Piso {apt.floor}</p>
          )}
        </div>
        <Badge variant={statusVariant}>{statusLabel}</Badge>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Building2 className="size-3.5" />
          <span>{apt.building.name}</span>
        </div>
        {apt.areaM2 != null && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="size-3.5" />
            <span>{apt.areaM2} m²</span>
          </div>
        )}
        {apt.tenant && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <UserIcon className="size-3.5" />
            <span>{apt.tenant.user.firstName} {apt.tenant.user.lastName}</span>
          </div>
        )}
        {apt.bedrooms != null && (
          <p className="text-muted-foreground">{apt.bedrooms} dorm. | {apt.bathrooms ?? 0} baños</p>
        )}
        <div className="flex items-center gap-2 pt-2">
          <a href={`/dashboard/expensas?apartmentId=${apt.id}`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <FileText className="size-3.5" />
              Expensas
            </Button>
          </a>
          <a href={`/dashboard/tickets?apartmentId=${apt.id}`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Ticket className="size-3.5" />
              Tickets
            </Button>
          </a>
        </div>
      </div>
    </div>
  )
}

function PropiedadesContent({ ownerId }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["owner-apartments", ownerId],
    queryFn: () => get<ApiResponse>(`/owners/${ownerId}/apartments`),
    select: (res) => res.data,
    enabled: !!ownerId,
  })

  const apartments = data ?? []

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <a href="/dashboard" className="hover:text-foreground transition-colors">
          <Home className="size-4" />
        </a>
        <span>/</span>
        <span className="text-foreground font-medium">Mis Propiedades</span>
      </nav>
      <div>
        <h1 className="text-2xl font-semibold">Mis Propiedades</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {ownerId
            ? "Tus departamentos registrados en el sistema."
            : "No tienes un perfil de propietario asociado."}
        </p>
      </div>

      {!ownerId ? (
        <div className="rounded-lg border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          No hay un perfil de propietario vinculado a tu cuenta. Contactate con el administrador.
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">Cargando propiedades…</p>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Error al cargar las propiedades: {(error as Error).message}
        </div>
      ) : apartments.length === 0 ? (
        <div className="rounded-lg border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          No tenés propiedades registradas. Contactate con el administrador para que asigne un departamento a tu perfil.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {apartments.map((apt) => (
            <ApartmentCard key={apt.id} apt={apt} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function PropiedadesPageRoot({ ownerId }: Props) {
  return (
    <QueryProvider>
      <PropiedadesContent ownerId={ownerId} />
    </QueryProvider>
  )
}
