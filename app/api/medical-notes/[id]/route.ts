import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { isToday } from "date-fns";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const note = await prisma.medicalNote.findUnique({
    where: { id },
    include: {
      patient: { select: { id: true, fullName: true, birthdate: true } },
      doctor: { select: { name: true, specialty: true, cedula: true, clinicName: true, clinicAddress: true } },
      prescription: true,
    },
  });

  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(note);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const note = await prisma.medicalNote.findUnique({ where: { id } });

  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (note.isLocked && !isToday(note.consultationDate)) {
    return NextResponse.json({ error: "Note is locked" }, { status: 403 });
  }

  const body = await req.json();
  const updated = await prisma.medicalNote.update({
    where: { id },
    data: { ...body, isLocked: true },
  });

  return NextResponse.json(updated);
}
