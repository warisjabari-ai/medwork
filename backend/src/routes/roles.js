// src/routes/roles.js
const router = require("express").Router();
const prisma = require("../lib/prisma");
const { requireAuth, requirePermission } = require("../middleware/auth");
router.use(requireAuth);

router.get("/",       requireAuth, async (req, res) => {
  res.json(await prisma.role.findMany({ orderBy: { name: "asc" } }));
});
router.post("/",      requirePermission("admin.roles"), async (req, res) => {
  const { name, description, color, permissions } = req.body;
  if (!name) return res.status(400).json({ error: "Nom requis." });
  const role = await prisma.role.create({ data: { name, description, color: color ?? "cyan", permissions: permissions ?? [] } });
  res.status(201).json(role);
});
router.put("/:id",    requirePermission("admin.roles"), async (req, res) => {
  const { name, description, color, permissions } = req.body;
  res.json(await prisma.role.update({ where: { id: Number(req.params.id) }, data: { name, description, color, permissions } }));
});
router.delete("/:id", requirePermission("admin.roles"), async (req, res) => {
  const users = await prisma.user.count({ where: { roleId: Number(req.params.id) } });
  if (users > 0) return res.status(400).json({ error: `Ce rôle est utilisé par ${users} utilisateur(s).` });
  await prisma.role.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: "Rôle supprimé." });
});
module.exports = router;