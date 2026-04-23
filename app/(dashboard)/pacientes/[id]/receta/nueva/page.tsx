import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PrescriptionClient } from "./prescription-client";

export default async function NuevaRecetaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nota?: string }>;
}) {
  const { id } = await params;
  const { nota: noteId } = await searchParams;
  const session = await auth();

  const [patient, doctor] = await Promise.all([
    prisma.patient.findUnique({
      where: { id },
      select: { id: true, fullName: true, birthdate: true },
    }),
    prisma.user.findUnique({
      where: { id: session?.user.id },
      select: {
        id: true,
        name: true,
        specialty: true,
        cedula: true,
        clinicName: true,
        clinicAddress: true,
        clinicPhone: true,
      },
    }),
  ]);

  let note = null;
  if (noteId) {
    note = await prisma.medicalNote.findUnique({
      where: { id: noteId },
      select: { id: true, diagnosisDescription: true },
    });
  }

  if (!patient) notFound();

  return <PrescriptionClient patient={patient} doctor={doctor} noteId={noteId} note={note} />;
}
