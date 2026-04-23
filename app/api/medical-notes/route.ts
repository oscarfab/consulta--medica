import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const noteSchema = z.object({
  patientId: z.string().min(1),
  appointmentId: z.string().optional().nullable(),
  consultationDate: z.string(),
  reasonForVisit: z.string().optional(),
  bloodPressure: z.string().optional(),
  heartRate: z.number().optional().nullable(),
  respiratoryRate: z.number().optional().nullable(),
  temperature: z.number().optional().nullable(),
  weight: z.number().optional().nullable(),
  height: z.number().optional().nullable(),
  bmi: z.number().optional().nullable(),
  oxygenSat: z.number().optional().nullable(),
  physicalExam: z.string().optional(),
  diagnosisCode: z.string().optional(),
  diagnosisDescription: z.string().optional(),
  treatmentPlan: z.string().optional(),
  prognosis: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = noteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const note = await prisma.medicalNote.create({
    data: {
      ...parsed.data,
      consultationDate: new Date(parsed.data.consultationDate),
      doctorId: session.user.id,
    },
  });

  return NextResponse.json(note, { status: 201 });
}
