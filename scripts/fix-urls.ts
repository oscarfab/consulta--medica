import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.prescription.updateMany({
    where: { qrCode: { contains: " " } },
    data: { qrCode: null },
  });
  console.log(`Cleaned ${result.count} prescription(s) with corrupted qrCode.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
