"use client";

import { format, differenceInYears } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { PrescriptionPDFButton } from "@/components/prescription-pdf-button";

interface Medication {
  name: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

interface Prescription {
  id: string;
  createdAt: string | Date;
  medications: unknown;
  notes?: string | null;
  note: {
    diagnosisDescription?: string | null;
    patient: { fullName: string; birthdate: string | Date };
    doctor: {
      name: string;
      specialty?: string | null;
      cedula?: string | null;
      clinicName?: string | null;
      clinicAddress?: string | null;
      clinicPhone?: string | null;
    };
  };
}

interface Props {
  prescription: Prescription;
  patientId: string;
}

export function PrescriptionView({ prescription, patientId }: Props) {
  const { note } = prescription;
  const medications = prescription.medications as Medication[];
  const age = differenceInYears(new Date(), new Date(note.patient.birthdate));

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href={`/pacientes/${patientId}`}>
            <Button variant="ghost" size="icon" className="text-slate-500">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Receta electrónica</h1>
            <p className="text-slate-500 text-sm">
              {format(new Date(prescription.createdAt), "d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
        </div>
        <PrescriptionPDFButton prescription={prescription} age={age} />
      </div>

      {/* Printable area */}
      <Card className="border border-slate-300 shadow-sm" id="prescription-print">
        <CardContent className="p-8 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start pb-4 border-b-2 border-[#0D9488]">
            <div>
              <p className="font-bold text-slate-800 text-lg">{note.doctor.name}</p>
              {note.doctor.specialty && <p className="text-sm text-slate-600">{note.doctor.specialty}</p>}
              {note.doctor.cedula && (
                <p className="text-xs text-slate-500 mt-1">Cédula Profesional: {note.doctor.cedula}</p>
              )}
              {note.doctor.clinicName && (
                <p className="text-xs text-slate-500 mt-1 font-medium">{note.doctor.clinicName}</p>
              )}
              {note.doctor.clinicAddress && (
                <p className="text-xs text-slate-400">{note.doctor.clinicAddress}</p>
              )}
              {note.doctor.clinicPhone && (
                <p className="text-xs text-slate-400">Tel: {note.doctor.clinicPhone}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Fecha de emisión:</p>
              <p className="font-semibold text-slate-700">
                {format(new Date(prescription.createdAt), "dd/MM/yyyy")}
              </p>
            </div>
          </div>

          {/* Patient */}
          <div className="flex justify-between text-sm">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Paciente</p>
              <p className="font-semibold text-slate-700 text-base">{note.patient.fullName}</p>
              <p className="text-slate-500 text-xs">{age} años</p>
            </div>
            {note.diagnosisDescription && (
              <div className="text-right max-w-xs">
                <p className="text-xs text-slate-400 uppercase tracking-wide">Diagnóstico</p>
                <p className="text-sm text-slate-600">{note.diagnosisDescription}</p>
              </div>
            )}
          </div>

          {/* Medications */}
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-3">
              Medicamentos prescritos
            </p>
            <div className="space-y-4">
              {medications.map((med, i) => (
                <div key={i} className="flex gap-4 pb-4 border-b border-slate-100 last:border-0">
                  <div className="w-6 h-6 rounded-full bg-[#0D9488] text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{med.name}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-600 mt-1">
                      <span>Dosis: <strong>{med.dose}</strong></span>
                      <span>Vía: <strong>{med.route}</strong></span>
                      <span>Frecuencia: <strong>{med.frequency}</strong></span>
                      <span>Duración: <strong>{med.duration}</strong></span>
                    </div>
                    {med.instructions && (
                      <p className="text-xs text-slate-500 mt-1 italic">{med.instructions}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {prescription.notes && (
            <div className="p-3 rounded-lg bg-slate-50 text-xs text-slate-600">
              <p className="font-semibold mb-1">Indicaciones generales:</p>
              <p>{prescription.notes}</p>
            </div>
          )}

          {/* Signature */}
          <div className="flex justify-between items-end pt-6 border-t border-slate-200">
            <div className="text-center">
              <div className="w-48 border-b border-slate-400 mb-1 h-10"></div>
              <p className="text-xs text-slate-600 font-semibold">{note.doctor.name}</p>
              {note.doctor.specialty && <p className="text-xs text-slate-400">{note.doctor.specialty}</p>}
              {note.doctor.cedula && <p className="text-xs text-slate-400">Cédula: {note.doctor.cedula}</p>}
            </div>
            <div className="text-right text-xs text-slate-400">
              <p className="font-medium text-slate-500">Receta válida por 30 días</p>
              <p>a partir del {format(new Date(prescription.createdAt), "dd/MM/yyyy")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
