import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Verificando usuarios de producción...");

  const existing = await prisma.user.findUnique({
    where: { email: "dr.mendoza@mediconsulta.site" },
  });

  if (existing) {
    console.log("✅ Usuario dr.mendoza@mediconsulta.site ya existe. Nada que hacer.");
    return;
  }

  console.log("🌱 Creando usuarios de producción...");

  await prisma.user.upsert({
    where: { email: "dr.mendoza@mediconsulta.site" },
    update: {},
    create: {
      email: "dr.mendoza@mediconsulta.site",
      password: await bcrypt.hash("Doctor123!", 12),
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
    where: { email: "recepcion@mediconsulta.site" },
    update: {},
    create: {
      email: "recepcion@mediconsulta.site",
      password: await bcrypt.hash("Recepcion123!", 12),
      name: "Recepción",
      role: "RECEPCIONISTA",
    },
  });

  console.log("✅ Usuarios de producción creados:");
  console.log("   📧 dr.mendoza@mediconsulta.site  /  Doctor123!");
  console.log("   📧 recepcion@mediconsulta.site   /  Recepcion123!");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
