import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [todayAppointments, totalPatients, monthConsultations, upcomingAppointments] =
    await Promise.all([
      prisma.appointment.count({
        where: { date: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.patient.count(),
      prisma.medicalNote.count({
        where: { consultationDate: { gte: monthStart, lte: monthEnd } },
      }),
      prisma.appointment.findMany({
        where: { date: { gte: now }, status: "PENDIENTE" },
        include: { patient: { select: { fullName: true } } },
        orderBy: { date: "asc" },
        take: 5,
      }),
    ]);

  return NextResponse.json({
    todayAppointments,
    totalPatients,
    monthConsultations,
    upcomingAppointments,
  });
}
