const router = require("express").Router();
const prisma = require("../lib/prisma");
const { requireAuth, requireSuperAdmin } = require("../middleware/auth");
router.use(requireAuth);

router.patch("/photo", async (req, res) => {
  try {
    const { photo } = req.body;
    await prisma.user.update({ where: { id: req.user.id }, data: { photo } });
    res.json({ message: "Photo mise à jour." });
  } catch (err) { res.status(500).json({ error: "Erreur serveur." }); }
});

router.patch("/signature/:userId", requireSuperAdmin, async (req, res) => {
  try {
    const { signature } = req.body;
    await prisma.user.update({ where: { id: Number(req.params.userId) }, data: { signature } });
    res.json({ message: "Signature mise à jour." });
  } catch (err) { res.status(500).json({ error: "Erreur serveur." }); }
});

module.exports = router;
