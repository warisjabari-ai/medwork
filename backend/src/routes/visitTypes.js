// src/routes/visitTypes.js
const router = require("express").Router();
const prisma = require("../lib/prisma");
const { requireAuth, requirePermission } = require("../middleware/auth");
router.use(requireAuth);

router.get("/",       async (req, res) => {
  res.json(await prisma.visitType.findMany({ orderBy: { name: "asc" } }));
});
router.post("/",      requirePermission("settings.visitTypes"), async (req, res) => {
  const { name, description, periodicity, mandatory, examConfig, editRules } = req.body;
  if (!name) return res.status(400).json({ error: "Nom requis." });
  const vt = await prisma.visitType.create({
    data: { name, description, periodicity: periodicity ?? "Annuelle", mandatory: mandatory ?? false, examConfig: examConfig ?? {}, editRules: editRules ?? {} },
  });
  res.status(201).json(vt);
});
router.put("/:id",    requirePermission("settings.visitTypes"), async (req, res) => {
  const { name, description, periodicity, mandatory, examConfig, editRules, examTypeIds } = req.body;
  res.json(await prisma.visitType.update({ where: { id: Number(req.params.id) }, data: { name, description, periodicity, mandatory, examConfig, editRules, ...(examTypeIds !== undefined ? { examTypeIds } : {}) } }));
});
router.delete("/:id", requirePermission("settings.visitTypes"), async (req, res) => {
  await prisma.visitType.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: "Type supprimé." });
});
module.exports = router;