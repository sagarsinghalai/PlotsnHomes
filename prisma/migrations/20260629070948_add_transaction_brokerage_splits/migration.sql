-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "brokerageRate" REAL NOT NULL DEFAULT 3.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Property_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Property_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Property" ("address", "agentId", "area", "availabilityStatus", "balconies", "bathrooms", "bedrooms", "capRate", "category", "change1m", "change24h", "change6m", "change7d", "changeYtd", "city", "country", "createdAt", "currentPrice", "description", "featured", "features", "flatsPerFloor", "floorNumber", "furnishingStatus", "garages", "hasPujaRoom", "hasServantRoom", "hasStudyRoom", "id", "images", "interestRate", "liftType", "listedPrice", "listingType", "lotSize", "mapLat", "mapLng", "marketRating", "pdfs", "price", "priceHistory", "pricePerSqft", "rentMonthly", "rooms", "slug", "sqft", "state", "status", "submittedById", "symbol", "title", "totalFloors", "type", "updatedAt", "videoUrl", "videos", "virtualTourUrl", "volumeScore", "yearBuilt", "yieldRate", "zip") SELECT "address", "agentId", "area", "availabilityStatus", "balconies", "bathrooms", "bedrooms", "capRate", "category", "change1m", "change24h", "change6m", "change7d", "changeYtd", "city", "country", "createdAt", "currentPrice", "description", "featured", "features", "flatsPerFloor", "floorNumber", "furnishingStatus", "garages", "hasPujaRoom", "hasServantRoom", "hasStudyRoom", "id", "images", "interestRate", "liftType", "listedPrice", "listingType", "lotSize", "mapLat", "mapLng", "marketRating", "pdfs", "price", "priceHistory", "pricePerSqft", "rentMonthly", "rooms", "slug", "sqft", "state", "status", "submittedById", "symbol", "title", "totalFloors", "type", "updatedAt", "videoUrl", "videos", "virtualTourUrl", "volumeScore", "yearBuilt", "yieldRate", "zip" FROM "Property";
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
CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'inr',
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "stripeSessionId" TEXT,
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "paymentPlan" TEXT,
    "paymentMethod" TEXT,
    "description" TEXT,
    "brokerageRate" REAL NOT NULL DEFAULT 0.0,
    "brokerageAmount" REAL NOT NULL DEFAULT 0.0,
    "sellerAmount" REAL NOT NULL DEFAULT 0.0,
    "received" TEXT NOT NULL DEFAULT 'no',
    "balance" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transaction_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("amount", "createdAt", "currency", "description", "id", "paymentMethod", "paymentPlan", "propertyId", "razorpayOrderId", "razorpayPaymentId", "status", "stripeSessionId", "type", "userId") SELECT "amount", "createdAt", "currency", "description", "id", "paymentMethod", "paymentPlan", "propertyId", "razorpayOrderId", "razorpayPaymentId", "status", "stripeSessionId", "type", "userId" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE UNIQUE INDEX "Transaction_stripeSessionId_key" ON "Transaction"("stripeSessionId");
CREATE UNIQUE INDEX "Transaction_razorpayOrderId_key" ON "Transaction"("razorpayOrderId");
CREATE UNIQUE INDEX "Transaction_razorpayPaymentId_key" ON "Transaction"("razorpayPaymentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
