"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format, differenceInYears } from "date-fns";
import { es } from "date-fns/locale";
import {
  Plus, Trash2, ArrowLeft, Loader2, FileDown, Send, MessageCircle,
  Copy, Eye, Save, CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { buscarMedicamento } from "@/lib/medicamentos";

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
  diagnosis: z.string().optional(),
});

type PrescriptionForm = z.infer<typeof prescriptionSchema>;

interface Patient {
  id: string;
  fullName: string;
  birthdate: Date | string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
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
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savedFolio, setSavedFolio] = useState<string | null>(null);

  // Email dialog
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailValue, setEmailValue] = useState(patient.email || "");
  const [saveEmail, setSaveEmail] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // WhatsApp dialog
  const [waOpen, setWaOpen] = useState(false);
  const [phoneValue, setPhoneValue] = useState(patient.whatsapp || patient.phone || "");
  const [savePhone, setSavePhone] = useState(false);
  const [sendingWa, setSendingWa] = useState(false);

  // Autocomplete
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeField, setActiveField] = useState<number | null>(null);

  const age = differenceInYears(new Date(), new Date(patient.birthdate));
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<PrescriptionForm>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      medications: [{ name: "", dose: "", route: "Oral", frequency: "Cada 8 horas", duration: "", instructions: "" }],
      notes: "",
      diagnosis: note?.diagnosisDescription || "",
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "medications" });

  const savePrescription = async (data: PrescriptionForm): Promise<{ id: string; folio: string } | null> => {
    if (!noteId) {
      toast.error("Debes crear una nota médica primero para generar la receta");
      return null;
    }

    const res = await fetch("/api/prescriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId, ...data }),
    });

    if (!res.ok) throw new Error();
    return res.json() as Promise<{ id: string; folio: string }>;
  };

  const onSaveDraft = handleSubmit(async (data) => {
    if (savedId) {
      toast.info("La receta ya fue guardada");
      return;
    }
    setSaving(true);
    try {
      const prescription = await savePrescription(data);
      if (!prescription) return;
      setSavedId(prescription.id);
      setSavedFolio(prescription.folio);
      toast.success(`Receta guardada · Folio: ${prescription.folio}`);
    } catch {
      toast.error("Error al guardar la receta");
    } finally {
      setSaving(false);
    }
  });

  const ensureSaved = async (): Promise<{ id: string; folio: string } | null> => {
    if (savedId && savedFolio) return { id: savedId, folio: savedFolio };
    const formData = watch();
    const valid = prescriptionSchema.safeParse(formData);
    if (!valid.success) {
      toast.error("Completa todos los campos requeridos antes de continuar");
      return null;
    }
    setSaving(true);
    try {
      const prescription = await savePrescription(valid.data);
      if (!prescription) return null;
      setSavedId(prescription.id);
      setSavedFolio(prescription.folio);
      return prescription;
    } catch {
      toast.error("Error al guardar la receta");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleViewPDF = async () => {
    const saved = await ensureSaved();
    if (!saved) return;
    router.push(`/pacientes/${patient.id}/receta/${saved.id}`);
  };

  const handleOpenEmail = async () => {
    const saved = await ensureSaved();
    if (!saved) return;
    setEmailOpen(true);
  };

  const handleSendEmail = async () => {
    if (!savedId) return;
    setSendingEmail(true);
    try {
      const res = await fetch(`/api/prescriptions/${savedId}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue, saveEmail }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Receta enviada exitosamente a ${emailValue}`);
      setEmailOpen(false);
    } catch {
      toast.error("Error al enviar el correo");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleOpenWhatsApp = async () => {
    const saved = await ensureSaved();
    if (!saved) return;
    setWaOpen(true);
  };

  const handleSendWhatsApp = async () => {
    if (!savedId) return;
    setSendingWa(true);
    try {
      const res = await fetch(`/api/prescriptions/${savedId}/send-whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneValue, savePhone }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      window.open(data.waUrl, "_blank");
      toast.success("WhatsApp abierto con la receta lista para enviar");
      setWaOpen(false);
    } catch {
      toast.error("Error al preparar WhatsApp");
    } finally {
      setSendingWa(false);
    }
  };

  const handleCopyLink = async () => {
    const saved = await ensureSaved();
    if (!saved) return;
    const link = `${appUrl}/verificar/${saved.folio}`;
    await navigator.clipboard.writeText(link);
    toast.success("Link de verificación copiado");
  };

  const handleMedNameChange = (index: number, value: string) => {
    setValue(`medications.${index}.name`, value);
    const results = buscarMedicamento(value);
    setSuggestions(results.map((m) => m.nombre));
    setActiveField(index);
  };

  const handleSelectSuggestion = (index: number, name: string) => {
    setValue(`medications.${index}.name`, name);
    setSuggestions([]);
    setActiveField(null);
  };

  const medicationsWatch = watch("medications");

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
        {savedFolio && (
          <span className="ml-auto text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            {savedFolio}
          </span>
        )}
      </div>

      {/* Header preview */}
      <Card className="border border-[#0D9488]/30 bg-teal-50/50">
        <CardContent className="pt-4">
          <div className="flex justify-between text-sm">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Médico</p>
              <p className="font-bold text-slate-700">{doctor?.name || "—"}</p>
              {doctor?.specialty && <p className="text-xs text-slate-600">{doctor.specialty}</p>}
              {doctor?.cedula && <p className="text-xs text-slate-600">Cédula: {doctor.cedula}</p>}
              {doctor?.clinicName && <p className="text-xs text-slate-500 mt-1">{doctor.clinicName}</p>}
              {doctor?.clinicPhone && <p className="text-xs text-slate-500">{doctor.clinicPhone}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Paciente</p>
              <p className="font-bold text-slate-700">{patient.fullName}</p>
              <p className="text-xs text-slate-600">{age} años</p>
              <p className="text-xs text-slate-500 mt-1">{format(new Date(), "dd/MM/yyyy")}</p>
              {savedFolio && <p className="text-xs font-mono text-[#0D9488] mt-0.5">Folio: {savedFolio}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <form className="space-y-5">
        {/* Diagnosis */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-700">Diagnóstico</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Diagnóstico o selecciona de la nota médica del día..."
              {...register("diagnosis")}
            />
          </CardContent>
        </Card>

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
                  <div className="space-y-1.5 relative">
                    <Label className="text-xs">Nombre del medicamento *</Label>
                    <Input
                      placeholder="Ej. Amoxicilina"
                      value={medicationsWatch[index]?.name || ""}
                      onChange={(e) => handleMedNameChange(index, e.target.value)}
                      className={errors.medications?.[index]?.name ? "border-red-500" : ""}
                    />
                    {activeField === index && suggestions.length > 0 && (
                      <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-44 overflow-y-auto">
                        {suggestions.map((s) => (
                          <button
                            key={s}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 text-slate-700"
                            onClick={() => handleSelectSuggestion(index, s)}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
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

        {/* General notes */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-700">Indicaciones generales</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={3}
              placeholder="Indicaciones generales, restricciones, próxima cita..."
              {...register("notes")}
            />
          </CardContent>
        </Card>

        {/* Validity notice */}
        <Card className="border-0 shadow-sm bg-slate-50">
          <CardContent className="pt-4 text-center text-xs text-slate-400">
            <p>Receta válida por 30 días a partir de la fecha de emisión</p>
            <p className="mt-0.5">Medicamento(s) sujeto(s) a disponibilidad</p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pb-8">
          <Link href={`/pacientes/${patient.id}`}>
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>

          <Button
            type="button"
            onClick={onSaveDraft}
            disabled={saving}
            variant="outline"
            className="gap-2 border-[#0D9488] text-[#0D9488] hover:bg-teal-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Guardando..." : "Guardar borrador"}
          </Button>

          <Button
            type="button"
            onClick={handleViewPDF}
            disabled={saving}
            variant="outline"
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            Vista previa
          </Button>

          <Button
            type="button"
            onClick={handleOpenEmail}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <Send className="w-4 h-4" />
            Enviar por correo
          </Button>

          <Button
            type="button"
            onClick={handleOpenWhatsApp}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </Button>

          <Button
            type="button"
            onClick={handleCopyLink}
            disabled={saving}
            variant="outline"
            className="gap-2"
          >
            <Copy className="w-4 h-4" />
            Copiar link
          </Button>

          <Button
            type="button"
            onClick={handleViewPDF}
            disabled={saving}
            className="bg-[#0D9488] hover:bg-[#0f766e] text-white gap-2"
          >
            <FileDown className="w-4 h-4" />
            Descargar PDF
          </Button>
        </div>
      </form>

      {/* Email Dialog */}
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar receta por correo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Paciente</Label>
              <p className="text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-md">{patient.fullName}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Correo electrónico *</Label>
              <Input
                type="email"
                placeholder="correo@ejemplo.com"
                value={emailValue}
                onChange={(e) => setEmailValue(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="saveEmail"
                checked={saveEmail}
                onCheckedChange={(v) => setSaveEmail(!!v)}
              />
              <label htmlFor="saveEmail" className="text-sm text-slate-600 cursor-pointer">
                Guardar este correo en el perfil del paciente
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleSendEmail}
              disabled={sendingEmail || !emailValue}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sendingEmail ? "Enviando..." : "Confirmar envío"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Dialog */}
      <Dialog open={waOpen} onOpenChange={setWaOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar receta por WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Paciente</Label>
              <p className="text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-md">{patient.fullName}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Teléfono WhatsApp *</Label>
              <Input
                type="tel"
                placeholder="+52 55 1234 5678"
                value={phoneValue}
                onChange={(e) => setPhoneValue(e.target.value)}
              />
              <p className="text-xs text-slate-400">Formato: +52 seguido de 10 dígitos</p>
            </div>

            {savedFolio && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-green-700 mb-1">Vista previa del mensaje:</p>
                <p className="text-xs text-green-800 whitespace-pre-line leading-relaxed">
                  {`Hola ${patient.fullName}, el ${doctor?.name} le ha enviado su receta con folio ${savedFolio}.\n\nVer receta completa en:\n${appUrl}/verificar/${savedFolio}`}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                id="savePhone"
                checked={savePhone}
                onCheckedChange={(v) => setSavePhone(!!v)}
              />
              <label htmlFor="savePhone" className="text-sm text-slate-600 cursor-pointer">
                Guardar este número en el perfil del paciente
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWaOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleSendWhatsApp}
              disabled={sendingWa || !phoneValue}
              className="bg-green-600 hover:bg-green-700 text-white gap-2"
            >
              {sendingWa ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
              {sendingWa ? "Preparando..." : "Abrir WhatsApp"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
