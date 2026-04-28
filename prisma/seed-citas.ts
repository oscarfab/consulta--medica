import { PrismaClient } from "@prisma/client";
import { addDays, format } from "date-fns";

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
function dayKey(d: Date): string {
  return format(d, "yyyy-MM-dd");
}
function isWeekday(d: Date): boolean {
  const day = d.getDay();
  return day !== 0 && day !== 6;
}
function weekdaysInRange(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const curr = new Date(start);
  curr.setHours(0, 0, 0, 0);
  const endMs = new Date(end).setHours(23, 59, 59, 999);
  while (curr.getTime() <= endMs) {
    if (isWeekday(curr)) days.push(new Date(curr));
    curr.setDate(curr.getDate() + 1);
  }
  return days;
}

// ── data pools ────────────────────────────────────────────────────────────────

const TIME_SLOTS: Array<[number, number]> = [
  [9,0],[9,30],[10,0],[10,30],[11,0],[11,30],
  [12,0],[12,30],[13,0],[13,30],[14,0],[14,30],
  [15,0],[15,30],[16,0],[16,30],[17,0],[17,30],
];

const motivosConsulta = [
  "Dolor de cabeza","Fiebre","Control diabetes","Revisión general",
  "Dolor abdominal","Presión alta","Gripe","Dolor de espalda","Mareos","Control hipertensión",
];
const diagnosticos = [
  { desc: "Hipertensión esencial",        code: "I10"   },
  { desc: "Diabetes mellitus tipo 2",     code: "E11"   },
  { desc: "Infección respiratoria aguda", code: "J06"   },
  { desc: "Lumbalgia",                    code: "M54.5" },
  { desc: "Cefalea tensional",            code: "G44.2" },
  { desc: "Gastritis aguda",              code: "K29"   },
  { desc: "Trastorno de ansiedad",        code: "F41"   },
  { desc: "Obesidad",                     code: "E66"   },
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
  { name:"Paracetamol",  dose:"500mg", route:"Oral", frequency:"cada 8 horas",  duration:"5 días",  instructions:"Con alimentos" },
  { name:"Ibuprofeno",   dose:"400mg", route:"Oral", frequency:"cada 12 horas", duration:"7 días",  instructions:"No en ayunas" },
  { name:"Amoxicilina",  dose:"500mg", route:"Oral", frequency:"cada 8 horas",  duration:"7 días",  instructions:"Completar tratamiento" },
  { name:"Metformina",   dose:"850mg", route:"Oral", frequency:"cada 12 horas", duration:"30 días", instructions:"Con comida" },
  { name:"Losartán",     dose:"50mg",  route:"Oral", frequency:"cada 24 horas", duration:"30 días", instructions:"En ayunas" },
  { name:"Omeprazol",    dose:"20mg",  route:"Oral", frequency:"cada 24 horas", duration:"14 días", instructions:"30 min antes del desayuno" },
  { name:"Azitromicina", dose:"500mg", route:"Oral", frequency:"cada 24 horas", duration:"3 días",  instructions:"Con agua" },
  { name:"Diclofenaco",  dose:"100mg", route:"Oral", frequency:"cada 12 horas", duration:"5 días",  instructions:"Con alimentos" },
];

// ── status by date ────────────────────────────────────────────────────────────

function statusForDate(
  date: Date,
  todayKey: string
): "ATENDIDO" | "PENDIENTE" | "CANCELADO" {
  const dk = dayKey(date);
  if (dk < todayKey) {
    // past: 65% ATENDIDO, 20% CANCELADO, 15% PENDIENTE
    const r = Math.random();
    if (r < 0.65) return "ATENDIDO";
    if (r < 0.85) return "CANCELADO";
    return "PENDIENTE";
  }
  if (dk === todayKey) {
    // today: 40% ATENDIDO, 40% PENDIENTE, 20% CANCELADO
    const r = Math.random();
    if (r < 0.40) return "ATENDIDO";
    if (r < 0.80) return "PENDIENTE";
    return "CANCELADO";
  }
  // future: 85% PENDIENTE, 15% CANCELADO
  return Math.random() < 0.85 ? "PENDIENTE" : "CANCELADO";
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Iniciando seed de citas adicionales...");

  const TODAY = new Date(2026, 3, 27); // 27 abril 2026
  TODAY.setHours(0, 0, 0, 0);
  const todayKey = dayKey(TODAY);

  // ── 1. Doctor ───────────────────────────────────────────────────────────────
  const medico = await prisma.user.findUniqueOrThrow({
    where: { email: "dr.mendoza@mediconsulta.site" },
  });

  // ── 2. Pacientes ────────────────────────────────────────────────────────────
  const pacientes = await prisma.patient.findMany({ select: { id: true } });
  if (pacientes.length === 0) {
    throw new Error("No hay pacientes. Ejecuta seed-masivo primero.");
  }

  // ── 3. Cargar citas existentes para evitar duplicados ───────────────────────
  const existing = await prisma.appointment.findMany({
    where: { doctorId: medico.id },
    select: { date: true, patientId: true },
  });

  // slotUsed: "yyyy-MM-dd_HH:MM" -> true
  const slotUsed = new Set<string>();
  // dayCount: "yyyy-MM-dd" -> count
  const dayCount = new Map<string, number>();
  // patientDay: "yyyy-MM-dd_patientId" -> true
  const patientDayUsed = new Set<string>();

  for (const a of existing) {
    const dk = dayKey(a.date);
    const hh = String(a.date.getHours()).padStart(2, "0");
    const mm = String(a.date.getMinutes()).padStart(2, "0");
    slotUsed.add(`${dk}_${hh}:${mm}`);
    dayCount.set(dk, (dayCount.get(dk) ?? 0) + 1);
    patientDayUsed.add(`${dk}_${a.patientId}`);
  }

  // ── 4. Rangos de fechas ─────────────────────────────────────────────────────
  const ranges = [
    { start: new Date(2026, 0, 1),  end: new Date(2026, 2, 31), target: 150, label: "Ene-Mar 2026" },
    { start: new Date(2026, 3, 1),  end: new Date(2026, 3, 30), target: 80,  label: "Abr 2026"     },
    { start: new Date(2026, 4, 1),  end: new Date(2026, 6, 31), target: 170, label: "May-Jul 2026" },
  ];

  type AppRow = {
    patientId: string;
    doctorId: string;
    date: Date;
    reason: string;
    status: "ATENDIDO" | "PENDIENTE" | "CANCELADO";
  };

  const appointmentData: AppRow[] = [];

  for (const range of ranges) {
    const weekdays = weekdaysInRange(range.start, range.end);
    let generated = 0;
    let attempts = 0;
    const maxAttempts = range.target * 30;

    while (generated < range.target && attempts < maxAttempts) {
      attempts++;

      const baseDay = new Date(pick(weekdays));
      const dk = dayKey(baseDay);

      // Max 12 per day
      if ((dayCount.get(dk) ?? 0) >= 12) continue;

      // Pick patient not already used today
      const shuffled = [...pacientes].sort(() => Math.random() - 0.5);
      let patientId: string | null = null;
      for (const p of shuffled) {
        if (!patientDayUsed.has(`${dk}_${p.id}`)) {
          patientId = p.id;
          break;
        }
      }
      if (!patientId) continue;

      // Pick available time slot
      const shuffledSlots = [...TIME_SLOTS].sort(() => Math.random() - 0.5);
      let slot: [number, number] | null = null;
      for (const s of shuffledSlots) {
        const hh = String(s[0]).padStart(2, "0");
        const mm = String(s[1]).padStart(2, "0");
        if (!slotUsed.has(`${dk}_${hh}:${mm}`)) {
          slot = s;
          break;
        }
      }
      if (!slot) continue;

      const date = new Date(baseDay);
      date.setHours(slot[0], slot[1], 0, 0);

      const hhStr = String(slot[0]).padStart(2, "0");
      const mmStr = String(slot[1]).padStart(2, "0");
      slotUsed.add(`${dk}_${hhStr}:${mmStr}`);
      dayCount.set(dk, (dayCount.get(dk) ?? 0) + 1);
      patientDayUsed.add(`${dk}_${patientId}`);

      appointmentData.push({
        patientId,
        doctorId: medico.id,
        date,
        reason: pick(motivosConsulta),
        status: statusForDate(date, todayKey),
      });
      generated++;
    }

    if (generated < range.target) {
      console.warn(`⚠️  ${range.label}: solo ${generated}/${range.target} (slots agotados)`);
    } else {
      console.log(`✅ ${range.label}: ${generated} citas`);
    }
  }

  // ── 5. Insertar citas ───────────────────────────────────────────────────────
  await prisma.appointment.createMany({ data: appointmentData });

  const pastCount   = appointmentData.filter(a => dayKey(a.date) < todayKey).length;
  const todayCount  = appointmentData.filter(a => dayKey(a.date) === todayKey).length;
  const futureCount = appointmentData.filter(a => dayKey(a.date) > todayKey).length;

  // ── 6. Folio base ───────────────────────────────────────────────────────────
  const lastRec = await prisma.prescription.findFirst({
    where: { folio: { startsWith: "REC-2026-M" } },
    orderBy: { folio: "desc" },
  });
  let folioCounter = 0;
  if (lastRec?.folio) {
    const m = lastRec.folio.match(/(\d+)$/);
    if (m) folioCounter = parseInt(m[1]);
  }

  // ── 7. Notas y recetas para citas ATENDIDO sin nota ─────────────────────────
  const citasAtendidas = await prisma.appointment.findMany({
    where: { doctorId: medico.id, status: "ATENDIDO", medicalNote: null },
    select: { id: true, patientId: true, date: true },
  });

  let noteCount = 0;
  let prescriptionCount = 0;

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

    if (Math.random() < 0.5) {
      const numMeds = rInt(1, 3);
      const meds = [...medicamentosPool].sort(() => Math.random() - 0.5).slice(0, numMeds);
      folioCounter++;
      const folio = `REC-2026-M${String(folioCounter).padStart(4, "0")}`;

      const existingRec = await prisma.prescription.findUnique({ where: { noteId: note.id } });
      if (!existingRec) {
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

  // ── 8. Resumen ──────────────────────────────────────────────────────────────
  console.log("\n✅ Citas generadas:");
  console.log(`📅 Citas pasadas: ${pastCount}`);
  console.log(`📅 Citas de hoy: ${todayCount}`);
  console.log(`📅 Citas futuras: ${futureCount}`);
  console.log(`📋 Notas creadas: ${noteCount}`);
  console.log(`💊 Recetas creadas: ${prescriptionCount}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
