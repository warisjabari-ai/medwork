import { useEffect, useMemo, useRef, useState } from "react";
import { Sidebar, AppHeader } from "../components/Navigation";
import type { AppPage } from "../components/Navigation";
import type { WorkerVisit } from "../types/visit";
import type { Worker } from "./WorkersPage";
import {
  Search, Plus, Download, ChevronDown, ChevronRight, X, Filter,
  Stethoscope, Calendar, Pencil, CalendarClock, CalendarCheck, Activity,
  type LucideIcon,
} from "lucide-react";

// ─── Filtre déroulant (style chip du design) ─────────────────────────────────
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

// ─── Export helpers ───────────────────────────────────────────────────────────
function exportCSV(rows: string[][], filename: string) {
  const bom = "﻿";
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([bom + csv], { type: "text/csv;charset=utf-8;" }));
  a.download = filename + ".csv"; a.click();
}

function ExportDropdown({ onPDF, onExcel }: { onPDF: () => void; onExcel: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-xs font-medium text-foreground transition hover:bg-muted">
        <Download className="size-4" />Exporter<ChevronDown className="size-3.5 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-xl border border-border bg-surface shadow-elevated">
          <button onClick={() => { onPDF(); setOpen(false); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground transition hover:bg-muted">Export PDF</button>
          <button onClick={() => { onExcel(); setOpen(false); }} className="flex w-full items-center gap-2 border-t border-border px-4 py-2.5 text-sm text-foreground transition hover:bg-muted">Export Excel</button>
        </div>
      )}
    </div>
  );
}

type Props = {
  allVisits: WorkerVisit[];
  workers: Worker[];
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
  onNewVisitForWorker: (worker: Worker) => void;
  onSelectWorker: (worker: Worker) => void;
  onEditVisit: (visit: WorkerVisit, worker: Worker) => void;
  onOpenVisit: (visit: WorkerVisit, worker: Worker) => void;
};

const norm = (t: string) => (t ?? "").trim().toLowerCase();
const initialsOf = (name: string) => name.split(" ").map((s) => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
function parseDate(str: string): number {
  const p = (str ?? "").split("/");
  if (p.length !== 3) return 0;
  return new Date(+p[2], +p[1] - 1, +p[0]).getTime();
}
function todayStr() {
  const t = new Date();
  return `${String(t.getDate()).padStart(2, "0")}/${String(t.getMonth() + 1).padStart(2, "0")}/${t.getFullYear()}`;
}

// ─── Modal sélection employé ─────────────────────────────────────────────────
function WorkerSelectModal({ workers, onSelect, onClose }: { workers: Worker[]; onSelect: (w: Worker) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const timer = setTimeout(() => document.addEventListener("mousedown", h), 100);
    return () => { clearTimeout(timer); document.removeEventListener("mousedown", h); };
  }, [onClose]);
  const filtered = workers.filter((w) => norm(w.name).includes(norm(search)) || norm(w.matricule).includes(norm(search)));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div ref={ref} className="w-full max-w-md overflow-hidden rounded-2xl bg-surface shadow-elevated">
        <div className="flex items-center justify-between bg-brand-deep px-5 py-4">
          <div>
            <h2 className="font-display text-base font-bold text-white">Nouvelle consultation</h2>
            <p className="mt-0.5 text-xs text-white/70">Sélectionnez l'employé concerné</p>
          </div>
          <button onClick={onClose} className="grid size-7 place-items-center rounded-full bg-white/20 text-white transition hover:bg-white/30"><X className="size-4" /></button>
        </div>
        <div className="border-b border-border px-4 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par nom ou matricule…"
              className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15" />
          </div>
        </div>
        <div className="max-h-72 divide-y divide-border overflow-y-auto">
          {filtered.length > 0 ? filtered.map((w) => (
            <button key={w.id} onClick={() => onSelect(w)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-accent">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-deep to-brand-vibrant text-[11px] font-bold text-white">{initialsOf(w.name)}</span>
              <span className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{w.name}</p>
                <p className="truncate text-xs text-muted-foreground">{w.matricule} · {w.department}</p>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          )) : <div className="px-4 py-8 text-center text-sm text-muted-foreground">Aucun employé trouvé.</div>}
        </div>
      </div>
    </div>
  );
}

export default function VisitsPage({
  allVisits, workers, currentPage, onNavigate, onLogout, onNewVisitForWorker,
  onEditVisit, onOpenVisit, userName, userRole, userPhoto, isSuperAdmin,
  permissions = [], searchData, onOpenWorker,
}: Props) {
  const [showModal, setShowModal] = useState(false);
  const [visitSearch, setVisitSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("");

  const can = (perm: string): boolean => {
    if (isSuperAdmin || permissions.includes("*")) return true;
    if (permissions.includes(perm)) return true;
    const parts = perm.split(".");
    for (let i = 1; i < parts.length; i++) {
      if (permissions.includes(parts.slice(0, i).join("."))) return true;
    }
    return permissions.some((p) => p === perm || p.startsWith(perm + "."));
  };

  const workerName = (id: number) => workers.find((w) => w.id === id)?.name ?? "Inconnu";
  const workerObj = (id: number) => workers.find((w) => w.id === id) ?? null;
  const workerCompany = (id: number) => workers.find((w) => w.id === id)?.company ?? "—";

  const sorted = useMemo(
    () => [...allVisits].sort((a, b) => (parseDate(b.date) - parseDate(a.date)) || (b.id - a.id)),
    [allVisits]
  );

  // KPI
  const kpi = useMemo(() => {
    const today = todayStr();
    const now = new Date();
    const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7)); monday.setHours(0, 0, 0, 0);
    const tc = (kw: string) => allVisits.filter((v) => norm(v.type).includes(kw)).length;
    return {
      today: allVisits.filter((v) => v.date === today).length,
      week: allVisits.filter((v) => parseDate(v.date) >= monday.getTime()).length,
      open: allVisits.filter((v) => !v.closed).length,
      total: allVisits.length,
      embauche: tc("embauche"),
      periodique: tc("périodique") + tc("periodique"),
      reprise: tc("reprise"),
    };
  }, [allVisits]);

  const doctors = useMemo(() => [...new Set(allVisits.map((v) => v.doctor).filter(Boolean))].sort() as string[], [allVisits]);

  const filteredVisits = useMemo(() => {
    const now = new Date();
    const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7)); monday.setHours(0, 0, 0, 0);
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const today = todayStr();
    return sorted.filter((v) => {
      const q = norm(visitSearch);
      const matchSearch = !q || norm(v.ref ?? "").includes(q) || norm(workerName(v.workerId)).includes(q) || norm(v.doctor ?? "").includes(q) || norm(v.type).includes(q);
      const matchType = !typeFilter || norm(v.type).includes(norm(typeFilter));
      const matchDoctor = !doctorFilter || v.doctor === doctorFilter;
      const matchStatus = !statusFilter || (statusFilter === "open" ? !v.closed : v.closed);
      const d = parseDate(v.date);
      const matchPeriod = !periodFilter || (periodFilter === "today" ? v.date === today : periodFilter === "week" ? d >= monday.getTime() : periodFilter === "month" ? d >= firstOfMonth : true);
      return matchSearch && matchType && matchDoctor && matchStatus && matchPeriod;
    });
  }, [sorted, visitSearch, typeFilter, doctorFilter, statusFilter, periodFilter, workers]);

  const handleExcelExport = () => {
    const header = ["Référence", "Employé", "Matricule", "Date", "Type", "Médecin", "Aptitude", "Statut"];
    const rows = filteredVisits.map((v) => { const wk = workerObj(v.workerId); return [v.ref ?? "—", workerName(v.workerId), wk?.matricule ?? "—", v.date, v.type, v.doctor ?? "—", v.aptitude, v.closed ? "Terminée" : "Ouverte"]; });
    exportCSV([header, ...rows], `consultations_${new Date().toLocaleDateString("fr-FR").replace(/\//g, "-")}`);
  };
  const handlePDFExport = () => {
    const rows = filteredVisits.map((v) => { const wk = workerObj(v.workerId); return `<tr><td>${v.ref ?? "—"}</td><td>${workerName(v.workerId)}</td><td>${wk?.matricule ?? "—"}</td><td>${v.date}</td><td>${v.type}</td><td>${v.doctor ?? "—"}</td><td>${v.aptitude}</td><td>${v.closed ? "Terminée" : "Ouverte"}</td></tr>`; }).join("");
    const html = `<style>body{font-family:Arial,sans-serif;font-size:11px;color:#1e293b}h1{font-size:16px;font-weight:800;color:#0F4C81;margin-bottom:4px}p{font-size:11px;color:#64748b;margin-bottom:16px}table{width:100%;border-collapse:collapse}th{background:#f1f5f9;text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;color:#64748b;border-bottom:2px solid #e2e8f0}td{padding:7px 10px;border-bottom:1px solid #f1f5f9}@page{margin:14mm 12mm}</style><h1>Liste des consultations</h1><p>Exporté le ${new Date().toLocaleDateString("fr-FR")} · ${filteredVisits.length} consultation(s)</p><table><thead><tr><th>Référence</th><th>Employé</th><th>Matricule</th><th>Date</th><th>Type</th><th>Médecin</th><th>Aptitude</th><th>Statut</th></tr></thead><tbody>${rows}</tbody></table>`;
    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); win.focus(); setTimeout(() => { win.print(); win.close(); }, 500); }
  };

  const kpiCards = [
    { label: "Aujourd'hui", value: kpi.today, icon: CalendarClock, barClass: "bg-brand-vibrant", bar: kpi.today > 0 ? 100 : 8 },
    { label: "Cette semaine", value: kpi.week, icon: Calendar, barClass: "bg-brand-deep", bar: 64 },
    { label: "Consultations ouvertes", value: kpi.open, icon: Activity, barClass: "bg-warning", bar: kpi.total ? Math.round((kpi.open / kpi.total) * 100) : 0 },
    { label: "Total consultations", value: kpi.total, icon: CalendarCheck, barClass: "bg-success", bar: 100 },
  ];
  const subCards = [
    { label: "Visites d'embauche", value: kpi.embauche },
    { label: "Visites périodiques", value: kpi.periodique },
    { label: "Visites de reprise", value: kpi.reprise },
  ];

  return (
    <>
      {showModal && <WorkerSelectModal workers={workers} onSelect={(w) => { setShowModal(false); onNewVisitForWorker(w); }} onClose={() => setShowModal(false)} />}

      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout} userName={userName} userRole={userRole} userPhoto={userPhoto} isSuperAdmin={isSuperAdmin} permissions={permissions} />

        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader onNavigate={onNavigate} searchData={searchData} permissions={permissions} isSuperAdmin={isSuperAdmin} onOpenWorker={onOpenWorker} onOpenVisit={(vid, wid) => { const v = allVisits.find((x) => x.id === vid); const w = workerObj(wid); if (v) onOpenVisit(v, w ?? ({ id: wid } as Worker)); }} />

          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[1400px] p-6 lg:p-8">

              {/* En-tête */}
              <div className="mb-8">
                <h1 className="font-display text-[26px] font-bold leading-tight tracking-tight text-foreground">Consultations</h1>
                <p className="mt-1 text-sm text-muted-foreground">Planning des visites médicales et suivi des examens cliniques.</p>
              </div>

              {/* KPI */}
              <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                {kpiCards.map((k) => {
                  const Icon = k.icon;
                  return (
                    <div key={k.label} className="rounded-xl border border-border bg-surface p-5 shadow-card">
                      <div className="flex items-start justify-between">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{k.label}</p>
                        <Icon className="size-4 text-muted-foreground/70" strokeWidth={1.75} />
                      </div>
                      <div className="mt-3 font-display text-[26px] font-bold leading-none tracking-tight text-foreground tabular-nums">{k.value}</div>
                      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted">
                        <div className={`h-full rounded-full ${k.barClass}`} style={{ width: `${Math.min(Math.max(k.bar, 0), 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sous-cartes par type */}
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {subCards.map((s) => (
                  <div key={s.label} className="flex items-center gap-4 rounded-xl border border-border bg-surface p-5 shadow-card">
                    <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Stethoscope className="size-5" strokeWidth={1.75} /></div>
                    <div>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="font-display text-xl font-bold tabular-nums text-foreground">{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Barre d'outils */}
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="relative min-w-[240px] flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input value={visitSearch} onChange={(e) => setVisitSearch(e.target.value)} placeholder="N° de consultation, employé, médecin…"
                    className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/15" />
                </div>
                <FilterSelect value={typeFilter} onChange={setTypeFilter} allLabel="Type" options={[{ value: "embauche", label: "Embauche" }, { value: "périodique", label: "Périodique" }, { value: "reprise", label: "Reprise" }, { value: "surveillance", label: "Surveillance renforcée" }, { value: "demande", label: "À la demande" }]} />
                <FilterSelect value={doctorFilter} onChange={setDoctorFilter} allLabel="Médecin" options={doctors.map((d) => ({ value: d, label: d }))} />
                <FilterSelect value={statusFilter} onChange={setStatusFilter} allLabel="Statut" options={[{ value: "open", label: "Ouverte" }, { value: "closed", label: "Terminée" }]} />
                <FilterSelect value={periodFilter} onChange={setPeriodFilter} allLabel="Période" options={[{ value: "today", label: "Aujourd'hui" }, { value: "week", label: "Cette semaine" }, { value: "month", label: "Ce mois" }]} />
                <ExportDropdown onPDF={handlePDFExport} onExcel={handleExcelExport} />
                {can("visits.create") && (
                  <button onClick={() => setShowModal(true)} className="flex h-9 items-center gap-2 rounded-md bg-brand-deep px-3 text-xs font-semibold text-white transition hover:bg-brand-deep/90">
                    <Plus className="size-4" /> Planifier une visite
                  </button>
                )}
              </div>

              {/* Tableau */}
              <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold">Référence</th>
                        <th className="px-6 py-3 text-left font-semibold">Employé</th>
                        <th className="px-6 py-3 text-left font-semibold">Type</th>
                        <th className="px-6 py-3 text-left font-semibold">Date</th>
                        <th className="px-6 py-3 text-left font-semibold">Médecin</th>
                        <th className="px-6 py-3 text-left font-semibold">Statut</th>
                        <th className="px-6 py-3 text-right font-semibold"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredVisits.length > 0 ? filteredVisits.map((visit) => {
                        const wk = workerObj(visit.workerId);
                        const openVisit = () => onOpenVisit(visit, wk ?? ({ id: visit.workerId, name: "", matricule: "", department: "", position: "", company: "", residence: "", contractStatus: "actif", status: "", lastVisit: "" } as Worker));
                        return (
                          <tr key={visit.id} onClick={openVisit} className="cursor-pointer transition-colors hover:bg-accent">
                            <td className="px-6 py-3.5">
                              {visit.ref ? <span className="rounded bg-muted px-2 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground">{visit.ref}</span> : <span className="text-muted-foreground">—</span>}
                            </td>
                            <td className="px-6 py-3.5">
                              <div className="flex items-center gap-3">
                                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-deep to-brand-vibrant text-[11px] font-bold text-white">{initialsOf(workerName(visit.workerId))}</span>
                                <div className="min-w-0">
                                  <p className="truncate font-medium text-foreground">{workerName(visit.workerId)}</p>
                                  <p className="truncate text-[11px] text-muted-foreground">{workerCompany(visit.workerId)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-3.5"><span className="inline-flex rounded bg-brand-vibrant/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-vibrant">{visit.type}</span></td>
                            <td className="px-6 py-3.5">
                              <span className="inline-flex items-center gap-1.5 tabular-nums text-muted-foreground"><Calendar className="size-3.5" />{visit.date}</span>
                            </td>
                            <td className="px-6 py-3.5 text-muted-foreground">{visit.doctor || "—"}</td>
                            <td className="px-6 py-3.5">
                              {visit.closed
                                ? <span className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-success/10 text-success"><span className="size-1.5 rounded-full bg-success" />Terminée</span>
                                : <span className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-brand-vibrant/10 text-brand-vibrant"><span className="size-1.5 rounded-full bg-brand-vibrant" />Ouverte</span>}
                            </td>
                            <td className="px-6 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                              {!visit.closed && can("visits.edit") && (
                                <button onClick={() => { const w = wk ?? workers.find((x) => x.id === visit.workerId); if (w) onEditVisit(visit, w); }} title="Modifier" className="grid size-7 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground ml-auto">
                                  <Pencil className="size-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr><td colSpan={7} className="px-6 py-16 text-center">
                          <p className="font-semibold text-foreground">Aucune consultation enregistrée</p>
                          <p className="mt-1 text-sm text-muted-foreground">Cliquez sur « Planifier une visite » pour créer la première.</p>
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
    </>
  );
}
