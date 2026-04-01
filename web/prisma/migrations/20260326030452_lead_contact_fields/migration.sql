-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadName" TEXT NOT NULL DEFAULT '',
    "phone" TEXT,
    "leadEmail" TEXT,
    "source" TEXT NOT NULL,
    "notes" TEXT,
    "qualificationStatus" TEXT NOT NULL,
    "leadScore" INTEGER,
    "salesStage" TEXT NOT NULL DEFAULT 'PRE_SALES',
    "createdById" TEXT NOT NULL,
    "assignedMainTeamLeadId" TEXT,
    "teamId" TEXT,
    "assignedSalesExecId" TEXT,
    "execAssignedAt" DATETIME,
    "execDeadlineAt" DATETIME,
    "closedAt" DATETIME,
    "internalReassignCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lead_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Lead_assignedMainTeamLeadId_fkey" FOREIGN KEY ("assignedMainTeamLeadId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lead_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lead_assignedSalesExecId_fkey" FOREIGN KEY ("assignedSalesExecId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Lead" ("assignedMainTeamLeadId", "assignedSalesExecId", "closedAt", "createdAt", "createdById", "execAssignedAt", "execDeadlineAt", "id", "internalReassignCount", "leadScore", "notes", "qualificationStatus", "salesStage", "source", "teamId", "updatedAt") SELECT "assignedMainTeamLeadId", "assignedSalesExecId", "closedAt", "createdAt", "createdById", "execAssignedAt", "execDeadlineAt", "id", "internalReassignCount", "leadScore", "notes", "qualificationStatus", "salesStage", "source", "teamId", "updatedAt" FROM "Lead";
DROP TABLE "Lead";
ALTER TABLE "new_Lead" RENAME TO "Lead";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
