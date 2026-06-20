import { useState } from "react";
import { useOrg } from "../branding";

type Props = {
  onLogin: (matricule: string, password: string) => Promise<void>;
  users?: { matricule: string; name: string; roleId: number; active: boolean }[];
};

/* ─── Icônes SVG (pas d'emoji) ─────────────────────────────────────────────── */
const sw = 1.6;
function IconEye() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>);
}
function IconEyeOff() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M10.7 5.1A9.8 9.8 0 0 1 12 5c6.5 0 10 7 10 7a13.2 13.2 0 0 1-1.7 2.4M6.6 6.6A13.3 13.3 0 0 0 2 12s3.5 7 10 7a9.6 9.6 0 0 0 5.4-1.6M3 3l18 18"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>);
}
function IconAlert() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>);
}
function IconShield() {
  return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8.3-7 9.5C8 19.3 5 15.5 5 11V6l7-3Z"/><path d="m9.5 12 1.8 1.8 3.2-3.6"/></svg>);
}
function IconActivity() {
  return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h4l2.5 7 5-14L17 12h4"/></svg>);
}
function IconChart() {
  return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="6" rx="1"/><rect x="13" y="7" width="3" height="10" rx="1"/></svg>);
}

const FEATURES = [
  { icon: <IconShield />, title: "Dossiers médicaux protégés", desc: "Secret médical respecté, accès par rôle." },
  { icon: <IconActivity />, title: "Visites & aptitudes suivies", desc: "Embauche, périodique, reprise, restrictions." },
  { icon: <IconChart />, title: "Statistiques & conformité", desc: "Indicateurs SST par site, service et risque." },
];

export default function LoginPage({ onLogin }: Props) {
  const { org } = useOrg();
  const [showPassword, setShowPassword] = useState(false);
  const [matricule, setMatricule] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!matricule.trim()) { setError("Veuillez saisir votre identifiant."); return; }
    if (!password.trim()) { setError("Veuillez saisir votre mot de passe."); return; }
    setLoading(true);
    try {
      await onLogin(matricule, password);
    } catch (err: any) {
      setError(err.message || "Identifiant ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };

  const initial = (org.name || "M").charAt(0).toUpperCase();

  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-[1.05fr_1fr]">

      {/* ── Panneau gauche — Marque (gradient + glassmorphism) ── */}
      <div
        className="relative hidden overflow-hidden text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16"
        style={{ background: "linear-gradient(150deg, rgb(var(--primary-dark)) 0%, rgb(var(--primary)) 58%, rgb(var(--primary-light)) 120%)" }}
      >
        {/* Formes flottantes décoratives */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" style={{ animation: "mw-float 9s ease-in-out infinite" }} />
        <div className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" style={{ animation: "mw-float2 11s ease-in-out infinite" }} />
        {/* Grille subtile */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />

        {/* Logo + nom */}
        <div className="relative z-10 mw-rise">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white/15 text-xl font-bold backdrop-blur-md ring-1 ring-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
              {org.logo ? <img src={org.logo} alt={org.name} className="h-full w-full object-contain p-1.5" /> : initial}
            </div>
            <span className="text-lg font-semibold tracking-tight">{org.name}</span>
          </div>
        </div>

        {/* Accroche + features */}
        <div className="relative z-10 max-w-md">
          <h2 className="mw-rise mw-delay-1 text-4xl font-bold leading-[1.1] tracking-tight">
            {org.tagline || "La plateforme intelligente de médecine du travail"}
          </h2>
          <p className="mw-rise mw-delay-2 mt-4 text-[15px] leading-relaxed text-white/75">
            Centralisez le suivi de la santé au travail de vos équipes : dossiers, visites, aptitudes et statistiques, en toute confidentialité.
          </p>

          <div className="mt-10 space-y-4">
            {FEATURES.map((f, i) => (
              <div key={f.title} className={`mw-rise flex items-start gap-3.5 mw-delay-${i + 3}`}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/12 backdrop-blur-md ring-1 ring-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                  {f.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold">{f.title}</p>
                  <p className="text-[13px] text-white/65">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Attribution */}
        <div className="relative z-10 mw-fade mw-delay-5 text-[12px] text-white/55">
          Propulsé par <span className="font-semibold text-white/80">MedWork</span> · {new Date().getFullYear()}
        </div>
      </div>

      {/* ── Panneau droit — Formulaire ── */}
      <div className="flex flex-col items-center justify-center bg-white px-6 py-12 sm:px-10">
        <div className="w-full max-w-[380px] mw-fade">

          {/* En-tête mobile */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-primary text-lg font-bold text-white shadow-sm">
              {org.logo ? <img src={org.logo} alt={org.name} className="h-full w-full object-contain p-1.5" /> : initial}
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-900">{org.name}</span>
          </div>

          {/* Titre */}
          <div className="mb-8">
            <h1 className="text-[26px] font-bold tracking-tight text-slate-900">Bon retour</h1>
            <p className="mt-1.5 text-sm text-slate-500">Connectez-vous pour accéder à votre espace.</p>
          </div>

          {/* Erreur */}
          {error && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              <span className="shrink-0"><IconAlert /></span>
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Identifiant */}
            <div className="flex flex-col gap-2">
              <label htmlFor="matricule" className="text-sm font-medium text-slate-700">Identifiant</label>
              <input
                id="matricule"
                type="text"
                value={matricule}
                onChange={(e) => setMatricule(e.target.value)}
                placeholder="Votre identifiant"
                autoFocus
                autoComplete="username"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/15"
              />
            </div>

            {/* Mot de passe */}
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">Mot de passe</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                  tabIndex={-1}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>

            {/* Se souvenir */}
            <label className="flex cursor-pointer select-none items-center gap-2.5">
              <button
                type="button"
                role="checkbox"
                aria-checked={remember}
                onClick={() => setRemember((v) => !v)}
                className={`flex h-[18px] w-[18px] items-center justify-center rounded-md border transition ${remember ? "border-primary bg-primary text-white" : "border-slate-300 bg-white"}`}
              >
                {remember && (<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>)}
              </button>
              <span className="text-sm text-slate-600">Rester connecté</span>
            </label>

            {/* Bouton */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Connexion…
                </span>
              ) : "Se connecter"}
            </button>
          </form>

          <p className="mt-10 text-center text-xs text-slate-400">
            {org.name}{org.tagline ? ` · ${org.tagline}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
