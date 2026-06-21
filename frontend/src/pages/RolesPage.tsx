import { useState } from "react";
import { Sidebar, AppHeader } from "../components/Navigation";
import type { AppPage } from "../components/Navigation";
import { Plus, Pencil, Trash2, Lock, Shield } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
export type Permission = { key: string; label: string; description: string; group: string };
export type Role = {
  id: number;
  name: string;
  description: string;
  color: "navy" | "cyan" | "green" | "orange" | "red" | "purple";
  permissions: string[];
};

// ─── Toutes les permissions disponibles ──────────────────────────────────────
export const ALL_PERMISSIONS: Permission[] = [
  { key: "workers.view",   label: "Voir les employés",        description: "Consulter la liste et les fiches",        group: "Employés" },
  { key: "workers.create", label: "Créer un employé",         description: "Ajouter un nouveau dossier",              group: "Employés" },
  { key: "workers.edit",   label: "Modifier un employé",      description: "Éditer les informations d'un dossier",    group: "Employés" },
  { key: "workers.delete", label: "Supprimer un employé",     description: "Archiver ou supprimer un dossier",        group: "Employés" },
  { key: "visits.view",   label: "Voir les consultations",   description: "Consulter l'historique des consultations",             group: "Consultations" },
  { key: "visits.create", label: "Créer une consultation",   description: "Créer une nouvelle consultation",                      group: "Consultations" },
  { key: "visits.close",  label: "Clôturer une consultation", description: "Fermer définitivement un dossier de consultation",    group: "Consultations" },
  { key: "visits.delete", label: "Supprimer une consultation", description: "Supprimer définitivement (irréversible)",            group: "Consultations" },
  { key: "visits.print",  label: "Imprimer les documents",   description: "Générer compte rendu, certificat, ordonnance",         group: "Consultations" },
  { key: "medical.antecedents",   label: "Voir les antécédents médicaux",     description: "Secret médical — médecin recommandé",    group: "Données médicales" },
  { key: "medical.vaccinations",  label: "Voir les vaccinations",             description: "Carnet vaccinal de l'employé",            group: "Données médicales" },
  { key: "medical.expositions",   label: "Voir les expositions aux risques",  description: "Risques professionnels identifiés",       group: "Données médicales" },
  { key: "medical.lastvisits",    label: "Voir les dernières consultations",  description: "Résumé des consultations récentes",       group: "Données médicales" },
  { key: "settings.visitTypes", label: "Gérer les types de consultation", description: "Créer, modifier, supprimer les types", group: "Paramètres" },
  { key: "settings.decisions",  label: "Gérer les décisions",       description: "Créer, modifier, supprimer les décisions", group: "Paramètres" },
  { key: "settings.examTypes",  label: "Gérer les types d'examens", description: "Créer, modifier, supprimer les examens biologiques", group: "Paramètres" },
  { key: "settings.organization", label: "Gérer l'organisation",     description: "Modifier le nom, le logo et la couleur", group: "Paramètres" },
  { key: "admin.roles",   label: "Gérer les rôles",           description: "Créer, modifier, supprimer les rôles",    group: "Administration" },
  { key: "admin.users",   label: "Gérer les utilisateurs",    description: "Créer et administrer les comptes",        group: "Administration" },
  { key: "reports.view",  label: "Voir les rapports",          description: "Accès aux statistiques et rapports",      group: "Rapports" },
];

const GROUPS = [...new Set(ALL_PERMISSIONS.map((p) => p.group))];

type Props = {
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
  onAdd: (r: Role) => void;
  onEdit: (r: Role) => void;
  onDelete: (id: number) => void;
};

// ─── Couleurs des badges de rôle ─────────────────────────────────────────────
const COLOR_OPTIONS: { value: Role["color"]; label: string; badge: string; dot: string }[] = [
  { value: "navy",   label: "Marine",  badge: "bg-slate-100 text-slate-700 ring-slate-300",    dot: "bg-slate-600"   },
  { value: "cyan",   label: "Cyan",    badge: "bg-sky-50 text-sky-700 ring-sky-200",            dot: "bg-sky-500"     },
  { value: "green",  label: "Vert",    badge: "bg-green-50 text-green-700 ring-green-200",      dot: "bg-green-500"   },
  { value: "orange", label: "Orange",  badge: "bg-orange-50 text-orange-700 ring-orange-200",  dot: "bg-orange-500"  },
  { value: "red",    label: "Rouge",   badge: "bg-red-50 text-red-700 ring-red-200",            dot: "bg-red-500"     },
  { value: "purple", label: "Violet",  badge: "bg-purple-50 text-purple-700 ring-purple-200",  dot: "bg-purple-500"  },
];

export function roleBadgeClass(color: Role["color"]) {
  return COLOR_OPTIONS.find((c) => c.value === color)?.badge ?? COLOR_OPTIONS[0].badge;
}
export function roleDotClass(color: Role["color"]) {
  return COLOR_OPTIONS.find((c) => c.value === color)?.dot ?? COLOR_OPTIONS[0].dot;
}

const inp = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/15";
const lbl = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground";

// ─── Formulaire rôle ──────────────────────────────────────────────────────────
function RoleForm({ initial, onSave, onCancel, submitLabel }: {
  initial: Omit<Role, "id">; onSave: (r: Omit<Role, "id">) => void; onCancel: () => void; submitLabel: string;
}) {
  const [form, setForm] = useState(initial);
  const togglePerm = (key: string) => setForm((p) => ({ ...p, permissions: p.permissions.includes(key) ? p.permissions.filter((k) => k !== key) : [...p.permissions, key] }));
  const toggleGroup = (group: string) => {
    const keys = ALL_PERMISSIONS.filter((p) => p.group === group).map((p) => p.key);
    const allActive = keys.every((k) => form.permissions.includes(k));
    setForm((p) => ({ ...p, permissions: allActive ? p.permissions.filter((k) => !keys.includes(k)) : [...new Set([...p.permissions, ...keys])] }));
  };
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!form.name.trim()) { alert("Le nom du rôle est obligatoire."); return; } onSave(form); };
  const badge = COLOR_OPTIONS.find((c) => c.value === form.color)!;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div><label className={lbl}>Nom du rôle *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Médecin du travail" className={inp} /></div>
        <div>
          <label className={lbl}>Couleur du badge</label>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((opt) => (
              <button key={opt.value} type="button" onClick={() => setForm({ ...form, color: opt.value })}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${form.color === opt.value ? "border-primary bg-primary/5 text-foreground" : "border-border bg-surface text-muted-foreground hover:bg-muted"}`}>
                <span className={`size-2.5 rounded-full ${opt.dot}`} />{opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="md:col-span-2"><label className={lbl}>Description</label><textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description du rôle et de ses responsabilités…" className={inp} /></div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Permissions</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setForm({ ...form, permissions: ALL_PERMISSIONS.map((p) => p.key) })} className="rounded-md border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground transition hover:bg-muted">Tout cocher</button>
            <button type="button" onClick={() => setForm({ ...form, permissions: [] })} className="rounded-md border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground transition hover:bg-muted">Tout décocher</button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {GROUPS.map((group) => {
            const groupPerms = ALL_PERMISSIONS.filter((p) => p.group === group);
            const allActive = groupPerms.every((p) => form.permissions.includes(p.key));
            const someActive = groupPerms.some((p) => form.permissions.includes(p.key));
            return (
              <div key={group} className="overflow-hidden rounded-xl border border-border bg-surface">
                <div className={`flex cursor-pointer items-center gap-3 border-b border-border px-4 py-2.5 transition ${allActive ? "bg-primary/5" : "bg-muted/40"}`} onClick={() => toggleGroup(group)}>
                  <input type="checkbox" checked={allActive} ref={(el) => { if (el) el.indeterminate = someActive && !allActive; }} onChange={() => toggleGroup(group)} className="size-4 rounded accent-primary" onClick={(e) => e.stopPropagation()} />
                  <span className={`text-xs font-bold uppercase tracking-wide ${allActive ? "text-primary" : "text-muted-foreground"}`}>{group}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">{groupPerms.filter((p) => form.permissions.includes(p.key)).length}/{groupPerms.length}</span>
                </div>
                <div className="divide-y divide-border">
                  {groupPerms.map((perm) => (
                    <label key={perm.key} className="flex cursor-pointer items-start gap-3 px-4 py-2.5 transition hover:bg-muted">
                      <input type="checkbox" checked={form.permissions.includes(perm.key)} onChange={() => togglePerm(perm.key)} className="mt-0.5 size-4 rounded accent-primary" />
                      <span>
                        <p className="text-xs font-semibold text-foreground">{perm.label}</p>
                        <p className="text-[10px] text-muted-foreground">{perm.description}</p>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Aperçu :</p>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${badge.badge}`}><span className={`size-1.5 rounded-full ${badge.dot}`} />{form.name || "Nom du rôle…"}</span>
        <span className="text-xs text-muted-foreground">{form.permissions.length} permission{form.permissions.length > 1 ? "s" : ""}</span>
      </div>

      <div className="flex gap-3">
        <button type="submit" className="rounded-md bg-brand-deep px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-deep/90">{submitLabel}</button>
        <button type="button" onClick={onCancel} className="rounded-md border border-border px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted">Annuler</button>
      </div>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function RolesPage({ roles, currentPage, onNavigate, onLogout, onAdd, onEdit, onDelete, userName, userRole, userPhoto, isSuperAdmin, permissions = [], searchData, onOpenWorker, onOpenVisit }: Props) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleAdd = (data: Omit<Role, "id">) => { onAdd({ id: Date.now(), ...data }); setShowAddForm(false); };
  const handleEdit = (data: Omit<Role, "id">) => { if (editingId === null) return; onEdit({ id: editingId, ...data }); setEditingId(null); };
  const handleDelete = (id: number) => { if (window.confirm("Supprimer ce rôle ?")) onDelete(id); };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout} userName={userName} userRole={userRole} userPhoto={userPhoto} isSuperAdmin={isSuperAdmin} permissions={permissions} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader onNavigate={onNavigate} searchData={searchData} permissions={permissions} isSuperAdmin={isSuperAdmin} onOpenWorker={onOpenWorker} onOpenVisit={onOpenVisit} />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1400px] p-6 lg:p-8">

            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-[26px] font-bold leading-tight tracking-tight text-foreground">Rôles &amp; permissions</h1>
                <p className="mt-1 text-sm text-muted-foreground">Définissez les rôles et les accès de chaque profil, dans le respect du secret médical.</p>
              </div>
              <button onClick={() => setShowAddForm((v) => !v)} className="flex h-9 shrink-0 items-center gap-2 rounded-md bg-brand-deep px-3 text-xs font-semibold text-white transition hover:bg-brand-deep/90"><Plus className="size-4" />Nouveau rôle</button>
            </div>

            {showAddForm && (
              <div className="mb-6 rounded-xl border border-border bg-surface p-6 shadow-card">
                <p className="mb-5 font-display font-bold text-foreground">Nouveau rôle</p>
                <RoleForm initial={{ name: "", description: "", color: "cyan", permissions: [] }} onSave={handleAdd} onCancel={() => setShowAddForm(false)} submitLabel="Créer le rôle" />
              </div>
            )}

            <div className="space-y-3">
              {roles.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center">
                  <p className="font-semibold text-foreground">Aucun rôle défini</p>
                  <p className="mt-1 text-sm text-muted-foreground">Cliquez sur « Nouveau rôle » pour en créer un.</p>
                </div>
              ) : roles.map((role) => (
                <div key={role.id} className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
                  {editingId === role.id ? (
                    <div className="p-6">
                      <p className="mb-4 font-display font-bold text-foreground">Modification — {role.name}</p>
                      <RoleForm initial={{ name: role.name, description: role.description, color: role.color, permissions: role.permissions }} onSave={handleEdit} onCancel={() => setEditingId(null)} submitLabel="Enregistrer" />
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4 p-5">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset ${roleBadgeClass(role.color)}`}><span className={`size-1.5 rounded-full ${roleDotClass(role.color)}`} />{role.name}</span>
                          {role.name === "Super Admin"
                            ? <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary"><Shield className="size-3" />Rôle système — accès total</span>
                            : <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{role.permissions.length} permission{role.permissions.length > 1 ? "s" : ""}</span>}
                        </div>
                        {role.description && <p className="mt-1.5 max-w-xl text-xs text-muted-foreground">{role.description}</p>}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {GROUPS.map((group) => {
                            const gp = ALL_PERMISSIONS.filter((p) => p.group === group);
                            const active = gp.filter((p) => role.permissions.includes(p.key)).length;
                            if (active === 0) return null;
                            return <span key={group} className="rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{group} ({active}/{gp.length})</span>;
                          })}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {role.name === "Super Admin" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground"><Lock className="size-3.5" />Système</span>
                        ) : (
                          <>
                            <button onClick={() => setEditingId(role.id)} title="Modifier" className="grid size-8 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"><Pencil className="size-4" /></button>
                            <button onClick={() => handleDelete(role.id)} title="Supprimer" className="grid size-8 place-items-center rounded-md text-muted-foreground transition hover:bg-danger/10 hover:text-danger"><Trash2 className="size-4" /></button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
