import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, subDays } from "date-fns";

const prisma = new PrismaClient();

// ── helpers ───────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function rInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function rFloat(min: number, max: number, dec = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(dec));
}
function rBool(p = 0.3): boolean {
  return Math.random() < p;
}
// Unique 18-char CURP guaranteed for indices 0-675
function generateCurp(i: number, sexCode: "H" | "M"): string {
  const base = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const a = base[Math.floor(i / 26) % 26];
  const b = base[i % 26];
  const idx = String(i).padStart(2, "0");
  return `MS${a}${b}000000${sexCode}DFABC${idx}`;
}

// ── data pools ────────────────────────────────────────────────────────────────

const nombresM = ["Juan","Carlos","Miguel","Roberto","Fernando","Alejandro","Luis","José","Eduardo","Ricardo","Pedro","Manuel","Antonio","Francisco","Jorge","Sergio","Raúl","Ernesto","Arturo","Gustavo"];
const nombresF = ["María","Ana","Laura","Sofía","Gabriela","Fernanda","Claudia","Patricia","Verónica","Mónica","Diana","Sandra","Alejandra","Rosa","Carmen","Lucía","Beatriz","Silvia","Elena","Adriana"];
const apellidosP = ["García","Martínez","López","González","Hernández","Pérez","Ramírez","Torres","Flores","Rivera","Sánchez","Díaz","Morales","Jiménez","Reyes","Cruz","Ortega","Vargas","Castillo","Romero"];
const apellidosM = ["Medina","Luna","Mendoza","Vega","Herrera","Suárez","Gutiérrez","Ramos","Ruiz","Alvarado"];
const bloodTypes = ["A_POS","A_NEG","B_POS","B_NEG","AB_POS","AB_NEG","O_POS","O_NEG"] as const;
const calles = ["Av. Insurgentes","Calle Pino","Av. Revolución","Calle Cedros","Av. Universidad","Calle Olivos","Av. Taxqueña","Calle Fresno","Av. Coyoacán","Calle Robles"];
const colonias = ["Col. Del Valle","Col. Condesa","Col. Roma Norte","Col. Narvarte","Col. Doctores","Col. Iztapalapa","Col. Tlalpan","Col. Mixcoac","Col. Ecatepec","Col. Naucalpan"];
const ciudades: Array<[string, string]> = [
  ["Ciudad de México","Ciudad de México"],
  ["Ciudad de México","Ciudad de México"],
  ["Ecatepec","Estado de México"],
  ["Naucalpan","Estado de México"],
  ["Tlalnepantla","Estado de México"],
];
const motivosConsulta = ["Dolor de cabeza","Fiebre","Control diabetes","Revisión general","Dolor abdominal","Presión alta","Gripe","Dolor de espalda","Mareos","Control hipertensión"];
const diagnosticos = [
  { desc: "Hipertensión esencial",       code: "I10"   },
  { desc: "Diabetes mellitus tipo 2",    code: "E11"   },
  { desc: "Infección respiratoria aguda",code: "J06"   },
  { desc: "Lumbalgia",                   code: "M54.5" },
  { desc: "Cefalea tensional",           code: "G44.2" },
  { desc: "Gastritis aguda",             code: "K29"   },
  { desc: "Trastorno de ansiedad",       code: "F41"   },
  { desc: "Obesidad",                    code: "E66"   },
];
const planes: Record<string, string> = {
  "I10":   "Iniciar antihipertensivo, dieta baja en sodio, control en 4 semanas.",
  "E11":   "Continuar hipoglucemiantes, control glucémico, dieta y ejercicio.",
  "J06":   "Tratamiento sintomático, hidratación, reposo relativo 3 días.",
  "M54.5": "AINE, fisioterapia, evitar cargas. Reevaluación en 2 semanas.",
  "G44.2": "Analgésicos, técnicas de relajación, hidratación adecuada.",
  "K29":   "Inhibidor de bomba de protones, dieta blanda, evitar irritantes.",
  "F41":   "Psicoeducación, técnicas de manejo del estrés, seguimiento.",
  "E66":   "Plan nutricional, actividad física gradual, control en 1 mes.",
};
const pronosticos = ["Favorable", "Reservado", "Bueno"];
const medicamentosPool = [
  { name:"Paracetamol",  dose:"500mg",  route:"Oral", frequency:"cada 8 horas",   duration:"5 días",  instructions:"Con alimentos" },
  { name:"Ibuprofeno",   dose:"400mg",  route:"Oral", frequency:"cada 12 horas",  duration:"7 días",  instructions:"No en ayunas" },
  { name:"Amoxicilina",  dose:"500mg",  route:"Oral", frequency:"cada 8 horas",   duration:"7 días",  instructions:"Completar tratamiento" },
  { name:"Metformina",   dose:"850mg",  route:"Oral", frequency:"cada 12 horas",  duration:"30 días", instructions:"Con comida" },
  { name:"Losartán",     dose:"50mg",   route:"Oral", frequency:"cada 24 horas",  duration:"30 días", instructions:"En ayunas" },
  { name:"Omeprazol",    dose:"20mg",   route:"Oral", frequency:"cada 24 horas",  duration:"14 días", instructions:"30 min antes del desayuno" },
  { name:"Azitromicina", dose:"500mg",  route:"Oral", frequency:"cada 24 horas",  duration:"3 días",  instructions:"Con agua" },
  { name:"Diclofenaco",  dose:"100mg",  route:"Oral", frequency:"cada 12 horas",  duration:"5 días",  instructions:"Con alimentos" },
];
const alergiasMeds = [null, null, "Penicilina", "Aspirina", "Sulfonamidas"];
const medicActuales = [null, null, "Metformina 850mg c/12h", "Losartán 50mg c/24h", "Omeprazol 20mg c/24h"];

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Iniciando seed masivo...");

  // ── 1. Usuarios ─────────────────────────────────────────────────────────────
  const medico = await prisma.user.upsert({
    where: { email: "dr.mendoza@mediconsulta.site" },
    update: {},
    create: {
      email: "dr.mendoza@mediconsulta.site",
      password: await bcrypt.hash("Doctor123!", 12),
      name: "Dr. Carlos Mendoza López",
      role: "MEDICO",
      specialty: "Medicina General",
      cedula: "8547123",
      clinicName: "Clínica Salud Integral",
      clinicAddress: "Av. Insurgentes Sur 1234, CDMX",
      clinicPhone: "55 5555 1234",
    },
  });

  await prisma.user.upsert({
    where: { email: "recepcion@mediconsulta.site" },
    update: {},
    create: {
      email: "recepcion@mediconsulta.site",
      password: await bcrypt.hash("Recepcion123!", 12),
      name: "Ana García Rodríguez",
      role: "RECEPCIONISTA",
    },
  });

  console.log("✅ Usuarios creados");

  // ── 2. Pacientes ─────────────────────────────────────────────────────────────
  const pacientesData = Array.from({ length: 80 }, (_, i) => {
    const esMasculino = i % 2 === 0;
    const nombre = esMasculino ? nombresM[i % nombresM.length] : nombresF[i % nombresF.length];
    const apP = apellidosP[i % apellidosP.length];
    const apM = apellidosM[i % apellidosM.length];
    const sexCode: "H" | "M" = esMasculino ? "H" : "M";
    const birthYear = rInt(1950, 2005);
    const birthMonth = rInt(1, 12);
    const birthDay = rInt(1, 28);
    const [city, state] = ciudades[i % ciudades.length];
    const phone = `55${String(rInt(10000000, 99999999))}`;
    return {
      fullName: `${nombre} ${apP} ${apM}`,
      birthdate: new Date(birthYear, birthMonth - 1, birthDay),
      sex: (esMasculino ? "MASCULINO" : "FEMENINO") as "MASCULINO" | "FEMENINO",
      curp: generateCurp(i, sexCode),
      bloodType: bloodTypes[i % bloodTypes.length],
      phone,
      email: `${nombre.toLowerCase().replace(/[áéíóú]/g,"a")}.${apP.toLowerCase()}${i}@gmail.com`,
      whatsapp: phone,
      address: `${pick(calles)} ${rInt(1, 999)}, ${colonias[i % colonias.length]}`,
      city,
      state,
    };
  });

  const pacientes = [];
  for (const data of pacientesData) {
    const p = await prisma.patient.upsert({
      where: { curp: data.curp },
      update: {},
      create: data,
    });
    pacientes.push(p);
  }
  console.log(`✅ ${pacientes.length} pacientes creados/existentes`);

  // ── 3. Antecedentes clínicos ─────────────────────────────────────────────────
  for (const p of pacientes) {
    await prisma.clinicalBackground.upsert({
      where: { patientId: p.id },
      update: {},
      create: {
        patientId: p.id,
        hfDiabetes:     rBool(0.25),
        hfHypertension: rBool(0.30),
        hfCancer:       rBool(0.10),
        hfCardiopathy:  rBool(0.15),
        hfObesity:      rBool(0.20),
        hfAsthma:       rBool(0.12),
        hfNephropathy:  rBool(0.08),
        hfPsychiatric:  rBool(0.10),
        pnpSmoking: pick(["No fuma", "Fumador activo", "Ex-fumador", null]),
        pnpAlcohol:  pick(["No ingiere", "Ocasional", "Frecuente", null]),
        allergyMedications: pick(alergiasMeds),
        currentMedications: pick(medicActuales),
      },
    });
  }
  console.log("✅ Antecedentes clínicos creados");

  // ── 4. Citas ──────────────────────────────────────────────────────────────────
  const existingCount = await prisma.appointment.count({ where: { doctorId: medico.id } });
  if (existingCount >= 100) {
    console.log(`⏭️  Ya existen ${existingCount} citas para este médico, saltando creación de citas.`);
  } else {
    const today = new Date();
    const horas = [9, 9.5, 10, 10.5, 11, 11.5, 12, 13, 13.5, 14, 14.5, 15, 15.5, 16, 16.5, 17, 17.5];
    // 90 ATENDIDO, 38 PENDIENTE, 22 CANCELADO = 150
    const statusPool: Array<"ATENDIDO" | "PENDIENTE" | "CANCELADO"> = [
      ...Array(90).fill("ATENDIDO"),
      ...Array(38).fill("PENDIENTE"),
      ...Array(22).fill("CANCELADO"),
    ];
    // Shuffle status pool
    statusPool.sort(() => Math.random() - 0.5);

    const appointmentData = statusPool.map((status, i) => {
      const daysAgo = rInt(0, 90);
      const hora = pick(horas);
      const hh = Math.floor(hora);
      const mm = (hora % 1) * 60;
      const date = subDays(today, daysAgo);
      date.setHours(hh, mm, 0, 0);
      return {
        patientId: pacientes[i % pacientes.length].id,
        doctorId: medico.id,
        date,
        reason: pick(motivosConsulta),
        status,
      };
    });

    await prisma.appointment.createMany({ data: appointmentData });
    console.log("✅ 150 citas creadas");
  }

  // ── 5. Notas médicas ──────────────────────────────────────────────────────────
  const citasAtendidas = await prisma.appointment.findMany({
    where: {
      doctorId: medico.id,
      status: "ATENDIDO",
      medicalNote: null,
    },
  });

  let noteCount = 0;
  let prescriptionCount = 0;

  // Determine folio starting point to avoid conflicts
  const lastRec = await prisma.prescription.findFirst({
    where: { folio: { startsWith: "REC-2026-M" } },
    orderBy: { folio: "desc" },
  });
  let folioCounter = 0;
  if (lastRec?.folio) {
    const m = lastRec.folio.match(/(\d+)$/);
    if (m) folioCounter = parseInt(m[1]);
  }

  for (const cita of citasAtendidas) {
    const diag = pick(diagnosticos);
    const peso = rFloat(55, 95);
    const talla = rFloat(1.55, 1.85, 2);
    const bmi = parseFloat((peso / (talla * talla)).toFixed(1));
    const bp = `${rInt(110, 150)}/${rInt(70, 95)}`;

    const note = await prisma.medicalNote.create({
      data: {
        patientId: cita.patientId,
        doctorId: medico.id,
        appointmentId: cita.id,
        consultationDate: cita.date,
        isLocked: true,
        reasonForVisit: pick(motivosConsulta),
        bloodPressure: bp,
        heartRate: rInt(60, 100),
        respiratoryRate: rInt(14, 20),
        temperature: rFloat(36.0, 38.5),
        weight: peso,
        height: talla,
        bmi,
        diagnosisCode: diag.code,
        diagnosisDescription: diag.desc,
        treatmentPlan: planes[diag.code] ?? "Tratamiento según diagnóstico.",
        prognosis: pick(pronosticos),
      },
    });
    noteCount++;

    // ── 6. Recetas (60 % de las notas) ──────────────────────────────────────
    if (Math.random() < 0.6) {
      const numMeds = rInt(1, 3);
      const meds = [...medicamentosPool]
        .sort(() => Math.random() - 0.5)
        .slice(0, numMeds);

      folioCounter++;
      const folio = `REC-2026-M${String(folioCounter).padStart(3, "0")}`;

      // Upsert by noteId (unique) to be safe on re-runs
      const existing = await prisma.prescription.findUnique({ where: { noteId: note.id } });
      if (!existing) {
        await prisma.prescription.create({
          data: {
            noteId: note.id,
            folio,
            status: "SENT",
            validUntil: addDays(cita.date, 30),
            medications: meds,
            diagnosis: diag.desc,
            notes: "Seguir indicaciones médicas. Control en 4 semanas.",
          },
        });
        prescriptionCount++;
      }
    }
  }

  // ── Resumen ───────────────────────────────────────────────────────────────────
  console.log("\n✅ Seed masivo completado");
  console.log("👤 Médico:       dr.mendoza@mediconsulta.site / Doctor123!");
  console.log("👤 Recepción:    recepcion@mediconsulta.site / Recepcion123!");
  console.log(`👥 Pacientes:    80`);
  console.log(`📅 Citas:        150`);
  console.log(`📋 Notas médicas: ${noteCount}`);
  console.log(`💊 Recetas:      ${prescriptionCount}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
