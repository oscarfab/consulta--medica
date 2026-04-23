import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { AntecedentesClient } from "./antecedentes-client";

export default async function AntecedentesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: { clinicalBackground: true },
  });

  if (!patient) notFound();

  return (
    <AntecedentesClient
      patientId={id}
      patientName={patient.fullName}
      patientSex={patient.sex}
      existing={patient.clinicalBackground}
    />
  );
}
