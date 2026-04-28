import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const patientSchema = z.object({
  fullName: z.string().min(2),
  birthdate: z.string(),
  sex: z.enum(["MASCULINO", "FEMENINO", "OTRO"]),
  curp: z.string().optional().nullable(),
  bloodType: z.enum(["A_POS", "A_NEG", "B_POS", "B_NEG", "AB_POS", "AB_NEG", "O_POS", "O_NEG", "DESCONOCIDO"]).optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
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

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { fullName: { contains: search, mode: "insensitive" as const } },
          { curp: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search } },
        ],
      }
    : {};

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      skip,
      take: limit,
      orderBy: { fullName: "asc" },
      include: {
        appointments: {
          orderBy: { date: "desc" },
          take: 1,
          select: { date: true, status: true },
        },
      },
    }),
    prisma.patient.count({ where }),
  ]);

  return NextResponse.json({ patients, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = patientSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const patient = await prisma.patient.create({
    data: {
      ...parsed.data,
      birthdate: new Date(parsed.data.birthdate),
    },
  });

  return NextResponse.json(patient, { status: 201 });
}
