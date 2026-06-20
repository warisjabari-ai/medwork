// src/routes/visits.js
// CRUD Visites médicales

const router = require("express").Router();
const prisma = require("../lib/prisma");
const { requireAuth, requirePermission } = require("../middleware/auth");

router.use(requireAuth);

// ─── Helper : inclure toutes les sous-tables ──────────────────────────────────
const FULL_INCLUDE = {
  clinicalExam:   true,
  physicalExam:   true,
  functionalEval: true,
  complaints:     true,
  diagnoses:      true,
  treatments:     true,
  examResults:    { include: { examType: true } },
  worker:         { select: { name: true, matricule: true, department: true, position: true, company: true, residence: true } },
};

// ─── Générer un ref unique ────────────────────────────────────────────────────
async function generateRef() {
  const year = new Date().getFullYear();
  const prefix = `VIS-${year}-`;
  const last = await prisma.visit.findFirst({
    where: { ref: { startsWith: prefix } },
    orderBy: { ref: "desc" },
    select: { ref: true },
  });
  const nextNum = last
    ? parseInt(last.ref.replace(prefix, ""), 10) + 1
    : 1;
  return `${prefix}${String(nextNum).padStart(5, "0")}`;
}

// ─── GET /api/visits ─────────────────────────────────────────────────────────
// Liste toutes les visites (avec filtres optionnels)
router.get("/", requirePermission("visits.view"), async (req, res) => {
  const { workerId, search, closed } = req.query;

  const where = {};
  if (workerId) where.workerId = Number(workerId);
  if (closed !== undefined) where.closed = closed === "true";
  if (search) {
    where.OR = [
      { ref:    { contains: search, mode: "insensitive" } },
      { doctor: { contains: search, mode: "insensitive" } },
      { type:   { contains: search, mode: "insensitive" } },
      { worker: { name: { contains: search, mode: "insensitive" } } },
      { worker: { matricule: { contains: search, mode: "insensitive" } } },
    ];
  }

  const visits = await prisma.visit.findMany({
    where,
    include: FULL_INCLUDE,
    orderBy: [{ id: "desc" }],
  });

  res.json(visits.map(formatVisit));
});

// ─── GET /api/visits/:id ──────────────────────────────────────────────────────
router.get("/:id", requirePermission("visits.view"), async (req, res) => {
  const visit = await prisma.visit.findUnique({
    where: { id: Number(req.params.id) },
    include: FULL_INCLUDE,
  });
  if (!visit) return res.status(404).json({ error: "Visite introuvable." });
  res.json(formatVisit(visit));
});

// ─── POST /api/visits ─────────────────────────────────────────────────────────
router.post("/", requirePermission("visits.create"), async (req, res) => {
  const body = req.body;
  if (!body.workerId) return res.status(400).json({ error: "workerId requis." });

  const ref = await generateRef();

  const visit = await prisma.visit.create({
    data: {
      ref,
      workerId:        Number(body.workerId),
      date:            body.date ?? "",
      type:            body.type ?? "Visite périodique",
      doctor:          body.doctor ?? "",
      aptitudeDoctor:  body.aptitudeDoctor ?? "",
      aptitude:        body.aptitude ?? "Apte",
      nextVisit:       body.nextVisit ?? "Non définie",
      note:            body.note ?? "",
      restrictions:    body.restrictions ?? "Aucune",
      biology:         body.biology ?? "",
      complementaryExams: body.complementaryExams ?? "",
      recommendations: body.recommendations ?? "",
      closed:          false,

      // Sous-tables créées en même temps
      clinicalExam: body.clinicalExam ? { create: body.clinicalExam } : undefined,
      physicalExam: body.physicalExam ? { create: body.physicalExam } : undefined,
      functionalEval: body.functionalEval ? {
        create: {
          ...body.functionalEval,
          visualTest: body.functionalEval.visualTest ?? undefined,
          imaging:    body.functionalEval.imaging ?? undefined,
        }
      } : undefined,
      complaints:  body.complaints?.length  ? { create: body.complaints }  : undefined,
      diagnoses:   body.diagnoses?.length   ? { create: body.diagnoses }   : undefined,
      treatments:  body.treatments?.length  ? { create: body.treatments }  : undefined,
    },
    include: FULL_INCLUDE,
  });

  res.status(201).json(formatVisit(visit));
});

// ─── PUT /api/visits/:id ──────────────────────────────────────────────────────
// La route PUT utilise visits.edit (parent) — le middleware hiérarchique accepte visits.edit.* aussi
router.put("/:id", requirePermission("visits.edit"), async (req, res) => {
  const id   = Number(req.params.id);
  const body = req.body;

  // Vérifier que la visite n'est pas clôturée
  const existing = await prisma.visit.findUnique({ where: { id }, select: { closed: true } });
  if (!existing) return res.status(404).json({ error: "Visite introuvable." });
  if (existing.closed) return res.status(400).json({ error: "Impossible de modifier une visite clôturée." });

  // Mettre à jour les champs principaux
  await prisma.visit.update({
    where: { id },
    data: {
      date:            body.date,
      type:            body.type,
      doctor:          body.doctor,
      aptitudeDoctor:  body.aptitudeDoctor,
      aptitude:        body.aptitude,
      nextVisit:       body.nextVisit,
      note:            body.note,
      restrictions:    body.restrictions,
      biology:         body.biology,
      complementaryExams: body.complementaryExams,
      recommendations: body.recommendations,
    },
  });

  // Mettre à jour ou créer les sous-tables
  if (body.clinicalExam) {
    await prisma.clinicalExam.upsert({
      where: { visitId: id },
      update: body.clinicalExam,
      create: { visitId: id, ...body.clinicalExam },
    });
  }
  if (body.physicalExam) {
    await prisma.physicalExam.upsert({
      where: { visitId: id },
      update: body.physicalExam,
      create: { visitId: id, ...body.physicalExam },
    });
  }
  if (body.functionalEval) {
    await prisma.functionalEval.upsert({
      where: { visitId: id },
      update: body.functionalEval,
      create: { visitId: id, ...body.functionalEval },
    });
  }

  // Remplacer les listes (supprimer + recréer)
  if (body.complaints !== undefined) {
    await prisma.complaint.deleteMany({ where: { visitId: id } });
    if (body.complaints.length) {
      await prisma.complaint.createMany({ data: body.complaints.map((c) => ({ ...c, visitId: id })) });
    }
  }
  if (body.diagnoses !== undefined) {
    await prisma.diagnosis.deleteMany({ where: { visitId: id } });
    if (body.diagnoses.length) {
      await prisma.diagnosis.createMany({ data: body.diagnoses.map((d) => ({ ...d, visitId: id })) });
    }
  }
  if (body.treatments !== undefined) {
    await prisma.treatment.deleteMany({ where: { visitId: id } });
    if (body.treatments.length) {
      await prisma.treatment.createMany({ data: body.treatments.map((t) => ({ ...t, visitId: id })) });
    }
  }

  const updated = await prisma.visit.findUnique({ where: { id }, include: FULL_INCLUDE });
  res.json(formatVisit(updated));
});

// ─── PATCH /api/visits/:id/close ─────────────────────────────────────────────
router.patch("/:id/close", requirePermission("visits.close"), async (req, res) => {
  const visit = await prisma.visit.update({
    where:  { id: Number(req.params.id) },
    data:   { closed: true },
    include: FULL_INCLUDE,
  });
  res.json(formatVisit(visit));
});

// ─── Formater une visite pour le frontend ─────────────────────────────────────
function formatVisit(v) {
  return {
    id:              v.id,
    ref:             v.ref,
    workerId:        v.workerId,
    date:            v.date,
    type:            v.type,
    doctor:          v.doctor ?? "",
    aptitudeDoctor:  v.aptitudeDoctor ?? "",
    aptitude:        v.aptitude,
    nextVisit:       v.nextVisit ?? "",
    note:            v.note ?? "",
    restrictions:    v.restrictions ?? "",
    biology:         v.biology ?? "",
    complementaryExams: v.complementaryExams ?? "",
    recommendations: v.recommendations ?? "",
    closed:          v.closed,
    // Sous-tables
    clinicalExam:     v.clinicalExam    ?? emptyClinic(),
    physicalExam:     v.physicalExam    ?? emptyPhysical(),
    functionalEvaluation: functionalFormat(v.functionalEval),
    complaints:       v.complaints      ?? [],
    diagnoses:        v.diagnoses       ?? [],
    treatment:        v.treatments      ?? [],
    examResults:      (v.examResults ?? []).map((r) => ({
      id: r.id, examTypeId: r.examTypeId, value: r.value ?? "",
      isAbnormal: r.isAbnormal,
      examType: r.examType ?? null,
    })),
    // Infos travailleur (pour l'affichage dans VisitsPage)
    worker:           v.worker          ?? null,
  };
}

function emptyClinic() {
  return { weight:"", height:"", bmi:"", temperature:"", bloodPressure:"", pulse:"", respiratoryRate:"" };
}
function emptyPhysical() {
  return { orl:"", digestive:"", cardiology:"", neurology:"", pulmonary:"", uroGenital:"", locomotor:"", others:"" };
}
function functionalFormat(fe) {
  if (!fe) return {
    ecg:"", spirometry:"", audiogram:"", hearingProtectionUsed:"Non", hearingProtectionType:"",
    visualTest:{ distanceOD:"", distanceOG:"", presOD:"", presOG:"", withGlasses:"Sans précision" },
    colorVisionOD:"", colorVisionOG:"", imaging:[],
  };
  return {
    ecg:                  fe.ecg ?? "",
    spirometry:           fe.spirometry ?? "",
    audiogram:            fe.audiogram ?? "",
    hearingProtectionUsed: fe.hearingProtectionUsed ?? "Non",
    hearingProtectionType: fe.hearingProtectionType ?? "",
    visualTest:           fe.visualTest ?? { distanceOD:"", distanceOG:"", presOD:"", presOG:"", withGlasses:"Sans précision" },
    colorVisionOD:        fe.colorVisionOD ?? "",
    colorVisionOG:        fe.colorVisionOG ?? "",
    imaging:              fe.imaging ?? [],
  };
}

// ─── DELETE /api/visits/:id ───────────────────────────────────────────────────
router.delete("/:id", requirePermission("visits.delete"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.visit.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
});

module.exports = router;