-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "secteur" TEXT,
    "toleranceRisque" TEXT,
    "onboardingFait" BOOLEAN NOT NULL DEFAULT false,
    "revenu" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenuSource" TEXT NOT NULL DEFAULT 'compte',
    "points" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenu_historique" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "label" TEXT,

    CONSTRAINT "revenu_historique_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_depenses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "raison" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "supprime" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "budget_depenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imprevus" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supprime" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "imprevus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "depenses_journalieres" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supprime" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "depenses_journalieres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "echeances" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "recurrence" TEXT NOT NULL,
    "icon" TEXT,
    "bg" TEXT,
    "color" TEXT,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidDate" TIMESTAMP(3),

    CONSTRAINT "echeances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "cat" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "objectives" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "target" DOUBLE PRECISION NOT NULL,
    "saved" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "date" TIMESTAMP(3) NOT NULL,
    "color" TEXT,

    CONSTRAINT "objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "icon" TEXT,
    "iconBg" TEXT,
    "iconColor" TEXT,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unread" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comptes_lies" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "banque" TEXT,
    "solde" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "comptes_lies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tontines" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "membersCount" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "desc" TEXT,
    "walletBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'collecting',
    "currentTurn" INTEGER NOT NULL DEFAULT 1,
    "adminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tontines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tontine_participants" (
    "id" TEXT NOT NULL,
    "tontineId" TEXT NOT NULL,
    "userId" TEXT,
    "memberName" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,

    CONSTRAINT "tontine_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tontine_payments" (
    "id" TEXT NOT NULL,
    "tontineId" TEXT NOT NULL,
    "memberName" TEXT NOT NULL,
    "cycleNum" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "method" TEXT,
    "preuveUrl" TEXT,
    "preuveNom" TEXT,
    "preuveDate" TIMESTAMP(3),

    CONSTRAINT "tontine_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tontine_cycles" (
    "id" TEXT NOT NULL,
    "tontineId" TEXT NOT NULL,
    "cycleNum" INTEGER NOT NULL,
    "beneficiary" TEXT NOT NULL,
    "totalCollected" DOUBLE PRECISION NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tontine_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communaute_posts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "texte" TEXT NOT NULL,
    "ville" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communaute_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "defis_actifs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "desc" TEXT,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "points" INTEGER NOT NULL,
    "emoji" TEXT,
    "deadline" TIMESTAMP(3),
    "statut" TEXT NOT NULL DEFAULT 'actif',

    CONSTRAINT "defis_actifs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "emoji" TEXT,
    "desc" TEXT,
    "obtenu" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cours_progression" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coursId" INTEGER NOT NULL,
    "progression" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "cours_progression_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tontine_participants_tontineId_ordre_key" ON "tontine_participants"("tontineId", "ordre");

-- CreateIndex
CREATE UNIQUE INDEX "tontine_payments_tontineId_memberName_cycleNum_key" ON "tontine_payments"("tontineId", "memberName", "cycleNum");

-- CreateIndex
CREATE UNIQUE INDEX "cours_progression_userId_coursId_key" ON "cours_progression"("userId", "coursId");

-- AddForeignKey
ALTER TABLE "revenu_historique" ADD CONSTRAINT "revenu_historique_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_depenses" ADD CONSTRAINT "budget_depenses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imprevus" ADD CONSTRAINT "imprevus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "depenses_journalieres" ADD CONSTRAINT "depenses_journalieres_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "echeances" ADD CONSTRAINT "echeances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objectives" ADD CONSTRAINT "objectives_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comptes_lies" ADD CONSTRAINT "comptes_lies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tontines" ADD CONSTRAINT "tontines_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tontine_participants" ADD CONSTRAINT "tontine_participants_tontineId_fkey" FOREIGN KEY ("tontineId") REFERENCES "tontines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tontine_participants" ADD CONSTRAINT "tontine_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tontine_payments" ADD CONSTRAINT "tontine_payments_tontineId_fkey" FOREIGN KEY ("tontineId") REFERENCES "tontines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tontine_cycles" ADD CONSTRAINT "tontine_cycles_tontineId_fkey" FOREIGN KEY ("tontineId") REFERENCES "tontines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communaute_posts" ADD CONSTRAINT "communaute_posts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defis_actifs" ADD CONSTRAINT "defis_actifs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badges" ADD CONSTRAINT "badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cours_progression" ADD CONSTRAINT "cours_progression_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
