import { useRef, useState } from "react";
import { Sidebar, AppHeader, Icon, icons } from "../components/Navigation";
import type { AppPage } from "../components/Navigation";
import type { AppUser } from "./UserManagementPage";
import type { Role } from "./RolesPage";
import { roleBadgeClass, roleDotClass } from "./RolesPage";
import { authAPI } from "../api";

type Props = {
  currentUser: AppUser;
  roles: Role[];
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  onLogout: () => void;
  onSave: (updated: AppUser) => void;
  userPhoto?: string;
  onPhotoChange: (dataUrl: string) => void;
  userSignature?: string;
  // Props sidebar
  userName?: string;
  userRole?: string;
  permissions?: string[];
  isSuperAdmin?: boolean;
};

// ─── Upload image helper ──────────────────────────────────────────────────────
function ImageUploader({
  label,
  hint,
  current,
  accept = "image/*",
  onUpload,
  preview = "avatar",
}: {
  label: string;
  hint: string;
  current?: string;
  accept?: string;
  onUpload: (dataUrl: string) => void;
  preview?: "avatar" | "signature";
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) { alert("Veuillez sélectionner une image."); return; }
    const reader = new FileReader();
    reader.onload = (e) => { if (e.target?.result) onUpload(e.target.result as string); };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</p>

      <div className="flex items-start gap-5">
        {/* Aperçu actuel */}
        {preview === "avatar" ? (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-medwork-navy text-xl font-bold text-white ring-4 ring-slate-100 overflow-hidden">
            {current ? <img src={current} alt="Photo" className="h-full w-full object-cover" /> : "📷"}
          </div>
        ) : (
          <div className="flex h-20 w-32 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden">
            {current ? <img src={current} alt="Signature" className="h-full w-full object-contain p-1" /> : <span className="text-2xl">✍️</span>}
          </div>
        )}

        {/* Zone de drop */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => ref.current?.click()}
          className={`flex-1 cursor-pointer rounded-xl border-2 border-dashed px-4 py-5 text-center transition
            ${dragging ? "border-medwork-cyan bg-cyan-50" : "border-slate-200 bg-slate-50 hover:border-medwork-cyan hover:bg-cyan-50/40"}`}
        >
          <p className="text-sm font-medium text-slate-600">
            Glissez une image ici ou <span className="text-medwork-cyan underline">cliquez pour choisir</span>
          </p>
          <p className="mt-1 text-xs text-slate-400">{hint}</p>
          {current && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onUpload(""); }}
              className="mt-2 text-xs text-red-400 hover:text-red-600 hover:underline"
            >
              Supprimer
            </button>
          )}
        </div>
      </div>

      <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}

// ─── Page profil ──────────────────────────────────────────────────────────────
export default function ProfilePage({
  currentUser, roles, currentPage, onNavigate, onLogout, onSave,
  userPhoto, onPhotoChange, userSignature,
  userName, userRole, permissions = [], isSuperAdmin, searchData, onOpenWorker, onOpenVisit,
}: Props) {
  const [form, setForm] = useState({ name: currentUser?.name ?? "", email: currentUser?.email ?? "" });
  const [matricule, setMatricule] = useState(currentUser?.matricule ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const role = roles.find((r) => r.id === currentUser?.roleId);
  const inp = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/15";
  const lbl = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) { setError("Le nom ne peut pas être vide."); return; }
    if (!matricule.trim()) { setError("L'identifiant ne peut pas être vide."); return; }
    if (password) {
      if (!currentPassword) { setError("Veuillez saisir votre mot de passe actuel."); return; }
      if (password !== confirmPassword) { setError("Les mots de passe ne correspondent pas."); return; }
    }

    setSaving(true);
    try {
      // 1. Changement de mot de passe via la route dédiée (autorisée à tout utilisateur
      //    authentifié, qui vérifie le mot de passe actuel) — et non via PUT /users/:id
      //    qui est réservé aux administrateurs (permission admin.users).
      if (password) {
        await authAPI.changePassword(currentPassword, password);
      }

      // 2. Mise à jour des informations de profil (nom / e-mail / identifiant) via onSave.
      //    On ne l'appelle que si quelque chose a réellement changé, pour éviter une
      //    erreur 403 inutile chez les utilisateurs non-admin qui ne modifient que leur
      //    mot de passe.
      const profileChanged =
        form.name !== (currentUser?.name ?? "") ||
        form.email !== (currentUser?.email ?? "") ||
        matricule !== (currentUser?.matricule ?? "");
      if (profileChanged) {
        onSave({ ...currentUser, name: form.name, email: form.email, matricule });
      }

      setCurrentPassword("");
      setPassword("");
      setConfirmPassword("");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      // Ex. « Mot de passe actuel incorrect. » renvoyé par la route change-password
      setError(err?.message || "Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const initials = (currentUser?.name ?? "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const isAdmin = isSuperAdmin ?? currentUser?.isSuperAdmin ?? false;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        onLogout={onLogout}
        userPhoto={userPhoto}
        userName={userName}
        userRole={userRole}
        isSuperAdmin={isAdmin}
        permissions={permissions}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader onNavigate={onNavigate} searchData={searchData} permissions={permissions} isSuperAdmin={isSuperAdmin} onOpenWorker={onOpenWorker} onOpenVisit={onOpenVisit} />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl space-y-5 p-6 lg:p-8">

            <div className="mb-2">
              <h1 className="font-display text-[26px] font-bold leading-tight tracking-tight text-foreground">Mon profil</h1>
              <p className="mt-1 text-sm text-muted-foreground">Gérez vos informations personnelles et votre mot de passe.</p>
            </div>

            {/* ── Carte identité ── */}
            <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
              <div className="flex items-center gap-5 border-b border-border pb-5 mb-5">
                {/* Avatar */}
                <div className="relative">
                  <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white ring-4 ring-border overflow-hidden
                    ${isAdmin ? "bg-gradient-to-br from-amber-400 to-amber-600" : "bg-gradient-to-br from-brand-deep to-brand-vibrant"}`}>
                    {userPhoto ? <img src={userPhoto} alt="Photo" className="h-full w-full object-cover" /> : initials}
                  </div>
                </div>
                <div>
                  <p className="font-display text-lg font-bold text-foreground">{currentUser?.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {isAdmin ? (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">Administrateur suprême</span>
                    ) : role ? (
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${roleBadgeClass(role.color)}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${roleDotClass(role.color)}`} />
                        {role.name}
                      </span>
                    ) : userRole ? (
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">{userRole}</span>
                    ) : null}
                    <span className="font-mono text-xs text-muted-foreground">{currentUser?.matricule}</span>
                  </div>
                </div>
              </div>

              {/* ── Photo de profil ── */}
              <div className="mb-5 pb-5 border-b border-slate-100">
                <ImageUploader
                  label="Photo de profil"
                  hint="JPG, PNG ou WEBP · Max 2 Mo · Carré recommandé"
                  current={userPhoto}
                  onUpload={onPhotoChange}
                  preview="avatar"
                />
              </div>

              {/* ── Formulaire infos ── */}
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={lbl}>Nom complet</label>
                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Adresse e-mail</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="votre@email.com" className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Identifiant de connexion</label>
                    <input type="text" value={matricule} onChange={(e) => setMatricule(e.target.value)} className={inp} />
                  </div>
                </div>

                {/* Changement mot de passe */}
                <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Changer le mot de passe</p>
                  <div>
                    <label className={lbl}>Mot de passe actuel</label>
                    <input type={showPassword ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Requis pour changer de mot de passe" autoComplete="current-password" className={inp} />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className={lbl}>Nouveau mot de passe</label>
                      <div className="relative">
                        <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Laisser vide pour ne pas modifier" className={inp + " pr-10"} />
                        <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">
                          {showPassword ? "🙈" : "👁️"}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>Confirmer</label>
                      <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Répéter le mot de passe" className={inp} />
                    </div>
                  </div>
                </div>

                {error && (
                  <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger ring-1 ring-danger/20">{error}</p>
                )}

                <div className="flex items-center gap-3">
                  <button type="submit" disabled={saving} className="rounded-md bg-brand-deep px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-deep/90 disabled:cursor-not-allowed disabled:opacity-60">
                    {saving ? "Enregistrement…" : "Enregistrer les modifications"}
                  </button>
                  {saved && (
                    <span className="text-sm font-medium text-success">Modifications enregistrées</span>
                  )}
                </div>
              </form>
            </div>

            {/* ── Signature(s) — admins seulement ── */}
            {/* ── Ma signature (lecture seule — gérée par l'admin dans Gestion des utilisateurs) ── */}
            {userSignature && (
              <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
                <p className="mb-3 font-display font-bold text-foreground">Ma signature</p>
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-48 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
                    <img src={userSignature} alt="Signature" className="h-full w-full object-contain p-2" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    La signature est gérée par l'administrateur depuis la page{" "}
                    <span className="font-semibold text-foreground">Utilisateurs</span>.
                  </p>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}