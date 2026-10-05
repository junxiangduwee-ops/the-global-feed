import { PrismaClient, UserRole, ReleaseStatus, ReleaseType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || "ChangeMe123!";

async function main() {
  console.log("  · seeding users");

  const users = [
    { email: "hod@mrdiy.com",    name: "Ahmad Razif",      role: UserRole.HEAD_OF_DEPARTMENT, department: "Communications" },
    { email: "sm@mrdiy.com",     name: "Priya Nair",       role: UserRole.SENIOR_MANAGER,     department: "Communications" },
    { email: "mgr@mrdiy.com",    name: "Tan Wei Liang",    role: UserRole.MANAGER,            department: "Marketing" },
    { email: "am@mrdiy.com",     name: "Siti Hajar",       role: UserRole.ASSISTANT_MANAGER,  department: "Communications" },
    { email: "exec@mrdiy.com",   name: "James Loh",        role: UserRole.SENIOR_EXECUTIVE,   department: "PR" },
  ];

  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  for (const u of users) {
    await prisma.user.upsert({
      where:  { email: u.email },
      update: {},
      create: { ...u, password: hash, country: "MY" },
    });
  }

  const hod = await prisma.user.findUniqueOrThrow({ where: { email: "hod@mrdiy.com" } });
  const sm  = await prisma.user.findUniqueOrThrow({ where: { email: "sm@mrdiy.com" } });
  const mgr = await prisma.user.findUniqueOrThrow({ where: { email: "mgr@mrdiy.com" } });

  console.log("  · seeding sample releases");

  const releases = [
    {
      title:          "MR.DIY Opens Flagship Standalone Store in Thailand",
      body:           "MR.DIY is proud to announce the opening of its 1,200th branch in Thailand, marking a significant milestone in the company's regional expansion.\n\nThe new flagship standalone store is located at a prime location in Bangkok and features an expanded range of products across all categories.\n\nThis opening reinforces MR.DIY's commitment to making quality products affordable and accessible to customers across Southeast Asia.",
      excerpt:        "MR.DIY opens its 1,200th branch in Thailand — a flagship standalone store.",
      releaseType:    ReleaseType.STORE_OPENING,
      originLanguage: "en",
      originCountry:  "TH",
      status:         ReleaseStatus.PUBLISHED,
      tags:           ["thailand", "expansion", "flagship"],
      submittedById:  sm!.id,
      reviewedById:   hod!.id,
      reviewedAt:     new Date(),
    },
    {
      title:          "MR.DIY Reaches 1,000 Stores Across Malaysia",
      body:           "MR.DIY has achieved a landmark milestone, reaching 1,000 stores across Malaysia. This achievement reflects the brand's dedication to serving communities nationwide with quality products at everyday low prices.\n\nThe 1,000th store, located in Kuala Lumpur, was officially opened by senior management and celebrated with special promotions for customers.",
      excerpt:        "MR.DIY hits 1,000 stores across Malaysia, reaffirming retail leadership.",
      releaseType:    ReleaseType.MILESTONE,
      originLanguage: "en",
      originCountry:  "MY",
      status:         ReleaseStatus.APPROVED,
      tags:           ["malaysia", "milestone", "1000-stores"],
      submittedById:  mgr!.id,
      reviewedById:   hod!.id,
      reviewedAt:     new Date(),
    },
    {
      title:          "MR.DIY Partners with St. Francis Xavier School for CSR Programme",
      body:           "MR.DIY has partnered with St. Francis Xavier School as part of its 'Little Inventors' CSR programme for the fourth consecutive year.\n\nThe programme equips students with basic STEM skills through hands-on workshops, providing tools and materials funded by MR.DIY's CSR initiative.",
      excerpt:        "MR.DIY partners with St. Francis Xavier School for the 'Little Inventors' programme.",
      releaseType:    ReleaseType.CSR,
      originLanguage: "en",
      originCountry:  "MY",
      status:         ReleaseStatus.PENDING,
      tags:           ["csr", "education", "community"],
      submittedById:  sm!.id,
    },
    {
      title:          "MR.DIY Wins Marketer No.1 Brand Thailand 2026",
      body:           "MR.DIY has been recognised as the Marketer No.1 Brand in Thailand for the fourth straight year, underscoring the brand's strong resonance with Thai consumers.\n\nThe award highlights MR.DIY's consistent marketing strategy and product quality across the Thai market.",
      excerpt:        "MR.DIY named Marketer No.1 Brand Thailand 2026 for the fourth consecutive year.",
      releaseType:    ReleaseType.AWARD,
      originLanguage: "en",
      originCountry:  "TH",
      status:         ReleaseStatus.DRAFT,
      tags:           ["award", "thailand", "brand"],
      submittedById:  mgr!.id,
    },
  ];

  for (const r of releases) {
    await prisma.release.create({ data: r });
  }

  console.log(`\n  ✓ Done! Seeded ${users.length} users and ${releases.length} releases.`);
  console.log(`\n  Default password for all accounts: ${DEFAULT_PASSWORD}`);
  console.log(`  Accounts:`);
  for (const u of users) {
    console.log(`    ${u.email.padEnd(24)} ${u.role}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
