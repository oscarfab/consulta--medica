import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addDays } from "date-fns";

const medicationSchema = z.object({
  name: z.string().min(1),
  dose: z.string(),
  route: z.string(),
  frequency: z.string(),
  duration: z.string(),
  instructions: z.string().optional(),
});

const prescriptionSchema = z.object({
  noteId: z.string().min(1),
  medications: z.array(medicationSchema),
  notes: z.string().optional(),
  diagnosis: z.string().optional(),
  patientEmail: z.string().email().optional().nullable(),
  patientPhone: z.string().optional().nullable(),
});

async function generateFolio(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.prescription.count({
    where: { folio: { startsWith: `REC-${year}-` } },
  });
  const seq = String(count + 1).padStart(4, "0");
  return `REC-${year}-${seq}`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = prescriptionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const folio = await generateFolio();
  const validUntil = addDays(new Date(), 30);

  const prescription = await prisma.prescription.create({
    data: {
      noteId: parsed.data.noteId,
      medications: parsed.data.medications,
      notes: parsed.data.notes,
      diagnosis: parsed.data.diagnosis,
      folio,
      validUntil,
      status: "DRAFT",
      patientEmail: parsed.data.patientEmail,
      patientPhone: parsed.data.patientPhone,
    },
  });

  return NextResponse.json(prescription, { status: 201 });
}
