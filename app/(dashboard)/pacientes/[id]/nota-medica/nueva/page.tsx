import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { MedicalNoteClient } from "./note-client";

export default async function NuevaNota({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const [patient, doctor] = await Promise.all([
    prisma.patient.findUnique({
      where: { id },
      select: { id: true, fullName: true, birthdate: true },
    }),
    prisma.user.findUnique({
      where: { id: session?.user.id },
      select: { id: true, name: true, specialty: true, cedula: true, clinicName: true },
    }),
  ]);

  if (!patient) notFound();

  return <MedicalNoteClient patient={patient} doctor={doctor} />;
}
