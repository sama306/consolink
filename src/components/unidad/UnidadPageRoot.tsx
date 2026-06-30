import { useQuery } from "@tanstack/react-query"
import { get } from "@/lib/browser-api-client"
import QueryProvider from "@/components/providers/QueryProvider"
import { Home, Building2, MapPin, User as UserIcon, Calendar, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Props {
  tenantId?: string
}

type ConsortiumInfo = {
  id: string
  name: string
}

type BuildingWithConsortium = {
  id: string
  name: string
  consortium: ConsortiumInfo
}

type OwnerInfo = {
  id: string
  user: { id: string; firstName: string; lastName: string }
}

type TenantApartment = {
  id: string
  unitNumber: string
  floor?: number | null
  bedrooms?: number | null
  bathrooms?: number | null
  areaM2?: number | null
  status?: string | null
  building: BuildingWithConsortium
  owner?: OwnerInfo | null
}

type ContractStatus = {
  tenantId: string
  leaseStart?: string | null
  leaseEnd?: string | null
  daysRemaining: number
  status: "active" | "expiring_soon" | "expired" | "no_end_date"
}

type ApiResponse<T> = {
  status: string
  data: T
}

const STATUS_LABELS: Record<string, string> = {
  occupied: "Ocupado",
  vacant: "Vacante",
  maintenance: "Mantenimiento",
}

const CONTRACT_STATUS_LABELS: Record<string, string> = {
  active: "Vigente",
  expiring_soon: "Próximo a vencer",
  expired: "Vencido",
  no_end_date: "Sin fecha de fin",
}

function getContractStatusVariant(status: string) {
  switch (status) {
    case "active": return "success" as const
    case "expiring_soon": return "warning" as const
    case "expired": return "destructive" as const
    case "no_end_date": return "secondary" as const
    default: return "secondary" as const
  }
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function UnidadContent({ tenantId }: Props) {
  const { data: apartment, isLoading, error } = useQuery({
    queryKey: ["tenant-apartment", tenantId],
    queryFn: () => get<ApiResponse<TenantApartment>>(`/tenants/${tenantId}/apartment`),
    select: (res) => res.data,
    enabled: !!tenantId,
  })

  const { data: contract } = useQuery({
    queryKey: ["tenant-contract-status", tenantId],
    queryFn: () => get<ApiResponse<ContractStatus>>(`/tenants/${tenantId}/contract-status`),
    select: (res) => res.data,
    enabled: !!tenantId,
  })

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <a href="/dashboard" className="hover:text-foreground transition-colors">
          <Home className="size-4" />
        </a>
        <span>/</span>
        <span className="text-foreground font-medium">Mi Unidad</span>
      </nav>
      <div>
        <h1 className="text-2xl font-semibold">Mi Unidad</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Información de tu departamento y contrato.
        </p>
      </div>

      {!tenantId ? (
        <div className="rounded-lg border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          No hay un perfil de inquilino vinculado a tu cuenta. Contactate con el administrador.
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">Cargando información…</p>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Error al cargar la unidad: {(error as Error).message}
        </div>
      ) : !apartment ? (
        <div className="rounded-lg border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          No tenés una unidad asignada. Contactate con el administrador.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border bg-card p-4 space-y-4">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Building2 className="size-4" />
              Departamento
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Consorcio</span>
                <span className="text-sm font-medium">{apartment.building.consortium.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Edificio</span>
                <span className="text-sm font-medium">{apartment.building.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Unidad</span>
                <span className="text-sm font-medium">{apartment.unitNumber}</span>
              </div>
              {apartment.floor != null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Piso</span>
                  <span className="text-sm font-medium">{apartment.floor}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado</span>
                <Badge variant={apartment.status === "vacant" ? "secondary" : "default"}>
                  {STATUS_LABELS[apartment.status ?? ""] ?? apartment.status ?? "—"}
                </Badge>
              </div>
              {apartment.areaM2 != null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Superficie</span>
                  <span className="text-sm font-medium">{apartment.areaM2} m²</span>
                </div>
              )}
              {apartment.bedrooms != null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Ambientes</span>
                  <span className="text-sm font-medium">{apartment.bedrooms} dorm. | {apartment.bathrooms ?? 0} baños</span>
                </div>
              )}
              {apartment.owner && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Propietario</span>
                  <span className="text-sm font-medium">
                    {apartment.owner.user.firstName} {apartment.owner.user.lastName}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4 space-y-4">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Calendar className="size-4" />
              Contrato
            </h2>
            {contract ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estado</span>
                  <Badge variant={getContractStatusVariant(contract.status)}>
                    {CONTRACT_STATUS_LABELS[contract.status] ?? contract.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Inicio</span>
                  <span className="text-sm font-medium">{formatDate(contract.leaseStart)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Fin</span>
                  <span className="text-sm font-medium">{formatDate(contract.leaseEnd)}</span>
                </div>
                {contract.status !== "no_end_date" && contract.status !== "expired" && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Días restantes</span>
                    <span className="text-sm font-medium flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {contract.daysRemaining}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Cargando información del contrato…</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function UnidadPageRoot({ tenantId }: Props) {
  return (
    <QueryProvider>
      <UnidadContent tenantId={tenantId} />
    </QueryProvider>
  )
}
