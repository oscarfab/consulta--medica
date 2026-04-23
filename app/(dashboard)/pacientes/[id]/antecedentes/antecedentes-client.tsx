"use client";

import { useForm, Controller } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface AntecedentesForm {
  hfDiabetes: boolean;
  hfHypertension: boolean;
  hfCancer: boolean;
  hfCardiopathy: boolean;
  hfObesity: boolean;
  hfAsthma: boolean;
  hfNephropathy: boolean;
  hfPsychiatric: boolean;
  hfOther: string;

  ppDiseases: string;
  ppSurgeries: string;
  ppHospitalizations: string;
  ppTraumas: string;
  ppTransfusions: string;

  pnpSmoking: string;
  pnpAlcohol: string;
  pnpDrugs: string;
  pnpDiet: string;
  pnpExercise: string;
  pnpHousing: string;
  pnpOccupation: string;

  goMenarca: string;
  goIvsa: string;
  goGestas: string;
  goPartos: string;
  goAborts: string;
  goCesareas: string;
  goFup: string;
  goMenopause: string;
  goOther: string;

  allergyMedications: string;
  allergyFood: string;
  allergyEnvironmental: string;
  currentMedications: string;
}

interface Props {
  patientId: string;
  patientName: string;
  patientSex: string;
  existing: Record<string, unknown> | null;
}

export function AntecedentesClient({ patientId, patientName, patientSex, existing }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const isFemale = patientSex === "FEMENINO";

  const { register, handleSubmit, control } = useForm<AntecedentesForm>({
    defaultValues: {
      hfDiabetes: (existing?.hfDiabetes as boolean) || false,
      hfHypertension: (existing?.hfHypertension as boolean) || false,
      hfCancer: (existing?.hfCancer as boolean) || false,
      hfCardiopathy: (existing?.hfCardiopathy as boolean) || false,
      hfObesity: (existing?.hfObesity as boolean) || false,
      hfAsthma: (existing?.hfAsthma as boolean) || false,
      hfNephropathy: (existing?.hfNephropathy as boolean) || false,
      hfPsychiatric: (existing?.hfPsychiatric as boolean) || false,
      hfOther: (existing?.hfOther as string) || "",
      ppDiseases: (existing?.ppDiseases as string) || "",
      ppSurgeries: (existing?.ppSurgeries as string) || "",
      ppHospitalizations: (existing?.ppHospitalizations as string) || "",
      ppTraumas: (existing?.ppTraumas as string) || "",
      ppTransfusions: (existing?.ppTransfusions as string) || "",
      pnpSmoking: (existing?.pnpSmoking as string) || "",
      pnpAlcohol: (existing?.pnpAlcohol as string) || "",
      pnpDrugs: (existing?.pnpDrugs as string) || "",
      pnpDiet: (existing?.pnpDiet as string) || "",
      pnpExercise: (existing?.pnpExercise as string) || "",
      pnpHousing: (existing?.pnpHousing as string) || "",
      pnpOccupation: (existing?.pnpOccupation as string) || "",
      goMenarca: (existing?.goMenarca as string) || "",
      goIvsa: (existing?.goIvsa as string) || "",
      goGestas: existing?.goGestas != null ? String(existing.goGestas) : "",
      goPartos: existing?.goPartos != null ? String(existing.goPartos) : "",
      goAborts: existing?.goAborts != null ? String(existing.goAborts) : "",
      goCesareas: existing?.goCesareas != null ? String(existing.goCesareas) : "",
      goFup: (existing?.goFup as string) || "",
      goMenopause: (existing?.goMenopause as string) || "",
      goOther: (existing?.goOther as string) || "",
      allergyMedications: (existing?.allergyMedications as string) || "",
      allergyFood: (existing?.allergyFood as string) || "",
      allergyEnvironmental: (existing?.allergyEnvironmental as string) || "",
      currentMedications: (existing?.currentMedications as string) || "",
    },
  });

  const onSubmit = async (data: AntecedentesForm) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        goGestas: data.goGestas ? parseInt(data.goGestas) : null,
        goPartos: data.goPartos ? parseInt(data.goPartos) : null,
        goAborts: data.goAborts ? parseInt(data.goAborts) : null,
        goCesareas: data.goCesareas ? parseInt(data.goCesareas) : null,
      };

      const res = await fetch(`/api/patients/${patientId}/antecedentes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();
      toast.success("Antecedentes guardados correctamente");
      router.push(`/pacientes/${patientId}`);
    } catch {
      toast.error("Error al guardar los antecedentes");
    } finally {
      setSaving(false);
    }
  };

  const CheckField = ({ name, label }: { name: keyof AntecedentesForm; label: string }) => (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex items-center gap-2">
          <Checkbox
            id={name}
            checked={!!field.value}
            onCheckedChange={field.onChange}
            className="data-[state=checked]:bg-[#0D9488] data-[state=checked]:border-[#0D9488]"
          />
          <label htmlFor={name} className="text-sm cursor-pointer">{label}</label>
        </div>
      )}
    />
  );

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href={`/pacientes/${patientId}`}>
          <Button variant="ghost" size="icon" className="text-slate-500">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Antecedentes clínicos</h1>
          <p className="text-slate-500 text-sm">{patientName} · NOM-004-SSA3-2012</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Heredo-familiares */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-700">I. Heredo-familiares</CardTitle>
            <p className="text-xs text-slate-500">Enfermedades presentes en familiares directos</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <CheckField name="hfDiabetes" label="Diabetes" />
              <CheckField name="hfHypertension" label="Hipertensión" />
              <CheckField name="hfCancer" label="Cáncer" />
              <CheckField name="hfCardiopathy" label="Cardiopatías" />
              <CheckField name="hfObesity" label="Obesidad" />
              <CheckField name="hfAsthma" label="Asma" />
              <CheckField name="hfNephropathy" label="Nefropatía" />
              <CheckField name="hfPsychiatric" label="Psiquiátricas" />
            </div>
            <div className="space-y-1.5">
              <Label>Otros antecedentes heredofamiliares</Label>
              <Textarea rows={2} placeholder="Especificar otras enfermedades hereditarias..." {...register("hfOther")} />
            </div>
          </CardContent>
        </Card>

        {/* Personales patológicos */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-700">II. Personales patológicos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Enfermedades previas</Label>
                <Textarea rows={2} placeholder="Diabetes, hipertensión, etc." {...register("ppDiseases")} />
              </div>
              <div className="space-y-1.5">
                <Label>Cirugías</Label>
                <Textarea rows={2} placeholder="Apendicectomía (2015), etc." {...register("ppSurgeries")} />
              </div>
              <div className="space-y-1.5">
                <Label>Hospitalizaciones</Label>
                <Textarea rows={2} placeholder="Motivo y fecha..." {...register("ppHospitalizations")} />
              </div>
              <div className="space-y-1.5">
                <Label>Traumatismos</Label>
                <Textarea rows={2} placeholder="Fracturas, accidentes, etc." {...register("ppTraumas")} />
              </div>
              <div className="space-y-1.5">
                <Label>Transfusiones</Label>
                <Textarea rows={2} placeholder="Especificar si aplica..." {...register("ppTransfusions")} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personales no patológicos */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-700">III. Personales no patológicos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tabaquismo</Label>
                <Input placeholder="Ej. No fuma / 10 cigarrillos/día por 5 años" {...register("pnpSmoking")} />
              </div>
              <div className="space-y-1.5">
                <Label>Alcoholismo</Label>
                <Input placeholder="Ej. Ocasional / Diario" {...register("pnpAlcohol")} />
              </div>
              <div className="space-y-1.5">
                <Label>Toxicomanías</Label>
                <Input placeholder="Ej. Ninguna / Especificar" {...register("pnpDrugs")} />
              </div>
              <div className="space-y-1.5">
                <Label>Alimentación</Label>
                <Input placeholder="Ej. Balanceada / Hipercalórica" {...register("pnpDiet")} />
              </div>
              <div className="space-y-1.5">
                <Label>Ejercicio</Label>
                <Input placeholder="Ej. 3 veces/semana 30 min" {...register("pnpExercise")} />
              </div>
              <div className="space-y-1.5">
                <Label>Vivienda</Label>
                <Input placeholder="Ej. Casa propia, agua potable, drenaje" {...register("pnpHousing")} />
              </div>
              <div className="space-y-1.5">
                <Label>Ocupación</Label>
                <Input placeholder="Ej. Empleado de oficina" {...register("pnpOccupation")} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gineco-obstétricos (solo femenino) */}
        {isFemale && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-slate-700">IV. Gineco-obstétricos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Menarca</Label>
                  <Input placeholder="Ej. 13 años" {...register("goMenarca")} />
                </div>
                <div className="space-y-1.5">
                  <Label>IVSA (Inicio vida sexual activa)</Label>
                  <Input placeholder="Ej. 18 años" {...register("goIvsa")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Gestas</Label>
                  <Input type="number" min="0" placeholder="0" {...register("goGestas")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Partos</Label>
                  <Input type="number" min="0" placeholder="0" {...register("goPartos")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Abortos</Label>
                  <Input type="number" min="0" placeholder="0" {...register("goAborts")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Cesáreas</Label>
                  <Input type="number" min="0" placeholder="0" {...register("goCesareas")} />
                </div>
                <div className="space-y-1.5">
                  <Label>FUP (Fecha última regla)</Label>
                  <Input type="date" {...register("goFup")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Menopausia</Label>
                  <Input placeholder="Ej. 50 años" {...register("goMenopause")} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Otros gineco-obstétricos</Label>
                <Textarea rows={2} placeholder="Observaciones adicionales..." {...register("goOther")} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alergias */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-700">
              {isFemale ? "V" : "IV"}. Alergias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Medicamentos</Label>
                <Textarea rows={2} placeholder="Penicilina, ASA, etc." {...register("allergyMedications")} />
              </div>
              <div className="space-y-1.5">
                <Label>Alimentos</Label>
                <Textarea rows={2} placeholder="Mariscos, lácteos, etc." {...register("allergyFood")} />
              </div>
              <div className="space-y-1.5">
                <Label>Ambientales</Label>
                <Textarea rows={2} placeholder="Polen, polvo, ácaros, etc." {...register("allergyEnvironmental")} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medicamentos actuales */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-700">
              {isFemale ? "VI" : "V"}. Medicamentos actuales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={4}
              placeholder="Nombre del medicamento, dosis, frecuencia..."
              {...register("currentMedications")}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3 pt-2">
          <Link href={`/pacientes/${patientId}`}>
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
          <Button
            type="submit"
            disabled={saving}
            className="bg-[#0D9488] hover:bg-[#0f766e] text-white gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Guardando..." : "Guardar antecedentes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
