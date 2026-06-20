import { useMemo } from "react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  Cell, Pie, PieChart,
} from "recharts";
import {
  Users, UserCheck, CalendarClock, Stethoscope, ShieldCheck, AlertTriangle,
  ChevronRight, Bell, ArrowUpRight, type LucideIcon,
} from "lucide-react";
import { Sidebar, AppHeader } from "../components/Navigation";
import type { AppPage } from "../components/Navigation";
import type { Worker } from "./WorkersPage";
import type { WorkerVisit } from "../types/visit";
import type { Decision } from "./DecisionsPage";

type Props = {
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
  workers?: Worker[];
  allVisits?: WorkerVisit[];
  decisions?: Decision[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseDMY(s: string): Date | null {
  if (!s) return null;
  if (s.includes("/")) {
    const [d, m, y] = s.split("/").map(Number);
    if (!d || !m || !y) return null;
    return new Date(y, m - 1, d);
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
function todayStr() {
  const t = new Date();
  return `${String(t.getDate()).padStart(2, "0")}/${String(t.getMonth() + 1).padStart(2, "0")}/${t.getFullYear()}`;
}
const MOIS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];
const initialsOf = (name: string) => name.split(" ").map((s) => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

export default function DashboardPage({
  currentPage, onNavigate, onLogout, userName, userRole, userPhoto, isSuperAdmin,
  permissions = [], searchData, onOpenWorker, onOpenVisit,
  workers = [], allVisits = [], decisions = [],
}: Props) {
  const today = todayStr();
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const _td = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const todayLabel = _td.charAt(0).toUpperCase() + _td.slice(1);

  // ── Statistiques réelles ──────────────────────────────────────────────────
  const stats = useMemo(() => {
    const visitsToday = allVisits.filter((v) => v.date === today).length;
    const visitsThisMonth = allVisits.filter((v) => {
      const d = parseDMY(v.date);
      return d && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
    const expired = allVisits.filter((v) => {
      if (v.closed || !v.nextVisit) return false;
      const d = parseDMY(v.nextVisit);
      return d && d < new Date();
    }).length;
    const actifs = workers.filter((w) => w.contractStatus === "actif").length;
    return { visitsToday, visitsThisMonth, expired, actifs };
  }, [allVisits, workers, today, currentMonth, currentYear]);

  // ── Répartition des aptitudes (par couleur de décision) ──────────────────
  const apt = useMemo(() => {
    let green = 0, orange = 0, red = 0;
    allVisits.forEach((v) => {
      if (!v.aptitude) return;
      const c = decisions.find((d) => d.label === v.aptitude)?.color;
      if (c === "green") green++;
      else if (c === "orange") orange++;
      else if (c === "red") red++;
    });
    const total = green + orange + red;
    return { green, orange, red, total, conforme: total ? Math.round((green / total) * 100) : 0 };
  }, [allVisits, decisions]);

  const aptitudeData = [
    { name: "Apte", value: apt.green, color: "rgb(var(--success))" },
    { name: "Apte avec réserve", value: apt.orange, color: "rgb(var(--warning))" },
    { name: "Inapte", value: apt.red, color: "rgb(var(--danger))" },
  ].filter((d) => d.value > 0);

  // ── Courbe : 12 derniers mois ─────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    const out: { m: string; v: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const count = allVisits.filter((v) => {
        const vd = parseDMY(v.date);
        return vd && vd.getMonth() === d.getMonth() && vd.getFullYear() === d.getFullYear();
      }).length;
      out.push({ m: MOIS_FR[d.getMonth()], v: count });
    }
    return out;
  }, [allVisits, currentMonth, currentYear]);

  // ── Rendez-vous du jour ───────────────────────────────────────────────────
  const todayVisits = useMemo(
    () => allVisits.filter((v) => v.date === today).slice(0, 6),
    [allVisits, today]
  );

  // ── Dernières visites ─────────────────────────────────────────────────────
  const recentVisits = useMemo(() => [...allVisits].sort((a, b) => b.id - a.id).slice(0, 5), [allVisits]);
  const workerName = (id: number) => workers.find((w) => w.id === id)?.name ?? "—";
  const workerCompany = (id: number) => workers.find((w) => w.id === id)?.company ?? "—";

  // ── Alertes (dérivées des vraies données) ────────────────────────────────
  const alerts = useMemo(() => {
    const a: { tone: "danger" | "warning" | "info"; title: string; body: string }[] = [];
    if (stats.expired > 0)
      a.push({ tone: "warning", title: `${stats.expired} aptitude${stats.expired > 1 ? "s" : ""} à renouveler`, body: "Des prochaines visites sont échues. Planifiez les renouvellements." });
    if (stats.visitsToday > 0)
      a.push({ tone: "info", title: `${stats.visitsToday} consultation${stats.visitsToday > 1 ? "s" : ""} aujourd'hui`, body: "Consultez l'agenda du jour pour les détails." });
    if (apt.red > 0)
      a.push({ tone: "danger", title: `${apt.red} inaptitude${apt.red > 1 ? "s" : ""} enregistrée${apt.red > 1 ? "s" : ""}`, body: "Vérifiez les restrictions et l'information de l'employeur." });
    if (a.length === 0)
      a.push({ tone: "info", title: "Aucune alerte", body: "Tout est à jour. Aucune action prioritaire requise." });
    return a;
  }, [stats, apt]);

  // ── Cartes KPI ────────────────────────────────────────────────────────────
  const kpis: { label: string; value: string | number; caption: string; icon: LucideIcon; bar: number; barClass: string; onClick?: () => void }[] = [
    { label: "Effectif total", value: workers.length, caption: "salariés suivis", icon: Users, bar: 100, barClass: "bg-brand-vibrant", onClick: () => onNavigate("workers") },
    { label: "Travailleurs actifs", value: stats.actifs, caption: `${workers.length} au total`, icon: UserCheck, bar: workers.length ? Math.round((stats.actifs / workers.length) * 100) : 0, barClass: "bg-brand-deep", onClick: () => onNavigate("workers") },
    { label: "Visites ce mois", value: stats.visitsThisMonth, caption: `${currentYear}`, icon: CalendarClock, bar: 64, barClass: "bg-brand-vibrant", onClick: () => onNavigate("visits") },
    { label: "Visites aujourd'hui", value: stats.visitsToday, caption: "consultations du jour", icon: Stethoscope, bar: stats.visitsToday > 0 ? 100 : 8, barClass: "bg-brand-deep", onClick: () => onNavigate("visits") },
    { label: "Taux d'aptitude", value: `${apt.conforme}%`, caption: `${apt.total} évaluation${apt.total > 1 ? "s" : ""}`, icon: ShieldCheck, bar: apt.conforme, barClass: "bg-success" },
    { label: "Aptitudes à renouveler", value: stats.expired, caption: "renouvellements à planifier", icon: AlertTriangle, bar: stats.expired > 0 ? 70 : 6, barClass: "bg-warning", onClick: () => onNavigate("visits") },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout}
        userName={userName} userRole={userRole} userPhoto={userPhoto}
        isSuperAdmin={isSuperAdmin} permissions={permissions} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader onNavigate={onNavigate} searchData={searchData} permissions={permissions}
          isSuperAdmin={isSuperAdmin} onOpenWorker={onOpenWorker} onOpenVisit={onOpenVisit} />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1400px] p-6 lg:p-8">

            {/* En-tête de page */}
            <div className="mb-8 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="font-display text-[26px] font-bold leading-tight tracking-tight text-foreground">Tableau de bord</h1>
                <p className="mt-1 text-sm text-muted-foreground">Aperçu global de l'activité médicale — {todayLabel}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button onClick={() => onNavigate("reports")} className="h-9 rounded-md border border-border bg-surface px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted">Rapports</button>
                <button onClick={() => onNavigate("visits")} className="h-9 rounded-md bg-brand-deep px-3 text-xs font-semibold text-white transition-colors hover:bg-brand-deep/90">Planifier une visite</button>
              </div>
            </div>

            {/* KPI grid */}
            <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
              {kpis.map((k) => {
                const Icon = k.icon;
                return (
                  <button key={k.label} onClick={k.onClick}
                    className="rounded-xl border border-border bg-surface p-5 text-left shadow-card transition-shadow hover:shadow-elevated disabled:cursor-default"
                    disabled={!k.onClick}>
                    <div className="flex items-start justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{k.label}</p>
                      <Icon className="size-4 text-muted-foreground/70" strokeWidth={1.75} />
                    </div>
                    <div className="mt-3 font-display text-[26px] font-bold leading-none tracking-tight text-foreground tabular-nums">{k.value}</div>
                    <div className="mt-2 text-[11px] font-medium text-muted-foreground">{k.caption}</div>
                    <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full ${k.barClass}`} style={{ width: `${Math.min(Math.max(k.bar, 0), 100)}%` }} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Charts row */}
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Évolution des visites */}
              <div className="rounded-xl border border-border bg-surface p-6 shadow-card lg:col-span-2">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="font-display font-bold text-foreground">Évolution des consultations</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">12 derniers mois</p>
                  </div>
                  <span className="rounded-full bg-brand-vibrant/10 px-2.5 py-1 text-[11px] font-semibold text-brand-vibrant">{allVisits.length} au total</span>
                </div>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData} margin={{ top: 10, right: 8, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="gradV" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgb(var(--brand-vibrant))" stopOpacity={0.28} />
                          <stop offset="100%" stopColor="rgb(var(--brand-vibrant))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgb(var(--border))" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="m" stroke="rgb(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgb(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: "rgb(var(--surface))", border: "1px solid rgb(var(--border))", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "rgb(var(--foreground))", fontWeight: 600 }} />
                      <Area type="monotone" dataKey="v" name="Consultations" stroke="rgb(var(--brand-vibrant))" strokeWidth={2.25} fill="url(#gradV)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Répartition des aptitudes */}
              <div className="flex flex-col rounded-xl border border-border bg-surface p-6 shadow-card">
                <h2 className="font-display font-bold text-foreground">Répartition des aptitudes</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">{apt.total} évaluation{apt.total > 1 ? "s" : ""}</p>
                <div className="relative mt-2 h-[180px]">
                  {aptitudeData.length === 0 ? (
                    <div className="grid h-full place-items-center text-sm text-muted-foreground">Aucune donnée</div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={aptitudeData} dataKey="value" innerRadius={56} outerRadius={78} paddingAngle={2} stroke="none">
                            {aptitudeData.map((d, i) => <Cell key={i} fill={d.color} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pointer-events-none absolute inset-0 grid place-items-center">
                        <div className="text-center">
                          <div className="font-display text-2xl font-bold leading-none text-foreground">{apt.conforme}%</div>
                          <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Aptes</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <ul className="mt-4 space-y-2.5">
                  {[{ name: "Apte", value: apt.green, color: "rgb(var(--success))" }, { name: "Apte avec réserve", value: apt.orange, color: "rgb(var(--warning))" }, { name: "Inapte", value: apt.red, color: "rgb(var(--danger))" }].map((d) => (
                    <li key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full" style={{ background: d.color }} />
                        <span className="text-muted-foreground">{d.name}</span>
                      </div>
                      <span className="font-semibold tabular-nums text-foreground">{d.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Rendez-vous + Alertes */}
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card lg:col-span-2">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                  <div>
                    <h2 className="font-display font-bold text-foreground">Consultations du jour</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">{todayVisits.length} programmée{todayVisits.length > 1 ? "s" : ""}</p>
                  </div>
                  <button onClick={() => onNavigate("visits")} className="flex items-center gap-1 text-xs font-semibold text-brand-vibrant hover:underline">
                    Voir l'agenda <ChevronRight className="size-3.5" />
                  </button>
                </div>
                {todayVisits.length === 0 ? (
                  <div className="px-6 py-10 text-center text-sm text-muted-foreground">Aucune consultation programmée aujourd'hui.</div>
                ) : (
                  <ul className="divide-y divide-border">
                    {todayVisits.map((v) => (
                      <li key={v.id} onClick={() => onOpenVisit?.(v.id, v.workerId)}
                        className="group flex cursor-pointer items-center gap-4 px-6 py-3.5 transition-colors hover:bg-accent">
                        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-deep to-brand-vibrant text-[11px] font-bold text-white">
                          {initialsOf(workerName(v.workerId))}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">{workerName(v.workerId)}</p>
                          <p className="truncate text-[11px] text-muted-foreground">{v.type}{v.doctor ? ` • ${v.doctor}` : ""}</p>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                          <span className={`size-1.5 rounded-full ${v.closed ? "bg-success" : "bg-brand-vibrant"}`} />
                          {v.closed ? "Terminée" : "À venir"}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Bell className="size-4 text-danger" strokeWidth={2} />
                    <h2 className="font-display font-bold text-foreground">Alertes prioritaires</h2>
                  </div>
                  <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-danger">{alerts.length}</span>
                </div>
                <div className="space-y-2 p-3">
                  {alerts.map((a) => {
                    const tone = { danger: "bg-danger/5 border-danger/20", warning: "bg-warning/5 border-warning/20", info: "bg-brand-vibrant/5 border-brand-vibrant/20" }[a.tone];
                    const dot = { danger: "bg-danger", warning: "bg-warning", info: "bg-brand-vibrant" }[a.tone];
                    return (
                      <div key={a.title} className={`rounded-lg border p-3 ${tone}`}>
                        <div className="flex items-start gap-2.5">
                          <span className={`mt-1.5 size-2 shrink-0 rounded-full ${dot}`} />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground">{a.title}</p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">{a.body}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Dernières visites */}
            <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h2 className="font-display font-bold text-foreground">Dernières consultations</h2>
                <button onClick={() => onNavigate("visits")} className="flex items-center gap-1 text-xs font-semibold text-brand-vibrant hover:underline">
                  Tout voir <ChevronRight className="size-3.5" />
                </button>
              </div>
              {recentVisits.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-muted-foreground">Aucune consultation enregistrée.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold">Employé</th>
                        <th className="px-6 py-3 text-left font-semibold">Entreprise</th>
                        <th className="px-6 py-3 text-left font-semibold">Type</th>
                        <th className="px-6 py-3 text-left font-semibold">Date</th>
                        <th className="px-6 py-3 text-right font-semibold">Aptitude</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {recentVisits.map((v) => {
                        const c = decisions.find((d) => d.label === v.aptitude)?.color;
                        const pill = c === "green" ? "bg-success/10 text-success" : c === "orange" ? "bg-warning/10 text-warning" : c === "red" ? "bg-danger/10 text-danger" : "bg-muted text-muted-foreground";
                        return (
                          <tr key={v.id} onClick={() => onOpenVisit?.(v.id, v.workerId)} className="cursor-pointer transition-colors hover:bg-accent">
                            <td className="px-6 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-deep to-brand-vibrant text-[11px] font-bold text-white">{initialsOf(workerName(v.workerId))}</div>
                                <span className="font-medium text-foreground">{workerName(v.workerId)}</span>
                              </div>
                            </td>
                            <td className="px-6 py-3.5 text-muted-foreground">{workerCompany(v.workerId)}</td>
                            <td className="px-6 py-3.5 text-foreground">{v.type}</td>
                            <td className="px-6 py-3.5 tabular-nums text-muted-foreground">{v.date}</td>
                            <td className="px-6 py-3.5 text-right">
                              {v.aptitude ? <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${pill}`}>{v.aptitude}</span> : <span className="text-muted-foreground">—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
