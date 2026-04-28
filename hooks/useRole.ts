"use client";

import { useSession } from "next-auth/react";

export function useRole() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  return {
    role,
    isDoctor: () => role === "MEDICO",
    isReceptionist: () => role === "RECEPCIONISTA",
  };
}
