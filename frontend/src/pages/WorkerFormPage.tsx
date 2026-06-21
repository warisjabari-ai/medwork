import { useState, type ChangeEvent, type FormEvent } from "react";
import type { Worker } from "./WorkersPage";
import { Sidebar, AppHeader, Icon, icons } from "../components/Navigation";
import type { AppPage } from "../components/Navigation";

type Props = {
  workerToEdit: Worker | null;
  onBack: () => void;
  onSave: (worker: Worker) => void;
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
};

export default function WorkerFormPage({
  workerToEdit,
  onBack,
  onSave,
  onNavigate,
  onLogout,
  userName,
  userRole,
  userPhoto,
  isSuperAdmin,
  permissions = [],
  searchData,
  onOpenWorker,
  onOpenVisit,
}: Props) {
  const [formData, setFormData] = useState<Worker>({
    id: workerToEdit?.id || Date.now(),
    name: workerToEdit?.name || "",
    matricule: workerToEdit?.matricule || "",
    department: workerToEdit?.department || "",
    position: workerToEdit?.position || "",
    company: workerToEdit?.company || "",
    status: workerToEdit?.status || "Apte",
    lastVisit: workerToEdit?.lastVisit || "",
    residence: workerToEdit?.residence || "",
    riskLevel: workerToEdit?.riskLevel || "Modéré",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.matricule || !formData.department || !formData.position || !formData.company) {
      alert("Merci de remplir les champs obligatoires.");
      return;
    }
    onSave(formData);
  };

  const isEdit = !!workerToEdit;
  const title = isEdit ? "Modifier la fiche employé" : "Nouvel employé";

  const inp = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/15";
  const lbl = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground";

  const fields = [
    { name: "name",       label: "Nom complet *",    placeholder: "Ex: Mamadou Diallo" },
    { name: "matricule",  label: "Matricule *",       placeholder: "Ex: MAT-001" },
    { name: "company",    label: "Entreprise *",      placeholder: "Ex: nom de l'entreprise" },
    { name: "department", label: "Département *",     placeholder: "Ex: Maintenance" },
    { name: "position",   label: "Poste *",           placeholder: "Ex: Opérateur" },
    { name: "residence",  label: "Résidence",         placeholder: "Ex: Kamsar" },
    { name: "lastVisit",  label: "Dernière visite",   placeholder: "Ex: 25/03/2026" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        currentPage="workerForm"
        onNavigate={onNavigate}
        onLogout={onLogout}
        userName={userName}
        userRole={userRole}
        userPhoto={userPhoto}
        isSuperAdmin={isSuperAdmin} permissions={permissions}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader
          title={title}
          onNavigate={onNavigate}
          left={
            <button
              onClick={onBack}
              title="Retour aux employés"
              className="grid h-8 w-8 place-items-center rounded-md border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Icon d={icons.arrowLeft} size={15} />
            </button>
          }
          searchData={searchData}
          permissions={permissions}
          isSuperAdmin={isSuperAdmin}
          onOpenWorker={onOpenWorker}
          onOpenVisit={onOpenVisit}
        />

        <main className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">

            {/* Informations personnelles */}
            <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
              <h3 className="mb-4 font-display font-bold text-foreground">
                Informations de l'employé
              </h3>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {fields.map(({ name, label, placeholder }) => (
                  <div key={name}>
                    <label className={lbl}>{label}</label>
                    <input
                      type="text"
                      name={name}
                      value={(formData as Record<string, string>)[name]}
                      onChange={handleChange}
                      placeholder={placeholder}
                      className={inp}
                    />
                  </div>
                ))}
                <div>
                  <label className={lbl}>Niveau de risque</label>
                  <select name="riskLevel" value={formData.riskLevel} onChange={handleChange} className={inp}>
                    <option value="Faible">Faible</option>
                    <option value="Modéré">Modéré</option>
                    <option value="Élevé">Élevé</option>
                  </select>
                </div>
              </div>

              {/* Info : statut automatique */}
              <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  Le <strong className="text-foreground">statut médical</strong> est calculé automatiquement à partir de l'aptitude de la dernière consultation enregistrée. Il n'est pas modifiable ici.
                </p>
              </div>
            </div>

            {/* Aperçu du statut */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
              <h3 className="mb-3 font-display font-bold text-foreground">
                Aperçu de la fiche
              </h3>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {[
                  ["Nom complet",   formData.name       || "—"],
                  ["Matricule",     formData.matricule  || "—"],
                  ["Entreprise",    formData.company    || "—"],
                  ["Département",   formData.department || "—"],
                  ["Poste",         formData.position   || "—"],
                  ["Résidence",     formData.residence  || "—"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-muted/50 p-3.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
                  </div>
                ))}
                <div className="rounded-xl border border-dashed border-border bg-muted/50 p-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Statut médical</p>
                  <p className="mt-1 text-sm font-semibold italic text-muted-foreground">Calculé depuis les consultations</p>
                </div>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="rounded-md bg-brand-deep px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-deep/90"
              >
                {isEdit ? "Enregistrer les modifications" : "Créer l'employé"}
              </button>
              <button
                type="button"
                onClick={onBack}
                className="rounded-md border border-border px-6 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                Annuler
              </button>
            </div>

          </form>
        </main>
      </div>
    </div>
  );
}