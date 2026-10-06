/**
 * Prisma seed — run with: npx prisma db seed
 *
 * Idempotent: safe to run multiple times. Existing accounts are skipped,
 * never overwritten.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─── Seed accounts ─────────────────────────────────────────────────────────────
// Add or remove entries here. Passwords are hashed at seed time.
// Change these credentials immediately after the first deployment.

const SEED_USERS = [
  {
    name:     "System Admin",
    email:    "admin@mrdiy.com",
    password: "Admin123!",
    role:     "SUPER_ADMIN" as const,
    country:  "MY",
  },
] satisfies {
  name:     string;
  email:    string;
  password: string;
  role:     "SUPER_ADMIN" | "HEAD_OF_DEPARTMENT" | "SENIOR_MANAGER" | "MANAGER" | "ASSISTANT_MANAGER" | "SENIOR_EXECUTIVE";
  country:  string;
}[];

// ─── Runner ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding database…\n");

  for (const user of SEED_USERS) {
    const existing = await prisma.user.findUnique({ where: { email: user.email } });

    if (existing) {
      console.log(`  skip  ${user.role.padEnd(20)}  ${user.email}  (already exists)`);
      continue;
    }

    const hash = await bcrypt.hash(user.password, 12);
    await prisma.user.create({
      data: {
        name:     user.name,
        email:    user.email,
        password: hash,
        role:     user.role,
        country:  user.country,
        isActive: true,
      },
    });

    console.log(`  ✓     ${user.role.padEnd(20)}  ${user.email}`);
  }

  console.log("\nDone. ⚠  Change all seeded passwords before going live.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
