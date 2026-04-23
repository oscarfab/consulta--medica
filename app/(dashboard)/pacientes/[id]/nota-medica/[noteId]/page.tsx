import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format, differenceInYears, isToday } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { ArrowLeft, FileText, Lock, Unlock, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default async function MedicalNoteViewPage({
  params,
}: {
  params: Promise<{ id: string; noteId: string }>;
}) {
  const { id, noteId } = await params;

  const note = await prisma.medicalNote.findUnique({
    where: { id: noteId },
    include: {
      patient: { select: { id: true, fullName: true, birthdate: true } },
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
      prescription: { select: { id: true } },
    },
  });

  if (!note || note.patient.id !== id) notFound();

  const age = differenceInYears(new Date(), note.patient.birthdate);
  const canEdit = isToday(note.consultationDate);

  const Row = ({ label, value }: { label: string; value?: string | number | null }) => (
    value ? (
      <div>
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm text-slate-700 mt-0.5 whitespace-pre-wrap">{String(value)}</p>
      </div>
    ) : null
  );

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href={`/pacientes/${id}`}>
            <Button variant="ghost" size="icon" className="text-slate-500">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Nota médica</h1>
            <p className="text-slate-500 text-sm">
              {format(note.consultationDate, "d 'de' MMMM 'de' yyyy — HH:mm", { locale: es })}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {canEdit && (
            <Link href={`/pacientes/${id}/nota-medica/${noteId}/editar`}>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Unlock className="w-3.5 h-3.5" />
                Editar (hoy)
              </Button>
            </Link>
          )}
          {note.prescription ? (
            <Link href={`/pacientes/${id}/receta/${note.prescription.id}`}>
              <Button size="sm" variant="outline" className="gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Ver receta
              </Button>
            </Link>
          ) : (
            <Link href={`/pacientes/${id}/receta/nueva?nota=${noteId}`}>
              <Button size="sm" className="bg-[#0D9488] hover:bg-[#0f766e] text-white gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Generar receta
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Lock indicator */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
        canEdit ? "bg-yellow-50 text-yellow-700 border border-yellow-100" : "bg-slate-50 text-slate-500 border border-slate-200"
      }`}>
        {canEdit ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
        {canEdit ? "Esta nota puede editarse (consulta de hoy)" : "Nota bloqueada — NOM-004-SSA3-2012 no permite alteraciones"}
      </div>

      {/* Patient info */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-4">
          <div className="flex justify-between items-start text-sm">
            <div>
              <p className="font-bold text-slate-700">{note.patient.fullName}</p>
              <p className="text-slate-500 text-xs">{age} años</p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p className="font-semibold">{note.doctor.name}</p>
              {note.doctor.specialty && <p>{note.doctor.specialty}</p>}
              {note.doctor.cedula && <p>Cédula: {note.doctor.cedula}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* S – Subjetivo */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-[#0D9488] uppercase tracking-wide">
            S — Subjetivo (Motivo de consulta)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">
            {note.reasonForVisit || <span className="text-slate-400 italic">No registrado</span>}
          </p>
        </CardContent>
      </Card>

      {/* O – Objetivo */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-[#0D9488] uppercase tracking-wide">
            O — Objetivo (Exploración física)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Signos vitales */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {note.bloodPressure && (
              <div className="p-2.5 rounded-lg bg-slate-50 text-center">
                <p className="text-xs text-slate-400">T/A</p>
                <p className="font-bold text-slate-700">{note.bloodPressure}</p>
                <p className="text-xs text-slate-400">mmHg</p>
              </div>
            )}
            {note.heartRate && (
              <div className="p-2.5 rounded-lg bg-slate-50 text-center">
                <p className="text-xs text-slate-400">FC</p>
                <p className="font-bold text-slate-700">{note.heartRate}</p>
                <p className="text-xs text-slate-400">lpm</p>
              </div>
            )}
            {note.respiratoryRate && (
              <div className="p-2.5 rounded-lg bg-slate-50 text-center">
                <p className="text-xs text-slate-400">FR</p>
                <p className="font-bold text-slate-700">{note.respiratoryRate}</p>
                <p className="text-xs text-slate-400">rpm</p>
              </div>
            )}
            {note.temperature && (
              <div className="p-2.5 rounded-lg bg-slate-50 text-center">
                <p className="text-xs text-slate-400">Temp</p>
                <p className="font-bold text-slate-700">{note.temperature}</p>
                <p className="text-xs text-slate-400">°C</p>
              </div>
            )}
            {note.weight && (
              <div className="p-2.5 rounded-lg bg-slate-50 text-center">
                <p className="text-xs text-slate-400">Peso</p>
                <p className="font-bold text-slate-700">{note.weight}</p>
                <p className="text-xs text-slate-400">kg</p>
              </div>
            )}
            {note.height && (
              <div className="p-2.5 rounded-lg bg-slate-50 text-center">
                <p className="text-xs text-slate-400">Talla</p>
                <p className="font-bold text-slate-700">{note.height}</p>
                <p className="text-xs text-slate-400">cm</p>
              </div>
            )}
            {note.bmi && (
              <div className="p-2.5 rounded-lg bg-slate-50 text-center">
                <p className="text-xs text-slate-400">IMC</p>
                <p className="font-bold text-slate-700">{note.bmi}</p>
                <p className="text-xs text-slate-400">kg/m²</p>
              </div>
            )}
            {note.oxygenSat && (
              <div className="p-2.5 rounded-lg bg-slate-50 text-center">
                <p className="text-xs text-slate-400">SatO₂</p>
                <p className="font-bold text-slate-700">{note.oxygenSat}</p>
                <p className="text-xs text-slate-400">%</p>
              </div>
            )}
          </div>

          {note.physicalExam && (
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">
                Exploración por aparatos y sistemas
              </p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.physicalExam}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* A – Análisis */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-[#0D9488] uppercase tracking-wide">
            A — Análisis (Diagnóstico)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {note.diagnosisDescription ? (
            <div className="flex items-start gap-3">
              {note.diagnosisCode && (
                <Badge className="bg-[#0D9488]/10 text-[#0D9488] border-[#0D9488]/20 font-mono text-xs mt-0.5">
                  {note.diagnosisCode}
                </Badge>
              )}
              <p className="text-sm text-slate-700">{note.diagnosisDescription}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">Sin diagnóstico registrado</p>
          )}
        </CardContent>
      </Card>

      {/* P – Plan */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-[#0D9488] uppercase tracking-wide">
            P — Plan de tratamiento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {note.treatmentPlan && (
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.treatmentPlan}</p>
          )}
          {note.prognosis && (
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Pronóstico</p>
              <p className="text-sm text-slate-700 mt-0.5">{note.prognosis}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Firma */}
      <Card className="border-0 shadow-sm bg-slate-50">
        <CardContent className="pt-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Firma del médico</p>
              <p className="font-bold text-slate-700">{note.doctor.name}</p>
              {note.doctor.specialty && <p className="text-xs text-slate-500">{note.doctor.specialty}</p>}
              {note.doctor.cedula && (
                <p className="text-xs text-slate-500">Cédula Profesional: {note.doctor.cedula}</p>
              )}
              {note.doctor.clinicName && <p className="text-xs text-slate-500">{note.doctor.clinicName}</p>}
            </div>
            <div className="text-right text-xs text-slate-400">
              <p>Fecha: {format(note.consultationDate, "dd/MM/yyyy HH:mm")}</p>
              <p className="mt-1">NOM-004-SSA3-2012</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
