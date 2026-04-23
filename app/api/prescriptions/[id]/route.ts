import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const prescription = await prisma.prescription.findUnique({
    where: { id },
    include: {
      note: {
        include: {
          patient: { select: { fullName: true, birthdate: true } },
          doctor: {
            select: {
              name: true,
              specialty: true,
              cedula: true,
              clinicName: true,
              clinicAddress: true,
              clinicPhone: true,
            },
          },
        },
      },
    },
  });

  if (!prescription) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(prescription);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const prescription = await prisma.prescription.update({ where: { id }, data: body });
  return NextResponse.json(prescription);
}
