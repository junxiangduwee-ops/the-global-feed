import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const secret = process.env.N8N_WEBHOOK_SECRET;
  const body   = await req.json();

  if (secret && body.secret !== secret)
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });

  const { job_id, translations } = body;
  if (!job_id) return NextResponse.json({ error: "Missing job_id" }, { status: 400 });

  for (const t of translations ?? []) {
    await prisma.releaseTranslation.upsert({
      where:  { releaseId_language_country: { releaseId: job_id, language: t.language, country: t.country } },
      update: { title: t.title, body: t.body, excerpt: t.excerpt, status: "COMPLETED", translatedAt: new Date() },
      create: { releaseId: job_id, language: t.language, country: t.country, title: t.title, body: t.body, excerpt: t.excerpt, status: "COMPLETED", translatedAt: new Date() },
    });
  }

  await prisma.release.update({ where: { id: job_id }, data: { status: "PUBLISHED", publishedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
