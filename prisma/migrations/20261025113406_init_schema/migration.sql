-- CreateTable
CREATE TABLE "InvestorUser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL DEFAULT 'demo_hash',
    "firmName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Managing Partner',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestorUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestorThesis" (
    "id" TEXT NOT NULL,
    "firmName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "targetSectors" TEXT[],
    "minMonthlyRev" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxValuation" DOUBLE PRECISION NOT NULL DEFAULT 10000000,
    "preferredStage" TEXT NOT NULL DEFAULT 'Seed',
    "customCriteria" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestorThesis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pitch" (
    "id" TEXT NOT NULL,
    "startupName" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "founderNames" TEXT NOT NULL,
    "founderEmail" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'Seed',
    "reportedMrr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "askAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "valuation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "extractedText" TEXT,
    "matchScore" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REVIEW',
    "summary" TEXT NOT NULL,
    "pros" TEXT[],
    "cons" TEXT[],
    "redFlags" TEXT[],
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "thesisId" TEXT NOT NULL,

    CONSTRAINT "Pitch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvestorUser_email_key" ON "InvestorUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "InvestorUser_slug_key" ON "InvestorUser"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "InvestorThesis_slug_key" ON "InvestorThesis"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "InvestorThesis_investorId_key" ON "InvestorThesis"("investorId");

-- AddForeignKey
ALTER TABLE "InvestorThesis" ADD CONSTRAINT "InvestorThesis_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "InvestorUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pitch" ADD CONSTRAINT "Pitch_thesisId_fkey" FOREIGN KEY ("thesisId") REFERENCES "InvestorThesis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
