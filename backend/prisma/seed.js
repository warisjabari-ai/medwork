// prisma/seed.js
// Données initiales pour tester l'application

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Initialisation des données...");

  // ─── Rôles ─────────────────────────────────────────────────────────────────
  // Rôle Super Admin — totalement indépendant des rôles métiers
  const roleSuperAdmin = await prisma.role.upsert({
    where: { name: "Super Admin" },
    update: { permissions: ["*"] },
    create: {
      name: "Super Admin",
      description: "Administration globale du système. Accès total et indépendant.",
      color: "navy",
      permissions: ["*"],
    },
  });

  const roleMedecin = await prisma.role.upsert({
    where: { name: "Médecin du travail" },
    update: {
      permissions: [
        "workers.view","workers.create","workers.edit","workers.delete",
        "visits.view","visits.create","visits.edit","visits.close","visits.delete","visits.print",
        "visits.edit.info","visits.edit.doctor","visits.edit.aptitudeDoctor",
        "visits.edit.clinicalExam","visits.edit.complaints",
        "visits.edit.physicalExam","visits.edit.biology","visits.edit.functional",
        "visits.edit.diagnoses","visits.edit.treatment","visits.edit.complementary",
        "visits.edit.recommendations","visits.edit.aptitude",
        "medical.antecedents","medical.vaccinations","medical.expositions","medical.lastvisits",
        "settings.visitTypes","settings.decisions","settings.examTypes",
        "admin.roles","admin.users","reports.view",
      ],
    },
    create: {
      name: "Médecin du travail",
      description: "Accès complet à toutes les fonctionnalités médicales.",
      color: "navy",
      permissions: [
        "workers.view","workers.create","workers.edit","workers.delete",
        "visits.view","visits.create","visits.edit","visits.close","visits.delete","visits.print",
        "visits.edit.info","visits.edit.doctor","visits.edit.aptitudeDoctor",
        "visits.edit.clinicalExam","visits.edit.complaints",
        "visits.edit.physicalExam","visits.edit.biology","visits.edit.functional",
        "visits.edit.diagnoses","visits.edit.treatment","visits.edit.complementary",
        "visits.edit.recommendations","visits.edit.aptitude",
        "medical.antecedents","medical.vaccinations","medical.expositions","medical.lastvisits",
        "settings.visitTypes","settings.decisions","settings.examTypes",
        "admin.roles","admin.users","reports.view",
      ],
    },
  });

  const roleInfirmier = await prisma.role.upsert({
    where: { name: "Infirmier(ère)" },
    update: {
      permissions: [
        "workers.view","visits.view","visits.create","visits.edit","visits.print",
        "visits.edit.clinicalExam","visits.edit.complaints",
        "visits.edit.physicalExam","visits.edit.biology","visits.edit.functional",
        "medical.vaccinations","medical.expositions","medical.lastvisits",
      ],
    },
    create: {
      name: "Infirmier(ère)",
      description: "Saisie des visites et consultation des dossiers.",
      color: "cyan",
      permissions: [
        "workers.view","visits.view","visits.create","visits.edit","visits.print",
        "visits.edit.clinicalExam","visits.edit.complaints",
        "visits.edit.physicalExam","visits.edit.biology","visits.edit.functional",
        "medical.vaccinations","medical.expositions","medical.lastvisits",
      ],
    },
  });

  const roleSecretaire = await prisma.role.upsert({
    where: { name: "Secrétaire" },
    update: {
      permissions: ["workers.view","workers.create","workers.edit","visits.view","reports.view","medical.lastvisits"],
    },
    create: {
      name: "Secrétaire",
      description: "Gestion administrative des travailleurs.",
      color: "green",
      permissions: ["workers.view","workers.create","workers.edit","visits.view","reports.view","medical.lastvisits"],
    },
  });

  const roleLabo = await prisma.role.upsert({
    where: { name: "Laboratoire" },
    update: {
      permissions: ["workers.view","visits.view","visits.edit.biology","settings.examTypes"],
    },
    create: {
      name: "Laboratoire",
      description: "Saisie des résultats d'examens biologiques.",
      color: "purple",
      permissions: ["workers.view","visits.view","visits.edit.biology","settings.examTypes"],
    },
  });

  const roleMedecinG = await prisma.role.upsert({
    where: { name: "Médecin généraliste" },
    update: {
      permissions: [
        "workers.view","visits.view","visits.create","visits.edit","visits.print",
        "visits.edit.info","visits.edit.clinicalExam","visits.edit.complaints",
        "visits.edit.physicalExam","visits.edit.biology","visits.edit.diagnoses",
        "visits.edit.treatment","visits.edit.recommendations","visits.edit.aptitude",
        "medical.antecedents","medical.vaccinations","medical.expositions","medical.lastvisits",
      ],
    },
    create: {
      name: "Médecin généraliste",
      description: "Consultation et saisie des visites médicales.",
      color: "purple",
      permissions: [
        "workers.view","visits.view","visits.create","visits.edit","visits.print",
        "visits.edit.info","visits.edit.clinicalExam","visits.edit.complaints",
        "visits.edit.physicalExam","visits.edit.biology","visits.edit.diagnoses",
        "visits.edit.treatment","visits.edit.recommendations","visits.edit.aptitude",
        "medical.antecedents","medical.vaccinations","medical.expositions","medical.lastvisits",
      ],
    },
  });

  console.log("✅ Rôles créés/mis à jour");

  // ─── Utilisateurs ───────────────────────────────────────────────────────────
  const hash = async (p) => bcrypt.hash(p, 10);

  await prisma.user.upsert({
    where: { matricule: "admin" },
    update: {},
    create: {
      name: "Administrateur", matricule: "admin", email: "admin@cbg.com",
      passwordHash: await hash("Admin@2026!"), roleId: roleSuperAdmin.id,
      isSuperAdmin: true, active: true,
    },
  });

  await prisma.user.upsert({
    where: { matricule: "icamara" },
    update: {},
    create: {
      name: "Dr Ibrahima Camara", matricule: "icamara", email: "i.camara@cbg.com",
      passwordHash: await hash("Medecin@2026"), roleId: roleMedecin.id, active: true,
    },
  });

  await prisma.user.upsert({
    where: { matricule: "acamara" },
    update: {},
    create: {
      name: "Dr Alseny Camara", matricule: "acamara", email: "a.camara@cbg.com",
      passwordHash: await hash("Medecin@2026"), roleId: roleMedecinG.id, active: true,
    },
  });

  await prisma.user.upsert({
    where: { matricule: "aissatou" },
    update: {},
    create: {
      name: "Infirmière Aïssatou", matricule: "aissatou", email: "a.barry@cbg.com",
      passwordHash: await hash("Infirmier@2026"), roleId: roleInfirmier.id, active: true,
    },
  });

  await prisma.user.upsert({
    where: { matricule: "fatou" },
    update: {},
    create: {
      name: "Secrétaire Fatou", matricule: "fatou", email: "f.camara@cbg.com",
      passwordHash: await hash("Secretaire@2026"), roleId: roleSecretaire.id, active: true,
    },
  });

  await prisma.user.upsert({
    where: { matricule: "labo" },
    update: {},
    create: {
      name: "Laborantin CBG", matricule: "labo", email: "labo@cbg.com",
      passwordHash: await hash("Labo@2026!"), roleId: roleLabo.id, active: true,
    },
  });

  console.log("✅ Utilisateurs créés/mis à jour");

  // ─── Décisions médicales ────────────────────────────────────────────────────
  const decisions = [
    { label: "Apte",                  color: "green",  requiresRestriction: false, description: "Apte à occuper son poste sans restriction." },
    { label: "Apte avec restriction", color: "orange", requiresRestriction: true,  description: "Apte sous réserve d'aménagements." },
    { label: "A surveiller",          color: "orange", requiresRestriction: false, description: "Surveillance médicale renforcée requise." },
    { label: "Inapte temporaire",     color: "red",    requiresRestriction: false, description: "Inaptitude temporaire — réexamen nécessaire." },
    { label: "Inapte",                color: "red",    requiresRestriction: false, description: "Déclaré inapte à son poste." },
  ];

  for (const d of decisions) {
    await prisma.decision.upsert({ where: { label: d.label }, update: {}, create: d });
  }
  console.log("✅ Décisions créées");

  // ─── Types de visite ────────────────────────────────────────────────────────
  const visitTypes = [
    { name: "Visite périodique",      periodicity: "Annuelle",     mandatory: true  },
    { name: "Visite d'embauche",      periodicity: "Unique",       mandatory: true  },
    { name: "Visite de reprise",      periodicity: "À la demande", mandatory: true  },
    { name: "Consultation spontanée", periodicity: "À la demande", mandatory: false },
    { name: "Visite de pré-reprise",  periodicity: "À la demande", mandatory: false },
  ];

  for (const vt of visitTypes) {
    await prisma.visitType.upsert({
      where: { name: vt.name },
      update: {},
      create: { ...vt, examConfig: {}, editRules: {}, examTypeIds: [] },
    });
  }
  console.log("✅ Types de visite créés");

  // ─── Travailleur exemple ────────────────────────────────────────────────────
  const worker = await prisma.worker.upsert({
    where: { matricule: "CBG-001" },
    update: {},
    create: {
      name: "Mamadou Diallo", matricule: "CBG-001",
      department: "D0012", position: "Opérateur minier",
      company: "CBG", residence: "Cité des Agents", contractStatus: "actif",
    },
  });

  const visitExists = await prisma.visit.findFirst({ where: { workerId: worker.id } });
  if (!visitExists) {
    await prisma.visit.create({
      data: {
        ref: "VIS-2026-00001", workerId: worker.id,
        date: "14/01/2026", type: "Visite périodique",
        doctor: "Dr Ibrahima Camara", aptitudeDoctor: "",
        aptitude: "Apte", nextVisit: "Jan. 2027",
        note: "Aptitude renouvelée. Surveillance simple recommandée.",
        restrictions: "Aucune", closed: false,
        clinicalExam: { create: { weight: "72", height: "1.74", bmi: "23.78", temperature: "36.8 °C", bloodPressure: "120/80", pulse: "78", respiratoryRate: "18" } },
        physicalExam: { create: { orl: "RAS", digestive: "RAS", cardiology: "Bruits réguliers", neurology: "RAS", pulmonary: "MR libre", uroGenital: "RAS", locomotor: "RAS", others: "—" } },
        treatments: { create: [{ molecule: "Paracétamol 1g", quantity: "3 boîtes", posology: "1 cp matin, midi et soir" }] },
      },
    });
  }

  console.log("✅ Données exemples créées");
  console.log("\n🎉 Base de données initialisée avec succès !\n");
  console.log("Identifiants de test :");
  console.log("  admin    / Admin@2026!       → Administrateur suprême");
  console.log("  icamara  / Medecin@2026      → Dr Ibrahima Camara (Médecin du travail)");
  console.log("  acamara  / Medecin@2026      → Dr Alseny Camara (Médecin généraliste)");
  console.log("  aissatou / Infirmier@2026    → Infirmière Aïssatou");
  console.log("  fatou    / Secretaire@2026   → Secrétaire Fatou");
  console.log("  labo     / Labo@2026!        → Laborantin CBG\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());