import { useState } from "react"
import { useExpenses, useMarkExpensePaid, useMarkExpensePending, STATUS_LABELS, getStatusVariant, type Expense } from "@/hooks/useExpenses"
import { useConsortiums } from "@/hooks/useConsortiums"
import { useBuildings } from "@/hooks/useBuildings"
import { useDebounce } from "@/lib/use-debounce"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { CheckCircle, Undo2, Plus } from "lucide-react"
import GenerateBulkExpensesDialog from "./GenerateBulkExpensesDialog"

interface Props {
  userRoles: string[]
}

const STATUS_FILTERS = ["", "PENDING", "PAID", "OVERDUE"]

export default function ExpensesTable({ userRoles }: Props) {
  const isAdmin = userRoles.includes("ADMIN")
  const isOwnerTenant = userRoles.includes("OWNER") || userRoles.includes("TENANT")

  const [page, setPage] = useState(1)
  const [consortiumFilter, setConsortiumFilter] = useState("")
  const [buildingFilter, setBuildingFilter] = useState("")
  const [periodFilter, setPeriodFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const debouncedConsortium = useDebounce(consortiumFilter, 300)
  const debouncedBuilding = useDebounce(buildingFilter, 300)
  const debouncedPeriod = useDebounce(periodFilter, 300)
  const debouncedStatus = useDebounce(statusFilter, 300)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [revertingExpense, setRevertingExpense] = useState<Expense | null>(null)

  const params: Record<string, unknown> = { page, limit: 20 }
  if (debouncedConsortium) params.consortiumId = debouncedConsortium
  if (debouncedBuilding) params.buildingId = debouncedBuilding
  if (debouncedPeriod) params.period = debouncedPeriod
  if (debouncedStatus) params.status = debouncedStatus

  const { data, isLoading, error } = useExpenses(params)
  const { data: consortiumsData } = useConsortiums({ limit: 100 })
  const { data: buildingsData } = useBuildings(
    debouncedConsortium ? { limit: 100, consortiumId: debouncedConsortium } : { limit: 100 }
  )
  const markPaidMutation = useMarkExpensePaid()
  const markPendingMutation = useMarkExpensePending()

  const items = data?.items ?? []
  const totalPages = data?.totalPages ?? 1
  const consortiums = consortiumsData?.items ?? []
  const buildings = buildingsData?.items ?? []

  const isDueSoon = (dueDate: string) => {
    const due = new Date(dueDate)
    const now = new Date()
    const diffMs = due.getTime() - now.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    return diffDays <= 7 && diffDays > 0
  }

  const isOverdue = (dueDate: string, status: string) => {
    if (status === "PAID") return false
    return new Date(dueDate) < new Date()
  }

  const handleMarkPaid = async (expenseId: string) => {
    try {
      await markPaidMutation.mutateAsync(expenseId)
    } catch {
    }
  }

  const handleRevertPending = async () => {
    if (!revertingExpense) return
    try {
      await markPendingMutation.mutateAsync(revertingExpense.id)
      setRevertingExpense(null)
    } catch {
    }
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="consortium-filter" className="text-xs">Consorcio</Label>
            <Select value={consortiumFilter} onValueChange={(v) => { setConsortiumFilter(v); setPage(1); setBuildingFilter("") }}>
              <SelectTrigger className="h-7 w-44 text-xs">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {consortiums.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="building-filter" className="text-xs">Edificio</Label>
            <Select value={buildingFilter} onValueChange={(v) => { setBuildingFilter(v); setPage(1) }}>
              <SelectTrigger className="h-7 w-44 text-xs">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {buildings.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="period-filter" className="text-xs">Período</Label>
            <input
              id="period-filter"
              type="month"
              value={periodFilter}
              onChange={(e) => { setPeriodFilter(e.target.value); setPage(1) }}
              className="h-7 w-40 rounded-lg border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="status-filter" className="text-xs">Estado</Label>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="h-7 w-32 text-xs">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {STATUS_FILTERS.filter(Boolean).map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setBulkOpen(true)} size="sm" className="ml-auto">
            <Plus /> Generar expensas
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">Cargando expensas…</p>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {(error as Error).message}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          No hay expensas.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {isAdmin && <TableHead>Departamento</TableHead>}
                <TableHead>Período</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Importe</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Vencimiento</TableHead>
                {isAdmin && <TableHead className="w-24 text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((expense: Expense) => {
                const dueSoon = isDueSoon(expense.dueDate)
                const expired = isOverdue(expense.dueDate, expense.status)
                return (
                  <TableRow key={expense.id}>
                    {isAdmin && (
                      <TableCell className="text-muted-foreground text-xs">
                        {expense.apartment.building?.name ?? "—"} - {expense.apartment.unitNumber}
                      </TableCell>
                    )}
                    <TableCell className="text-xs font-medium">{expense.period}</TableCell>
                    <TableCell className="text-xs">{expense.description}</TableCell>
                    <TableCell className="text-xs font-medium">
                      ${Number(expense.amount).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(expense.status)}>
                        {STATUS_LABELS[expense.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className={dueSoon || expired ? "font-semibold text-destructive" : ""}>
                        {new Date(expense.dueDate).toLocaleDateString("es-AR")}
                      </span>
                      {(dueSoon || expired) && expense.status !== "PAID" && (
                        <span className="ml-1.5 text-[11px] text-destructive">
                          ({expired ? "vencida" : "próximo"})
                        </span>
                      )}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {expense.status === "PAID" && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setRevertingExpense(expense)}
                              disabled={markPendingMutation.isPending}
                              title="Revertir a pendiente"
                            >
                              <Undo2 className="size-3.5" />
                            </Button>
                          )}
                          {expense.status !== "PAID" && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleMarkPaid(expense.id)}
                              disabled={markPaidMutation.isPending}
                              title="Marcar como pagada"
                            >
                              <CheckCircle className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <span className="text-xs text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}

      {isAdmin && (
        <GenerateBulkExpensesDialog open={bulkOpen} onOpenChange={setBulkOpen} />
      )}

      <AlertDialog open={!!revertingExpense} onOpenChange={(open) => { if (!open) setRevertingExpense(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revertir expensa a pendiente</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de revertir esta expensa de "{revertingExpense?.description}" ({revertingExpense?.period}) a estado pendiente? Esta acción es una corrección manual de un marcado como pagado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevertPending} disabled={markPendingMutation.isPending}>
              {markPendingMutation.isPending ? "Revirtiendo…" : "Sí, revertir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
