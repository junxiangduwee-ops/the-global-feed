-- =============================================================================
-- The Global Feed — Seed Data
-- Paste into Supabase → SQL Editor → Run  AFTER schema.sql
-- Default password for all accounts: ChangeMe123!
-- =============================================================================

INSERT INTO "User" ("id", "email", "name", "password", "role", "department", "country")
VALUES
  ('user_hod_001',  'hod@mrdiy.com',  'Ahmad Razif',   '$2b$10$tqQ4xeMP4xmXxeX9LA4kPuJJ7rakXQTZkbNkICiu1dA0sH01msjoS', 'HEAD_OF_DEPARTMENT', 'Communications', 'MY'),
  ('user_sm_001',   'sm@mrdiy.com',   'Priya Nair',    '$2b$10$tqQ4xeMP4xmXxeX9LA4kPuJJ7rakXQTZkbNkICiu1dA0sH01msjoS', 'SENIOR_MANAGER',     'Communications', 'MY'),
  ('user_mgr_001',  'mgr@mrdiy.com',  'Tan Wei Liang', '$2b$10$tqQ4xeMP4xmXxeX9LA4kPuJJ7rakXQTZkbNkICiu1dA0sH01msjoS', 'MANAGER',            'Marketing',      'MY'),
  ('user_am_001',   'am@mrdiy.com',   'Siti Hajar',    '$2b$10$tqQ4xeMP4xmXxeX9LA4kPuJJ7rakXQTZkbNkICiu1dA0sH01msjoS', 'ASSISTANT_MANAGER',  'Communications', 'MY'),
  ('user_exec_001', 'exec@mrdiy.com', 'James Loh',     '$2b$10$tqQ4xeMP4xmXxeX9LA4kPuJJ7rakXQTZkbNkICiu1dA0sH01msjoS', 'SENIOR_EXECUTIVE',   'PR',             'MY')
ON CONFLICT ("email") DO NOTHING;

INSERT INTO "Release" ("id", "title", "body", "excerpt", "releaseType", "originLanguage", "originCountry", "status", "submittedById", "reviewedById", "reviewedAt", "tags")
VALUES
  (
    'rel_001',
    'MR.DIY Opens Flagship Standalone Store in Thailand',
    'MR.DIY is proud to announce the opening of its 1,200th branch in Thailand, marking a significant milestone in the company''s regional expansion.

The new flagship standalone store is located at a prime location in Bangkok and features an expanded range of products across all categories.

This opening reinforces MR.DIY''s commitment to making quality products affordable and accessible to customers across Southeast Asia.',
    'MR.DIY opens its 1,200th branch in Thailand — a flagship standalone store.',
    'STORE_OPENING', 'en', 'TH', 'PUBLISHED',
    'user_sm_001', 'user_hod_001', NOW(),
    ARRAY['thailand', 'expansion', 'flagship']
  ),
  (
    'rel_002',
    'MR.DIY Reaches 1,000 Stores Across Malaysia',
    'MR.DIY has achieved a landmark milestone, reaching 1,000 stores across Malaysia. This achievement reflects the brand''s dedication to serving communities nationwide with quality products at everyday low prices.

The 1,000th store, located in Kuala Lumpur, was officially opened by senior management and celebrated with special promotions for customers.',
    'MR.DIY hits 1,000 stores across Malaysia, reaffirming retail leadership.',
    'MILESTONE', 'en', 'MY', 'APPROVED',
    'user_mgr_001', 'user_hod_001', NOW(),
    ARRAY['malaysia', 'milestone', '1000-stores']
  ),
  (
    'rel_003',
    'MR.DIY Partners with St. Francis Xavier School for CSR Programme',
    'MR.DIY has partnered with St. Francis Xavier School as part of its Little Inventors CSR programme for the fourth consecutive year.

The programme equips students with basic STEM skills through hands-on workshops, providing tools and materials funded by MR.DIY''s CSR initiative.',
    'MR.DIY partners with St. Francis Xavier School for the Little Inventors programme.',
    'CSR', 'en', 'MY', 'PENDING',
    'user_sm_001', NULL, NULL,
    ARRAY['csr', 'education', 'community']
  ),
  (
    'rel_004',
    'MR.DIY Wins Marketer No.1 Brand Thailand 2026',
    'MR.DIY has been recognised as the Marketer No.1 Brand in Thailand for the fourth straight year, underscoring the brand''s strong resonance with Thai consumers.

The award highlights MR.DIY''s consistent marketing strategy and product quality across the Thai market.',
    'MR.DIY named Marketer No.1 Brand Thailand 2026 for the fourth consecutive year.',
    'AWARD', 'en', 'TH', 'DRAFT',
    'user_mgr_001', NULL, NULL,
    ARRAY['award', 'thailand', 'brand']
  )
ON CONFLICT ("id") DO NOTHING;
