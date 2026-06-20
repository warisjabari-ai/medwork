// src/branding.tsx
// Contexte de marque : diffuse l'identité de l'organisation (nom, logo, couleur)
// à toute l'application, et la charge depuis l'API au démarrage.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { settingsAPI, type Organization } from "./api";

const DEFAULT_ORG: Organization = {
  name: "MedWork",
  tagline: "La plateforme intelligente de médecine du travail",
  logo: null,
  primaryColor: "#0F4C81",
};

// ─── Génération automatique du thème depuis la couleur principale ─────────────
function hexToRgb(hex: string): [number, number, number] {
  let h = (hex || "#00aadd").replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return [0, 170, 221];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360; s /= 100; l /= 100;
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

// Applique la charte graphique de l'entreprise à toute l'application via les
// variables CSS lues par Tailwind (rgb(var(--primary) / <alpha>)).
export function applyTheme(hex: string) {
  if (typeof document === "undefined") return;
  const [r, g, b] = hexToRgb(hex);
  const [h, s] = rgbToHsl(r, g, b);
  const l = rgbToHsl(r, g, b)[2];
  const root = document.documentElement;
  const set = (name: string, rgb: [number, number, number]) =>
    root.style.setProperty(name, rgb.join(" "));
  set("--primary", [r, g, b]);
  set("--primary-light", hslToRgb(h, s, Math.min(l + 12, 96)));
  set("--primary-dark", hslToRgb(h, s, Math.max(l - 14, 10)));
  set("--primary-hover", hslToRgb(h, s, Math.max(l - 7, 12)));
  set("--primary-bg", hslToRgb(h, Math.min(s, 60), 96));
  set("--primary-border", hslToRgb(h, Math.min(s, 55), 86));
}

type OrgContextValue = {
  org: Organization;
  setOrg: (o: Organization) => void;
  refresh: () => Promise<void>;
};

const OrgContext = createContext<OrgContextValue>({
  org: DEFAULT_ORG,
  setOrg: () => {},
  refresh: async () => {},
});

export function OrgProvider({ children }: { children: ReactNode }) {
  const [org, setOrg] = useState<Organization>(DEFAULT_ORG);

  const refresh = async () => {
    try {
      const data = await settingsAPI.getOrganization();
      setOrg({ ...DEFAULT_ORG, ...data });
    } catch {
      // En cas d'échec réseau, on garde l'identité par défaut MedWork
    }
  };

  useEffect(() => { refresh(); }, []);

  // Applique la charte graphique (couleurs dérivées) dès que la couleur change
  useEffect(() => {
    applyTheme(org.primaryColor || "#00aadd");
  }, [org.primaryColor]);

  // Met à jour le titre de l'onglet du navigateur selon l'identité
  useEffect(() => {
    document.title = org.tagline ? `${org.name} — ${org.tagline}` : org.name;
  }, [org.name, org.tagline]);

  return (
    <OrgContext.Provider value={{ org, setOrg, refresh }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  return useContext(OrgContext);
}
