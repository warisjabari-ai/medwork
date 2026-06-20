const router = require("express").Router();
const prisma = require("../lib/prisma");
const { requireAuth, requirePermission } = require("../middleware/auth");
router.use(requireAuth);
router.get("/", async (req, res) => {
  try { res.json(await prisma.decision.findMany({ orderBy: { label: "asc" } })); }
  catch (err) { res.status(500).json({ error: "Erreur serveur." }); }
});
router.post("/", requirePermission("settings.decisions"), async (req, res) => {
  try {
    const { label, color, description, requiresRestriction } = req.body;
    if (!label) return res.status(400).json({ error: "Libellé requis." });
    res.status(201).json(await prisma.decision.create({ data: { label, color: color ?? "green", description, requiresRestriction: requiresRestriction ?? false } }));
  } catch (err) { res.status(500).json({ error: "Erreur serveur." }); }
});
router.put("/:id", requirePermission("settings.decisions"), async (req, res) => {
  try {
    const { label, color, description, requiresRestriction } = req.body;
    res.json(await prisma.decision.update({ where: { id: Number(req.params.id) }, data: { label, color, description, requiresRestriction } }));
  } catch (err) { res.status(500).json({ error: "Erreur serveur." }); }
});
router.delete("/:id", requirePermission("settings.decisions"), async (req, res) => {
  try {
    await prisma.decision.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Décision supprimée." });
  } catch (err) { res.status(500).json({ error: "Erreur serveur." }); }
});
module.exports = router;
