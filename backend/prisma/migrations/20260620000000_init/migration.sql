-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT 'cyan',
    "permissions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "matricule" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "roleId" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "signature" TEXT,
    "photo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Worker" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "matricule" TEXT NOT NULL,
    "department" TEXT,
    "position" TEXT,
    "company" TEXT,
    "residence" TEXT,
    "contractStatus" TEXT NOT NULL DEFAULT 'actif',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Worker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "periodicity" TEXT NOT NULL DEFAULT 'Annuelle',
    "mandatory" BOOLEAN NOT NULL DEFAULT false,
    "examConfig" JSONB NOT NULL DEFAULT '{}',
    "editRules" JSONB NOT NULL DEFAULT '{}',
    "examTypeIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisitType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Decision" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'green',
    "description" TEXT,
    "requiresRestriction" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visit" (
    "id" SERIAL NOT NULL,
    "ref" TEXT NOT NULL,
    "workerId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "doctor" TEXT,
    "aptitudeDoctor" TEXT,
    "aptitude" TEXT NOT NULL DEFAULT 'Apte',
    "nextVisit" TEXT,
    "note" TEXT,
    "restrictions" TEXT,
    "biology" TEXT,
    "complementaryExams" TEXT,
    "recommendations" TEXT,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalExam" (
    "id" SERIAL NOT NULL,
    "visitId" INTEGER NOT NULL,
    "weight" TEXT,
    "height" TEXT,
    "bmi" TEXT,
    "temperature" TEXT,
    "bloodPressure" TEXT,
    "pulse" TEXT,
    "respiratoryRate" TEXT,

    CONSTRAINT "ClinicalExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhysicalExam" (
    "id" SERIAL NOT NULL,
    "visitId" INTEGER NOT NULL,
    "orl" TEXT,
    "digestive" TEXT,
    "cardiology" TEXT,
    "neurology" TEXT,
    "pulmonary" TEXT,
    "uroGenital" TEXT,
    "locomotor" TEXT,
    "others" TEXT,

    CONSTRAINT "PhysicalExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FunctionalEval" (
    "id" SERIAL NOT NULL,
    "visitId" INTEGER NOT NULL,
    "ecg" TEXT,
    "spirometry" TEXT,
    "audiogram" TEXT,
    "hearingProtectionUsed" TEXT,
    "hearingProtectionType" TEXT,
    "colorVisionOD" TEXT,
    "colorVisionOG" TEXT,
    "visualTest" JSONB,
    "imaging" JSONB,

    CONSTRAINT "FunctionalEval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" SERIAL NOT NULL,
    "visitId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "duration" TEXT,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diagnosis" (
    "id" SERIAL NOT NULL,
    "visitId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "isHistory" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Diagnosis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Treatment" (
    "id" SERIAL NOT NULL,
    "visitId" INTEGER NOT NULL,
    "molecule" TEXT NOT NULL,
    "quantity" TEXT,
    "posology" TEXT,

    CONSTRAINT "Treatment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT DEFAULT '',
    "valueType" TEXT NOT NULL DEFAULT 'numeric',
    "normalMin" DOUBLE PRECISION,
    "normalMax" DOUBLE PRECISION,
    "referenceRanges" JSONB DEFAULT '[]',
    "normalValues" JSONB,
    "possibleValues" JSONB,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamResult" (
    "id" SERIAL NOT NULL,
    "visitId" INTEGER NOT NULL,
    "examTypeId" INTEGER NOT NULL,
    "value" TEXT,
    "isAbnormal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerAntecedent" (
    "id" SERIAL NOT NULL,
    "workerId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Personnel',
    "suivi" TEXT NOT NULL DEFAULT 'Suivi',
    "visitRef" TEXT,
    "visitDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerAntecedent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerVaccination" (
    "id" SERIAL NOT NULL,
    "workerId" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "dateAdmin" TEXT,
    "dateExp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerVaccination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerExposition" (
    "id" SERIAL NOT NULL,
    "workerId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "niveau" TEXT NOT NULL DEFAULT 'Modéré',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerExposition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_matricule_key" ON "User"("matricule");

-- CreateIndex
CREATE UNIQUE INDEX "Worker_matricule_key" ON "Worker"("matricule");

-- CreateIndex
CREATE UNIQUE INDEX "VisitType_name_key" ON "VisitType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Decision_label_key" ON "Decision"("label");

-- CreateIndex
CREATE UNIQUE INDEX "Visit_ref_key" ON "Visit"("ref");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalExam_visitId_key" ON "ClinicalExam"("visitId");

-- CreateIndex
CREATE UNIQUE INDEX "PhysicalExam_visitId_key" ON "PhysicalExam"("visitId");

-- CreateIndex
CREATE UNIQUE INDEX "FunctionalEval_visitId_key" ON "FunctionalEval"("visitId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamType_name_key" ON "ExamType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ExamResult_visitId_examTypeId_key" ON "ExamResult"("visitId", "examTypeId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalExam" ADD CONSTRAINT "ClinicalExam_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalExam" ADD CONSTRAINT "PhysicalExam_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunctionalEval" ADD CONSTRAINT "FunctionalEval_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Treatment" ADD CONSTRAINT "Treatment_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResult" ADD CONSTRAINT "ExamResult_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResult" ADD CONSTRAINT "ExamResult_examTypeId_fkey" FOREIGN KEY ("examTypeId") REFERENCES "ExamType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerAntecedent" ADD CONSTRAINT "WorkerAntecedent_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerVaccination" ADD CONSTRAINT "WorkerVaccination_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerExposition" ADD CONSTRAINT "WorkerExposition_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

