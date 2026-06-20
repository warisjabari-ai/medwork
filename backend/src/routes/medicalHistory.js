// src/routes/medicalHistory.js
// Antécédents, Vaccinations, Expositions par travailleur

const router = require("express").Router({ mergeParams: true });
const prisma  = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");

router.use(requireAuth);

// ─── GET /api/workers/:workerId/medical-history ───────────────────────────────
// Retourne antécédents + vaccinations + expositions d'un travailleur
router.get("/", async (req, res) => {
  const workerId = parseInt(req.params.workerId);
  if (isNaN(workerId)) return res.status(400).json({ error: "workerId invalide" });

  try {
    const [antecedents, vaccinations, expositions] = await Promise.all([
      prisma.workerAntecedent.findMany({ where: { workerId }, orderBy: { createdAt: "asc" } }),
      prisma.workerVaccination.findMany({ where: { workerId }, orderBy: { createdAt: "asc" } }),
      prisma.workerExposition.findMany({  where: { workerId }, orderBy: { createdAt: "asc" } }),
    ]);
    res.json({ antecedents, vaccinations, expositions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── ANTÉCÉDENTS ──────────────────────────────────────────────────────────────

// POST /api/workers/:workerId/medical-history/antecedents
router.post("/antecedents", async (req, res) => {
  const workerId = parseInt(req.params.workerId);
  const { label, type, suivi, visitRef, visitDate } = req.body;
  if (!label?.trim()) return res.status(400).json({ error: "label requis" });
  try {
    const item = await prisma.workerAntecedent.create({
      data: { workerId, label: label.trim(), type: type ?? "Personnel", suivi: suivi ?? "Suivi", visitRef, visitDate },
    });
    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PUT /api/workers/:workerId/medical-history/antecedents/:id
router.put("/antecedents/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { label, type, suivi } = req.body;
  try {
    const item = await prisma.workerAntecedent.update({
      where: { id },
      data: { label: label?.trim(), type, suivi },
    });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /api/workers/:workerId/medical-history/antecedents/:id
router.delete("/antecedents/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.workerAntecedent.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/workers/:workerId/medical-history/antecedents/sync
// Synchronisation automatique depuis un diagnostic de visite (évite les doublons)
router.post("/antecedents/sync", async (req, res) => {
  const workerId = parseInt(req.params.workerId);
  const { diagnoses, visitRef, visitDate } = req.body;
  if (!Array.isArray(diagnoses)) return res.status(400).json({ error: "diagnoses[] requis" });

  try {
    const existing = await prisma.workerAntecedent.findMany({ where: { workerId } });
    const existingLabels = new Set(existing.map((a) => a.label.trim().toLowerCase()));

    const toCreate = diagnoses.filter(
      (d) => d.isHistory && d.label?.trim() && !existingLabels.has(d.label.trim().toLowerCase())
    );

    if (toCreate.length > 0) {
      await prisma.workerAntecedent.createMany({
        data: toCreate.map((d) => ({
          workerId,
          label:     d.label.trim(),
          type:      "Personnel",
          suivi:     "Suivi",
          visitRef:  visitRef ?? null,
          visitDate: visitDate ?? null,
        })),
      });
    }

    // Retourner la liste à jour
    const updated = await prisma.workerAntecedent.findMany({ where: { workerId }, orderBy: { createdAt: "asc" } });
    res.json({ added: toCreate.length, antecedents: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── VACCINATIONS ─────────────────────────────────────────────────────────────

router.post("/vaccinations", async (req, res) => {
  const workerId = parseInt(req.params.workerId);
  const { nom, dateAdmin, dateExp } = req.body;
  if (!nom?.trim()) return res.status(400).json({ error: "nom requis" });
  try {
    const item = await prisma.workerVaccination.create({
      data: { workerId, nom: nom.trim(), dateAdmin, dateExp },
    });
    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.put("/vaccinations/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { nom, dateAdmin, dateExp } = req.body;
  try {
    const item = await prisma.workerVaccination.update({
      where: { id },
      data: { nom: nom?.trim(), dateAdmin, dateExp },
    });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.delete("/vaccinations/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.workerVaccination.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── EXPOSITIONS ──────────────────────────────────────────────────────────────

router.post("/expositions", async (req, res) => {
  const workerId = parseInt(req.params.workerId);
  const { type, niveau } = req.body;
  if (!type?.trim()) return res.status(400).json({ error: "type requis" });
  try {
    const item = await prisma.workerExposition.create({
      data: { workerId, type: type.trim(), niveau: niveau ?? "Modéré" },
    });
    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.put("/expositions/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { type, niveau } = req.body;
  try {
    const item = await prisma.workerExposition.update({
      where: { id },
      data: { type: type?.trim(), niveau },
    });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.delete("/expositions/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.workerExposition.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
