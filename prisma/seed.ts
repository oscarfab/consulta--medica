import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const medico = await prisma.user.upsert({
    where: { email: "medico@demo.com" },
    update: {},
    create: {
      email: "medico@demo.com",
      password: await bcrypt.hash("demo1234", 12),
      name: "Dr. Carlos Mendoza López",
      role: "MEDICO",
      specialty: "Medicina General",
      cedula: "5821947",
      clinicName: "Clínica Salud Integral",
      clinicAddress: "Av. Insurgentes Sur 1234, Col. Del Valle, CDMX",
      clinicPhone: "55 5555 1234",
    },
  });

  await prisma.user.upsert({
    where: { email: "recep@demo.com" },
    update: {},
    create: {
      email: "recep@demo.com",
      password: await bcrypt.hash("demo1234", 12),
      name: "Ana Ramírez Torres",
      role: "RECEPCIONISTA",
    },
  });

  const patient1 = await prisma.patient.upsert({
    where: { curp: "GAML850312HDFRPS09" },
    update: {},
    create: {
      fullName: "García Martínez Luis Alberto",
      birthdate: new Date("1985-03-12"),
      sex: "MASCULINO",
      curp: "GAML850312HDFRPS09",
      bloodType: "O_POS",
      phone: "55 1234 5678",
      email: "luis.garcia@email.com",
      whatsapp: "+52 55 1234 5678",
      address: "Calle Pino 45, Col. Pedregal",
      city: "Ciudad de México",
      state: "Ciudad de México",
      zipCode: "14010",
      emergencyContact: "María García",
      emergencyPhone: "55 8765 4321",
      insuranceName: "IMSS",
      insuranceNumber: "86542317800",
    },
  });

  const patient2 = await prisma.patient.upsert({
    where: { curp: "ROMJ920715MDFDRN05" },
    update: {},
    create: {
      fullName: "Rodríguez Morales Jimena",
      birthdate: new Date("1992-07-15"),
      sex: "FEMENINO",
      curp: "ROMJ920715MDFDRN05",
      bloodType: "A_POS",
      phone: "55 9876 5432",
      email: "jimena.rodriguez@email.com",
      whatsapp: "+52 55 9876 5432",
      address: "Av. Revolución 300, Col. Mixcoac",
      city: "Ciudad de México",
      state: "Ciudad de México",
      zipCode: "03910",
      emergencyContact: "Roberto Rodríguez",
      emergencyPhone: "55 3456 7890",
    },
  });

  const patient3 = await prisma.patient.upsert({
    where: { curp: "HELN680925HMCRNL07" },
    update: {},
    create: {
      fullName: "Hernández López Nelson",
      birthdate: new Date("1968-09-25"),
      sex: "MASCULINO",
      curp: "HELN680925HMCRNL07",
      bloodType: "B_NEG",
      phone: "55 2345 6789",
      email: "nelson.hernandez@email.com",
      address: "Calle Cedros 12, Col. Bosques de Chapultepec",
      city: "Ciudad de México",
      state: "Ciudad de México",
      zipCode: "11700",
    },
  });

  await prisma.clinicalBackground.upsert({
    where: { patientId: patient1.id },
    update: {},
    create: {
      patientId: patient1.id,
      hfDiabetes: true,
      hfHypertension: true,
      ppDiseases: "Gastritis crónica (2015)",
      pnpSmoking: "Ex-fumador, dejó hace 5 años",
      pnpAlcohol: "Ocasional, fines de semana",
      allergyMedications: "Penicilina (urticaria)",
      currentMedications: "Omeprazol 20mg c/24h",
    },
  });

  await prisma.clinicalBackground.upsert({
    where: { patientId: patient2.id },
    update: {},
    create: {
      patientId: patient2.id,
      hfCancer: true,
      pnpSmoking: "No fuma",
      pnpAlcohol: "No ingiere",
      goMenarca: "13 años",
      goIvsa: "19 años",
      goGestas: 1,
      goPartos: 1,
      goAborts: 0,
      goCesareas: 0,
      goFup: "2026-04-01",
      allergyFood: "Mariscos",
    },
  });

  const now = new Date();
  const appt1 = await prisma.appointment.create({
    data: {
      patientId: patient1.id,
      doctorId: medico.id,
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0),
      reason: "Revisión de presión arterial",
      status: "PENDIENTE",
    },
  });

  await prisma.appointment.create({
    data: {
      patientId: patient2.id,
      doctorId: medico.id,
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 30),
      reason: "Consulta ginecológica",
      status: "PENDIENTE",
    },
  });

  const appt3 = await prisma.appointment.create({
    data: {
      patientId: patient3.id,
      doctorId: medico.id,
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0),
      reason: "Control de diabetes",
      status: "ATENDIDO",
    },
  });

  await prisma.appointment.create({
    data: {
      patientId: patient1.id,
      doctorId: medico.id,
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 11, 0),
      reason: "Seguimiento tratamiento",
      status: "PENDIENTE",
    },
  });

  // Sample medical note + prescription for patient3
  const note = await prisma.medicalNote.create({
    data: {
      patientId: patient3.id,
      doctorId: medico.id,
      appointmentId: appt3.id,
      consultationDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0),
      isLocked: true,
      reasonForVisit: "Control de diabetes y revisión general",
      bloodPressure: "130/85",
      heartRate: 78,
      temperature: 36.5,
      weight: 82,
      height: 170,
      bmi: 28.4,
      diagnosisCode: "E11",
      diagnosisDescription: "Diabetes mellitus tipo 2, sin complicaciones",
      treatmentPlan: "Continuar con Metformina 850mg c/12h, dieta hipocalórica y ejercicio moderado",
      prognosis: "Favorable con adherencia al tratamiento",
    },
  });

  const year = new Date().getFullYear();
  await prisma.prescription.create({
    data: {
      noteId: note.id,
      folio: `REC-${year}-0001`,
      status: "SENT",
      validUntil: addDays(new Date(), 30),
      patientEmail: patient3.email,
      emailSentAt: new Date(),
      medications: [
        { name: "Metformina", dose: "850 mg", route: "Oral", frequency: "Cada 12 horas", duration: "90 días", instructions: "Tomar con alimentos" },
        { name: "Atorvastatina", dose: "20 mg", route: "Oral", frequency: "Una vez al día", duration: "90 días", instructions: "Tomar en la noche" },
      ],
      notes: "Dieta hipocalórica. Ejercicio 30 min diarios. Control en 3 meses.",
      diagnosis: "Diabetes mellitus tipo 2 · Dislipidemia",
    },
  });

  console.log("✅ Database seeded successfully!");
  console.log("📧 Médico:          medico@demo.com / demo1234");
  console.log("📧 Recepcionista:   recep@demo.com / demo1234");
  console.log("💊 Receta de ejemplo: REC-" + year + "-0001");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
