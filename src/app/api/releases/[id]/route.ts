import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ReleaseStatus, ReleaseType } from "@prisma/client";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const release = await prisma.release.findUnique({ where: { id: params.id } });
  if (!release) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (release.submittedById !== session.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, body, excerpt, releaseType, originLanguage, originCountry, tags, status } = await req.json();

  const updated = await prisma.release.update({
    where: { id: params.id },
    data:  { title, body, excerpt: excerpt || null, releaseType: releaseType as ReleaseType,
             originLanguage, originCountry, tags, status: status as ReleaseStatus },
  });

  return NextResponse.json({ id: updated.id });
}
