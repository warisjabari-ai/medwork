// src/middleware/auth.js
// Middleware de vérification du token JWT

const jwt    = require("jsonwebtoken");
const prisma = require("../lib/prisma");

// ─── Vérifie que l'utilisateur est connecté ──────────────────────────────────
async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token manquant. Veuillez vous connecter." });
  }

  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { role: true },
    });
    if (!user || !user.active) {
      return res.status(401).json({ error: "Compte inactif ou introuvable." });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token invalide ou expiré." });
  }
}

// ─── Vérifie une permission avec logique hiérarchique ───────────────────────
// Un utilisateur avec "visits.edit.info" a aussi "visits.edit"
// Un utilisateur avec "visits.edit" a aussi "visits.edit.info", etc.
function hasPerm(perms, requiredPerm) {
  if (!perms || perms.length === 0) return false;
  if (perms.includes("*")) return true;

  // Match exact
  if (perms.includes(requiredPerm)) return true;

  // Descendant : l'utilisateur a visits.edit.info → il satisfait visits.edit
  // (un sous-droit implique le droit parent pour les vérifications backend)
  const requiredParts = requiredPerm.split(".");
  for (const perm of perms) {
    const parts = perm.split(".");
    // Si la permission de l'utilisateur commence par la permission requise → ok
    // Ex: user has "visits.edit.info", required "visits.edit" → ok
    if (parts.length > requiredParts.length) {
      const prefix = parts.slice(0, requiredParts.length).join(".");
      if (prefix === requiredPerm) return true;
    }
    // Si la permission requise commence par la permission de l'utilisateur → ok
    // Ex: user has "visits.edit", required "visits.edit.info" → ok
    if (requiredParts.length > parts.length) {
      const prefix = requiredParts.slice(0, parts.length).join(".");
      if (prefix === perm) return true;
    }
  }
  return false;
}

function requirePermission(permissionKey) {
  return (req, res, next) => {
    if (req.user.isSuperAdmin) return next();
    const perms = req.user.role?.permissions ?? [];
    if (!hasPerm(perms, permissionKey)) {
      return res.status(403).json({
        error: `Permission refusée. Requiert : ${permissionKey}`,
      });
    }
    next();
  };
}

// ─── Vérifie que l'utilisateur est super admin ───────────────────────────────
function requireSuperAdmin(req, res, next) {
  if (!req.user.isSuperAdmin) {
    return res.status(403).json({ error: "Accès réservé à l'administrateur suprême." });
  }
  next();
}

module.exports = { requireAuth, requirePermission, requireSuperAdmin, hasPerm };