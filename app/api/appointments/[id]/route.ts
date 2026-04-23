import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  date: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["PENDIENTE", "ATENDIDO", "CANCELADO"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const data: Record<string, unknown> = { ...parsed.data };
  if (data.date) data.date = new Date(data.date as string);

  const appointment = await prisma.appointment.update({
    where: { id },
    data,
    include: {
      patient: { select: { id: true, fullName: true } },
      doctor: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(appointment);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.appointment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
