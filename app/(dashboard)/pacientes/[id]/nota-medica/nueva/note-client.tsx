"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format, differenceInYears } from "date-fns";
import { Loader2, Save, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { searchCIE10 } from "@/lib/cie10";

const noteSchema = z.object({
  consultationDate: z.string().min(1),
  reasonForVisit: z.string().min(1, "Motivo requerido"),
  bloodPressure: z.string().optional(),
  heartRate: z.string().optional(),
  respiratoryRate: z.string().optional(),
  temperature: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  oxygenSat: z.string().optional(),
  physicalExam: z.string().optional(),
  diagnosisCode: z.string().optional(),
  diagnosisDescription: z.string().optional(),
  treatmentPlan: z.string().min(1, "Plan de tratamiento requerido"),
  prognosis: z.string().optional(),
});

type NoteForm = z.infer<typeof noteSchema>;

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
}

interface Props {
  patient: Patient;
  doctor: Doctor | null;
}

export function MedicalNoteClient({ patient, doctor }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [cie10Query, setCie10Query] = useState("");
  const [cie10Results, setCie10Results] = useState<{ code: string; description: string }[]>([]);
  const [selectedDx, setSelectedDx] = useState<{ code: string; description: string } | null>(null);
  const [showCie10, setShowCie10] = useState(false);
  const cie10Ref = useRef<HTMLDivElement>(null);

  const age = differenceInYears(new Date(), new Date(patient.birthdate));

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<NoteForm>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      consultationDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    },
  });

  const weight = watch("weight");
  const height = watch("height");

  useEffect(() => {
    const w = parseFloat(weight || "0");
    const h = parseFloat(height || "0") / 100;
    if (w > 0 && h > 0) {
      setValue("height", height); // trigger re-render only
    }
  }, [weight, height, setValue]);

  const bmi =
    parseFloat(weight || "0") > 0 && parseFloat(height || "0") > 0
      ? (parseFloat(weight!) / Math.pow(parseFloat(height!) / 100, 2)).toFixed(1)
      : null;

  useEffect(() => {
    const results = searchCIE10(cie10Query);
    setCie10Results(results);
  }, [cie10Query]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (cie10Ref.current && !cie10Ref.current.contains(e.target as Node)) {
        setShowCie10(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectDx = (item: { code: string; description: string }) => {
    setSelectedDx(item);
    setValue("diagnosisCode", item.code);
    setValue("diagnosisDescription", item.description);
    setCie10Query(`${item.code} – ${item.description}`);
    setShowCie10(false);
  };

  const onSubmit = async (data: NoteForm) => {
    setSaving(true);
    try {
      const w = parseFloat(data.weight || "0") || null;
      const h = parseFloat(data.height || "0") || null;
      const bmiVal = w && h ? parseFloat((w / Math.pow(h / 100, 2)).toFixed(1)) : null;

      const payload = {
        patientId: patient.id,
        consultationDate: new Date(data.consultationDate).toISOString(),
        reasonForVisit: data.reasonForVisit,
        bloodPressure: data.bloodPressure || null,
        heartRate: data.heartRate ? parseInt(data.heartRate) : null,
        respiratoryRate: data.respiratoryRate ? parseInt(data.respiratoryRate) : null,
        temperature: data.temperature ? parseFloat(data.temperature) : null,
        weight: w,
        height: h,
        bmi: bmiVal,
        oxygenSat: data.oxygenSat ? parseFloat(data.oxygenSat) : null,
        physicalExam: data.physicalExam || null,
        diagnosisCode: data.diagnosisCode || null,
        diagnosisDescription: data.diagnosisDescription || null,
        treatmentPlan: data.treatmentPlan,
        prognosis: data.prognosis || null,
      };

      const res = await fetch("/api/medical-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();
      const note = await res.json();
      toast.success("Nota médica guardada");
      router.push(`/pacientes/${patient.id}/nota-medica/${note.id}`);
    } catch {
      toast.error("Error al guardar la nota médica");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href={`/pacientes/${patient.id}`}>
          <Button variant="ghost" size="icon" className="text-slate-500">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Nueva nota médica</h1>
          <p className="text-slate-500 text-sm">
            {patient.fullName} · {age} años · SOAP (NOM-004-SSA3-2012)
          </p>
        </div>
      </div>

      {/* Doctor info banner */}
      {doctor && (
        <div className="p-3 rounded-lg bg-teal-50 border border-teal-100 text-xs text-slate-600">
          <span className="font-semibold text-[#0D9488]">Dr. {doctor.name}</span>
          {doctor.specialty && ` · ${doctor.specialty}`}
          {doctor.cedula && ` · Cédula: ${doctor.cedula}`}
          {doctor.clinicName && ` · ${doctor.clinicName}`}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Fecha y hora */}
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5">
            <div className="space-y-1.5">
              <Label>Fecha y hora de la consulta *</Label>
              <Input
                type="datetime-local"
                {...register("consultationDate")}
                className={errors.consultationDate ? "border-red-500" : ""}
              />
            </div>
          </CardContent>
        </Card>

        {/* S – Subjetivo */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-700">
              S – Subjetivo
              <span className="text-xs font-normal text-slate-400 ml-2">(Motivo de consulta)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label>Motivo de consulta *</Label>
              <Textarea
                rows={3}
                placeholder="Descripción del motivo de consulta según el paciente..."
                {...register("reasonForVisit")}
                className={errors.reasonForVisit ? "border-red-500" : ""}
              />
              {errors.reasonForVisit && <p className="text-xs text-red-500">{errors.reasonForVisit.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* O – Objetivo */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-700">
              O – Objetivo
              <span className="text-xs font-normal text-slate-400 ml-2">(Exploración física)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Signos vitales */}
            <div>
              <p className="text-sm font-semibold text-slate-600 mb-3">Signos vitales</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">T/A (mmHg)</Label>
                  <Input placeholder="120/80" {...register("bloodPressure")} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">FC (lpm)</Label>
                  <Input type="number" placeholder="72" {...register("heartRate")} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">FR (rpm)</Label>
                  <Input type="number" placeholder="16" {...register("respiratoryRate")} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Temp (°C)</Label>
                  <Input type="number" step="0.1" placeholder="36.5" {...register("temperature")} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Peso (kg)</Label>
                  <Input type="number" step="0.1" placeholder="70" {...register("weight")} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Talla (cm)</Label>
                  <Input type="number" placeholder="170" {...register("height")} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">IMC</Label>
                  <div className="h-9 px-3 flex items-center rounded-md border border-slate-200 bg-slate-50 text-sm font-mono text-slate-600">
                    {bmi || "—"}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">SatO₂ (%)</Label>
                  <Input type="number" step="0.1" max="100" placeholder="98" {...register("oxygenSat")} />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-1.5">
              <Label>Exploración por aparatos y sistemas</Label>
              <Textarea
                rows={5}
                placeholder={`Cabeza y cuello: ...\nTórax: ...\nAbdomen: ...\nExtremidades: ...\nNeurológico: ...`}
                {...register("physicalExam")}
              />
            </div>
          </CardContent>
        </Card>

        {/* A – Análisis / Diagnóstico */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-700">
              A – Análisis
              <span className="text-xs font-normal text-slate-400 ml-2">(Diagnóstico)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* CIE-10 selector */}
            <div className="space-y-1.5" ref={cie10Ref}>
              <Label>Diagnóstico (CIE-10)</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  className="pl-9"
                  placeholder="Buscar por código o nombre (ej. diabetes, J00...)"
                  value={cie10Query}
                  onChange={(e) => { setCie10Query(e.target.value); setShowCie10(true); }}
                  onFocus={() => setShowCie10(true)}
                />
                {showCie10 && cie10Results.length > 0 && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                    {cie10Results.map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        className="w-full text-left px-3 py-2.5 hover:bg-slate-50 text-sm border-b last:border-0 border-slate-50"
                        onClick={() => selectDx(item)}
                      >
                        <span className="font-mono text-[#0D9488] font-semibold text-xs">{item.code}</span>
                        <span className="ml-2 text-slate-700">{item.description}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedDx && (
                <p className="text-xs text-[#0D9488] font-medium">
                  ✓ {selectedDx.code} — {selectedDx.description}
                </p>
              )}
              <input type="hidden" {...register("diagnosisCode")} />
              <input type="hidden" {...register("diagnosisDescription")} />
            </div>
          </CardContent>
        </Card>

        {/* P – Plan */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-700">
              P – Plan
              <span className="text-xs font-normal text-slate-400 ml-2">(Tratamiento)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Plan de tratamiento *</Label>
              <Textarea
                rows={4}
                placeholder="Indicaciones, medicamentos, procedimientos, estudios..."
                {...register("treatmentPlan")}
                className={errors.treatmentPlan ? "border-red-500" : ""}
              />
              {errors.treatmentPlan && <p className="text-xs text-red-500">{errors.treatmentPlan.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Pronóstico</Label>
              <Input placeholder="Ej. Favorable, reservado, etc." {...register("prognosis")} />
            </div>
          </CardContent>
        </Card>

        {/* Firma */}
        <Card className="border-0 shadow-sm bg-slate-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="font-semibold text-slate-700">Dr. {doctor?.name}</p>
                {doctor?.specialty && <p className="text-xs text-slate-500">{doctor.specialty}</p>}
                {doctor?.cedula && <p className="text-xs text-slate-500">Cédula: {doctor.cedula}</p>}
              </div>
              <div className="text-right text-xs text-slate-400">
                <p>NOM-004-SSA3-2012</p>
                <p>La nota será bloqueada al guardar</p>
              </div>
            </div>
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
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Guardando..." : "Guardar nota médica"}
          </Button>
        </div>
      </form>
    </div>
  );
}
