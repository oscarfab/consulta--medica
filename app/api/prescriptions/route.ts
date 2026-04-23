import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

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
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = prescriptionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const prescription = await prisma.prescription.create({
    data: {
      noteId: parsed.data.noteId,
      medications: parsed.data.medications,
      notes: parsed.data.notes,
    },
  });

  return NextResponse.json(prescription, { status: 201 });
}
