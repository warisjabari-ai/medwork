import { useRef, useState } from "react";
import { Sidebar, AppHeader } from "../components/Navigation";
import type { AppPage } from "../components/Navigation";
import { settingsAPI } from "../api";
import { useOrg } from "../branding";

type Props = {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  onLogout: () => void;
  userName?: string;
  userRole?: string;
  userPhoto?: string;
  isSuperAdmin?: boolean;
  permissions?: string[];
  searchData?: any;
  onOpenWorker?: (w: any) => void;
  onOpenVisit?: (v: any, w: any) => void;
};

const inp = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/15";
const lbl = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground";

export default function OrganizationPage({
  currentPage, onNavigate, onLogout, userName, userRole, userPhoto,
  isSuperAdmin, permissions = [], searchData, onOpenWorker, onOpenVisit,
}: Props) {
  const { org, setOrg, refresh } = useOrg();
  const [name, setName] = useState(org.name ?? "");
  const [tagline, setTagline] = useState(org.tagline ?? "");
  const [primaryColor, setPrimaryColor] = useState(org.primaryColor ?? "#00aadd");
  const [logo, setLogo] = useState<string | null>(org.logo ?? null);
  const [address, setAddress] = useState(org.address ?? "");
  const [country, setCountry] = useState(org.country ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLogoFile = (file: File) => {
    if (!file.type.startsWith("image/")) { setError("Veuillez sélectionner une image."); return; }
    if (file.size > 1024 * 1024) { setError("Le logo doit faire moins de 1 Mo."); return; }
    const reader = new FileReader();
    reader.onload = (e) => { if (e.target?.result) { setLogo(e.target.result as string); setError(""); } };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Le nom de l'organisation est obligatoire."); return; }
    setSaving(true);
    try {
      const updated = await settingsAPI.updateOrganization({
        name: name.trim(),
        tagline: tagline.trim() || null,
        primaryColor,
        logo,
        address: address.trim() || null,
        country: country.trim() || null,
      });
      setOrg({ ...org, ...updated });
      await refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        onLogout={onLogout}
        userPhoto={userPhoto}
        userName={userName}
        userRole={userRole}
        isSuperAdmin={isSuperAdmin}
        permissions={permissions}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader onNavigate={onNavigate} searchData={searchData} permissions={permissions} isSuperAdmin={isSuperAdmin} onOpenWorker={onOpenWorker} onOpenVisit={onOpenVisit} />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl p-6 lg:p-8">

            <div className="mb-8">
              <h1 className="font-display text-[26px] font-bold leading-tight tracking-tight text-foreground">Organisation</h1>
              <p className="mt-1 text-sm text-muted-foreground">Identité de votre service de santé : nom, logo et couleur, appliqués partout dans l'application.</p>
            </div>

            <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
              <p className="font-display font-bold text-foreground">Identité de l'organisation</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ces informations apparaissent sur la page de connexion, la barre latérale et les documents imprimés.
              </p>

              <form onSubmit={handleSave} className="mt-6 space-y-5">
                {/* Logo + aperçu */}
                <div>
                  <p className={lbl}>Logo</p>
                  <div className="flex items-center gap-5">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-white text-2xl font-black overflow-hidden ring-4 ring-border" style={{ background: primaryColor }}>
                      {logo ? <img src={logo} alt="Logo" className="h-full w-full object-contain p-1.5" /> : (name || "M").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col gap-2">
                      <button type="button" onClick={() => fileRef.current?.click()} className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted">
                        Choisir une image…
                      </button>
                      {logo && (
                        <button type="button" onClick={() => setLogo(null)} className="text-left text-xs text-danger hover:underline">
                          Retirer le logo
                        </button>
                      )}
                      <p className="text-[11px] text-muted-foreground">PNG ou JPG, moins de 1 Mo.</p>
                    </div>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoFile(f); }} />
                </div>

                <div>
                  <label className={lbl}>Nom de l'organisation *</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Service de Santé au Travail — Mon Entreprise" className={inp} />
                </div>

                <div>
                  <label className={lbl}>Accroche / sous-titre</label>
                  <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Ex: Santé, sécurité et travail" className={inp} />
                </div>

                <div>
                  <label className={lbl}>Couleur principale</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-surface p-1" />
                    <input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className={inp + " max-w-[140px]"} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={lbl}>Adresse (documents)</label>
                    <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ex: Zone industrielle, Kamsar" className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Pays</label>
                    <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Ex: Guinée" className={inp} />
                  </div>
                </div>

                {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger ring-1 ring-danger/20">{error}</p>}

                <div className="flex items-center gap-3 pt-2">
                  <button type="submit" disabled={saving} className="rounded-md bg-brand-deep px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-deep/90 disabled:opacity-60">
                    {saving ? "Enregistrement…" : "Enregistrer"}
                  </button>
                  {saved && <span className="flex items-center gap-1.5 text-sm font-medium text-success">Modifications enregistrées</span>}
                </div>
              </form>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
