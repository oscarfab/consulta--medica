import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { format, differenceInYears } from "date-fns";
import { es } from "date-fns/locale";
import { renderToBuffer } from "@react-pdf/renderer";
import { PrescriptionPDF } from "@/lib/prescription-pdf";
import React from "react";

const sendSchema = z.object({
  email: z.string().email(),
  saveEmail: z.boolean().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

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

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  const meds = prescription.medications as Array<{ name: string; dose: string; frequency: string; duration: string }>;
  const doctor = prescription.note.doctor;
  const patient = prescription.note.patient;

  const medicamentosHtml = meds
    .map(
      (m) =>
        `<tr><td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;">${m.name}</td>
         <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;">${m.dose}</td>
         <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;">${m.frequency}</td>
         <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;">${m.duration}</td></tr>`
    )
    .join("");

  const emailHtml = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

    <div style="background:#0D9488;padding:28px 32px;">
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">${doctor.clinicName || "MediConsulta"}</h1>
      <p style="margin:4px 0 0;color:#ccfbf1;font-size:13px;">${doctor.name}${doctor.specialty ? ` — ${doctor.specialty}` : ""}</p>
    </div>

    <div style="padding:28px 32px;">
      <p style="color:#334155;font-size:15px;margin:0 0 16px;">
        El <strong>${doctor.name}</strong>${doctor.specialty ? ` (${doctor.specialty})` : ""}
        le ha enviado su receta electrónica.
      </p>

      <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:20px;">
        <p style="margin:0 0 4px;font-size:13px;color:#64748b;">Paciente</p>
        <p style="margin:0;font-size:15px;font-weight:600;color:#1e293b;">${patient.fullName}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#64748b;">
          Folio: <strong>${prescription.folio}</strong> ·
          Fecha: ${format(new Date(prescription.createdAt), "dd/MM/yyyy")}
        </p>
      </div>

      <h3 style="color:#1e293b;font-size:14px;margin:0 0 10px;">Medicamentos prescritos:</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
        <thead>
          <tr style="background:#f1f5f9;">
            <th style="padding:8px 12px;text-align:left;color:#475569;">Medicamento</th>
            <th style="padding:8px 12px;text-align:left;color:#475569;">Dosis</th>
            <th style="padding:8px 12px;text-align:left;color:#475569;">Frecuencia</th>
            <th style="padding:8px 12px;text-align:left;color:#475569;">Duración</th>
          </tr>
        </thead>
        <tbody>${medicamentosHtml}</tbody>
      </table>

      ${prescription.notes ? `<p style="color:#475569;font-size:13px;"><strong>Indicaciones:</strong> ${prescription.notes}</p>` : ""}

      <p style="color:#94a3b8;font-size:12px;text-align:center;margin:20px 0 0;">
        Receta válida hasta: ${format(new Date(prescription.validUntil), "dd 'de' MMMM 'de' yyyy", { locale: es })}
      </p>
    </div>

    <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
      <p style="margin:0;color:#64748b;font-size:12px;">
        ${doctor.clinicName || ""}${doctor.clinicPhone ? ` · ${doctor.clinicPhone}` : ""}${doctor.clinicAddress ? ` · ${doctor.clinicAddress}` : ""}
      </p>
      <p style="margin:4px 0 0;color:#94a3b8;font-size:11px;">
        Este documento es una receta electrónica generada digitalmente. Cédula profesional: ${doctor.cedula || "N/A"}
      </p>
    </div>
  </div>
</body>
</html>`;

  // Generate PDF as attachment
  const age = differenceInYears(new Date(), new Date(patient.birthdate));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(PrescriptionPDF as any, { prescription, age });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await renderToBuffer(element as any);

  const resend = new Resend(resendKey);
  const fromEmail = process.env.RESEND_FROM_EMAIL || "recetas@mediconsulta.site";

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: [parsed.data.email],
    subject: `Su receta médica - ${prescription.folio}`,
    html: emailHtml,
    attachments: [
      {
        filename: `receta_${prescription.folio}.pdf`,
        content: pdfBuffer,
      },
    ],
  });

  if (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: "Error al enviar correo" }, { status: 500 });
  }

  await prisma.prescription.update({
    where: { id },
    data: {
      emailSentAt: new Date(),
      patientEmail: parsed.data.email,
      status: "SENT",
    },
  });

  if (parsed.data.saveEmail) {
    await prisma.patient.update({
      where: { id: patient.id },
      data: { email: parsed.data.email },
    });
  }

  return NextResponse.json({ success: true });
}
