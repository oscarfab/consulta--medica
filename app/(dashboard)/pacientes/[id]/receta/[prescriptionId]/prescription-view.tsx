"use client";

import { format, differenceInYears } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Send, MessageCircle, Copy, ExternalLink, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { PrescriptionPDFButton } from "@/components/prescription-pdf-button";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
  folio: string;
  status: string;
  createdAt: string | Date;
  validUntil: string | Date;
  emailSentAt?: string | Date | null;
  whatsappSentAt?: string | Date | null;
  patientEmail?: string | null;
  patientPhone?: string | null;
  medications: unknown;
  notes?: string | null;
  diagnosis?: string | null;
  note: {
    diagnosisDescription?: string | null;
    patient: { id: string; fullName: string; birthdate: string | Date; email?: string | null; phone?: string | null; whatsapp?: string | null };
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

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  SENT: "Enviada",
  EXPIRED: "Caducada",
};
const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  SENT: "bg-green-100 text-green-700",
  EXPIRED: "bg-red-100 text-red-700",
};

export function PrescriptionView({ prescription, patientId }: Props) {
  const { note } = prescription;
  const medications = prescription.medications as Medication[];
  const age = differenceInYears(new Date(), new Date(note.patient.birthdate));
  const verifyUrl = `${(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").trim()}/verificar/${prescription.folio}`;

  const [emailOpen, setEmailOpen] = useState(false);
  const [emailValue, setEmailValue] = useState(prescription.patientEmail || note.patient.email || "");
  const [saveEmail, setSaveEmail] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const [waOpen, setWaOpen] = useState(false);
  const [phoneValue, setPhoneValue] = useState(prescription.patientPhone || note.patient.whatsapp || note.patient.phone || "");
  const [savePhone, setSavePhone] = useState(false);
  const [sendingWa, setSendingWa] = useState(false);

  const handleSendEmail = async () => {
    setSendingEmail(true);
    try {
      const res = await fetch(`/api/prescriptions/${prescription.id}/send-email`, {
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

  const handleSendWhatsApp = async () => {
    setSendingWa(true);
    try {
      const res = await fetch(`/api/prescriptions/${prescription.id}/send-whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneValue, savePhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar WhatsApp");
      toast.success("PDF enviado exitosamente por WhatsApp");
      setWaOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar WhatsApp");
    } finally {
      setSendingWa(false);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(verifyUrl);
    toast.success("Link de verificación copiado");
  };

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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-800">Receta electrónica</h1>
              <Badge className={`text-xs ${STATUS_COLORS[prescription.status] || STATUS_COLORS.DRAFT}`}>
                {STATUS_LABELS[prescription.status] || prescription.status}
              </Badge>
            </div>
            <p className="text-slate-500 text-sm font-mono">{prescription.folio}</p>
          </div>
        </div>
        <PrescriptionPDFButton prescription={prescription} age={age} />
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
          onClick={() => setEmailOpen(true)}
        >
          <Send className="w-3.5 h-3.5" />
          Enviar por correo
          {prescription.emailSentAt && <CheckCircle className="w-3 h-3 text-green-500" />}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-green-600 border-green-200 hover:bg-green-50"
          onClick={() => setWaOpen(true)}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          WhatsApp
          {prescription.whatsappSentAt && <CheckCircle className="w-3 h-3 text-green-500" />}
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={handleCopyLink}>
          <Copy className="w-3.5 h-3.5" />
          Copiar link
        </Button>
        <Link href={verifyUrl} target="_blank">
          <Button size="sm" variant="outline" className="gap-1.5">
            <ExternalLink className="w-3.5 h-3.5" />
            Ver verificador
          </Button>
        </Link>
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
              <p className="text-xs font-mono text-slate-500 mt-1">Folio: {prescription.folio}</p>
            </div>
          </div>

          {/* Patient */}
          <div className="flex justify-between text-sm">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Paciente</p>
              <p className="font-semibold text-slate-700 text-base">{note.patient.fullName}</p>
              <p className="text-slate-500 text-xs">{age} años</p>
            </div>
            {(prescription.diagnosis || note.diagnosisDescription) && (
              <div className="text-right max-w-xs">
                <p className="text-xs text-slate-400 uppercase tracking-wide">Diagnóstico</p>
                <p className="text-sm text-slate-600">{prescription.diagnosis || note.diagnosisDescription}</p>
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
              <p>hasta el {format(new Date(prescription.validUntil), "dd/MM/yyyy")}</p>
              <p className="text-[10px] mt-1">Este documento es una receta electrónica generada digitalmente</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Dialog */}
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar receta por correo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Paciente</Label>
              <p className="text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-md">{note.patient.fullName}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Correo electrónico *</Label>
              <Input type="email" placeholder="correo@ejemplo.com" value={emailValue} onChange={(e) => setEmailValue(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="saveEmail2" checked={saveEmail} onCheckedChange={(v) => setSaveEmail(!!v)} />
              <label htmlFor="saveEmail2" className="text-sm text-slate-600 cursor-pointer">
                Guardar este correo en el perfil del paciente
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailOpen(false)}>Cancelar</Button>
            <Button onClick={handleSendEmail} disabled={sendingEmail || !emailValue} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
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
              <p className="text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-md">{note.patient.fullName}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Teléfono WhatsApp *</Label>
              <Input type="tel" placeholder="+52 55 1234 5678" value={phoneValue} onChange={(e) => setPhoneValue(e.target.value)} />
              <p className="text-xs text-slate-400">Formato: +52 seguido de 10 dígitos</p>
            </div>
            <p className="text-sm text-slate-500 bg-green-50 border border-green-100 rounded-md px-3 py-2">
              El PDF llegará directamente al WhatsApp del paciente.
            </p>
            <div className="flex items-center gap-2">
              <Checkbox id="savePhone2" checked={savePhone} onCheckedChange={(v) => setSavePhone(!!v)} />
              <label htmlFor="savePhone2" className="text-sm text-slate-600 cursor-pointer">
                Guardar número en perfil del paciente
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWaOpen(false)}>Cancelar</Button>
            <Button onClick={handleSendWhatsApp} disabled={sendingWa || !phoneValue} className="bg-green-600 hover:bg-green-700 text-white gap-2">
              {sendingWa ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
              {sendingWa ? "Enviando PDF..." : "Enviar PDF por WhatsApp"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
