-- Add credential columns
ALTER TABLE "User"
ADD COLUMN "username" TEXT,
ADD COLUMN "passwordHash" TEXT;

-- Populate defaults for existing rows
UPDATE "User"
SET "username" = LOWER(REPLACE(email, '@', '_'))
WHERE "username" IS NULL;

UPDATE "User"
SET "passwordHash" = '6f14eeb110e94bee8dc7f41aab912fb4:5e94f56b5fd71a57e0d8382a4fc00658551adba694c702061024294cb518f1e126c162b7999610d6afe11e2a127fedde974673559604e08aba0f07ce9e1a8d4a'
WHERE "passwordHash" IS NULL;

-- Enforce constraints
ALTER TABLE "User"
ALTER COLUMN "username" SET NOT NULL;

ALTER TABLE "User"
ALTER COLUMN "passwordHash" SET NOT NULL;

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
