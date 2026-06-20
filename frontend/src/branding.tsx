// src/branding.tsx
// Contexte de marque : diffuse l'identité de l'organisation (nom, logo, couleur)
// à toute l'application, et la charge depuis l'API au démarrage.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { settingsAPI, type Organization } from "./api";

const DEFAULT_ORG: Organization = {
  name: "MedWork",
  tagline: "Santé au travail",
  logo: null,
  primaryColor: "#00aadd",
};

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
