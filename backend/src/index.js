// src/index.js
// Point d'entrée du serveur MedWork
// Les migrations de base de données sont appliquées via `prisma migrate deploy`
// au moment du déploiement (voir le script "start" de package.json), et NON ici.
// On évite ainsi tout `db push --accept-data-loss` au runtime (risque de perte de données).

require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const path    = require("path");
const fs      = require("fs");

const app = express();

// ─── Middleware globaux ───────────────────────────────────────────────────────

// Origines autorisées : configurables via la variable d'env CORS_ORIGINS
// (liste séparée par des virgules). Par défaut, on autorise le dev local Vite.
// Exemple en production : CORS_ORIGINS="https://medwork.vercel.app,https://app.medwork.com"
const defaultOrigins = ["http://localhost:5173", "http://localhost:3000"];
const envOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

// Autorise aussi tout sous-domaine *.vercel.app (déploiements + previews Vercel)
// et *.lovable.app (aperçu Lovable). L'API reste protégée par le token JWT.
function isAllowedOrigin(origin) {
  if (allowedOrigins.includes(origin)) return true;
  try {
    const host = new URL(origin).hostname;
    return host.endsWith(".vercel.app") || host.endsWith(".lovable.app");
  } catch {
    return false;
  }
}

app.use(cors({
  origin: (origin, callback) => {
    // Requêtes sans origine (curl, apps mobiles, server-to-server) : autorisées
    if (!origin) return callback(null, true);
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error(`Origine non autorisée par CORS : ${origin}`));
  },
  credentials: true,
}));

// Parser le JSON des requêtes
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers uploadés (photos, signatures)
const uploadDir = process.env.UPLOAD_DIR || "./uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use("/uploads", express.static(path.resolve(uploadDir)));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth",        require("./routes/auth"));
app.use("/api/users",       require("./routes/users"));
app.use("/api/roles",       require("./routes/roles"));
app.use("/api/workers",     require("./routes/workers"));
app.use("/api/workers/:workerId/medical-history", require("./routes/medicalHistory"));
app.use("/api/exam-types", require("./routes/examTypes"));
app.use("/api/visits",      require("./routes/visits"));
app.use("/api/visit-types", require("./routes/visitTypes"));
app.use("/api/decisions",   require("./routes/decisions"));
app.use("/api/reports",     require("./routes/reports"));
app.use("/api/uploads",     require("./routes/uploads"));
app.use("/api/settings",    require("./routes/settings"));

// ─── Route de santé ───────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "MedWork",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// ─── Gestion des erreurs ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Erreur serveur :", err.message);
  res.status(err.status || 500).json({
    error: err.message || "Erreur interne du serveur",
  });
});

// ─── Démarrage ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`\n✅ Serveur MedWork démarré sur http://localhost:${PORT}`);
  console.log(`📋 API disponible sur http://localhost:${PORT}/api`);
  console.log(`🗄️  Base Prisma Studio : npm run db:studio\n`);
});