"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type WhatsAppStatus = "disconnected" | "connecting" | "connected";

export function WhatsAppBadge() {
  const [status, setStatus] = useState<WhatsAppStatus>("disconnected");

  useEffect(() => {
    const check = () => {
      fetch("/api/whatsapp/connect")
        .then((r) => r.json())
        .then((d) => setStatus(d.status as WhatsAppStatus))
        .catch(() => {});
    };

    check();
    const id = setInterval(check, 10000);
    return () => clearInterval(id);
  }, []);

  if (status === "connected") return null;

  const dot =
    status === "connecting"
      ? "bg-yellow-400 animate-pulse"
      : "bg-red-500";

  const label =
    status === "connecting" ? "WhatsApp conectando..." : "WhatsApp desconectado";

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-medium text-slate-600">
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
      {status === "disconnected" && (
        <Link
          href="/configuracion#whatsapp"
          className="font-semibold text-[#0D9488] hover:underline ml-0.5"
        >
          Conectar →
        </Link>
      )}
    </div>
  );
}
