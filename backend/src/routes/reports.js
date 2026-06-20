const router = require("express").Router();
const prisma = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");
router.use(requireAuth);

router.get("/prescriptions", async (req, res) => {
  try {
    const { month, year, molecule, doctor } = req.query;
    const visits = await prisma.visit.findMany({ include: { treatments: true, worker: { select: { name: true, matricule: true } } } });
    let lines = [];
    for (const v of visits) {
      if (month || year) {
        const parts = v.date.split("/");
        if (parts.length === 3) {
          if (month && parseInt(parts[1]) !== parseInt(month)) continue;
          if (year && parseInt(parts[2]) !== parseInt(year)) continue;
        }
      }
      for (const t of v.treatments) {
        if (molecule && !t.molecule.toLowerCase().includes(molecule.toLowerCase())) continue;
        if (doctor && v.doctor && !v.doctor.toLowerCase().includes(doctor.toLowerCase())) continue;
        lines.push({ visitRef: v.ref, visitDate: v.date, visitType: v.type, doctor: v.doctor ?? "—", workerName: v.worker?.name ?? "—", workerMatricule: v.worker?.matricule ?? "—", molecule: t.molecule, quantity: t.quantity ?? "", posology: t.posology ?? "" });
      }
    }
    res.json(lines);
  } catch (err) { res.status(500).json({ error: "Erreur serveur." }); }
});

router.get("/aptitudes", async (req, res) => {
  try {
    const { year } = req.query;
    const visits = await prisma.visit.findMany({ include: { worker: { select: { name: true, matricule: true, department: true, position: true } } }, orderBy: { id: "desc" } });
    const latest = {};
    for (const v of visits) {
      if (!year || v.date.endsWith("/" + year)) {
        if (!latest[v.workerId]) latest[v.workerId] = v;
      }
    }
    const today = new Date();
    const result = Object.values(latest).map((v) => {
      let expired = false;
      if (v.nextVisit) {
        const p = v.nextVisit.split("/");
        if (p.length === 2) expired = new Date(p[1], p[0] - 1, 1) < today;
      }
      return { workerName: v.worker?.name ?? "—", matricule: v.worker?.matricule ?? "—", department: v.worker?.department ?? "—", position: v.worker?.position ?? "—", aptitude: v.aptitude, doctor: v.doctor ?? "—", date: v.date, nextVisit: v.nextVisit ?? "—", expired };
    });
    res.json(result);
  } catch (err) { res.status(500).json({ error: "Erreur serveur." }); }
});

router.get("/activity", async (req, res) => {
  try {
    const { year } = req.query;
    const visits = await prisma.visit.findMany({ select: { date: true, type: true, doctor: true, workerId: true } });
    const filtered = year ? visits.filter((v) => v.date.endsWith("/" + year)) : visits;
    const byMonth = {};
    for (let m = 1; m <= 12; m++) byMonth[m] = 0;
    const byType = {};
    const byDoctor = {};
    for (const v of filtered) {
      const parts = v.date.split("/");
      if (parts.length === 3) { const m = parseInt(parts[1]); if (m >= 1 && m <= 12) byMonth[m]++; }
      byType[v.type] = (byType[v.type] || 0) + 1;
      const d = v.doctor || "Non renseigné";
      byDoctor[d] = (byDoctor[d] || 0) + 1;
    }
    res.json({ byMonth, byType, byDoctor, total: filtered.length });
  } catch (err) { res.status(500).json({ error: "Erreur serveur." }); }
});

module.exports = router;
