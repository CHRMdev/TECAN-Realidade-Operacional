-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Quebra" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "flightNumber" TEXT NOT NULL,
    "uldNumber" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Quebra_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Entrega" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "deliveryType" TEXT NOT NULL,
    "uldNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Entrega_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AWB" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entregaId" TEXT NOT NULL,
    "awbNumber" TEXT NOT NULL,
    CONSTRAINT "AWB_entregaId_fkey" FOREIGN KEY ("entregaId") REFERENCES "Entrega" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LaminaProduzida" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "uldNumber" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LaminaProduzida_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SaidaVoo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "flightNumber" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SaidaVoo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "Quebra_userId_idx" ON "Quebra"("userId");

-- CreateIndex
CREATE INDEX "Quebra_createdAt_idx" ON "Quebra"("createdAt");

-- CreateIndex
CREATE INDEX "Entrega_userId_idx" ON "Entrega"("userId");

-- CreateIndex
CREATE INDEX "Entrega_createdAt_idx" ON "Entrega"("createdAt");

-- CreateIndex
CREATE INDEX "AWB_entregaId_idx" ON "AWB"("entregaId");

-- CreateIndex
CREATE INDEX "LaminaProduzida_userId_idx" ON "LaminaProduzida"("userId");

-- CreateIndex
CREATE INDEX "LaminaProduzida_createdAt_idx" ON "LaminaProduzida"("createdAt");

-- CreateIndex
CREATE INDEX "SaidaVoo_userId_idx" ON "SaidaVoo"("userId");

-- CreateIndex
CREATE INDEX "SaidaVoo_createdAt_idx" ON "SaidaVoo"("createdAt");
