-- Replace provisioningPassword (plaintext) with mustResetPassword (boolean).
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "authUserId" TEXT,
    "passwordHash" TEXT,
    "mustResetPassword" BOOLEAN NOT NULL DEFAULT false,
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

INSERT INTO "new_User" (
    "id",
    "email",
    "authUserId",
    "passwordHash",
    "mustResetPassword",
    "name",
    "image",
    "role",
    "createdAt",
    "updatedAt",
    "managerId",
    "teamId",
    "analystTeamName"
)
SELECT
    "id",
    "email",
    "authUserId",
    "passwordHash",
    CASE
        WHEN "provisioningPassword" IS NOT NULL AND length(trim("provisioningPassword")) > 0 THEN 1
        ELSE 0
    END,
    "name",
    "image",
    "role",
    "createdAt",
    "updatedAt",
    "managerId",
    "teamId",
    "analystTeamName"
FROM "User";

DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_authUserId_key" ON "User"("authUserId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
