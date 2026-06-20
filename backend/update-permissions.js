const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Médecin du travail
  const med = await prisma.role.findFirst({ where: { name: "Médecin du travail" } });
  if (med && !med.permissions.includes("reports.view")) {
    await prisma.role.update({
      where: { id: med.id },
      data: { permissions: [...med.permissions, "reports.view"] }
    });
    console.log("✅ Médecin du travail mis à jour");
  }

  // Médecin généraliste
  const medG = await prisma.role.findFirst({ where: { name: "Médecin généraliste" } });
  if (medG && !medG.permissions.includes("reports.view")) {
    await prisma.role.update({
      where: { id: medG.id },
      data: { permissions: [...medG.permissions, "reports.view"] }
    });
    console.log("✅ Médecin généraliste mis à jour");
  }

  console.log("Fait !");
}

main().catch(console.error).finally(() => prisma.$disconnect());