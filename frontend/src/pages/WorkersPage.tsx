import { useMemo, useState } from "react";
import { Sidebar, AppHeader } from "../components/Navigation";
import type { AppPage } from "../components/Navigation";
import {
  Search, Plus, Download, ChevronDown, Pencil, Trash2,
  CheckCircle2, RotateCcw, DoorOpen, Filter, type LucideIcon,
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

export type Worker = {
  id: number;
  name: string;
  matricule: string;
  department: string;
  position: string;
  company: string;
  status: string;
  lastVisit: string;
  residence: string;
  contractStatus?: "actif" | "embauche" | "fin_contrat";
  riskLevel?: "Faible" | "Modéré" | "Élevé" | string;
};

type Props = {
  workers: Worker[];
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  onSelect: (worker: Worker) => void;
  onCreate: () => void;
  onEdit: (worker: Worker) => void;
  onDelete: (id: number) => void;
  onSetContractStatus: (id: number, status: Worker["contractStatus"]) => void;
  onLogout: () => void;
  userName?: string;
  userRole?: string;
  userPhoto?: string;
  isSuperAdmin?: boolean;
  permissions?: string[];
  searchData?: import("../components/Navigation").SearchableData;
  onOpenWorker?: (id: number) => void;
  onOpenVisit?: (visitId: number, workerId: number) => void;
};

const norm = (t: string) => (t ?? "").trim().toLowerCase();
const initialsOf = (name: string) => name.split(" ").map((s) => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

// Classe une aptitude : apte (vert) / restriction (orange) / inapte (rouge)
function aptKind(status: string): "apte" | "restriction" | "inapte" {
  const s = norm(status);
  if (s.includes("inapte")) return "inapte";
  if (s.includes("restriction") || s.includes("réserve") || s.includes("reserve") || s.includes("surveil")) return "restriction";
  return "apte";
}
const aptPill: Record<string, string> = {
  apte: "bg-success/10 text-success",
  restriction: "bg-warning/10 text-warning",
  inapte: "bg-danger/10 text-danger",
};
const riskPill: Record<string, string> = {
  "Élevé": "bg-danger/10 text-danger",
  "Modéré": "bg-warning/10 text-warning",
  "Faible": "bg-success/10 text-success",
};

export default function WorkersPage({
  workers, currentPage, onNavigate, onSelect, onCreate, onEdit, onDelete,
  onSetContractStatus, onLogout, userName, userRole, userPhoto, isSuperAdmin,
  permissions = [], searchData, onOpenWorker, onOpenVisit,
}: Props) {
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [aptFilter, setAptFilter] = useState("");

  const can = (perm: string): boolean => {
    if (isSuperAdmin || permissions.includes("*")) return true;
    if (permissions.includes(perm)) return true;
    const parts = perm.split(".");
    for (let i = 1; i < parts.length; i++) {
      if (permissions.includes(parts.slice(0, i).join("."))) return true;
    }
    return false;
  };

  // KPI
  const kpi = useMemo(() => {
    let apte = 0, restriction = 0, inapte = 0;
    workers.forEach((w) => {
      const k = aptKind(w.status);
      if (k === "apte") apte++; else if (k === "restriction") restriction++; else inapte++;
    });
    const total = workers.length || 1;
    return {
      total: workers.length, apte, restriction, inapte,
      aptePct: Math.round((apte / total) * 100),
      restPct: Math.round((restriction / total) * 100),
      inaptePct: Math.round((inapte / total) * 100),
    };
  }, [workers]);

  const positions = useMemo(() => [...new Set(workers.map((w) => w.position).filter(Boolean))].sort(), [workers]);

  const filteredWorkers = useMemo(() => {
    const q = norm(search);
    return workers.filter((w) => {
      const matchesSearch = !q || norm(w.name).includes(q) || norm(w.matricule).includes(q) || norm(w.department).includes(q) || norm(w.company).includes(q) || norm(w.position).includes(q);
      const matchesPosition = !positionFilter || w.position === positionFilter;
      const matchesRisk = !riskFilter || (w.riskLevel ?? "Modéré") === riskFilter;
      const matchesApt = !aptFilter || aptKind(w.status) === aptFilter;
      return matchesSearch && matchesPosition && matchesRisk && matchesApt;
    });
  }, [workers, search, positionFilter, riskFilter, aptFilter]);

  const handleExcelExport = () => {
    const header = ["Nom", "Matricule", "Entreprise", "Département", "Poste", "Aptitude", "Contrat", "Dernière visite"];
    const rows = filteredWorkers.map((w) => [
      w.name, w.matricule, w.company ?? "—", w.department ?? "—", w.position ?? "—", w.status,
      w.contractStatus === "embauche" ? "En cours d'embauche" : w.contractStatus === "fin_contrat" ? "Fin de contrat" : "En activité",
      w.lastVisit ?? "—",
    ]);
    exportCSV([header, ...rows], `employes_${new Date().toLocaleDateString("fr-FR").replace(/\//g, "-")}`);
  };

  const handlePDFExport = () => {
    const rows = filteredWorkers.map((w) => `<tr><td>${w.name}</td><td>${w.matricule}</td><td>${w.company ?? "—"}</td><td>${w.department ?? "—"}</td><td>${w.position ?? "—"}</td><td>${w.status}</td><td>${w.lastVisit ?? "—"}</td></tr>`).join("");
    const html = `<style>body{font-family:Arial,sans-serif;font-size:11px;color:#1e293b}h1{font-size:16px;font-weight:800;color:#0F4C81;margin-bottom:4px}p{font-size:11px;color:#64748b;margin-bottom:16px}table{width:100%;border-collapse:collapse}th{background:#f1f5f9;text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#64748b;border-bottom:2px solid #e2e8f0}td{padding:7px 10px;border-bottom:1px solid #f1f5f9}@page{margin:14mm 12mm}</style><h1>Liste des employés</h1><p>Exporté le ${new Date().toLocaleDateString("fr-FR")} · ${filteredWorkers.length} employé(s)</p><table><thead><tr><th>Nom</th><th>Matricule</th><th>Entreprise</th><th>Département</th><th>Poste</th><th>Aptitude</th><th>Dernière visite</th></tr></thead><tbody>${rows}</tbody></table>`;
    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); win.focus(); setTimeout(() => { win.print(); win.close(); }, 500); }
  };

  const kpiCards = [
    { label: "Effectif total", value: kpi.total, chip: null, chipClass: "" },
    { label: "Aptes", value: kpi.apte, chip: `${kpi.aptePct}%`, chipClass: "bg-success/10 text-success" },
    { label: "Restrictions", value: kpi.restriction, chip: `${kpi.restPct}%`, chipClass: "bg-warning/10 text-warning" },
    { label: "Inaptes", value: kpi.inapte, chip: `${kpi.inaptePct}%`, chipClass: "bg-danger/10 text-danger" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout} userName={userName} userRole={userRole} userPhoto={userPhoto} isSuperAdmin={isSuperAdmin} permissions={permissions} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader onNavigate={onNavigate} searchData={searchData} permissions={permissions} isSuperAdmin={isSuperAdmin} onOpenWorker={onOpenWorker} onOpenVisit={onOpenVisit} />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1400px] p-6 lg:p-8">

            {/* En-tête */}
            <div className="mb-8 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="font-display text-[26px] font-bold leading-tight tracking-tight text-foreground">Employés</h1>
                <p className="mt-1 text-sm text-muted-foreground">Annuaire global des salariés suivis par votre service de santé au travail.</p>
              </div>
            </div>

            {/* KPI */}
            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              {kpiCards.map((k) => (
                <div key={k.label} className="rounded-xl border border-border bg-surface p-5 shadow-card">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{k.label}</p>
                    {k.chip && <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${k.chipClass}`}>{k.chip}</span>}
                  </div>
                  <div className="mt-3 font-display text-[28px] font-bold leading-none tracking-tight text-foreground tabular-nums">{k.value}</div>
                </div>
              ))}
            </div>

            {/* Barre d'outils */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="relative min-w-[240px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, matricule, entreprise…"
                  className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/15" />
              </div>
              <FilterSelect value={positionFilter} onChange={setPositionFilter} allLabel="Poste" options={positions.map((p) => ({ value: p, label: p }))} />
              <FilterSelect value={riskFilter} onChange={setRiskFilter} allLabel="Niveau de risque" options={[{ value: "Élevé", label: "Élevé" }, { value: "Modéré", label: "Modéré" }, { value: "Faible", label: "Faible" }]} />
              <FilterSelect value={aptFilter} onChange={setAptFilter} allLabel="Aptitude" options={[{ value: "apte", label: "Apte" }, { value: "restriction", label: "Avec restriction" }, { value: "inapte", label: "Inapte" }]} />
              <ExportDropdown onPDF={handlePDFExport} onExcel={handleExcelExport} />
              {can("workers.create") && (
                <button onClick={onCreate} className="flex h-9 items-center gap-2 rounded-md bg-brand-deep px-3 text-xs font-semibold text-white transition hover:bg-brand-deep/90">
                  <Plus className="size-4" /> Ajouter un employé
                </button>
              )}
            </div>

            {/* Tableau */}
            <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold">Employé</th>
                      <th className="px-6 py-3 text-left font-semibold">Entreprise</th>
                      <th className="px-6 py-3 text-left font-semibold">Poste</th>
                      <th className="px-6 py-3 text-left font-semibold">Risque</th>
                      <th className="px-6 py-3 text-left font-semibold">Aptitude</th>
                      <th className="px-6 py-3 text-left font-semibold">Contrat</th>
                      <th className="px-6 py-3 text-left font-semibold">Dernière visite</th>
                      <th className="px-6 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredWorkers.length > 0 ? filteredWorkers.map((worker) => {
                      const k = aptKind(worker.status);
                      const isFin = worker.contractStatus === "fin_contrat";
                      return (
                        <tr key={worker.id} className={`transition-colors hover:bg-accent ${isFin ? "opacity-60" : ""}`}>
                          <td className="px-6 py-3.5">
                            <button onClick={() => onSelect(worker)} className="flex items-center gap-3 text-left">
                              <div className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-deep to-brand-vibrant text-[11px] font-bold text-white">{initialsOf(worker.name)}</div>
                              <div className="min-w-0">
                                <p className="truncate font-medium text-foreground hover:text-primary">{worker.name}</p>
                                <p className="truncate font-mono text-[11px] text-muted-foreground">{worker.matricule}</p>
                              </div>
                            </button>
                          </td>
                          <td className="px-6 py-3.5 text-muted-foreground">{worker.company || "—"}</td>
                          <td className="px-6 py-3.5 text-foreground">{worker.position || "—"}</td>
                          <td className="px-6 py-3.5">
                            <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${riskPill[worker.riskLevel ?? "Modéré"] ?? "bg-muted text-muted-foreground"}`}>{worker.riskLevel ?? "Modéré"}</span>
                          </td>
                          <td className="px-6 py-3.5">
                            <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${aptPill[k]}`}>{worker.status}</span>
                          </td>
                          <td className="px-6 py-3.5">
                            {worker.contractStatus === "embauche" ? (
                              <span className="inline-flex rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-brand-vibrant/10 text-brand-vibrant">En embauche</span>
                            ) : worker.contractStatus === "fin_contrat" ? (
                              <span className="inline-flex rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground">Fin de contrat</span>
                            ) : (
                              <span className="inline-flex rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-success/10 text-success">En activité</span>
                            )}
                          </td>
                          <td className="px-6 py-3.5 tabular-nums text-muted-foreground">{worker.lastVisit || "—"}</td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center justify-end gap-1.5">
                              {can("workers.edit") && (
                                <button onClick={() => onEdit(worker)} title="Modifier" className="grid size-7 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground">
                                  <Pencil className="size-3.5" />
                                </button>
                              )}
                              {can("workers.edit") && (worker.contractStatus === "embauche" ? (
                                <button onClick={() => onSetContractStatus(worker.id, "actif")} title="Valider l'embauche" className="grid size-7 place-items-center rounded-md text-brand-vibrant transition hover:bg-brand-vibrant/10">
                                  <CheckCircle2 className="size-3.5" />
                                </button>
                              ) : worker.contractStatus === "fin_contrat" ? (
                                <button onClick={() => onSetContractStatus(worker.id, "actif")} title="Réactiver" className="grid size-7 place-items-center rounded-md text-success transition hover:bg-success/10">
                                  <RotateCcw className="size-3.5" />
                                </button>
                              ) : (
                                <button onClick={() => { if (window.confirm(`Marquer ${worker.name} en fin de contrat ?`)) onSetContractStatus(worker.id, "fin_contrat"); }} title="Fin de contrat" className="grid size-7 place-items-center rounded-md text-muted-foreground transition hover:bg-warning/10 hover:text-warning">
                                  <DoorOpen className="size-3.5" />
                                </button>
                              ))}
                              {can("workers.delete") && (
                                <button onClick={() => { if (window.confirm(`Supprimer définitivement ${worker.name} ?`)) onDelete(worker.id); }} title="Supprimer" className="grid size-7 place-items-center rounded-md text-muted-foreground transition hover:bg-danger/10 hover:text-danger">
                                  <Trash2 className="size-3.5" />
                                </button>
                              )}
                              {!can("workers.edit") && !can("workers.delete") && <span className="text-[10px] italic text-muted-foreground">Lecture seule</span>}
                            </div>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={8} className="px-6 py-16 text-center">
                          <p className="font-semibold text-foreground">Aucun employé trouvé</p>
                          <p className="mt-1 text-sm text-muted-foreground">Essayez de modifier votre recherche ou vos filtres.</p>
                        </td>
                      </tr>
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
