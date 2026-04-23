import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const bg = await prisma.clinicalBackground.findUnique({ where: { patientId: id } });
  return NextResponse.json(bg);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const bg = await prisma.clinicalBackground.upsert({
    where: { patientId: id },
    create: { patientId: id, ...body },
    update: body,
  });

  return NextResponse.json(bg);
}
