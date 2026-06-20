const fs = require('fs');
const schema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Role {
  id          Int      @id @default(autoincrement())
  name        String   @unique
  description String?
  color       String   @default("cyan")
  permissions String[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  users       User[]
}

model User {
  id           Int      @id @default(autoincrement())
  name         String
  matricule    String   @unique
  email        String?
  passwordHash String
  roleId       Int
  active       Boolean  @default(true)
  isSuperAdmin Boolean  @default(false)
  signature    String?
  photo        String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  role         Role     @relation(fields: [roleId], references: [id])
}

model Worker {
  id             Int      @id @default(autoincrement())
  name           String
  matricule      String   @unique
  department     String?
  position       String?
  company        String?
  residence      String?
  contractStatus String   @default("actif")
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  visits         Visit[]
}

model VisitType {
  id          Int      @id @default(autoincrement())
  name        String   @unique
  description String?
  periodicity String   @default("Annuelle")
  mandatory   Boolean  @default(false)
  examConfig  Json     @default("{}")
  editRules   Json     @default("{}")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Decision {
  id                  Int      @id @default(autoincrement())
  label               String   @unique
  color               String   @default("green")
  description         String?
  requiresRestriction Boolean  @default(false)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

model Visit {
  id                 Int             @id @default(autoincrement())
  ref                String          @unique
  workerId           Int
  date               String
  type               String
  doctor             String?
  aptitudeDoctor     String?
  aptitude           String          @default("Apte")
  nextVisit          String?
  note               String?
  restrictions       String?
  biology            String?
  complementaryExams String?
  recommendations    String?
  closed             Boolean         @default(false)
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt
  worker             Worker          @relation(fields: [workerId], references: [id], onDelete: Cascade)
  clinicalExam       ClinicalExam?
  physicalExam       PhysicalExam?
  functionalEval     FunctionalEval?
  complaints         Complaint[]
  diagnoses          Diagnosis[]
  treatments         Treatment[]
}

model ClinicalExam {
  id              Int     @id @default(autoincrement())
  visitId         Int     @unique
  weight          String?
  height          String?
  bmi             String?
  temperature     String?
  bloodPressure   String?
  pulse           String?
  respiratoryRate String?
  visit           Visit   @relation(fields: [visitId], references: [id], onDelete: Cascade)
}

model PhysicalExam {
  id         Int     @id @default(autoincrement())
  visitId    Int     @unique
  orl        String?
  digestive  String?
  cardiology String?
  neurology  String?
  pulmonary  String?
  uroGenital String?
  locomotor  String?
  others     String?
  visit      Visit   @relation(fields: [visitId], references: [id], onDelete: Cascade)
}

model FunctionalEval {
  id                    Int     @id @default(autoincrement())
  visitId               Int     @unique
  ecg                   String?
  spirometry            String?
  audiogram             String?
  hearingProtectionUsed String?
  hearingProtectionType String?
  colorVisionOD         String?
  colorVisionOG         String?
  visualTest            Json?
  imaging               Json?
  visit                 Visit   @relation(fields: [visitId], references: [id], onDelete: Cascade)
}

model Complaint {
  id       Int     @id @default(autoincrement())
  visitId  Int
  label    String
  duration String?
  visit    Visit   @relation(fields: [visitId], references: [id], onDelete: Cascade)
}

model Diagnosis {
  id        Int     @id @default(autoincrement())
  visitId   Int
  label     String
  isHistory Boolean @default(false)
  visit     Visit   @relation(fields: [visitId], references: [id], onDelete: Cascade)
}

model Treatment {
  id       Int     @id @default(autoincrement())
  visitId  Int
  molecule String
  quantity String?
  posology String?
  visit    Visit   @relation(fields: [visitId], references: [id], onDelete: Cascade)
}
`;

fs.writeFileSync('prisma/schema.prisma', schema, 'utf8');
console.log('schema.prisma créé avec succès !');