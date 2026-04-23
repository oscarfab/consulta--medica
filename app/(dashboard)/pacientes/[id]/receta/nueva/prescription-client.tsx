"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format, differenceInYears } from "date-fns";
import { Plus, Trash2, ArrowLeft, Loader2, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const medicationSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  dose: z.string().min(1, "Dosis requerida"),
  route: z.string().min(1),
  frequency: z.string().min(1),
  duration: z.string().min(1),
  instructions: z.string().optional(),
});

const prescriptionSchema = z.object({
  medications: z.array(medicationSchema).min(1, "Agrega al menos un medicamento"),
  notes: z.string().optional(),
});

type PrescriptionForm = z.infer<typeof prescriptionSchema>;

interface Patient {
  id: string;
  fullName: string;
  birthdate: Date | string;
}

interface Doctor {
  id?: string;
  name?: string;
  specialty?: string | null;
  cedula?: string | null;
  clinicName?: string | null;
  clinicAddress?: string | null;
  clinicPhone?: string | null;
}

interface Props {
  patient: Patient;
  doctor: Doctor | null;
  noteId?: string;
  note?: { id: string; diagnosisDescription?: string | null } | null;
}

const ROUTES = ["Oral", "Sublingual", "IV", "IM", "Subcutánea", "Tópica", "Inhalatoria", "Rectal", "Ótica", "Oftálmica", "Nasal"];
const FREQUENCIES = ["Cada 4 horas", "Cada 6 horas", "Cada 8 horas", "Cada 12 horas", "Cada 24 horas", "Una vez al día", "Dos veces al día", "Tres veces al día", "Según necesidad"];

export function PrescriptionClient({ patient, doctor, noteId, note }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const age = differenceInYears(new Date(), new Date(patient.birthdate));

  const { register, handleSubmit, control, formState: { errors } } = useForm<PrescriptionForm>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      medications: [{ name: "", dose: "", route: "Oral", frequency: "Cada 8 horas", duration: "", instructions: "" }],
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "medications" });

  const onSubmit = async (data: PrescriptionForm) => {
    setSaving(true);
    try {
      let finalNoteId = noteId;

      // If no noteId, we need one — create a minimal note or show error
      if (!finalNoteId) {
        toast.error("Debes crear una nota médica primero para generar la receta");
        return;
      }

      const res = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId: finalNoteId, ...data }),
      });

      if (!res.ok) throw new Error();
      const prescription = await res.json();
      toast.success("Receta guardada");
      router.push(`/pacientes/${patient.id}/receta/${prescription.id}`);
    } catch {
      toast.error("Error al guardar la receta");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href={`/pacientes/${patient.id}`}>
          <Button variant="ghost" size="icon" className="text-slate-500">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Nueva receta electrónica</h1>
          <p className="text-slate-500 text-sm">{patient.fullName} · {age} años</p>
        </div>
      </div>

      {/* Preview header */}
      <Card className="border border-[#0D9488]/30 bg-teal-50/50">
        <CardContent className="pt-4">
          <div className="flex justify-between text-sm">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Médico</p>
              <p className="font-bold text-slate-700">{doctor?.name || "—"}</p>
              {doctor?.specialty && <p className="text-xs text-slate-600">{doctor.specialty}</p>}
              {doctor?.cedula && <p className="text-xs text-slate-600">Cédula: {doctor.cedula}</p>}
              {doctor?.clinicName && <p className="text-xs text-slate-500 mt-1">{doctor.clinicName}</p>}
              {doctor?.clinicAddress && <p className="text-xs text-slate-500">{doctor.clinicAddress}</p>}
              {doctor?.clinicPhone && <p className="text-xs text-slate-500">{doctor.clinicPhone}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Paciente</p>
              <p className="font-bold text-slate-700">{patient.fullName}</p>
              <p className="text-xs text-slate-600">{age} años</p>
              <p className="text-xs text-slate-500 mt-1">{format(new Date(), "dd/MM/yyyy")}</p>
            </div>
          </div>
          {note?.diagnosisDescription && (
            <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-teal-100">
              Dx: {note.diagnosisDescription}
            </p>
          )}
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Medications */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-slate-700">Medicamentos</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => append({ name: "", dose: "", route: "Oral", frequency: "Cada 8 horas", duration: "", instructions: "" })}
                className="gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar medicamento
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 rounded-lg bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-600">Medicamento {index + 1}</p>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-500 hover:bg-red-50 h-7 px-2"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nombre del medicamento *</Label>
                    <Input
                      placeholder="Ej. Amoxicilina"
                      {...register(`medications.${index}.name`)}
                      className={errors.medications?.[index]?.name ? "border-red-500" : ""}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Dosis *</Label>
                    <Input
                      placeholder="Ej. 500 mg"
                      {...register(`medications.${index}.dose`)}
                      className={errors.medications?.[index]?.dose ? "border-red-500" : ""}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Vía de administración</Label>
                    <select
                      {...register(`medications.${index}.route`)}
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      {ROUTES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Frecuencia</Label>
                    <select
                      {...register(`medications.${index}.frequency`)}
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Duración *</Label>
                    <Input
                      placeholder="Ej. 7 días"
                      {...register(`medications.${index}.duration`)}
                      className={errors.medications?.[index]?.duration ? "border-red-500" : ""}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Indicaciones especiales</Label>
                  <Input
                    placeholder="Ej. Tomar con alimentos, no ingerir alcohol..."
                    {...register(`medications.${index}.instructions`)}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-700">Notas adicionales</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={3}
              placeholder="Indicaciones generales, restricciones, próxima cita..."
              {...register("notes")}
            />
          </CardContent>
        </Card>

        {/* Footer preview */}
        <Card className="border-0 shadow-sm bg-slate-50">
          <CardContent className="pt-4 text-center text-xs text-slate-400">
            <p>Receta válida por 30 días a partir de la fecha de emisión</p>
            <p className="mt-0.5">Medicamento(s) sujeto(s) a disponibilidad</p>
          </CardContent>
        </Card>

        <div className="flex gap-3 pb-8">
          <Link href={`/pacientes/${patient.id}`}>
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
          <Button
            type="submit"
            disabled={saving}
            className="bg-[#0D9488] hover:bg-[#0f766e] text-white gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            {saving ? "Guardando..." : "Guardar receta"}
          </Button>
        </div>
      </form>
    </div>
  );
}
