// src/routes/users.js
const router = require("express").Router();
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { requireAuth, requirePermission, requireSuperAdmin } = require("../middleware/auth");

router.use(requireAuth);

// GET /api/users
router.get("/", requireAuth, async (req, res) => {
  const users = await prisma.user.findMany({
    include: { role: { select: { id: true, name: true, color: true } } },
    orderBy: { name: "asc" },
  });
  res.json(users.map(({ passwordHash, ...u }) => u));
});

// POST /api/users
router.post("/", requirePermission("admin.users"), async (req, res) => {
  const { name, matricule, email, roleId, active, isSuperAdmin, password } = req.body;
  if (!name || !matricule || !password) {
    return res.status(400).json({ error: "Nom, identifiant et mot de passe requis." });
  }
  const existing = await prisma.user.findUnique({ where: { matricule } });
  if (existing) return res.status(409).json({ error: "Identifiant déjà utilisé." });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, matricule, email, roleId: Number(roleId), active: active ?? true, isSuperAdmin: isSuperAdmin ?? false, passwordHash },
    include: { role: true },
  });
  const { passwordHash: _, ...safe } = user;
  res.status(201).json(safe);
});

// PUT /api/users/:id
router.put("/:id", requirePermission("admin.users"), async (req, res) => {
  const { name, matricule, email, roleId, active, password } = req.body;
  const data = { name, matricule, email, roleId: roleId ? Number(roleId) : undefined, active };
  if (password) data.passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.update({ where: { id: Number(req.params.id) }, data, include: { role: true } });
  const { passwordHash, ...safe } = user;
  res.json(safe);
});

// PATCH /api/users/:id/toggle-active
router.patch("/:id/toggle-active", requirePermission("admin.users"), async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) } });
  if (user?.isSuperAdmin) return res.status(403).json({ error: "Impossible de désactiver l'administrateur suprême." });
  const updated = await prisma.user.update({ where: { id: Number(req.params.id) }, data: { active: !user.active } });
  const { passwordHash, ...safe } = updated;
  res.json(safe);
});

// PATCH /api/users/:id/signature  (super admin seulement)
router.patch("/:id/signature", requireSuperAdmin, async (req, res) => {
  const { signature } = req.body; // data URL base64
  const user = await prisma.user.update({ where: { id: Number(req.params.id) }, data: { signature } });
  res.json({ id: user.id, signature: user.signature });
});

// PATCH /api/users/me/photo
router.patch("/me/photo", async (req, res) => {
  const { photo } = req.body;
  await prisma.user.update({ where: { id: req.user.id }, data: { photo } });
  res.json({ message: "Photo mise à jour." });
});

// DELETE /api/users/:id
router.delete("/:id", requirePermission("admin.users"), async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) } });
  if (user?.isSuperAdmin) return res.status(403).json({ error: "Impossible de supprimer l'administrateur suprême." });
  await prisma.user.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: "Utilisateur supprimé." });
});

module.exports = router;