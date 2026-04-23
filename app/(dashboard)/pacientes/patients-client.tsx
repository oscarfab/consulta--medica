"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { format, differenceInYears, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Search, UserPlus, FileText, ChevronLeft, ChevronRight, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface Patient {
  id: string;
  fullName: string;
  birthdate: string;
  sex: "MASCULINO" | "FEMENINO" | "OTRO";
  curp?: string;
  phone?: string;
  bloodType: string;
  appointments: { date: string; status: string }[];
}

const BLOOD_LABELS: Record<string, string> = {
  A_POS: "A+", A_NEG: "A-", B_POS: "B+", B_NEG: "B-",
  AB_POS: "AB+", AB_NEG: "AB-", O_POS: "O+", O_NEG: "O-", DESCONOCIDO: "—",
};

const SEX_LABELS: Record<string, string> = {
  MASCULINO: "Masculino", FEMENINO: "Femenino", OTRO: "Otro",
};

export function PatientsClient() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, page: String(page), limit: "15" });
      const res = await fetch(`/api/patients?${params}`);
      const data = await res.json();
      setPatients(data.patients);
      setTotalPages(data.pages);
      setTotal(data.total);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    const timer = setTimeout(fetchPatients, 300);
    return () => clearTimeout(timer);
  }, [fetchPatients]);

  useEffect(() => { setPage(1); }, [search]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pacientes</h1>
          <p className="text-slate-500 text-sm">{total} pacientes registrados</p>
        </div>
        <Link href="/pacientes/nuevo">
          <Button className="bg-[#0D9488] hover:bg-[#0f766e] text-white gap-1.5">
            <UserPlus className="w-4 h-4" />
            Nuevo paciente
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          className="pl-9 bg-white"
          placeholder="Buscar por nombre, CURP o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-7 h-7 animate-spin text-[#0D9488]" />
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">
                {search ? "No se encontraron pacientes con ese término" : "No hay pacientes registrados"}
              </p>
              {!search && (
                <Link href="/pacientes/nuevo" className="mt-2 inline-block text-xs text-[#0D9488] hover:underline">
                  Registrar primer paciente →
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Edad</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Sexo</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">CURP</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Última visita</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Sangre</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {patients.map((p) => {
                    const age = differenceInYears(new Date(), parseISO(p.birthdate));
                    const lastVisit = p.appointments[0]?.date;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold text-slate-700">{p.fullName}</p>
                            {p.phone && <p className="text-xs text-slate-400">{p.phone}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{age} años</td>
                        <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                          {SEX_LABELS[p.sex]}
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-xs hidden lg:table-cell">
                          {p.curp || "—"}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {lastVisit ? (
                            <span className="text-slate-600 text-xs">
                              {format(parseISO(lastVisit), "d MMM yyyy", { locale: es })}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs">Sin visitas</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <Badge variant="outline" className="text-xs font-mono">
                            {BLOOD_LABELS[p.bloodType] || "—"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/pacientes/${p.id}`}>
                            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                              <FileText className="w-3.5 h-3.5" />
                              Ver expediente
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-slate-500">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="gap-1"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
