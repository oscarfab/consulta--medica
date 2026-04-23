import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PatientForm } from "@/components/patient-form";
import { format } from "date-fns";

export default async function EditPatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patient = await prisma.patient.findUnique({ where: { id } });
  if (!patient) notFound();

  const defaultValues = {
    fullName: patient.fullName,
    birthdate: format(patient.birthdate, "yyyy-MM-dd"),
    sex: patient.sex as "MASCULINO" | "FEMENINO" | "OTRO",
    curp: patient.curp || "",
    bloodType: patient.bloodType as "A_POS" | "A_NEG" | "B_POS" | "B_NEG" | "AB_POS" | "AB_NEG" | "O_POS" | "O_NEG" | "DESCONOCIDO",
    phone: patient.phone || "",
    address: patient.address || "",
    city: patient.city || "",
    state: patient.state || "",
    zipCode: patient.zipCode || "",
    emergencyContact: patient.emergencyContact || "",
    emergencyPhone: patient.emergencyPhone || "",
    insuranceName: patient.insuranceName || "",
    insuranceNumber: patient.insuranceNumber || "",
    notes: patient.notes || "",
  };

  return <PatientForm patientId={id} defaultValues={defaultValues} />;
}
