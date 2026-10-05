-- =============================================================================
-- The Global Feed — Manual Schema
-- Paste this entire file into Supabase → SQL Editor → Run
-- =============================================================================

-- Enums
CREATE TYPE "UserRole" AS ENUM (
  'HEAD_OF_DEPARTMENT',
  'SENIOR_MANAGER',
  'MANAGER',
  'ASSISTANT_MANAGER',
  'SENIOR_EXECUTIVE'
);

CREATE TYPE "ReleaseStatus" AS ENUM (
  'DRAFT',
  'PENDING',
  'APPROVED',
  'DECLINED',
  'TRANSLATING',
  'PUBLISHED'
);

CREATE TYPE "ReleaseType" AS ENUM (
  'STORE_OPENING',
  'MILESTONE',
  'CSR',
  'AWARD',
  'CAMPAIGN',
  'PRODUCT_LAUNCH',
  'PARTNERSHIP',
  'ANNOUNCEMENT',
  'OTHER'
);

CREATE TYPE "TranslationStatus" AS ENUM (
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'FAILED'
);

-- Users
CREATE TABLE "User" (
  "id"          TEXT NOT NULL,
  "email"       TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "password"    TEXT NOT NULL,
  "role"        "UserRole" NOT NULL DEFAULT 'SENIOR_EXECUTIVE',
  "department"  TEXT,
  "country"     TEXT NOT NULL DEFAULT 'MY',
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");

-- Releases
CREATE TABLE "Release" (
  "id"              TEXT NOT NULL,
  "title"           TEXT NOT NULL,
  "body"            TEXT NOT NULL,
  "excerpt"         TEXT,
  "releaseType"     "ReleaseType" NOT NULL DEFAULT 'ANNOUNCEMENT',
  "originLanguage"  TEXT NOT NULL DEFAULT 'en',
  "originCountry"   TEXT NOT NULL DEFAULT 'MY',
  "status"          "ReleaseStatus" NOT NULL DEFAULT 'DRAFT',
  "score"           INTEGER,
  "submittedById"   TEXT NOT NULL,
  "reviewedById"    TEXT,
  "reviewedAt"      TIMESTAMP(3),
  "reviewNote"      TEXT,
  "n8nJobId"        TEXT,
  "n8nSentAt"       TIMESTAMP(3),
  "publishAt"       TIMESTAMP(3),
  "publishedAt"     TIMESTAMP(3),
  "tags"            TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Release_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Release_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Release_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "Release_status_idx" ON "Release"("status");
CREATE INDEX "Release_submittedById_idx" ON "Release"("submittedById");
CREATE INDEX "Release_createdAt_idx" ON "Release"("createdAt" DESC);

-- Release Translations
CREATE TABLE "ReleaseTranslation" (
  "id"           TEXT NOT NULL,
  "releaseId"    TEXT NOT NULL,
  "language"     TEXT NOT NULL,
  "country"      TEXT NOT NULL,
  "title"        TEXT NOT NULL,
  "body"         TEXT NOT NULL,
  "excerpt"      TEXT,
  "status"       "TranslationStatus" NOT NULL DEFAULT 'PENDING',
  "translatedAt" TIMESTAMP(3),
  "translator"   TEXT NOT NULL DEFAULT 'n8n-ai',
  "reviewedById" TEXT,
  "reviewedAt"   TIMESTAMP(3),
  "isApproved"   BOOLEAN NOT NULL DEFAULT false,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReleaseTranslation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ReleaseTranslation_releaseId_language_country_key" UNIQUE ("releaseId", "language", "country"),
  CONSTRAINT "ReleaseTranslation_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ReleaseTranslation_releaseId_idx" ON "ReleaseTranslation"("releaseId");

-- Activity Log
CREATE TABLE "ActivityLog" (
  "id"        TEXT NOT NULL,
  "releaseId" TEXT,
  "actorId"   TEXT NOT NULL,
  "action"    TEXT NOT NULL,
  "meta"      TEXT NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ActivityLog_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ActivityLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "ActivityLog_releaseId_idx" ON "ActivityLog"("releaseId");
CREATE INDEX "ActivityLog_actorId_idx" ON "ActivityLog"("actorId");

-- Auto-update updatedAt
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW."updatedAt" = CURRENT_TIMESTAMP; RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "User_updatedAt" BEFORE UPDATE ON "User"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER "Release_updatedAt" BEFORE UPDATE ON "Release"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER "ReleaseTranslation_updatedAt" BEFORE UPDATE ON "ReleaseTranslation"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Prisma migration tracking (needed so Prisma knows schema is applied)
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id"                    VARCHAR(36) NOT NULL,
  "checksum"              VARCHAR(64) NOT NULL,
  "finished_at"           TIMESTAMPTZ,
  "migration_name"        VARCHAR(255) NOT NULL,
  "logs"                  TEXT,
  "rolled_back_at"        TIMESTAMPTZ,
  "started_at"            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "applied_steps_count"   INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
);
