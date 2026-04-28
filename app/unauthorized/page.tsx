import Link from "next/link";
import { ShieldOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-red-100 flex items-center justify-center mx-auto">
          <ShieldOff className="w-10 h-10 text-red-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-800">Acceso restringido</h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            No tienes permiso para acceder a esta sección. Esta área está reservada
            exclusivamente para el personal médico.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700 text-left space-y-1">
          <p className="font-semibold">Como recepcionista puedes acceder a:</p>
          <ul className="list-disc list-inside space-y-0.5 text-blue-600">
            <li>Dashboard de recepción</li>
            <li>Gestión de agenda y citas</li>
            <li>Información general de pacientes</li>
          </ul>
        </div>

        <Link href="/dashboard">
          <Button className="bg-[#1E40AF] hover:bg-[#1d3ea0] text-white gap-2">
            <ArrowLeft className="w-4 h-4" />
            Regresar al dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
