-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('draft', 'in_progress', 'finished');

-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('registered', 'seeded', 'active', 'eliminated', 'finished');

-- CreateEnum
CREATE TYPE "TribeCode" AS ENUM ('comet', 'satellite', 'star');

-- CreateEnum
CREATE TYPE "BracketType" AS ENUM ('swiss');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('pending', 'finished', 'bye');

-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('pending', 'in_progress', 'finished');

-- CreateEnum
CREATE TYPE "ScheduleSource" AS ENUM ('manual', 'auto');

-- CreateEnum
CREATE TYPE "AuditEntityType" AS ENUM ('tournament', 'match', 'participant');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('tournament_seed', 'tournament_reseed', 'match_result_create', 'match_result_update', 'match_result_reset', 'match_schedule_manual', 'match_schedule_auto');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TournamentStatus" NOT NULL DEFAULT 'draft',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "format" TEXT NOT NULL DEFAULT 'swiss',
    "roundsCount" INTEGER NOT NULL DEFAULT 4,
    "currentRound" INTEGER NOT NULL DEFAULT 0,
    "setsToWin" INTEGER NOT NULL DEFAULT 2,
    "tvIntervalSec" INTEGER NOT NULL DEFAULT 10,
    "isTelegramEnabled" BOOLEAN NOT NULL DEFAULT false,
    "date" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "status" "RoundStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "tribe" "TribeCode" NOT NULL,
    "telegramContact" TEXT,
    "registrationOrder" INTEGER NOT NULL,
    "seedNumber" INTEGER,
    "status" "ParticipantStatus" NOT NULL DEFAULT 'registered',
    "finalPlace" INTEGER,
    "finalScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "bracketType" "BracketType" NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "matchNumber" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL,
    "participantAId" TEXT,
    "participantBId" TEXT,
    "winnerId" TEXT,
    "loserId" TEXT,
    "scoreA" INTEGER,
    "scoreB" INTEGER,
    "status" "MatchStatus" NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "scheduleSource" "ScheduleSource",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditRecord" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "adminId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" "AuditEntityType" NOT NULL,
    "entityId" TEXT,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "Round_tournamentId_number_idx" ON "Round"("tournamentId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Round_tournamentId_number_key" ON "Round"("tournamentId", "number");

-- CreateIndex
CREATE INDEX "Participant_tournamentId_idx" ON "Participant"("tournamentId");

-- CreateIndex
CREATE INDEX "Participant_tournamentId_seedNumber_idx" ON "Participant"("tournamentId", "seedNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_tournamentId_nickname_key" ON "Participant"("tournamentId", "nickname");

-- CreateIndex
CREATE INDEX "Match_tournamentId_bracketType_roundNumber_matchNumber_idx" ON "Match"("tournamentId", "bracketType", "roundNumber", "matchNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Match_tournamentId_bracketType_roundNumber_matchNumber_key" ON "Match"("tournamentId", "bracketType", "roundNumber", "matchNumber");

-- CreateIndex
CREATE INDEX "AuditRecord_tournamentId_createdAt_idx" ON "AuditRecord"("tournamentId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_participantAId_fkey" FOREIGN KEY ("participantAId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_participantBId_fkey" FOREIGN KEY ("participantBId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_loserId_fkey" FOREIGN KEY ("loserId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditRecord" ADD CONSTRAINT "AuditRecord_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
