// src/routes/settings.js
// Réglages globaux de l'application — identité de l'organisation (marque).
const router = require("express").Router();
const prisma = require("../lib/prisma");
const { requireAuth, requireSuperAdmin } = require("../middleware/auth");

const DEFAULTS = {
  name: "MedWork",
  tagline: "Santé au travail",
  logo: null,
  primaryColor: "#00aadd",
  address: null,
  country: null,
};

// Récupère la ligne unique (id=1), la crée avec les valeurs par défaut si absente.
async function getOrCreate() {
  let org = await prisma.organizationSettings.findUnique({ where: { id: 1 } });
  if (!org) {
    org = await prisma.organizationSettings.create({ data: { id: 1, ...DEFAULTS } });
  }
  return org;
}

// GET /api/settings/organization
// Public (pas d'authentification) : l'identité/marque doit pouvoir s'afficher
// sur la page de connexion, avant que l'utilisateur ne soit connecté.
router.get("/organization", async (req, res) => {
  try {
    const org = await getOrCreate();
    res.json({
      name: org.name,
      tagline: org.tagline,
      logo: org.logo,
      primaryColor: org.primaryColor,
      address: org.address,
      country: org.country,
    });
  } catch (err) {
    console.error("Erreur lecture organisation:", err.message);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// PUT /api/settings/organization
// Réservé au super administrateur : modifier l'identité de l'organisation.
router.put("/organization", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { name, tagline, logo, primaryColor, address, country } = req.body;
    await getOrCreate();
    const data = {};
    if (name !== undefined) data.name = name;
    if (tagline !== undefined) data.tagline = tagline;
    if (logo !== undefined) data.logo = logo;
    if (primaryColor !== undefined) data.primaryColor = primaryColor;
    if (address !== undefined) data.address = address;
    if (country !== undefined) data.country = country;
    const org = await prisma.organizationSettings.update({ where: { id: 1 }, data });
    res.json(org);
  } catch (err) {
    console.error("Erreur mise à jour organisation:", err.message);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

module.exports = router;
