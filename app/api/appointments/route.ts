import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const appointmentSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  date: z.string(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["PENDIENTE", "ATENDIDO", "CANCELADO"]).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const appointments = await prisma.appointment.findMany({
    where: {
      ...(from && to
        ? { date: { gte: new Date(from), lte: new Date(to) } }
        : {}),
    },
    include: {
      patient: { select: { id: true, fullName: true } },
      doctor: { select: { id: true, name: true } },
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(appointments);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = appointmentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const appointment = await prisma.appointment.create({
    data: {
      ...parsed.data,
      date: new Date(parsed.data.date),
      status: parsed.data.status ?? "PENDIENTE",
    },
    include: {
      patient: { select: { id: true, fullName: true } },
      doctor: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(appointment, { status: 201 });
}
