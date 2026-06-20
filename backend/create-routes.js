const fs = require('fs');

// Créer les dossiers
fs.mkdirSync('src/routes', { recursive: true });
fs.mkdirSync('src/lib', { recursive: true });
fs.mkdirSync('src/middleware', { recursive: true });

// src/lib/prisma.js
fs.writeFileSync('src/lib/prisma.js', `const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
module.exports = prisma;
`, 'utf8');

// src/middleware/auth.js
fs.writeFileSync('src/middleware/auth.js', `const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token manquant." });
  }
  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { role: true },
    });
    if (!user || !user.active) {
      return res.status(401).json({ error: "Compte inactif ou introuvable." });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token invalide ou expiré." });
  }
}

function requirePermission(permissionKey) {
  return (req, res, next) => {
    if (req.user.isSuperAdmin) return next();
    const perms = req.user.role?.permissions ?? [];
    if (!perms.includes(permissionKey)) {
      return res.status(403).json({ error: "Permission refusée." });
    }
    next();
  };
}

function requireSuperAdmin(req, res, next) {
  if (!req.user.isSuperAdmin) {
    return res.status(403).json({ error: "Accès réservé à l'administrateur suprême." });
  }
  next();
}

module.exports = { requireAuth, requirePermission, requireSuperAdmin };
`, 'utf8');

// src/routes/auth.js
fs.writeFileSync('src/routes/auth.js', `const router = require("express").Router();
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
`, 'utf8');

// src/routes/workers.js
fs.writeFileSync('src/routes/workers.js', `const router = require("express").Router();
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
    const { name, matricule, department, position, company, residence, contractStatus } = req.body;
    if (!name?.trim() || !matricule?.trim()) return res.status(400).json({ error: "Nom et matricule requis." });
    const existing = await prisma.worker.findUnique({ where: { matricule } });
    if (existing) return res.status(409).json({ error: "Ce matricule existe déjà." });
    const worker = await prisma.worker.create({
      data: { name, matricule, department, position, company, residence, contractStatus: contractStatus ?? "actif" },
    });
    res.status(201).json(worker);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur." });
  }
});

router.put("/:id", requirePermission("workers.edit"), async (req, res) => {
  try {
    const { name, matricule, department, position, company, residence, contractStatus } = req.body;
    const worker = await prisma.worker.update({
      where: { id: Number(req.params.id) },
      data: { name, matricule, department, position, company, residence, contractStatus },
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
`, 'utf8');

// src/routes/roles.js
fs.writeFileSync('src/routes/roles.js', `const router = require("express").Router();
const prisma = require("../lib/prisma");
const { requireAuth, requirePermission } = require("../middleware/auth");
router.use(requireAuth);
router.get("/", async (req, res) => {
  try { res.json(await prisma.role.findMany({ orderBy: { name: "asc" } })); }
  catch (err) { res.status(500).json({ error: "Erreur serveur." }); }
});
router.post("/", requirePermission("admin.roles"), async (req, res) => {
  try {
    const { name, description, color, permissions } = req.body;
    if (!name) return res.status(400).json({ error: "Nom requis." });
    res.status(201).json(await prisma.role.create({ data: { name, description, color: color ?? "cyan", permissions: permissions ?? [] } }));
  } catch (err) { res.status(500).json({ error: "Erreur serveur." }); }
});
router.put("/:id", requirePermission("admin.roles"), async (req, res) => {
  try {
    const { name, description, color, permissions } = req.body;
    res.json(await prisma.role.update({ where: { id: Number(req.params.id) }, data: { name, description, color, permissions } }));
  } catch (err) { res.status(500).json({ error: "Erreur serveur." }); }
});
router.delete("/:id", requirePermission("admin.roles"), async (req, res) => {
  try {
    await prisma.role.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Rôle supprimé." });
  } catch (err) { res.status(500).json({ error: "Erreur serveur." }); }
});
module.exports = router;
`, 'utf8');

// src/routes/decisions.js
fs.writeFileSync('src/routes/decisions.js', `const router = require("express").Router();
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
`, 'utf8');

// src/routes/visitTypes.js
fs.writeFileSync('src/routes/visitTypes.js', `const router = require("express").Router();
const prisma = require("../lib/prisma");
const { requireAuth, requirePermission } = require("../middleware/auth");
router.use(requireAuth);
router.get("/", async (req, res) => {
  try { res.json(await prisma.visitType.findMany({ orderBy: { name: "asc" } })); }
  catch (err) { res.status(500).json({ error: "Erreur serveur." }); }
});
router.post("/", requirePermission("settings.visitTypes"), async (req, res) => {
  try {
    const { name, description, periodicity, mandatory, examConfig, editRules } = req.body;
    if (!name) return res.status(400).json({ error: "Nom requis." });
    res.status(201).json(await prisma.visitType.create({ data: { name, description, periodicity: periodicity ?? "Annuelle", mandatory: mandatory ?? false, examConfig: examConfig ?? {}, editRules: editRules ?? {} } }));
  } catch (err) { res.status(500).json({ error: "Erreur serveur." }); }
});
router.put("/:id", requirePermission("settings.visitTypes"), async (req, res) => {
  try {
    const { name, description, periodicity, mandatory, examConfig, editRules } = req.body;
    res.json(await prisma.visitType.update({ where: { id: Number(req.params.id) }, data: { name, description, periodicity, mandatory, examConfig, editRules } }));
  } catch (err) { res.status(500).json({ error: "Erreur serveur." }); }
});
router.delete("/:id", requirePermission("settings.visitTypes"), async (req, res) => {
  try {
    await prisma.visitType.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Type supprimé." });
  } catch (err) { res.status(500).json({ error: "Erreur serveur." }); }
});
module.exports = router;
`, 'utf8');

// src/routes/users.js
fs.writeFileSync('src/routes/users.js', `const router = require("express").Router();
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { requireAuth, requirePermission, requireSuperAdmin } = require("../middleware/auth");
router.use(requireAuth);
router.get("/", requirePermission("admin.users"), async (req, res) => {
  try {
    const users = await prisma.user.findMany({ include: { role: { select: { id: true, name: true, color: true } } }, orderBy: { name: "asc" } });
    res.json(users.map(({ passwordHash, ...u }) => u));
  } catch (err) { res.status(500).json({ error: "Erreur serveur." }); }
});
router.post("/", requirePermission("admin.users"), async (req, res) => {
  try {
    const { name, matricule, email, roleId, active, isSuperAdmin, password } = req.body;
    if (!name || !matricule || !password) return res.status(400).json({ error: "Champs requis manquants." });
    const existing = await prisma.user.findUnique({ where: { matricule } });
    if (existing) return res.status(409).json({ error: "Identifiant déjà utilisé." });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { name, matricule, email, roleId: Number(roleId), active: active ?? true, isSuperAdmin: isSuperAdmin ?? false, passwordHash }, include: { role: true } });
    const { passwordHash: _, ...safe } = user;
    res.status(201).json(safe);
  } catch (err) { res.status(500).json({ error: "Erreur serveur." }); }
});
router.put("/:id", requirePermission("admin.users"), async (req, res) => {
  try {
    const { name, matricule, email, roleId, active, password } = req.body;
    const data = { name, matricule, email, roleId: roleId ? Number(roleId) : undefined, active };
    if (password) data.passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.update({ where: { id: Number(req.params.id) }, data, include: { role: true } });
    const { passwordHash, ...safe } = user;
    res.json(safe);
  } catch (err) { res.status(500).json({ error: "Erreur serveur." }); }
});
router.patch("/:id/toggle-active", requirePermission("admin.users"), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) } });
    if (user?.isSuperAdmin) return res.status(403).json({ error: "Impossible de désactiver l'administrateur suprême." });
    const updated = await prisma.user.update({ where: { id: Number(req.params.id) }, data: { active: !user.active } });
    const { passwordHash, ...safe } = updated;
    res.json(safe);
  } catch (err) { res.status(500).json({ error: "Erreur serveur." }); }
});
router.patch("/:id/signature", requireSuperAdmin, async (req, res) => {
  try {
    const { signature } = req.body;
    const user = await prisma.user.update({ where: { id: Number(req.params.id) }, data: { signature } });
    res.json({ id: user.id, signature: user.signature });
  } catch (err) { res.status(500).json({ error: "Erreur serveur." }); }
});
router.delete("/:id", requirePermission("admin.users"), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) } });
    if (user?.isSuperAdmin) return res.status(403).json({ error: "Impossible de supprimer l'administrateur suprême." });
    await prisma.user.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Utilisateur supprimé." });
  } catch (err) { res.status(500).json({ error: "Erreur serveur." }); }
});
module.exports = router;
`, 'utf8');

// src/routes/reports.js
fs.writeFileSync('src/routes/reports.js', `const router = require("express").Router();
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
`, 'utf8');

// src/routes/uploads.js
fs.writeFileSync('src/routes/uploads.js', `const router = require("express").Router();
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
`, 'utf8');

// src/routes/visits.js
fs.writeFileSync('src/routes/visits.js', `const router = require("express").Router();
const prisma = require("../lib/prisma");
const { requireAuth, requirePermission } = require("../middleware/auth");
router.use(requireAuth);

async function generateRef() {
  const year = new Date().getFullYear();
  const prefix = "VIS-" + year + "-";
  const last = await prisma.visit.findFirst({ where: { ref: { startsWith: prefix } }, orderBy: { ref: "desc" }, select: { ref: true } });
  const nextNum = last ? parseInt(last.ref.replace(prefix, ""), 10) + 1 : 1;
  return prefix + String(nextNum).padStart(5, "0");
}

const INCLUDE = { clinicalExam: true, physicalExam: true, functionalEval: true, complaints: true, diagnoses: true, treatments: true, worker: { select: { name: true, matricule: true, department: true, position: true, company: true, residence: true } } };

function fmt(v) {
  return { id: v.id, ref: v.ref, workerId: v.workerId, date: v.date, type: v.type, doctor: v.doctor ?? "", aptitudeDoctor: v.aptitudeDoctor ?? "", aptitude: v.aptitude, nextVisit: v.nextVisit ?? "", note: v.note ?? "", restrictions: v.restrictions ?? "", biology: v.biology ?? "", complementaryExams: v.complementaryExams ?? "", recommendations: v.recommendations ?? "", closed: v.closed, clinicalExam: v.clinicalExam ?? { weight:"",height:"",bmi:"",temperature:"",bloodPressure:"",pulse:"",respiratoryRate:"" }, physicalExam: v.physicalExam ?? { orl:"",digestive:"",cardiology:"",neurology:"",pulmonary:"",uroGenital:"",locomotor:"",others:"" }, functionalEvaluation: v.functionalEval ? { ecg: v.functionalEval.ecg ?? "", spirometry: v.functionalEval.spirometry ?? "", audiogram: v.functionalEval.audiogram ?? "", hearingProtectionUsed: v.functionalEval.hearingProtectionUsed ?? "Non", hearingProtectionType: v.functionalEval.hearingProtectionType ?? "", visualTest: v.functionalEval.visualTest ?? {}, colorVisionOD: v.functionalEval.colorVisionOD ?? "", colorVisionOG: v.functionalEval.colorVisionOG ?? "", imaging: v.functionalEval.imaging ?? [] } : { ecg:"",spirometry:"",audiogram:"",hearingProtectionUsed:"Non",hearingProtectionType:"",visualTest:{},colorVisionOD:"",colorVisionOG:"",imaging:[] }, complaints: v.complaints ?? [], diagnoses: v.diagnoses ?? [], treatment: v.treatments ?? [], worker: v.worker ?? null };
}

router.get("/", requirePermission("visits.view"), async (req, res) => {
  try {
    const { workerId, search } = req.query;
    const where = {};
    if (workerId) where.workerId = Number(workerId);
    if (search) where.OR = [{ ref: { contains: search, mode: "insensitive" } }, { doctor: { contains: search, mode: "insensitive" } }, { type: { contains: search, mode: "insensitive" } }];
    const visits = await prisma.visit.findMany({ where, include: INCLUDE, orderBy: { id: "desc" } });
    res.json(visits.map(fmt));
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur." }); }
});

router.get("/:id", requirePermission("visits.view"), async (req, res) => {
  try {
    const visit = await prisma.visit.findUnique({ where: { id: Number(req.params.id) }, include: INCLUDE });
    if (!visit) return res.status(404).json({ error: "Visite introuvable." });
    res.json(fmt(visit));
  } catch (err) { res.status(500).json({ error: "Erreur serveur." }); }
});

router.post("/", requirePermission("visits.create"), async (req, res) => {
  try {
    const body = req.body;
    if (!body.workerId) return res.status(400).json({ error: "workerId requis." });
    const ref = await generateRef();
    const visit = await prisma.visit.create({
      data: { ref, workerId: Number(body.workerId), date: body.date ?? "", type: body.type ?? "Visite périodique", doctor: body.doctor ?? "", aptitudeDoctor: body.aptitudeDoctor ?? "", aptitude: body.aptitude ?? "Apte", nextVisit: body.nextVisit ?? "Non définie", note: body.note ?? "", restrictions: body.restrictions ?? "Aucune", biology: body.biology ?? "", complementaryExams: body.complementaryExams ?? "", recommendations: body.recommendations ?? "", closed: false,
        clinicalExam: body.clinicalExam ? { create: body.clinicalExam } : undefined,
        physicalExam: body.physicalExam ? { create: body.physicalExam } : undefined,
        complaints: body.complaints?.length ? { create: body.complaints } : undefined,
        diagnoses: body.diagnoses?.length ? { create: body.diagnoses } : undefined,
        treatments: body.treatments?.length ? { create: body.treatments } : undefined,
      },
      include: INCLUDE,
    });
    res.status(201).json(fmt(visit));
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur." }); }
});

router.put("/:id", requirePermission("visits.edit"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.body;
    const existing = await prisma.visit.findUnique({ where: { id }, select: { closed: true } });
    if (!existing) return res.status(404).json({ error: "Visite introuvable." });
    if (existing.closed) return res.status(400).json({ error: "Impossible de modifier une visite clôturée." });
    await prisma.visit.update({ where: { id }, data: { date: body.date, type: body.type, doctor: body.doctor, aptitudeDoctor: body.aptitudeDoctor, aptitude: body.aptitude, nextVisit: body.nextVisit, note: body.note, restrictions: body.restrictions, biology: body.biology, complementaryExams: body.complementaryExams, recommendations: body.recommendations } });
    if (body.clinicalExam) await prisma.clinicalExam.upsert({ where: { visitId: id }, update: body.clinicalExam, create: { visitId: id, ...body.clinicalExam } });
    if (body.physicalExam) await prisma.physicalExam.upsert({ where: { visitId: id }, update: body.physicalExam, create: { visitId: id, ...body.physicalExam } });
    if (body.complaints !== undefined) { await prisma.complaint.deleteMany({ where: { visitId: id } }); if (body.complaints.length) await prisma.complaint.createMany({ data: body.complaints.map((c) => ({ ...c, visitId: id })) }); }
    if (body.diagnoses !== undefined) { await prisma.diagnosis.deleteMany({ where: { visitId: id } }); if (body.diagnoses.length) await prisma.diagnosis.createMany({ data: body.diagnoses.map((d) => ({ ...d, visitId: id })) }); }
    if (body.treatments !== undefined) { await prisma.treatment.deleteMany({ where: { visitId: id } }); if (body.treatments.length) await prisma.treatment.createMany({ data: body.treatments.map((t) => ({ ...t, visitId: id })) }); }
    const updated = await prisma.visit.findUnique({ where: { id }, include: INCLUDE });
    res.json(fmt(updated));
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur." }); }
});

router.patch("/:id/close", requirePermission("visits.close"), async (req, res) => {
  try {
    const visit = await prisma.visit.update({ where: { id: Number(req.params.id) }, data: { closed: true }, include: INCLUDE });
    res.json(fmt(visit));
  } catch (err) { res.status(500).json({ error: "Erreur serveur." }); }
});

module.exports = router;
`, 'utf8');

// src/index.js
fs.writeFileSync('src/index.js', `require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors({ origin: ["http://localhost:3000", "http://localhost:5173"], credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth",        require("./routes/auth"));
app.use("/api/users",       require("./routes/users"));
app.use("/api/roles",       require("./routes/roles"));
app.use("/api/workers",     require("./routes/workers"));
app.use("/api/visits",      require("./routes/visits"));
app.use("/api/visit-types", require("./routes/visitTypes"));
app.use("/api/decisions",   require("./routes/decisions"));
app.use("/api/reports",     require("./routes/reports"));
app.use("/api/uploads",     require("./routes/uploads"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "MédWork CBG", version: "1.0.0", timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error("Erreur :", err.message);
  res.status(err.status || 500).json({ error: err.message || "Erreur interne." });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log("Serveur MédWork CBG démarré sur http://localhost:" + PORT);
  console.log("API disponible sur http://localhost:" + PORT + "/api");
});
`, 'utf8');

console.log('Tous les fichiers créés avec succès !');