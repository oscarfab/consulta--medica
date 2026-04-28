import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PrescriptionView } from "./prescription-view";

export default async function PrescriptionPage({
  params,
}: {
  params: Promise<{ id: string; prescriptionId: string }>;
}) {
  const { id, prescriptionId } = await params;

  const prescription = await prisma.prescription.findUnique({
    where: { id: prescriptionId },
    include: {
      note: {
        include: {
          patient: { select: { id: true, fullName: true, birthdate: true, email: true, phone: true, whatsapp: true } },
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

  if (!prescription || prescription.note.patient === null) notFound();

  return <PrescriptionView prescription={prescription} patientId={id} />;
}
