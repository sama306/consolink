import { useState } from "react"
import { useUsers, useUpdateUser, useUpdateUserRoles, useResetPassword, type AppUser } from "@/hooks/useUsers"
import { useDebounce } from "@/lib/use-debounce"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Pencil, KeyRound, Search, Shield } from "lucide-react"

const ALL_ROLES = ["ADMIN", "OWNER", "TENANT", "MANAGER"] as const

const ROLE_BADGE_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "info" | "warning"> = {
  ADMIN: "destructive",
  OWNER: "info",
  TENANT: "secondary",
  MANAGER: "warning",
}

export default function UsuariosTable() {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editActive, setEditActive] = useState(true)
  const [editRoles, setEditRoles] = useState<string[]>([])
  const [roleError, setRoleError] = useState<string | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [resetUser, setResetUser] = useState<AppUser | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)

  const { data: users, isLoading, error } = useUsers()
  const updateMutation = useUpdateUser(editingUser?.id ?? "")
  const rolesMutation = useUpdateUserRoles(editingUser?.id ?? "")
  const resetMutation = useResetPassword(resetUser?.id ?? "")

  const filtered = (users ?? []).filter((u) => {
    if (!debouncedSearch) return true
    const q = debouncedSearch.toLowerCase()
    return (
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    )
  })

  const openEdit = (u: AppUser) => {
    setEditingUser(u)
    setEditName(`${u.firstName} ${u.lastName}`)
    setEditEmail(u.email)
    setEditPhone(u.phone ?? "")
    setEditActive(u.isActive)
    setEditRoles(u.userRoles.map((ur) => ur.role.name))
    setRoleError(null)
    setEditOpen(true)
  }

  const handleSave = async () => {
    if (!editingUser) return
    setRoleError(null)
    const [firstName, ...lastParts] = editName.trim().split(" ")
    const lastName = lastParts.join(" ") || ""

    try {
      await updateMutation.mutateAsync({
        firstName,
        lastName,
        email: editEmail,
        phone: editPhone || undefined,
        isActive: editActive,
      })

      const currentRoles = editingUser.userRoles.map((ur) => ur.role.name)
      const rolesToAdd = editRoles.filter((r) => !currentRoles.includes(r))
      const rolesToRemove = currentRoles.filter((r) => !editRoles.includes(r))

      const roleOps: { roleName: string; action: "add" | "remove" }[] = [
        ...rolesToAdd.map((r) => ({ roleName: r, action: "add" as const })),
        ...rolesToRemove.map((r) => ({ roleName: r, action: "remove" as const })),
      ]

      if (roleOps.length > 0) {
        await rolesMutation.mutateAsync({ roles: roleOps })
      }

      setEditOpen(false)
      setEditingUser(null)
    } catch (err: unknown) {
      setRoleError(err instanceof Error ? err.message : "Error al guardar")
    }
  }

  const toggleRole = (role: string) => {
    setEditRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )
  }

  const openReset = (u: AppUser) => {
    setResetUser(u)
    setNewPassword("")
    setGeneratedPassword(null)
    setResetOpen(true)
  }

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%"
    let pwd = ""
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewPassword(pwd)
    setGeneratedPassword(pwd)
  }

  const handleResetPassword = async () => {
    if (!resetUser || !newPassword) return
    try {
      await resetMutation.mutateAsync({ password: newPassword })
      setGeneratedPassword(newPassword)
      setNewPassword("")
    } catch (err: unknown) {
      setRoleError(err instanceof Error ? err.message : "Error al resetear contraseña")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="search-user" className="text-xs">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              id="search-user"
              placeholder="Nombre o email…"
              className="h-7 w-60 text-xs pl-7"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">Cargando usuarios…</p>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {(error as Error).message}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          {debouncedSearch ? "No hay usuarios que coincidan con la búsqueda." : "No hay usuarios registrados."}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-28 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {u.firstName} {u.lastName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {u.userRoles.map((ur) => (
                        <Badge key={ur.id} variant={ROLE_BADGE_VARIANTS[ur.role.name] ?? "secondary"} className="text-[10px]">
                          {ur.role.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.isActive ? "default" : "secondary"} className="text-[10px]">
                      {u.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(u)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => openReset(u)}>
                        <KeyRound className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={(open) => { if (!open) { setEditOpen(false); setEditingUser(null) } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
            <DialogDescription>
              Modificá los datos del usuario y sus roles.
            </DialogDescription>
          </DialogHeader>

          {roleError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {roleError}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-name">Nombre completo</Label>
              <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-phone">Teléfono</Label>
              <Input id="edit-phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="edit-active" checked={editActive} onCheckedChange={(v) => setEditActive(v === true)} />
              <Label htmlFor="edit-active" className="text-sm">Cuenta activa</Label>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Roles</Label>
              <div className="flex flex-wrap gap-3">
                {ALL_ROLES.map((role) => (
                  <label key={role} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <Checkbox checked={editRoles.includes(role)} onCheckedChange={() => toggleRole(role)} />
                    <Badge variant={ROLE_BADGE_VARIANTS[role] ?? "secondary"} className="text-[10px]">
                      {role}
                    </Badge>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditOpen(false); setEditingUser(null) }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending || rolesMutation.isPending}>
              {updateMutation.isPending || rolesMutation.isPending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetOpen} onOpenChange={(open) => { if (!open) { setResetOpen(false); setResetUser(null); setGeneratedPassword(null) } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Resetear contraseña</DialogTitle>
            <DialogDescription>
              {resetUser ? `${resetUser.firstName} ${resetUser.lastName} (${resetUser.email})` : ""}
            </DialogDescription>
          </DialogHeader>

          {generatedPassword ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-primary/50 bg-primary/10 px-4 py-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Nueva contraseña</p>
                <p className="text-lg font-mono font-bold tracking-wider">{generatedPassword}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Esta contraseña se muestra una sola vez. Copiala antes de cerrar.
                </p>
              </div>
              <Button className="w-full" variant="outline" onClick={() => {
                navigator.clipboard.writeText(generatedPassword)
              }}>
                Copiar contraseña
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-password">Nueva contraseña</Label>
                <div className="flex gap-2">
                  <Input
                    id="new-password"
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="flex-1"
                  />
                  <Button variant="outline" size="sm" onClick={generateRandomPassword}>
                    <Shield className="size-3.5" />
                    Generar
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setResetOpen(false); setResetUser(null) }}>Cancelar</Button>
                <Button onClick={handleResetPassword} disabled={!newPassword || newPassword.length < 6 || resetMutation.isPending}>
                  {resetMutation.isPending ? "Reseteando…" : "Resetear"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
