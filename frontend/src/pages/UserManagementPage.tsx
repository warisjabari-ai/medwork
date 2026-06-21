import { useMemo, useRef, useState } from "react";
import { Sidebar, AppHeader } from "../components/Navigation";
import type { AppPage } from "../components/Navigation";
import { roleBadgeClass, roleDotClass } from "./RolesPage";
import type { Role } from "./RolesPage";
import {
  Search, Plus, Download, ChevronDown, Filter, Pencil, Trash2,
  Lock, Unlock, ShieldCheck, Users, Stethoscope, UserX, Eye, EyeOff,
  type LucideIcon,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
export type AppUser = {
  id: number;
  name: string;
  matricule: string;
  email: string;
  roleId: number;
  active: boolean;
  createdAt: string;
  isSuperAdmin?: boolean;
  permissions?: string[];
  signature?: string;
};

type Props = {
  users: AppUser[];
  roles: Role[];
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  onLogout: () => void;
  userName?: string;
  userRole?: string;
  userPhoto?: string;
  isSuperAdmin?: boolean;
  permissions?: string[];
  searchData?: import("../components/Navigation").SearchableData;
  onOpenWorker?: (id: number) => void;
  onOpenVisit?: (visitId: number, workerId: number) => void;
  onAdd: (u: AppUser) => void;
  onEdit: (u: AppUser) => void;
  onDelete: (id: number) => void;
  onToggleActive: (id: number) => void;
  currentUserRoleId: number;
  currentUserIsSuperAdmin: boolean;
};

const initialsOf = (name: string) => name.split(" ").map((s) => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

function FilterSelect({ icon: Ico, value, onChange, allLabel, options }: {
  icon?: LucideIcon; value: string; onChange: (v: string) => void; allLabel: string; options: { value: string; label: string }[];
}) {
  const Ic = Ico ?? Filter;
  return (
    <div className="relative">
      <Ic className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="h-9 appearance-none rounded-md border border-border bg-surface pl-8 pr-7 text-xs font-medium text-foreground outline-none transition hover:bg-muted focus:border-primary/40">
        <option value="">{allLabel}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

// ─── Upload signature ─────────────────────────────────────────────────────────
function SignatureUploader({ current, onUpload }: { current?: string; onUpload: (dataUrl: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) { alert("Veuillez sélectionner une image."); return; }
    const reader = new FileReader();
    reader.onload = (e) => { if (e.target?.result) onUpload(e.target.result as string); };
    reader.readAsDataURL(file);
  };
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-16 w-40 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted">
        {current ? <img src={current} alt="Signature" className="h-full w-full object-contain p-1" /> : <span className="text-2xl opacity-40">✍️</span>}
      </div>
      <div onClick={() => ref.current?.click()} className="flex-1 cursor-pointer rounded-xl border-2 border-dashed border-border bg-muted px-4 py-4 text-center transition hover:border-primary/40">
        <p className="text-sm font-medium text-foreground">Glissez ou <span className="text-primary underline">cliquez pour choisir</span></p>
        <p className="mt-0.5 text-xs text-muted-foreground">PNG fond transparent recommandé · JPG accepté</p>
        {current && <button type="button" onClick={(e) => { e.stopPropagation(); onUpload(""); }} className="mt-1.5 text-xs text-danger hover:underline">Supprimer la signature</button>}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}

const inp = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/15";
const lbl = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground";

function UserForm({ initial, roles, onSave, onCancel, submitLabel, isEdit, canUploadSignature = false }: {
  initial: Omit<AppUser, "id" | "createdAt">; roles: Role[]; onSave: (data: Omit<AppUser, "id" | "createdAt">) => void;
  onCancel: () => void; submitLabel: string; isEdit: boolean; canUploadSignature?: boolean;
}) {
  const [form, setForm] = useState(initial);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { alert("Le nom est obligatoire."); return; }
    if (!form.matricule.trim()) { alert("L'identifiant de connexion est obligatoire."); return; }
    if (!isEdit && !password.trim()) { alert("Le mot de passe est obligatoire pour un nouvel utilisateur."); return; }
    if (password && password !== confirmPassword) { alert("Les mots de passe ne correspondent pas."); return; }
    if (!form.roleId) { alert("Veuillez sélectionner un rôle."); return; }
    onSave({ ...form, ...(password ? { password: password } as any : {}) });
  };

  const selectedRole = roles.find((r) => r.id === form.roleId);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div><label className={lbl}>Nom complet *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Dr Mamadou Camara" className={inp} /></div>
        <div><label className={lbl}>Identifiant de connexion *</label><input value={form.matricule} onChange={(e) => setForm({ ...form, matricule: e.target.value })} placeholder="Ex: mcamara" className={inp} /></div>
        <div><label className={lbl}>Adresse e-mail</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Ex: prenom.nom@exemple.com" className={inp} /></div>
        <div><label className={lbl}>Rôle *</label>
          <select value={form.roleId} onChange={(e) => setForm({ ...form, roleId: Number(e.target.value) })} className={inp}>
            <option value={0}>— Sélectionner un rôle —</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div><label className={lbl}>{isEdit ? "Nouveau mot de passe" : "Mot de passe *"}</label>
          <div className="relative">
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isEdit ? "Laisser vide pour ne pas modifier" : "Mot de passe…"} className={inp + " pr-10"} />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
          </div>
        </div>
        <div><label className={lbl}>Confirmer le mot de passe</label><input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Répéter le mot de passe" className={inp} /></div>
        <div className="md:col-span-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-muted px-4 py-3 transition hover:bg-accent">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="size-4 rounded accent-primary" />
            <span className="text-sm font-medium text-foreground">Compte actif</span>
          </label>
        </div>
      </div>

      {selectedRole && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rôle attribué :</p>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${roleBadgeClass(selectedRole.color)}`}>
            <span className={`size-1.5 rounded-full ${roleDotClass(selectedRole.color)}`} />{selectedRole.name}
          </span>
          <span className="text-xs text-muted-foreground">{selectedRole.permissions.length} permission{selectedRole.permissions.length > 1 ? "s" : ""}</span>
        </div>
      )}

      {canUploadSignature && (
        <div className="space-y-2 rounded-xl border border-border bg-muted/50 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-foreground">Signature du médecin</p>
          <p className="mb-3 text-xs text-muted-foreground">Apparaîtra sur les documents imprimés (compte rendu, certificat, ordonnance).</p>
          <SignatureUploader current={form.signature} onUpload={(d) => setForm({ ...form, signature: d || undefined })} />
        </div>
      )}

      <div className="flex gap-3">
        <button type="submit" className="rounded-md bg-brand-deep px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-deep/90">{submitLabel}</button>
        <button type="button" onClick={onCancel} className="rounded-md border border-border px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted">Annuler</button>
      </div>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function UserManagementPage({
  users, roles, currentPage, onNavigate, onLogout, userName, userRole, userPhoto, isSuperAdmin,
  onAdd, onEdit, onDelete, onToggleActive, currentUserRoleId, currentUserIsSuperAdmin,
  permissions = [], searchData, onOpenWorker, onOpenVisit,
}: Props) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const handleAdd = (data: Omit<AppUser, "id" | "createdAt">) => { onAdd({ id: Date.now(), createdAt: new Date().toLocaleDateString("fr-FR"), ...data }); setShowAddForm(false); };
  const handleEdit = (data: Omit<AppUser, "id" | "createdAt">) => {
    if (editingId === null) return;
    const existing = users.find((u) => u.id === editingId);
    if (!existing) return;
    onEdit({ ...existing, ...data }); setEditingId(null);
  };
  const handleDelete = (id: number) => { if (window.confirm("Supprimer cet utilisateur ?")) onDelete(id); };

  const roleOf = (id: number) => roles.find((r) => r.id === id);

  // KPI
  const kpi = useMemo(() => {
    const active = users.filter((u) => u.active).length;
    const medecins = users.filter((u) => /m[ée]decin/i.test(roleOf(u.roleId)?.name ?? "")).length;
    const admins = users.filter((u) => u.isSuperAdmin || /admin/i.test(roleOf(u.roleId)?.name ?? "")).length;
    const inactive = users.filter((u) => !u.active).length;
    return { total: users.length, active, medecins, admins, inactive };
  }, [users, roles]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.matricule.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRole = !filterRole || u.roleId === Number(filterRole);
    const matchStatus = !filterStatus || (filterStatus === "active" ? u.active : !u.active);
    return matchSearch && matchRole && matchStatus;
  });

  const exportCSV = () => {
    const bom = "﻿";
    const rows = [["Nom", "Identifiant", "Email", "Rôle", "Statut"], ...filtered.map((u) => [u.name, u.matricule, u.email, u.isSuperAdmin ? "Super admin" : roleOf(u.roleId)?.name ?? "—", u.active ? "Actif" : "Désactivé"])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([bom + csv], { type: "text/csv;charset=utf-8;" }));
    a.download = `utilisateurs_${new Date().toLocaleDateString("fr-FR").replace(/\//g, "-")}.csv`; a.click();
  };

  const kpiCards: { label: string; value: number; icon: LucideIcon; chip?: string; chipClass?: string }[] = [
    { label: "Utilisateurs actifs", value: kpi.active, icon: Users, chip: `${kpi.total}`, chipClass: "bg-muted text-muted-foreground" },
    { label: "Médecins", value: kpi.medecins, icon: Stethoscope },
    { label: "Administrateurs", value: kpi.admins, icon: ShieldCheck },
    { label: "Comptes désactivés", value: kpi.inactive, icon: UserX },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout} userName={userName} userRole={userRole} userPhoto={userPhoto} isSuperAdmin={isSuperAdmin} permissions={permissions} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader onNavigate={onNavigate} searchData={searchData} permissions={permissions} isSuperAdmin={isSuperAdmin} onOpenWorker={onOpenWorker} onOpenVisit={onOpenVisit} />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1400px] p-6 lg:p-8">

            {/* En-tête */}
            <div className="mb-8">
              <h1 className="font-display text-[26px] font-bold leading-tight tracking-tight text-foreground">Utilisateurs &amp; permissions</h1>
              <p className="mt-1 text-sm text-muted-foreground">Gérez les comptes, rôles et accès au système conformément au secret médical.</p>
            </div>

            {/* KPI */}
            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              {kpiCards.map((k) => {
                const Icon = k.icon;
                return (
                  <div key={k.label} className="rounded-xl border border-border bg-surface p-5 shadow-card">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{k.label}</p>
                      <Icon className="size-4 text-muted-foreground/70" strokeWidth={1.75} />
                    </div>
                    <div className="mt-3 font-display text-[28px] font-bold leading-none tracking-tight text-foreground tabular-nums">{k.value}</div>
                  </div>
                );
              })}
            </div>

            {/* Formulaire d'ajout */}
            {showAddForm && (
              <div className="mb-6 rounded-xl border border-border bg-surface p-6 shadow-card">
                <p className="mb-5 font-display font-bold text-foreground">Nouvel utilisateur</p>
                <UserForm initial={{ name: "", matricule: "", email: "", roleId: roles[0]?.id ?? 0, active: true }} roles={roles} onSave={handleAdd} onCancel={() => setShowAddForm(false)} submitLabel="Créer l'utilisateur" isEdit={false} canUploadSignature={currentUserIsSuperAdmin} />
              </div>
            )}

            {/* Barre d'outils */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="relative min-w-[240px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, email, rôle…"
                  className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/15" />
              </div>
              <FilterSelect value={filterRole} onChange={setFilterRole} allLabel="Rôle" options={roles.map((r) => ({ value: String(r.id), label: r.name }))} />
              <FilterSelect value={filterStatus} onChange={setFilterStatus} allLabel="Statut" options={[{ value: "active", label: "Actif" }, { value: "inactive", label: "Désactivé" }]} />
              <button onClick={exportCSV} className="flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-xs font-medium text-foreground transition hover:bg-muted"><Download className="size-4" />Exporter</button>
              <button onClick={() => setShowAddForm((v) => !v)} className="flex h-9 items-center gap-2 rounded-md bg-brand-deep px-3 text-xs font-semibold text-white transition hover:bg-brand-deep/90"><Plus className="size-4" />Nouvel utilisateur</button>
            </div>

            {/* Tableau */}
            <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold">Utilisateur</th>
                      <th className="px-6 py-3 text-left font-semibold">Identifiant</th>
                      <th className="px-6 py-3 text-left font-semibold">Rôle</th>
                      <th className="px-6 py-3 text-left font-semibold">Statut</th>
                      <th className="px-6 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.length > 0 ? filtered.map((user) => {
                      const role = roleOf(user.roleId);
                      const isCurrent = user.roleId === currentUserRoleId;
                      if (editingId === user.id) {
                        return (
                          <tr key={user.id}><td colSpan={5} className="bg-muted/30 px-6 py-5">
                            <p className="mb-4 font-display font-bold text-foreground">Modification — {user.name}</p>
                            <UserForm initial={{ name: user.name, matricule: user.matricule, email: user.email, roleId: user.roleId, active: user.active, signature: user.signature }} roles={roles} onSave={handleEdit} onCancel={() => setEditingId(null)} submitLabel="Enregistrer" isEdit canUploadSignature={currentUserIsSuperAdmin} />
                          </td></tr>
                        );
                      }
                      return (
                        <tr key={user.id} className="transition-colors hover:bg-accent">
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className={`grid size-9 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white ${user.isSuperAdmin ? "bg-gradient-to-br from-amber-400 to-amber-600" : user.active ? "bg-gradient-to-br from-brand-deep to-brand-vibrant" : "bg-muted-foreground/40"}`}>{initialsOf(user.name)}</div>
                              <div className="min-w-0">
                                <p className="flex items-center gap-2 truncate font-medium text-foreground">{user.name}{isCurrent && <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary">Vous</span>}</p>
                                <p className="truncate text-[11px] text-muted-foreground">{user.email || "—"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 font-mono text-[12px] text-muted-foreground">{user.matricule}</td>
                          <td className="px-6 py-3.5">
                            {user.isSuperAdmin ? (
                              <span className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700"><span className="size-1.5 rounded-full bg-amber-500" />Super admin</span>
                            ) : role ? (
                              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${roleBadgeClass(role.color)}`}><span className={`size-1.5 rounded-full ${roleDotClass(role.color)}`} />{role.name}</span>
                            ) : <span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-danger/10 text-danger">Rôle manquant</span>}
                          </td>
                          <td className="px-6 py-3.5">
                            {user.active
                              ? <span className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-success/10 text-success"><span className="size-1.5 rounded-full bg-success" />Actif</span>
                              : <span className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground"><span className="size-1.5 rounded-full bg-muted-foreground/50" />Désactivé</span>}
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center justify-end gap-1.5">
                              {user.isSuperAdmin ? (
                                <span className="text-[10px] font-medium italic text-muted-foreground">Protégé</span>
                              ) : (
                                <>
                                  <button onClick={() => onToggleActive(user.id)} title={user.active ? "Désactiver" : "Activer"} className="grid size-7 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground">{user.active ? <Lock className="size-3.5" /> : <Unlock className="size-3.5" />}</button>
                                  <button onClick={() => setEditingId(user.id)} title="Modifier" className="grid size-7 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"><Pencil className="size-3.5" /></button>
                                  <button onClick={() => handleDelete(user.id)} title="Supprimer" className="grid size-7 place-items-center rounded-md text-muted-foreground transition hover:bg-danger/10 hover:text-danger"><Trash2 className="size-3.5" /></button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan={5} className="px-6 py-16 text-center">
                        <p className="font-semibold text-foreground">Aucun utilisateur trouvé</p>
                        <p className="mt-1 text-sm text-muted-foreground">Modifiez vos filtres ou créez un nouvel utilisateur.</p>
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
