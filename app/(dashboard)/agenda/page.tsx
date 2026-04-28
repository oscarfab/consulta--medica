import { AgendaClient } from "./agenda-client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AgendaPage() {
  const session = await auth();
  const patients = await prisma.patient.findMany({
    select: { id: true, fullName: true },
    orderBy: { fullName: "asc" },
  });
  const doctors = await prisma.user.findMany({
    where: { role: "MEDICO" },
    select: { id: true, name: true },
  });

  return (
    <AgendaClient
      patients={patients}
      doctors={doctors}
      currentUserId={session?.user.id || ""}
      userRole={session?.user.role || "RECEPCIONISTA"}
    />
  );
}
