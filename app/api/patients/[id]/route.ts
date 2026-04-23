import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  fullName: z.string().min(2).optional(),
  birthdate: z.string().optional(),
  sex: z.enum(["MASCULINO", "FEMENINO", "OTRO"]).optional(),
  curp: z.string().optional().nullable(),
  bloodType: z.enum(["A_POS", "A_NEG", "B_POS", "B_NEG", "AB_POS", "AB_NEG", "O_POS", "O_NEG", "DESCONOCIDO"]).optional(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  emergencyPhone: z.string().optional().nullable(),
  insuranceName: z.string().optional().nullable(),
  insuranceNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      clinicalBackground: true,
      appointments: {
        orderBy: { date: "desc" },
        include: { doctor: { select: { name: true } } },
      },
      medicalNotes: {
        orderBy: { consultationDate: "desc" },
        include: { doctor: { select: { name: true, specialty: true, cedula: true } } },
      },
    },
  });

  if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(patient);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const data: Record<string, unknown> = { ...parsed.data };
  if (data.birthdate) data.birthdate = new Date(data.birthdate as string);

  const patient = await prisma.patient.update({ where: { id }, data });
  return NextResponse.json(patient);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.patient.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
