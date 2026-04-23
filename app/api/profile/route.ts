import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  specialty: z.string().optional().nullable(),
  cedula: z.string().optional().nullable(),
  clinicName: z.string().optional().nullable(),
  clinicAddress: z.string().optional().nullable(),
  clinicPhone: z.string().optional().nullable(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true, role: true,
      specialty: true, cedula: true,
      clinicName: true, clinicAddress: true, clinicPhone: true,
    },
  });

  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
    select: {
      id: true, name: true, email: true, role: true,
      specialty: true, cedula: true,
      clinicName: true, clinicAddress: true, clinicPhone: true,
    },
  });

  return NextResponse.json(user);
}
