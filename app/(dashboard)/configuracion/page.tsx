import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ConfigClient } from "./config-client";

export default async function ConfigPage() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id: session?.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      specialty: true,
      cedula: true,
      clinicName: true,
      clinicAddress: true,
      clinicPhone: true,
    },
  });

  return <ConfigClient user={user} />;
}
