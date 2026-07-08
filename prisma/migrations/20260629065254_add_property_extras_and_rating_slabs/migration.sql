-- CreateTable
CREATE TABLE "RatingSlab" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "minYield" REAL NOT NULL,
    "maxYield" REAL,
    "color" TEXT NOT NULL DEFAULT '#22c55e',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DeveloperTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "developerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "deadline" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DeveloperTask_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "Developer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Developer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "projectCount" INTEGER NOT NULL DEFAULT 0,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "country" TEXT NOT NULL DEFAULT 'IN',
    "experienceYears" INTEGER,
    "identityType" TEXT,
    "identityNumber" TEXT,
    "website" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Developer" ("createdAt", "id", "name", "projectCount", "updatedAt") SELECT "createdAt", "id", "name", "projectCount", "updatedAt" FROM "Developer";
DROP TABLE "Developer";
ALTER TABLE "new_Developer" RENAME TO "Developer";
CREATE UNIQUE INDEX "Developer_name_key" ON "Developer"("name");
CREATE TABLE "new_Property" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "listedPrice" REAL,
    "currentPrice" REAL,
    "rentMonthly" REAL,
    "bedrooms" INTEGER NOT NULL DEFAULT 0,
    "bathrooms" REAL NOT NULL DEFAULT 0,
    "sqft" INTEGER,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'IN',
    "type" TEXT NOT NULL DEFAULT 'RESIDENTIAL',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "images" TEXT NOT NULL DEFAULT '[]',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "yearBuilt" INTEGER,
    "yieldRate" REAL NOT NULL DEFAULT 0,
    "capRate" REAL NOT NULL DEFAULT 0,
    "interestRate" REAL NOT NULL DEFAULT 6.5,
    "change24h" REAL NOT NULL DEFAULT 0,
    "change7d" REAL NOT NULL DEFAULT 0,
    "change1m" REAL NOT NULL DEFAULT 0,
    "change6m" REAL NOT NULL DEFAULT 0,
    "changeYtd" REAL NOT NULL DEFAULT 0,
    "pricePerSqft" REAL,
    "priceHistory" TEXT NOT NULL DEFAULT '[]',
    "marketRating" TEXT NOT NULL DEFAULT 'B',
    "volumeScore" INTEGER NOT NULL DEFAULT 0,
    "listingType" TEXT NOT NULL DEFAULT 'SALE',
    "category" TEXT,
    "area" TEXT,
    "rooms" INTEGER,
    "garages" INTEGER NOT NULL DEFAULT 0,
    "lotSize" INTEGER,
    "totalFloors" INTEGER,
    "floorNumber" INTEGER,
    "furnishingStatus" TEXT,
    "hasServantRoom" BOOLEAN NOT NULL DEFAULT false,
    "hasPujaRoom" BOOLEAN NOT NULL DEFAULT false,
    "hasStudyRoom" BOOLEAN NOT NULL DEFAULT false,
    "balconies" INTEGER NOT NULL DEFAULT 0,
    "liftType" TEXT,
    "flatsPerFloor" INTEGER,
    "availabilityStatus" TEXT NOT NULL DEFAULT 'Available',
    "videos" TEXT NOT NULL DEFAULT '[]',
    "pdfs" TEXT NOT NULL DEFAULT '[]',
    "features" TEXT NOT NULL DEFAULT '[]',
    "videoUrl" TEXT,
    "virtualTourUrl" TEXT,
    "mapLat" REAL,
    "mapLng" REAL,
    "submittedById" TEXT,
    "agentId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Property_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Property_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Property" ("address", "agentId", "area", "bathrooms", "bedrooms", "capRate", "category", "change24h", "change7d", "changeYtd", "city", "country", "createdAt", "description", "featured", "features", "floorNumber", "garages", "id", "images", "interestRate", "listingType", "lotSize", "mapLat", "mapLng", "marketRating", "pdfs", "price", "priceHistory", "pricePerSqft", "rentMonthly", "rooms", "slug", "sqft", "state", "status", "submittedById", "symbol", "title", "totalFloors", "type", "updatedAt", "videoUrl", "videos", "virtualTourUrl", "volumeScore", "yearBuilt", "yieldRate", "zip") SELECT "address", "agentId", "area", "bathrooms", "bedrooms", "capRate", "category", "change24h", "change7d", "changeYtd", "city", "country", "createdAt", "description", "featured", "features", "floorNumber", "garages", "id", "images", "interestRate", "listingType", "lotSize", "mapLat", "mapLng", "marketRating", "pdfs", "price", "priceHistory", "pricePerSqft", "rentMonthly", "rooms", "slug", "sqft", "state", "status", "submittedById", "symbol", "title", "totalFloors", "type", "updatedAt", "videoUrl", "videos", "virtualTourUrl", "volumeScore", "yearBuilt", "yieldRate", "zip" FROM "Property";
DROP TABLE "Property";
ALTER TABLE "new_Property" RENAME TO "Property";
CREATE UNIQUE INDEX "Property_symbol_key" ON "Property"("symbol");
CREATE UNIQUE INDEX "Property_slug_key" ON "Property"("slug");
CREATE INDEX "Property_listingType_idx" ON "Property"("listingType");
CREATE INDEX "Property_category_idx" ON "Property"("category");
CREATE INDEX "Property_area_idx" ON "Property"("area");
CREATE INDEX "Property_state_idx" ON "Property"("state");
CREATE INDEX "Property_price_idx" ON "Property"("price");
CREATE INDEX "Property_type_idx" ON "Property"("type");
CREATE INDEX "Property_status_idx" ON "Property"("status");
CREATE INDEX "Property_yieldRate_idx" ON "Property"("yieldRate");
CREATE INDEX "Property_changeYtd_idx" ON "Property"("changeYtd");
CREATE INDEX "Property_availabilityStatus_idx" ON "Property"("availabilityStatus");
CREATE INDEX "Property_furnishingStatus_idx" ON "Property"("furnishingStatus");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
