// src/components/Navigation.tsx
// Ce fichier contient la barre latérale partagée par toutes les pages.
// Tu n'as pas besoin de comprendre le contenu — il suffit de le copier.

import { useEffect, useRef, useState } from "react";
import { useOrg } from "../branding";
import {
  LayoutDashboard, Users, Stethoscope, BarChart3, ClipboardList,
  ShieldCheck, FlaskConical, Building2, Shield, UserCog,
  Search, Bell, ChevronDown, ChevronRight, ChevronLeft, Plus,
  LogOut, UserRound, type LucideIcon,
} from "lucide-react";

// ─── Structure de navigation (sections façon ui-ux-medwork) ───────────────────
// Chaque item est rattaché à une page existante + une permission (string ou liste).
type NavLeaf = { page: AppPage; icon: LucideIcon; label: string; perm: string | string[] | null };
type NavSection = { label: string; items: NavLeaf[] };

const NAV_SECTIONS: NavSection[] = [
  { label: "Général", items: [
    { page: "dashboard", icon: LayoutDashboard, label: "Tableau de bord", perm: null },
    { page: "workers",   icon: Users,           label: "Employés",        perm: "workers.view" },
  ]},
  { label: "Médical", items: [
    { page: "visits",    icon: Stethoscope,     label: "Consultations",   perm: "visits.view" },
  ]},
  { label: "Analyse", items: [
    { page: "reports",   icon: BarChart3,       label: "Rapports",        perm: ["reports.view", "reports.prescriptions", "reports.aptitudes"] },
  ]},
  { label: "Paramètres", items: [
    { page: "visitTypes",   icon: ClipboardList, label: "Types de consultation", perm: "settings.visitTypes" },
    { page: "decisions",    icon: ShieldCheck,   label: "Décisions d'aptitude",  perm: "settings.decisions" },
    { page: "examTypes",    icon: FlaskConical,  label: "Types d'examens",       perm: "settings.examTypes" },
    { page: "organization", icon: Building2,     label: "Organisation",          perm: "settings.organization" },
  ]},
  { label: "Administration", items: [
    { page: "roles",          icon: Shield,  label: "Rôles",        perm: "admin.roles" },
    { page: "userManagement", icon: UserCog, label: "Utilisateurs", perm: "admin.users" },
  ]},
];

// Liste de toutes les pages de l'application
export type AppPage =
  | "login"
  | "dashboard"
  | "workers"
  | "workerDetails"
  | "workerForm"
  | "visits"
  | "visitTypes"
  | "decisions"
  | "examTypes"
  | "organization"
  | "roles"
  | "userManagement"
  | "profile"
  | "reports";

// ─── Icônes SVG ───────────────────────────────────────────────────────────────
export const Icon = ({ d, size = 18 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export const icons = {
  dashboard:   "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  workers:     "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  visits:      "M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01",
  visitType:   "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2 M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2",
  decisions:   "M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4 12 14.01l-3-3",
  examTypes:   "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18",
  users:       "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
  roles:       "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  settings:    "M12 20h9 M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z",
  folder:      "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z",
  userGroup:   "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  chevLeft:    "M15 18l-6-6 6-6",
  chevRight:   "M9 18l6-6-6-6",
  chevDown:    "M6 9l6 6 6-6",
  logout:      "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  search:      "M21 21l-4.35-4.35 M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  plus:        "M12 5v14 M5 12h14",
  stethoscope: "M4.5 12a7.5 7.5 0 0 0 15 0 M4.5 12H3a9 9 0 0 0 18 0h-1.5 M12 19.5V21 M9 3h6 M10 3v4a2 2 0 0 0 4 0V3",
  userPlus:    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M19 8v6 M22 11h-6",
  arrowLeft:   "M19 12H5 M12 19l-7-7 7-7",
  reports:     "M18 20V10 M12 20V4 M6 20v-6",
  download:    "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3",
};

// Détermine quel élément du menu est surligné selon la page active
function getActiveItem(page: AppPage): AppPage {
  if (page === "workerDetails" || page === "workerForm") return "workers";
  return page;
}

// ─── Icône de profil + popover déconnexion ────────────────────────────────────
export function ProfilePopover({
  collapsed,
  userName = "Administrateur",
  userRole = "ADMIN",
  userPhoto,
  isSuperAdmin = false,
  onLogout,
  onNavigate,
}: {
  collapsed: boolean;
  userName?: string;
  userRole?: string;
  userPhoto?: string;
  isSuperAdmin?: boolean;
  onLogout: () => void;
  onNavigate?: (page: AppPage) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = userName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const Avatar = ({ size = "sm" }: { size?: "sm" | "lg" }) => {
    const cls = size === "lg"
      ? "h-10 w-10 shrink-0 rounded-full text-sm font-bold text-white"
      : "h-9 w-9 shrink-0 rounded-full text-xs font-bold text-white";
    if (userPhoto) {
      return <img src={userPhoto} alt={userName} className={`${cls} object-cover ring-2 ring-border`} />;
    }
    return (
      <span className={`grid place-items-center ${cls} bg-gradient-to-br from-brand-deep to-brand-vibrant`}>
        {initials}
      </span>
    );
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title={collapsed ? `${userName} — ${userRole}` : undefined}
        className={`flex w-full items-center gap-3 rounded-md px-2 py-1.5 transition hover:bg-muted ${open ? "bg-muted" : ""}`}
      >
        <Avatar size="sm" />
        {!collapsed && (
          <span className="min-w-0 flex-1 overflow-hidden text-left">
            <p className="truncate text-xs font-semibold text-foreground">{userName}</p>
            <p className="truncate text-[10px] text-muted-foreground">{userRole}</p>
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute z-50 w-56 rounded-xl border border-border bg-surface p-3 shadow-elevated ${collapsed ? "bottom-0 left-14" : "bottom-14 left-0 right-0"}`}>
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <Avatar size="lg" />
            <div className="overflow-hidden">
              <p className="truncate text-sm font-semibold text-foreground">{userName}</p>
              <p className="truncate text-[11px] text-muted-foreground">{userRole}</p>
              {isSuperAdmin && (
                <span className="mt-0.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">Super admin</span>
              )}
            </div>
          </div>
          {onNavigate && (
            <button
              onClick={() => { setOpen(false); onNavigate("profile"); }}
              className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <UserRound className="size-4" /> Mon profil
            </button>
          )}
          <button
            onClick={() => { setOpen(false); onLogout(); }}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-danger transition hover:bg-danger/10"
          >
            <LogOut className="size-4" /> Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Bouton "Nouveau" avec menu déroulant ─────────────────────────────────────
export function QuickActionMenu({ onNavigate }: { onNavigate: (page: AppPage) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-xs font-semibold text-white transition hover:bg-primary-hover">
        <Plus className="size-4" />
        <span className="hidden sm:inline">Nouvelle consultation</span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-60 rounded-xl border border-border bg-surface p-1.5 shadow-elevated"
          style={{ top: 'calc(100% + 6px)' }}>
          {[
            { icon: "stethoscope" as const, label: "Nouvelle consultation", sub: "Créer une visite médicale", page: "visits" as AppPage },
            { icon: "userPlus" as const, label: "Nouvel employé", sub: "Ajouter un dossier", page: "workerForm" as AppPage },
          ].map(({ icon, label, sub, page }) => (
            <button key={label} onClick={() => { setOpen(false); onNavigate(page); }}
              className="flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition hover:bg-muted">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon d={icons[icon]} size={14} />
              </span>
              <span>
                <p className="text-sm font-medium text-slate-800">{label}</p>
                <p className="text-xs text-slate-400">{sub}</p>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Barre latérale ───────────────────────────────────────────────────────────
export function Sidebar({
  currentPage,
  onNavigate,
  onLogout,
  userName,
  userRole,
  userPhoto,
  isSuperAdmin = false,
  permissions = [],
}: {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  onLogout: () => void;
  userName?: string;
  userRole?: string;
  userPhoto?: string;
  isSuperAdmin?: boolean;
  permissions?: string[];
}) {
  const [collapsed, setCollapsed] = useState(false);
  const active = getActiveItem(currentPage);
  const { org } = useOrg();

  // Super admin voit tout, sinon on vérifie les permissions (avec héritage par préfixe)
  const can = (perm: string): boolean => {
    if (isSuperAdmin || permissions.includes("*")) return true;
    if (permissions.includes(perm)) return true;
    const parts = perm.split(".");
    for (let i = 1; i < parts.length; i++) {
      if (permissions.includes(parts.slice(0, i).join("."))) return true;
    }
    return false;
  };
  const itemVisible = (perm: string | string[] | null) =>
    perm == null ? true : Array.isArray(perm) ? perm.some(can) : can(perm);

  return (
    <aside className={`${collapsed ? "w-[68px]" : "w-64"} relative flex h-screen shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200`}>

      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-4">
        <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-brand-deep text-white shadow-sm">
          {org.logo
            ? <img src={org.logo} alt={org.name} className="h-full w-full object-contain p-1" />
            : <span className="font-display text-base font-black leading-none">{(org.name || "M").charAt(0).toUpperCase()}</span>}
        </div>
        {!collapsed && <span className="truncate font-display text-lg font-bold tracking-tight text-foreground">{org.name}</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-6 overflow-y-auto overflow-x-hidden px-3 py-4">
        {NAV_SECTIONS.map((section) => {
          const items = section.items.filter((it) => itemVisible(it.perm));
          if (items.length === 0) return null;
          return (
            <div key={section.label}>
              {!collapsed && (
                <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/70">{section.label}</div>
              )}
              <div className="space-y-0.5">
                {items.map((it) => {
                  const isActive = active === it.page;
                  const ItemIcon = it.icon;
                  return (
                    <button key={it.page} onClick={() => onNavigate(it.page)} title={collapsed ? it.label : undefined}
                      className={`group flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${collapsed ? "justify-center" : ""} ${isActive ? "bg-primary-light/10 text-primary-light" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                      <ItemIcon className={`size-[18px] shrink-0 ${isActive ? "text-primary-light" : "text-muted-foreground/80 group-hover:text-foreground"}`} strokeWidth={isActive ? 2.2 : 1.75} />
                      {!collapsed && <span className="truncate">{it.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Profil */}
      <div className="shrink-0 border-t border-border p-3">
        <ProfilePopover collapsed={collapsed} userName={userName} userRole={userRole} userPhoto={userPhoto} isSuperAdmin={isSuperAdmin} onLogout={onLogout} onNavigate={onNavigate} />
      </div>

      {/* Toggle réduire/déployer */}
      <button onClick={() => setCollapsed(v => !v)}
        title={collapsed ? "Déployer" : "Réduire"}
        className="absolute -right-3 top-[52px] z-10 grid h-6 w-6 place-items-center rounded-full border border-border bg-surface text-muted-foreground shadow-card transition hover:border-primary/40 hover:text-primary">
        {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
      </button>
    </aside>
  );
}

// ─── Types pour la recherche globale ─────────────────────────────────────────
export type SearchableData = {
  workers?:    { id: number; name: string; matricule: string; company?: string; department?: string; position?: string; status: string }[];
  visits?:     { id: number; ref?: string; type: string; date: string; doctor?: string; workerId: number; aptitude: string; treatment?: { molecule: string }[] }[];
  visitTypes?: { id: number; name: string; description: string }[];
  decisions?:  { id: number; label: string; color: string }[];
  users?:      { id: number; name: string; matricule: string; role?: { name: string } }[];
  workerMap?:  Record<number, string>;
};

type SearchResult = {
  id: string;
  category: string;
  categoryIcon: string;
  title: string;
  subtitle: string;
  action: () => void;
};

// ─── Modal de recherche globale ───────────────────────────────────────────────
function GlobalSearchModal({
  onClose,
  data,
  permissions,
  isSuperAdmin,
  onNavigate,
  onOpenWorker,
  onOpenVisit,
}: {
  onClose: () => void;
  data: SearchableData;
  permissions: string[];
  isSuperAdmin?: boolean;
  onNavigate: (page: AppPage) => void;
  onOpenWorker?: (id: number) => void;
  onOpenVisit?: (visitId: number, workerId: number) => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const can = (perm: string): boolean => {
    if (isSuperAdmin || permissions.includes("*")) return true;
    if (permissions.includes(perm)) return true;
    const parts = perm.split(".");
    for (let i = 1; i < parts.length; i++) {
      if (permissions.includes(parts.slice(0, i).join("."))) return true;
    }
    return permissions.some(p => p === perm || p.startsWith(perm + "."));
  };

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50); }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const results: SearchResult[] = [];
  const q = query.trim().toLowerCase();

  if (q.length >= 2) {
    // ── Travailleurs ──
    if (can("workers.view")) {
      (data.workers ?? []).forEach((w) => {
        const match = [w.name, w.matricule, w.company, w.department, w.position, w.status]
          .filter(Boolean).some((s) => s!.toLowerCase().includes(q));
        if (match) results.push({
          id: `w-${w.id}`,
          category: "Travailleur", categoryIcon: "👷",
          title: w.name,
          subtitle: `${w.matricule} · ${w.position ?? ""} · ${w.department ?? ""}`,
          action: () => { onOpenWorker?.(w.id); onClose(); },
        });
      });
    }

    // ── Visites médicales ──
    if (can("visits.view")) {
      (data.visits ?? []).forEach((v) => {
        const wName = data.workerMap?.[v.workerId] ?? "";
        const prescriptions = (v.treatment ?? []).map((t) => t.molecule).join(" ");
        const match = [v.ref, v.type, v.date, v.doctor, v.aptitude, wName, prescriptions]
          .filter(Boolean).some((s) => s!.toLowerCase().includes(q));
        if (match) results.push({
          id: `v-${v.id}`,
          category: "Visite médicale", categoryIcon: "🩺",
          title: `${v.ref ? `[${v.ref}] ` : ""}${v.type}`,
          subtitle: `${wName} · ${v.date} · ${v.doctor ?? ""}`,
          action: () => { onOpenVisit?.(v.id, v.workerId); onClose(); },
        });
      });
    }

    // ── Types de visite ──
    if (can("settings.visitTypes")) {
      (data.visitTypes ?? []).forEach((vt) => {
        if ([vt.name, vt.description].some((s) => s?.toLowerCase().includes(q))) {
          results.push({
            id: `vt-${vt.id}`,
            category: "Type de consultation", categoryIcon: "📋",
            title: vt.name,
            subtitle: vt.description,
            action: () => { onNavigate("visitTypes"); onClose(); },
          });
        }
      });
    }

    // ── Décisions / Aptitudes ──
    if (can("settings.decisions")) {
      (data.decisions ?? []).forEach((d) => {
        if (d.label.toLowerCase().includes(q)) {
          results.push({
            id: `d-${d.id}`,
            category: "Décision médicale", categoryIcon: "✅",
            title: d.label,
            subtitle: "Paramétrage des décisions",
            action: () => { onNavigate("decisions"); onClose(); },
          });
        }
      });
    }

    // ── Utilisateurs ──
    if (can("admin.users")) {
      (data.users ?? []).forEach((u) => {
        if ([u.name, u.matricule, u.role?.name].some((s) => s?.toLowerCase().includes(q))) {
          results.push({
            id: `u-${u.id}`,
            category: "Utilisateur", categoryIcon: "👤",
            title: u.name,
            subtitle: `${u.matricule} · ${u.role?.name ?? ""}`,
            action: () => { onNavigate("userManagement"); onClose(); },
          });
        }
      });
    }

    // ── Prescriptions ──
    if (can("visits.view")) {
      const seen = new Set<string>();
      (data.visits ?? []).forEach((v) => {
        (v.treatment ?? []).forEach((t) => {
          if (!t.molecule.toLowerCase().includes(q)) return;
          const key = t.molecule.toLowerCase();
          if (seen.has(key)) return;
          seen.add(key);
          const wName = data.workerMap?.[v.workerId] ?? "";
          results.push({
            id: `p-${v.id}-${key}`,
            category: "Prescription", categoryIcon: "💊",
            title: t.molecule,
            subtitle: `Prescrit lors de ${v.type} · ${wName} · ${v.date}`,
            action: () => { onOpenVisit?.(v.id, v.workerId); onClose(); },
          });
        });
      });
    }

    // ── Rapports (accès direct) ──
    if (can("reports.view")) {
      const reportCards = [
        { id: "prescriptions", label: "Rapport prescriptions médicales",   keywords: ["prescription", "médicament", "ordonnance"] },
        { id: "aptitudes",     label: "Rapport suivi des aptitudes",        keywords: ["aptitude", "apte", "inapte", "restriction"] },
        { id: "activity",      label: "Rapport activité médicale",          keywords: ["activité", "visite", "statistique"] },
        { id: "workers",       label: "Rapport suivi des travailleurs",     keywords: ["travailleur", "embauche", "contrat"] },
      ];
      reportCards.forEach((r) => {
        if ([r.label, ...r.keywords].some((k) => k.toLowerCase().includes(q))) {
          results.push({
            id: `r-${r.id}`,
            category: "Rapport", categoryIcon: "📊",
            title: r.label,
            subtitle: "Module Rapports",
            action: () => { onNavigate("reports"); onClose(); },
          });
        }
      });
    }
  }

  // Grouper par catégorie
  const grouped: Record<string, SearchResult[]> = {};
  results.forEach((r) => {
    if (!grouped[r.category]) grouped[r.category] = [];
    grouped[r.category].push(r);
  });

  const CATEGORY_ORDER = ["Travailleur", "Visite médicale", "Prescription", "Utilisateur", "Type de consultation", "Décision médicale", "Rapport"];
  const sortedCategories = Object.keys(grouped).sort((a, b) =>
    (CATEGORY_ORDER.indexOf(a) + 1 || 99) - (CATEGORY_ORDER.indexOf(b) + 1 || 99)
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[10vh] px-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Barre de saisie */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5 shrink-0 text-slate-400">
            <path d="M21 21l-4.35-4.35 M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un travailleur, une visite, une prescription…"
            className="flex-1 text-base text-slate-800 outline-none placeholder-slate-400"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
          )}
          <kbd className="hidden rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500 sm:block">Esc</kbd>
        </div>

        {/* Résultats */}
        <div className="max-h-[60vh] overflow-y-auto">
          {q.length < 2 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-slate-400">Tapez au moins 2 caractères pour lancer la recherche.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {["Matricule", "Nom", "Réf. visite", "Médicament"].map((hint) => (
                  <span key={hint} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-400">{hint}</span>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-2xl mb-2">🔍</p>
              <p className="text-sm font-semibold text-slate-600">Aucun résultat pour « {query} »</p>
              <p className="mt-1 text-xs text-slate-400">Essayez un autre terme ou vérifiez l'orthographe.</p>
            </div>
          ) : (
            <div className="py-2">
              {sortedCategories.map((cat) => (
                <div key={cat}>
                  <div className="flex items-center gap-2 px-5 py-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{grouped[cat][0].categoryIcon} {cat}</span>
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">{grouped[cat].length}</span>
                  </div>
                  {grouped[cat].slice(0, 5).map((r) => (
                    <button
                      key={r.id}
                      onClick={r.action}
                      className="flex w-full items-start gap-3 px-5 py-3 text-left transition hover:bg-slate-50 active:bg-slate-100"
                    >
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm">
                        {r.categoryIcon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 truncate">{r.title}</p>
                        <p className="text-xs text-slate-400 truncate">{r.subtitle}</p>
                      </div>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="mt-2 h-3.5 w-3.5 shrink-0 text-slate-300">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  ))}
                  {grouped[cat].length > 5 && (
                    <p className="px-5 py-1.5 text-xs text-slate-400">+{grouped[cat].length - 5} résultat{grouped[cat].length - 5 > 1 ? "s" : ""} supplémentaire{grouped[cat].length - 5 > 1 ? "s" : ""}</p>
                  )}
                </div>
              ))}
              <p className="border-t border-slate-100 px-5 py-2.5 text-[10px] text-slate-400">
                {results.length} résultat{results.length > 1 ? "s" : ""} trouvé{results.length > 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── En-tête de page ──────────────────────────────────────────────────────────
export function AppHeader({
  title,
  subtitle,
  onNavigate,
  left,
  searchData,
  permissions,
  isSuperAdmin,
  onOpenWorker,
  onOpenVisit,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  onNavigate: (page: AppPage) => void;
  left?: React.ReactNode;
  searchData?: SearchableData;
  permissions?: string[];
  isSuperAdmin?: boolean;
  onOpenWorker?: (id: number) => void;
  onOpenVisit?: (visitId: number, workerId: number) => void;
}) {
  const [searchOpen, setSearchOpen] = useState(false);

  // ⌘K / Ctrl+K pour ouvrir la recherche
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  return (
    <>
      {/* Modal rendu en dehors du header pour éviter les problèmes de z-index */}
      {searchOpen && (
        <GlobalSearchModal
          onClose={() => setSearchOpen(false)}
          data={searchData ?? {}}
          permissions={permissions ?? []}
          isSuperAdmin={isSuperAdmin}
          onNavigate={onNavigate}
          onOpenWorker={onOpenWorker}
          onOpenVisit={onOpenVisit}
        />
      )}
      <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-surface px-6">
        {left}
        {(title || subtitle) && (
          <div className="hidden shrink-0 lg:block">
            <p className="text-sm font-semibold leading-tight text-foreground">{title}</p>
            {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
          </div>
        )}

        {/* Recherche globale */}
        <button onClick={() => setSearchOpen(true)}
          className="flex h-9 max-w-md flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground transition hover:border-primary/40">
          <Search className="size-4 shrink-0" />
          <span className="flex-1 truncate text-left">Rechercher un employé, un dossier, une entreprise…</span>
          <kbd className="hidden items-center rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium sm:flex">⌘K</kbd>
        </button>

        {/* Cluster droite */}
        <div className="flex items-center gap-2">
          <button className="relative grid h-9 w-9 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label="Notifications">
            <Bell className="size-[18px]" strokeWidth={1.75} />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-danger ring-2 ring-surface" />
          </button>
          <QuickActionMenu onNavigate={onNavigate} />
        </div>
      </header>
    </>
  );
}