import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ReleaseStatus, ReleaseType } from "@prisma/client";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, body, excerpt, releaseType, originLanguage, originCountry, tags, status } = await req.json();

  const release = await prisma.release.create({
    data: {
      title, body,
      excerpt:        excerpt   || null,
      releaseType:    releaseType as ReleaseType,
      originLanguage: originLanguage || "en",
      originCountry:  originCountry  || "MY",
      tags:           tags || [],
      status:         status as ReleaseStatus,
      submittedById:  session.id,
    },
  });

  await prisma.activityLog.create({
    data: { releaseId: release.id, actorId: session.id, action: status === "DRAFT" ? "saved_draft" : "submitted" },
  });

  return NextResponse.json({ id: release.id });
}
