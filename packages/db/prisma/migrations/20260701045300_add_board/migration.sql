-- CreateTable
CREATE TABLE "Board" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Board_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Frame" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "boardId" TEXT,
    "name" TEXT NOT NULL,
    "x" REAL NOT NULL,
    "y" REAL NOT NULL,
    "width" REAL NOT NULL,
    "height" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Frame_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Frame_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Frame" ("createdAt", "height", "id", "name", "userId", "width", "x", "y") SELECT "createdAt", "height", "id", "name", "userId", "width", "x", "y" FROM "Frame";
DROP TABLE "Frame";
ALTER TABLE "new_Frame" RENAME TO "Frame";
CREATE INDEX "Frame_userId_idx" ON "Frame"("userId");
CREATE INDEX "Frame_boardId_idx" ON "Frame"("boardId");
CREATE TABLE "new_Screenshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "boardId" TEXT,
    "storageKey" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'image/png',
    "sourceUrl" TEXT NOT NULL,
    "pageTitle" TEXT NOT NULL,
    "capturedAt" DATETIME NOT NULL,
    "boardX" REAL NOT NULL DEFAULT 0,
    "boardY" REAL NOT NULL DEFAULT 0,
    "boardScale" REAL NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Screenshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Screenshot_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Screenshot" ("boardScale", "boardX", "boardY", "capturedAt", "createdAt", "height", "id", "mimeType", "pageTitle", "sourceUrl", "storageKey", "userId", "width") SELECT "boardScale", "boardX", "boardY", "capturedAt", "createdAt", "height", "id", "mimeType", "pageTitle", "sourceUrl", "storageKey", "userId", "width" FROM "Screenshot";
DROP TABLE "Screenshot";
ALTER TABLE "new_Screenshot" RENAME TO "Screenshot";
CREATE UNIQUE INDEX "Screenshot_storageKey_key" ON "Screenshot"("storageKey");
CREATE INDEX "Screenshot_userId_capturedAt_idx" ON "Screenshot"("userId", "capturedAt");
CREATE INDEX "Screenshot_boardId_idx" ON "Screenshot"("boardId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Board_userId_idx" ON "Board"("userId");
