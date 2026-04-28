import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { CalendarPlus, UserPlus, Search, Calendar, Users, ClipboardList, Clock } from "lucide-react";
import { WhatsAppBadge } from "./whatsapp-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const statusColors: Record<string, string> = {
  PENDIENTE: "bg-yellow-100 text-yellow-700",
  ATENDIDO: "bg-green-100 text-green-700",
  CANCELADO: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  PENDIENTE: "Pendiente",
  ATENDIDO: "Atendido",
  CANCELADO: "Cancelado",
};

export default async function DashboardPage() {
  const session = await auth();
  const isDoctor = session?.user.role === "MEDICO";
  const now = new Date();

  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const [todayCount, totalPatients, weekCount, monthConsultations, upcomingAppointments] =
    await Promise.all([
      prisma.appointment.count({
        where: { date: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.patient.count(),
      prisma.appointment.count({
        where: { date: { gte: weekStart, lte: weekEnd } },
      }),
      isDoctor
        ? prisma.medicalNote.count({
            where: { consultationDate: { gte: startOfMonth(now), lte: endOfMonth(now) } },
          })
        : Promise.resolve(0),
      prisma.appointment.findMany({
        where: { date: { gte: todayStart, lte: todayEnd }, status: "PENDIENTE" },
        include: { patient: { select: { fullName: true } } },
        orderBy: { date: "asc" },
        take: 8,
      }),
    ]);

  const greeting =
    now.getHours() < 12 ? "Buenos días" : now.getHours() < 19 ? "Buenas tardes" : "Buenas noches";

  const accentColor = isDoctor ? "#0D9488" : "#1E40AF";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          {greeting}, {session?.user.name.split(" ")[0]}
        </h1>
        <p className="text-slate-500 text-sm mt-1 capitalize">
          {format(now, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
        {isDoctor && <WhatsAppBadge />}
      </div>

      {/* Stats */}
      <div className={`grid grid-cols-1 gap-4 ${isDoctor ? "sm:grid-cols-3" : "sm:grid-cols-3"}`}>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Citas hoy</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{todayCount}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center">
                <Calendar className="w-5 h-5" style={{ color: accentColor }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {isDoctor ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total pacientes</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">{totalPatients}</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pacientes en espera</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">
                    {upcomingAppointments.filter((a) => a.status === "PENDIENTE").length}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#1E40AF]" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isDoctor ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Consultas este mes</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">{monthConsultations}</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Citas esta semana</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">{weekCount}</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-700">Acciones rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link href="/agenda?nueva=1">
              <Button className="text-white gap-2" style={{ backgroundColor: accentColor }}>
                <CalendarPlus className="w-4 h-4" />
                Nueva cita
              </Button>
            </Link>
            <Link href="/pacientes/nuevo">
              <Button variant="outline" className="gap-2 border-slate-200">
                <UserPlus className="w-4 h-4" />
                Nuevo paciente
              </Button>
            </Link>
            <Link href="/pacientes">
              <Button variant="outline" className="gap-2 border-slate-200">
                <Search className="w-4 h-4" />
                Buscar paciente
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Today's appointments */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-slate-700">
              Citas de hoy
            </CardTitle>
            <Link href="/agenda" className="text-xs font-medium hover:underline" style={{ color: accentColor }}>
              Ver agenda completa →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No hay citas registradas hoy</p>
              <p className="text-xs mt-1">Las citas del día aparecerán aquí</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${accentColor}18` }}
                    >
                      <Clock className="w-4 h-4" style={{ color: accentColor }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{appt.patient.fullName}</p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(appt.date), "HH:mm")}
                        {isDoctor && appt.reason ? ` · ${appt.reason}` : ""}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[appt.status]}`}>
                    {statusLabels[appt.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
