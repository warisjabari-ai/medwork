const router = require("express").Router();
const prisma = require("../lib/prisma");
const { requireAuth, requirePermission } = require("../middleware/auth");

router.use(requireAuth);

router.get("/", requirePermission("workers.view"), async (req, res) => {
  try {
    const { search, contractStatus } = req.query;
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { matricule: { contains: search, mode: "insensitive" } },
      ];
    }
    if (contractStatus) where.contractStatus = contractStatus;
    const workers = await prisma.worker.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        visits: { orderBy: { id: "desc" }, take: 1, select: { date: true, aptitude: true, nextVisit: true, ref: true } },
      },
    });
    const result = workers.map((w) => {
      const last = w.visits[0];
      return {
        id: w.id, name: w.name, matricule: w.matricule,
        department: w.department ?? "", position: w.position ?? "",
        company: w.company ?? "", residence: w.residence ?? "",
        contractStatus: w.contractStatus,
        riskLevel: w.riskLevel ?? "Modéré",
        status: last?.aptitude ?? "Aucune visite",
        lastVisit: last?.date ?? "—",
      };
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

router.get("/:id", requirePermission("workers.view"), async (req, res) => {
  try {
    const worker = await prisma.worker.findUnique({ where: { id: Number(req.params.id) } });
    if (!worker) return res.status(404).json({ error: "Travailleur introuvable." });
    res.json(worker);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur." });
  }
});

router.post("/", requirePermission("workers.create"), async (req, res) => {
  try {
    const { name, matricule, department, position, company, residence, contractStatus, riskLevel } = req.body;
    if (!name?.trim() || !matricule?.trim()) return res.status(400).json({ error: "Nom et matricule requis." });
    const existing = await prisma.worker.findUnique({ where: { matricule } });
    if (existing) return res.status(409).json({ error: "Ce matricule existe déjà." });
    const worker = await prisma.worker.create({
      data: { name, matricule, department, position, company, residence, contractStatus: contractStatus ?? "actif", riskLevel: riskLevel ?? "Modéré" },
    });
    res.status(201).json(worker);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur." });
  }
});

router.put("/:id", requirePermission("workers.edit"), async (req, res) => {
  try {
    const { name, matricule, department, position, company, residence, contractStatus, riskLevel } = req.body;
    const worker = await prisma.worker.update({
      where: { id: Number(req.params.id) },
      data: { name, matricule, department, position, company, residence, contractStatus, riskLevel },
    });
    res.json(worker);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur." });
  }
});

router.patch("/:id/contract-status", requirePermission("workers.edit"), async (req, res) => {
  try {
    const { contractStatus } = req.body;
    const worker = await prisma.worker.update({
      where: { id: Number(req.params.id) },
      data: { contractStatus },
    });
    res.json(worker);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur." });
  }
});

router.delete("/:id", requirePermission("workers.delete"), async (req, res) => {
  try {
    await prisma.worker.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Travailleur supprimé." });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur." });
  }
});

module.exports = router;
