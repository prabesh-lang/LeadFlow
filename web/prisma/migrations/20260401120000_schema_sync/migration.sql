-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "city" TEXT;
ALTER TABLE "Lead" ADD COLUMN "country" TEXT;
ALTER TABLE "Lead" ADD COLUMN "lostNotes" TEXT;

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipientId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "leadId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TeamWhatsApp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "label" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeamWhatsApp_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LeadHandoffLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leadId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT,
    "detail" TEXT,
    CONSTRAINT "LeadHandoffLog_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LeadHandoffLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalesExecTeamTransfer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "salesExecId" TEXT NOT NULL,
    "fromTeamId" TEXT,
    "toTeamId" TEXT NOT NULL,
    "transferredById" TEXT NOT NULL,
    CONSTRAINT "SalesExecTeamTransfer_salesExecId_fkey" FOREIGN KEY ("salesExecId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SalesExecTeamTransfer_fromTeamId_fkey" FOREIGN KEY ("fromTeamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SalesExecTeamTransfer_toTeamId_fkey" FOREIGN KEY ("toTeamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SalesExecTeamTransfer_transferredById_fkey" FOREIGN KEY ("transferredById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "authUserId" TEXT,
    "passwordHash" TEXT,
    "provisioningPassword" TEXT,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "managerId" TEXT,
    "teamId" TEXT,
    "analystTeamName" TEXT,
    CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "email", "id", "image", "managerId", "name", "passwordHash", "role", "teamId", "updatedAt") SELECT "createdAt", "email", "id", "image", "managerId", "name", "passwordHash", "role", "teamId", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_authUserId_key" ON "User"("authUserId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Notification_recipientId_read_idx" ON "Notification"("recipientId", "read");

-- CreateIndex
CREATE INDEX "Notification_recipientId_createdAt_idx" ON "Notification"("recipientId", "createdAt");

-- CreateIndex
CREATE INDEX "TeamWhatsApp_teamId_idx" ON "TeamWhatsApp"("teamId");

-- CreateIndex
CREATE INDEX "LeadHandoffLog_leadId_createdAt_idx" ON "LeadHandoffLog"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "SalesExecTeamTransfer_createdAt_idx" ON "SalesExecTeamTransfer"("createdAt");

-- CreateIndex
CREATE INDEX "SalesExecTeamTransfer_salesExecId_idx" ON "SalesExecTeamTransfer"("salesExecId");

