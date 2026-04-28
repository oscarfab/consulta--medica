import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { format, differenceInYears } from "date-fns";
import { es } from "date-fns/locale";
import { renderToBuffer } from "@react-pdf/renderer";
import { PrescriptionPDF } from "@/lib/prescription-pdf";
import React from "react";
import { MessageMedia } from "whatsapp-web.js";
import { getWhatsAppClient, isWhatsAppReady } from "@/lib/whatsapp-client";

const sendSchema = z.object({
  phone: z.string().min(10),
  savePhone: z.boolean().optional(),
});

interface Medication {
  name: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  if (!isWhatsAppReady()) {
    return NextResponse.json(
      {
        error:
          "WhatsApp no está conectado. Ve a Configuración → Conexión WhatsApp para vincular tu dispositivo.",
      },
      { status: 503 }
    );
  }

  const prescription = await prisma.prescription.findUnique({
    where: { id },
    include: {
      note: {
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
        },
      },
    },
  });

  if (!prescription) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const meds = prescription.medications as unknown as Medication[];
  const doctor = prescription.note.doctor;
  const patient = prescription.note.patient;

  const clinicLower = (doctor.clinicName || "").toLowerCase();
  const clinicDisplay = doctor.clinicName
    ? clinicLower.startsWith("clínica") || clinicLower.startsWith("clinica")
      ? doctor.clinicName
      : `Clínica ${doctor.clinicName}`
    : "";

  console.log("1. Iniciando envío WhatsApp...");

  // Generar PDF
  const age = differenceInYears(new Date(), new Date(patient.birthdate));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(PrescriptionPDF as any, { prescription, age });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await renderToBuffer(element as any);
  console.log("2. PDF generado, tamaño:", pdfBuffer.length);

  // Formatear número de teléfono
  const phoneClean = parsed.data.phone.replace(/\D/g, "").replace(/^52/, "");

  // Construir mensaje caption
  const validUntil = format(new Date(prescription.validUntil), "dd 'de' MMMM 'de' yyyy", {
    locale: es,
  });
  const footerParts = [clinicDisplay, doctor.clinicPhone ? `Tel: ${doctor.clinicPhone}` : ""]
    .filter(Boolean)
    .join(" - ");

  const mensajeCaption =
    `🏥 *RECETA MÉDICA OFICIAL*\n` +
    `📋 Folio: ${prescription.folio}\n\n` +
    `👨‍⚕️ *${doctor.name}*\n` +
    (doctor.specialty ? `${doctor.specialty}\n` : "") +
    (doctor.cedula ? `Cédula: ${doctor.cedula}\n` : "") +
    `\n👤 *Paciente:* ${patient.fullName}\n` +
    `📅 *Válida hasta:* ${validUntil}\n` +
    (footerParts ? `\n🏥 ${footerParts}` : "");

  // Enviar PDF por WhatsApp Web
  const media = new MessageMedia(
    "application/pdf",
    pdfBuffer.toString("base64"),
    `Receta-${prescription.folio}.pdf`
  );

  try {
    const whatsappClient = await getWhatsAppClient();

    // getNumberId resuelve el LID automáticamente y devuelve el ID correcto
    const numberId = await whatsappClient.getNumberId(`52${phoneClean}`);
    if (!numberId) {
      return NextResponse.json(
        { error: "Número no encontrado en WhatsApp" },
        { status: 400 }
      );
    }
    const phoneFormatted = numberId._serialized;
    console.log("3. Enviando a número:", phoneFormatted);

    await whatsappClient.sendMessage(phoneFormatted, media, { caption: mensajeCaption });
    console.log("4. PDF enviado exitosamente a", phoneFormatted);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al enviar por WhatsApp";
    console.error("WhatsApp send error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  await prisma.prescription.update({
    where: { id },
    data: {
      whatsappSentAt: new Date(),
      patientPhone: parsed.data.phone,
      status: "SENT",
    },
  });

  if (parsed.data.savePhone) {
    await prisma.patient.update({
      where: { id: patient.id },
      data: { whatsapp: parsed.data.phone },
    });
  }

  return NextResponse.json({ success: true });
}
