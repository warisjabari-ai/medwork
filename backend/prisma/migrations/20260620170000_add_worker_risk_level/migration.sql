-- Ajout du niveau de risque sur l'employé (Faible | Modéré | Élevé)
ALTER TABLE "Worker" ADD COLUMN "riskLevel" TEXT NOT NULL DEFAULT 'Modéré';
