const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");

router.post("/login", async (req, res) => {
  try {
    const { matricule, password } = req.body;
    if (!matricule || !password) {
      return res.status(400).json({ error: "Identifiant et mot de passe requis." });
    }
    const user = await prisma.user.findUnique({
      where: { matricule },
      include: { role: true },
    });
    if (!user) return res.status(401).json({ error: "Identifiant introuvable." });
    if (!user.active) return res.status(401).json({ error: "Compte désactivé." });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Mot de passe incorrect." });
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "8h" });
    const { passwordHash, ...safe } = user;
    res.json({ token, user: safe });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  const { passwordHash, ...safe } = req.user;
  res.json(safe);
});

router.put("/change-password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: "Champs requis." });
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(400).json({ error: "Mot de passe actuel incorrect." });
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash } });
    res.json({ message: "Mot de passe modifié." });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur." });
  }
});

module.exports = router;
