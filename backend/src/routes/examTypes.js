// src/routes/examTypes.js
// CRUD Types d'examens biologiques

const router = require("express").Router();
const prisma  = require("../lib/prisma");
const { requireAuth, requirePermission } = require("../middleware/auth");

router.use(requireAuth);

// ─── GET /api/exam-types ──────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const exams = await prisma.examType.findMany({
      orderBy: { name: "asc" },
    });
    res.json(exams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── POST /api/exam-types ─────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  const { name, unit, valueType, normalMin, normalMax, normalValues, possibleValues, description } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Nom requis" });
  try {
    const exam = await prisma.examType.create({
      data: {
        name: name.trim(),
        unit: unit ?? "",
        valueType: valueType ?? "numeric",
        normalMin: normalMin !== undefined ? parseFloat(normalMin) : null,
        normalMax: normalMax !== undefined ? parseFloat(normalMax) : null,
        normalValues: normalValues ?? null,
        possibleValues: possibleValues ?? null,
        description: description ?? null,
      },
    });
    res.status(201).json(exam);
  } catch (err) {
    if (err.code === "P2002") return res.status(400).json({ error: "Cet examen existe déjà." });
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── PUT /api/exam-types/:id ──────────────────────────────────────────────────
router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, unit, valueType, normalMin, normalMax, normalValues, possibleValues, description, active } = req.body;
  try {
    const exam = await prisma.examType.update({
      where: { id },
      data: {
        name: name?.trim(),
        unit,
        valueType,
        normalMin: normalMin !== undefined && normalMin !== "" ? parseFloat(normalMin) : null,
        normalMax: normalMax !== undefined && normalMax !== "" ? parseFloat(normalMax) : null,
        normalValues: normalValues ?? null,
        possibleValues: possibleValues ?? null,
        description,
        active,
      },
    });
    res.json(exam);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── DELETE /api/exam-types/:id ───────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.examType.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── GET /api/exam-types/results/:visitId ────────────────────────────────────
// Résultats d'une visite
router.get("/results/:visitId", async (req, res) => {
  const visitId = parseInt(req.params.visitId);
  try {
    const results = await prisma.examResult.findMany({
      where: { visitId },
      include: { examType: true },
    });
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── POST /api/exam-types/results/:visitId ───────────────────────────────────
// Sauvegarder les résultats d'une visite (upsert)
router.post("/results/:visitId", async (req, res) => {
  const visitId = parseInt(req.params.visitId);
  const { results } = req.body; // [{ examTypeId, value }]
  if (!Array.isArray(results)) return res.status(400).json({ error: "results[] requis" });

  try {
    // Charger les types d'examens pour calculer isAbnormal
    const examTypeIds = results.map((r) => r.examTypeId);
    const examTypes = await prisma.examType.findMany({ where: { id: { in: examTypeIds } } });
    const examMap = Object.fromEntries(examTypes.map((e) => [e.id, e]));

    const ops = results
      .filter((r) => r.value !== undefined && r.value !== null && r.value !== "")
      .map((r) => {
        const et = examMap[r.examTypeId];
        let isAbnormal = false;
        if (et) {
          if (et.valueType === "numeric") {
            const num = parseFloat(r.value);
            if (!isNaN(num)) {
              if (et.normalMin !== null && num < et.normalMin) isAbnormal = true;
              if (et.normalMax !== null && num > et.normalMax) isAbnormal = true;
            }
          } else if (et.valueType === "qualitative") {
            const normals = (et.normalValues ?? []);
            if (normals.length > 0 && r.value && !normals.includes(r.value)) isAbnormal = true;
          }
        }
        return prisma.examResult.upsert({
          where: { visitId_examTypeId: { visitId, examTypeId: r.examTypeId } },
          create: { visitId, examTypeId: r.examTypeId, value: String(r.value), isAbnormal },
          update: { value: String(r.value), isAbnormal },
        });
      });

    await Promise.all(ops);

    // Retourner les résultats mis à jour
    const updated = await prisma.examResult.findMany({
      where: { visitId },
      include: { examType: true },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;