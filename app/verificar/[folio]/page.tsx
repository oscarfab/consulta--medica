import { prisma } from "@/lib/prisma";
import { format, differenceInYears, isPast } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle, XCircle, Stethoscope } from "lucide-react";

export default async function VerificarPage({ params }: { params: Promise<{ folio: string }> }) {
  const { folio } = await params;

  const prescription = await prisma.prescription.findUnique({
    where: { folio },
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

  if (!prescription) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Receta no encontrada</h1>
          <p className="text-slate-500 text-sm">
            El folio <strong>{folio}</strong> no corresponde a ninguna receta en el sistema.
          </p>
        </div>
      </div>
    );
  }

  const isExpired = isPast(new Date(prescription.validUntil));
  const patient = prescription.note.patient;
  const doctor = prescription.note.doctor;
  const meds = prescription.medications as Array<{
    name: string;
    dose: string;
    route: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  const age = differenceInYears(new Date(), new Date(patient.birthdate));

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Status banner */}
        <div
          className={`rounded-xl p-4 mb-6 flex items-center gap-3 ${
            isExpired
              ? "bg-red-50 border border-red-200"
              : "bg-green-50 border border-green-200"
          }`}
        >
          {isExpired ? (
            <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
          ) : (
            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
          )}
          <div>
            <p className={`font-bold text-sm ${isExpired ? "text-red-700" : "text-green-700"}`}>
              {isExpired ? "RECETA CADUCADA" : "RECETA VERIFICADA"}
            </p>
            <p className={`text-xs ${isExpired ? "text-red-600" : "text-green-600"}`}>
              {isExpired
                ? `Esta receta caducó el ${format(new Date(prescription.validUntil), "dd/MM/yyyy")}`
                : `Válida hasta el ${format(new Date(prescription.validUntil), "dd 'de' MMMM 'de' yyyy", { locale: es })}`}
            </p>
          </div>
        </div>

        {/* Main document */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

          {/* Header */}
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#0D9488] flex items-center justify-center flex-shrink-0">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800">{doctor.name}</p>
                {doctor.specialty && <p className="text-sm text-slate-600">{doctor.specialty}</p>}
                {doctor.cedula && (
                  <p className="text-xs text-slate-500">Cédula profesional: {doctor.cedula}</p>
                )}
              </div>
              <div className="text-right">
                {doctor.clinicName && (
                  <p className="text-sm font-medium text-slate-700">{doctor.clinicName}</p>
                )}
                {doctor.clinicPhone && (
                  <p className="text-xs text-slate-500">{doctor.clinicPhone}</p>
                )}
                {doctor.clinicAddress && (
                  <p className="text-xs text-slate-400">{doctor.clinicAddress}</p>
                )}
              </div>
            </div>
          </div>

          {/* Patient info */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Paciente</p>
                <p className="font-semibold text-slate-800">{patient.fullName}</p>
                <p className="text-sm text-slate-500">{age} años</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 uppercase tracking-wide">Folio</p>
                <p className="font-mono font-bold text-slate-800">{prescription.folio}</p>
                <p className="text-xs text-slate-500">
                  {format(new Date(prescription.createdAt), "dd/MM/yyyy")}
                </p>
              </div>
            </div>
          </div>

          {/* Diagnosis */}
          {prescription.diagnosis && (
            <div className="px-6 py-3 border-b border-slate-100">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Diagnóstico</p>
              <p className="text-sm text-slate-700">{prescription.diagnosis}</p>
            </div>
          )}

          {/* Medications */}
          <div className="p-6">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">Medicamentos prescritos</p>
            <div className="space-y-3">
              {meds.map((med, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="font-semibold text-slate-800 text-sm">{med.name}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                    <p className="text-xs text-slate-500">Dosis: {med.dose}</p>
                    <p className="text-xs text-slate-500">Vía: {med.route}</p>
                    <p className="text-xs text-slate-500">Frecuencia: {med.frequency}</p>
                    <p className="text-xs text-slate-500">Duración: {med.duration}</p>
                  </div>
                  {med.instructions && (
                    <p className="text-xs text-slate-400 mt-1 italic">{med.instructions}</p>
                  )}
                </div>
              ))}
            </div>

            {prescription.notes && (
              <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-100">
                <p className="text-xs text-amber-700 font-semibold mb-1">Indicaciones generales</p>
                <p className="text-sm text-amber-800">{prescription.notes}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              Receta válida por 30 días a partir del{" "}
              {format(new Date(prescription.createdAt), "dd/MM/yyyy")}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Este documento es una receta electrónica generada digitalmente por MediConsulta
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
