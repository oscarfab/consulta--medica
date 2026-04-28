import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { differenceInYears, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import {
  ArrowLeft, Edit, CalendarPlus, ClipboardPlus, FileText,
  Phone, MapPin, User, Shield, Clock, Stethoscope,
  FilePlus, ExternalLink, Send, MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BLOOD_LABELS: Record<string, string> = {
  A_POS: "A+", A_NEG: "A-", B_POS: "B+", B_NEG: "B-",
  AB_POS: "AB+", AB_NEG: "AB-", O_POS: "O+", O_NEG: "O-", DESCONOCIDO: "—",
};

const STATUS_COLORS: Record<string, string> = {
  PENDIENTE: "bg-yellow-100 text-yellow-700",
  ATENDIDO: "bg-green-100 text-green-700",
  CANCELADO: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente", ATENDIDO: "Atendido", CANCELADO: "Cancelado",
};

const RX_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  SENT: "bg-green-100 text-green-700",
  EXPIRED: "bg-red-100 text-red-700",
};

const RX_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  SENT: "Enviada",
  EXPIRED: "Caducada",
};

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const isDoctor = session?.user.role === "MEDICO";

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      appointments: {
        orderBy: { date: "desc" },
        include: { doctor: { select: { name: true } } },
      },
      medicalNotes: {
        orderBy: { consultationDate: "desc" },
        include: {
          doctor: { select: { name: true, specialty: true } },
          prescription: {
            select: {
              id: true,
              folio: true,
              createdAt: true,
              medications: true,
              status: true,
              emailSentAt: true,
              whatsappSentAt: true,
            },
          },
        },
      },
      clinicalBackground: true,
    },
  });

  if (!patient) notFound();

  const age = differenceInYears(new Date(), patient.birthdate);
  const sexLabel = { MASCULINO: "Masculino", FEMENINO: "Femenino", OTRO: "Otro" }[patient.sex];

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/pacientes">
            <Button variant="ghost" size="icon" className="text-slate-500">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{patient.fullName}</h1>
            <p className="text-slate-500 text-sm">
              {age} años · {sexLabel} · Tipo {BLOOD_LABELS[patient.bloodType]}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/agenda?nueva=1&paciente=${patient.id}`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <CalendarPlus className="w-4 h-4" />
              Nueva cita
            </Button>
          </Link>
          {isDoctor && (
            <Link href={`/pacientes/${patient.id}/nota-medica/nueva`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <ClipboardPlus className="w-4 h-4" />
                Nueva nota
              </Button>
            </Link>
          )}
          <Link href={`/pacientes/${patient.id}/editar`}>
            <Button className="bg-[#0D9488] hover:bg-[#0f766e] text-white gap-1.5" size="sm">
              <Edit className="w-4 h-4" />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="info">Información</TabsTrigger>
          {isDoctor && <TabsTrigger value="antecedentes">Antecedentes</TabsTrigger>}
          {isDoctor && <TabsTrigger value="notas">Notas médicas ({patient.medicalNotes.length})</TabsTrigger>}
          {isDoctor && (
            <TabsTrigger value="recetas">
              Recetas ({patient.medicalNotes.filter((n) => n.prescription).length})
            </TabsTrigger>
          )}
          <TabsTrigger value="citas">Citas ({patient.appointments.length})</TabsTrigger>
        </TabsList>

        {/* Info tab */}
        <TabsContent value="info" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                  <User className="w-4 h-4" /> Datos personales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Row label="Nombre completo" value={patient.fullName} />
                <Row label="Fecha de nacimiento" value={format(patient.birthdate, "d 'de' MMMM 'de' yyyy", { locale: es })} />
                <Row label="Edad" value={`${age} años`} />
                <Row label="Sexo" value={sexLabel || "—"} />
                <Row label="CURP" value={patient.curp || "—"} mono />
                <Row label="Grupo sanguíneo" value={BLOOD_LABELS[patient.bloodType]} />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Row label="Teléfono" value={patient.phone || "—"} />
                <Row label="Correo" value={patient.email || "—"} />
                <Row label="WhatsApp" value={patient.whatsapp || "—"} />
                <Row label="Contacto de emergencia" value={patient.emergencyContact || "—"} />
                <Row label="Tel. emergencia" value={patient.emergencyPhone || "—"} />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Domicilio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Row label="Calle" value={patient.address || "—"} />
                <Row label="Ciudad" value={patient.city || "—"} />
                <Row label="Estado" value={patient.state || "—"} />
                <Row label="C.P." value={patient.zipCode || "—"} />
              </CardContent>
            </Card>

            {(patient.insuranceName || patient.insuranceNumber) && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Seguro médico
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <Row label="Aseguradora" value={patient.insuranceName || "—"} />
                  <Row label="Póliza" value={patient.insuranceNumber || "—"} />
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Antecedentes tab — doctor only */}
        {isDoctor && <TabsContent value="antecedentes">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">
              {patient.clinicalBackground ? "Antecedentes registrados" : "Sin antecedentes registrados"}
            </p>
            <Link href={`/pacientes/${patient.id}/antecedentes`}>
              <Button size="sm" className="bg-[#0D9488] hover:bg-[#0f766e] text-white gap-1.5">
                <Edit className="w-3.5 h-3.5" />
                {patient.clinicalBackground ? "Editar antecedentes" : "Registrar antecedentes"}
              </Button>
            </Link>
          </div>
          {patient.clinicalBackground ? (
            <AntecedentesPreview bg={patient.clinicalBackground} sex={patient.sex} />
          ) : (
            <Card className="border-0 shadow-sm border-dashed border-2 border-slate-200">
              <CardContent className="text-center py-12 text-slate-400">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No hay antecedentes clínicos</p>
                <p className="text-xs mt-1">Registra los antecedentes conforme a NOM-004-SSA3-2012</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>}

        {/* Medical notes tab — doctor only */}
        {isDoctor && <TabsContent value="notas" className="space-y-3">
          <div className="flex justify-end">
            <Link href={`/pacientes/${patient.id}/nota-medica/nueva`}>
              <Button size="sm" className="bg-[#0D9488] hover:bg-[#0f766e] text-white gap-1.5">
                <ClipboardPlus className="w-3.5 h-3.5" />
                Nueva nota médica
              </Button>
            </Link>
          </div>
          {patient.medicalNotes.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="text-center py-12 text-slate-400">
                <Stethoscope className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">Sin notas médicas</p>
              </CardContent>
            </Card>
          ) : (
            patient.medicalNotes.map((note) => (
              <Card key={note.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-700 text-sm">
                        {format(note.consultationDate, "d 'de' MMMM 'de' yyyy — HH:mm", { locale: es })}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Dr. {note.doctor.name}
                        {note.doctor.specialty && ` · ${note.doctor.specialty}`}
                      </p>
                      {note.reasonForVisit && (
                        <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                          <span className="font-medium">Motivo:</span> {note.reasonForVisit}
                        </p>
                      )}
                      {note.diagnosisDescription && (
                        <p className="text-sm text-slate-600 mt-1">
                          <span className="font-medium">Dx:</span> {note.diagnosisCode && `[${note.diagnosisCode}]`} {note.diagnosisDescription}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {note.prescription && (
                        <Link href={`/pacientes/${patient.id}/receta/${note.prescription.id}`}>
                          <Button size="sm" variant="outline" className="text-xs gap-1">
                            <FileText className="w-3 h-3" /> Receta
                          </Button>
                        </Link>
                      )}
                      <Link href={`/pacientes/${patient.id}/nota-medica/${note.id}`}>
                        <Button size="sm" variant="outline" className="text-xs">Ver nota</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>}

        {/* Recetas tab — doctor only */}
        {isDoctor && (
          <TabsContent value="recetas" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Historial de recetas electrónicas del paciente
              </p>
              <Link href={`/pacientes/${patient.id}/receta/nueva`}>
                <Button size="sm" className="bg-[#0D9488] hover:bg-[#0f766e] text-white gap-1.5">
                  <FilePlus className="w-3.5 h-3.5" />
                  Nueva receta
                </Button>
              </Link>
            </div>

            {patient.medicalNotes.filter((n) => n.prescription).length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="text-center py-12 text-slate-400">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Sin recetas registradas</p>
                  <p className="text-xs mt-1">Las recetas aparecerán aquí una vez creadas desde una nota médica</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Folio</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Medicamentos</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Enviada</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {patient.medicalNotes
                        .filter((n) => n.prescription)
                        .map((note) => {
                          const rx = note.prescription!;
                          const meds = (rx.medications as Array<{ name: string }>) ?? [];
                          const medsResumen = meds
                            .slice(0, 2)
                            .map((m) => m.name)
                            .join(", ") + (meds.length > 2 ? ` +${meds.length - 2} más` : "");

                          return (
                            <tr key={rx.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3">
                                <span className="font-mono text-xs font-semibold text-slate-700">
                                  {rx.folio || "—"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                                {format(new Date(rx.createdAt), "dd/MM/yyyy", { locale: es })}
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-xs text-slate-600 max-w-[200px] truncate">
                                  {medsResumen || "—"}
                                </p>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    RX_STATUS_COLORS[rx.status] ?? RX_STATUS_COLORS.DRAFT
                                  }`}
                                >
                                  {RX_STATUS_LABELS[rx.status] ?? rx.status}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1.5">
                                  {rx.emailSentAt && (
                                    <span title="Enviada por correo">
                                      <Send className="w-3.5 h-3.5 text-blue-500" />
                                    </span>
                                  )}
                                  {rx.whatsappSentAt && (
                                    <span title="Enviada por WhatsApp">
                                      <MessageCircle className="w-3.5 h-3.5 text-green-500" />
                                    </span>
                                  )}
                                  {!rx.emailSentAt && !rx.whatsappSentAt && (
                                    <span className="text-xs text-slate-300">—</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Link href={`/pacientes/${patient.id}/receta/${rx.id}`}>
                                    <Button size="sm" variant="outline" className="text-xs h-7 px-2 gap-1">
                                      <FileText className="w-3 h-3" />
                                      Ver PDF
                                    </Button>
                                  </Link>
                                  {rx.folio && (
                                    <Link href={`/verificar/${rx.folio}`} target="_blank">
                                      <Button size="sm" variant="outline" className="text-xs h-7 px-2 gap-1">
                                        <ExternalLink className="w-3 h-3" />
                                        Verificador
                                      </Button>
                                    </Link>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </TabsContent>
        )}

        {/* Appointments tab */}
        <TabsContent value="citas" className="space-y-3">
          {patient.appointments.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="text-center py-12 text-slate-400">
                <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">Sin citas registradas</p>
              </CardContent>
            </Card>
          ) : (
            patient.appointments.map((appt) => (
              <div
                key={appt.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-100 shadow-xs"
              >
                <div>
                  <p className="font-semibold text-slate-700 text-sm">
                    {format(appt.date, "d 'de' MMMM 'de' yyyy — HH:mm", { locale: es })}
                  </p>
                  <p className="text-xs text-slate-500">
                    Dr. {appt.doctor.name}
                    {isDoctor && appt.reason && ` · ${appt.reason}`}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[appt.status]}`}>
                  {STATUS_LABELS[appt.status]}
                </span>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500 text-xs">{label}</span>
      <span className={`text-slate-700 text-xs font-medium text-right ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

type ClinicalBg = {
  hfDiabetes?: boolean | null;
  hfHypertension?: boolean | null;
  hfCancer?: boolean | null;
  hfCardiopathy?: boolean | null;
  hfObesity?: boolean | null;
  hfAsthma?: boolean | null;
  hfOther?: string | null;
  allergyMedications?: string | null;
  allergyFood?: string | null;
  allergyEnvironmental?: string | null;
  currentMedications?: string | null;
};

function AntecedentesPreview({ bg, sex }: { bg: ClinicalBg; sex: string }) {
  const hfItems = [
    { key: "hfDiabetes" as const, label: "Diabetes" },
    { key: "hfHypertension" as const, label: "Hipertensión" },
    { key: "hfCancer" as const, label: "Cáncer" },
    { key: "hfCardiopathy" as const, label: "Cardiopatías" },
    { key: "hfObesity" as const, label: "Obesidad" },
    { key: "hfAsthma" as const, label: "Asma" },
  ].filter((i) => bg[i.key]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Heredo-familiares</CardTitle>
        </CardHeader>
        <CardContent>
          {hfItems.length === 0 ? (
            <p className="text-xs text-slate-400">Ninguno registrado</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {hfItems.map((i) => (
                <Badge key={i.key} variant="secondary" className="text-xs">{i.label}</Badge>
              ))}
            </div>
          )}
          {bg.hfOther && <p className="text-xs text-slate-600 mt-2">Otros: {bg.hfOther}</p>}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Alergias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-xs">
          {bg.allergyMedications && <p><span className="font-medium text-slate-600">Medicamentos:</span> {bg.allergyMedications}</p>}
          {bg.allergyFood && <p><span className="font-medium text-slate-600">Alimentos:</span> {bg.allergyFood}</p>}
          {bg.allergyEnvironmental && <p><span className="font-medium text-slate-600">Ambientales:</span> {bg.allergyEnvironmental}</p>}
          {!bg.allergyMedications && !bg.allergyFood && !bg.allergyEnvironmental && (
            <p className="text-slate-400">Ninguna registrada</p>
          )}
        </CardContent>
      </Card>

      {bg.currentMedications && (
        <Card className="border-0 shadow-sm md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Medicamentos actuales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-700 whitespace-pre-wrap">{bg.currentMedications}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
