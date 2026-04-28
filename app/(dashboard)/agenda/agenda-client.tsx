"use client";

import { useState, useEffect, useCallback } from "react";
import { format, startOfWeek, addDays, isSameDay, parseISO, addWeeks, subWeeks } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Plus, ChevronLeft, ChevronRight, Calendar, Loader2, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface Appointment {
  id: string;
  date: string;
  reason?: string;
  status: "PENDIENTE" | "ATENDIDO" | "CANCELADO";
  notes?: string;
  patient: { id: string; fullName: string };
  doctor: { id: string; name: string };
}

interface Patient { id: string; fullName: string }
interface Doctor { id: string; name: string }

const STATUS_COLORS = {
  PENDIENTE: "bg-yellow-100 text-yellow-700 border-yellow-200",
  ATENDIDO: "bg-green-100 text-green-700 border-green-200",
  CANCELADO: "bg-red-100 text-red-700 border-red-200",
};
const STATUS_LABELS = { PENDIENTE: "Pendiente", ATENDIDO: "Atendido", CANCELADO: "Cancelado" };

const apptSchema = z.object({
  patientId: z.string().min(1, "Selecciona un paciente"),
  doctorId: z.string().min(1, "Selecciona un médico"),
  date: z.string().min(1, "Selecciona fecha y hora"),
  reason: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["PENDIENTE", "ATENDIDO", "CANCELADO"]).optional(),
});

type ApptForm = z.infer<typeof apptSchema>;

interface Props {
  patients: Patient[];
  doctors: Doctor[];
  currentUserId: string;
  userRole: string;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7am to 7pm

export function AgendaClient({ patients, doctors, currentUserId, userRole }: Props) {
  const isDoctor = userRole === "MEDICO";
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<"week" | "day">("week");
  const [selectedDay, setSelectedDay] = useState(new Date());

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { register, handleSubmit, control, reset, setValue, formState: { errors } } = useForm<ApptForm>({
    resolver: zodResolver(apptSchema),
    defaultValues: { status: "PENDIENTE", doctorId: currentUserId },
  });

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const from = weekStart.toISOString();
      const to = addDays(weekStart, 6).toISOString();
      const res = await fetch(`/api/appointments?from=${from}&to=${to}`);
      const data = await res.json();
      setAppointments(data);
    } catch {
      toast.error("Error al cargar la agenda");
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const openNew = (day?: Date) => {
    setEditingAppt(null);
    reset({
      status: "PENDIENTE",
      doctorId: currentUserId,
      date: day ? format(day, "yyyy-MM-dd") + "T08:00" : "",
    });
    setDialogOpen(true);
  };

  const openEdit = (appt: Appointment) => {
    if (!patients.length || !doctors.length) return;
    setEditingAppt(appt);
    reset({
      patientId: appt.patient.id,
      doctorId: appt.doctor.id,
      date: format(parseISO(appt.date), "yyyy-MM-dd'T'HH:mm"),
      reason: appt.reason || "",
      notes: appt.notes || "",
      status: appt.status,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: ApptForm) => {
    setSaving(true);
    try {
      const body = { ...data, date: new Date(data.date).toISOString() };
      if (editingAppt) {
        await fetch(`/api/appointments/${editingAppt.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        toast.success("Cita actualizada");
      } else {
        await fetch("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        toast.success("Cita creada");
      }
      setDialogOpen(false);
      fetchAppointments();
    } catch {
      toast.error("Error al guardar la cita");
    } finally {
      setSaving(false);
    }
  };

  const deleteAppt = async (id: string) => {
    if (!confirm("¿Eliminar esta cita?")) return;
    await fetch(`/api/appointments/${id}`, { method: "DELETE" });
    toast.success("Cita eliminada");
    fetchAppointments();
  };

  const getApptsByDay = (day: Date) =>
    appointments.filter((a) => isSameDay(parseISO(a.date), day));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Agenda</h1>
          <p className="text-slate-500 text-sm">
            {format(weekStart, "d 'de' MMMM", { locale: es })} –{" "}
            {format(addDays(weekStart, 6), "d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            <button
              onClick={() => setView("week")}
              className={`px-3 py-1.5 text-xs font-medium ${view === "week" ? "bg-[#0D9488] text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              Semana
            </button>
            <button
              onClick={() => setView("day")}
              className={`px-3 py-1.5 text-xs font-medium ${view === "day" ? "bg-[#0D9488] text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              Día
            </button>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekStart(subWeeks(weekStart, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
          >
            Hoy
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekStart(addWeeks(weekStart, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button onClick={() => openNew()} className="bg-[#0D9488] hover:bg-[#0f766e] text-white gap-1.5">
            <Plus className="w-4 h-4" />
            Nueva cita
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#0D9488]" />
        </div>
      ) : view === "week" ? (
        /* Weekly view */
        <div className="grid grid-cols-7 gap-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {weekDays.map((day) => {
            const isToday = isSameDay(day, new Date());
            const dayAppts = getApptsByDay(day);
            return (
              <div key={day.toString()} className="min-h-32 border-r last:border-0 border-slate-100">
                <div
                  className={`p-2 text-center border-b border-slate-100 ${isToday ? "bg-[#0D9488]/10" : ""}`}
                >
                  <p className="text-xs text-slate-500 uppercase">{format(day, "EEE", { locale: es })}</p>
                  <p className={`text-lg font-bold ${isToday ? "text-[#0D9488]" : "text-slate-700"}`}>
                    {format(day, "d")}
                  </p>
                </div>
                <div className="p-1.5 space-y-1">
                  {dayAppts.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => openEdit(a)}
                      className={`w-full text-left p-1.5 rounded text-xs border ${STATUS_COLORS[a.status]} hover:opacity-80 transition-opacity`}
                    >
                      <p className="font-semibold truncate">{format(parseISO(a.date), "HH:mm")}</p>
                      <p className="truncate">{a.patient.fullName}</p>
                    </button>
                  ))}
                  <button
                    onClick={() => openNew(day)}
                    className="w-full text-xs text-slate-300 hover:text-slate-500 py-1 hover:bg-slate-50 rounded transition-colors"
                  >
                    + Agregar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Day view */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Day selector */}
          <div className="flex border-b border-slate-100 overflow-x-auto">
            {weekDays.map((day) => {
              const isToday = isSameDay(day, new Date());
              const isSel = isSameDay(day, selectedDay);
              return (
                <button
                  key={day.toString()}
                  onClick={() => setSelectedDay(day)}
                  className={`flex-1 min-w-[60px] py-3 text-center border-r last:border-0 border-slate-100 transition-colors ${isSel ? "bg-[#0D9488]/10" : "hover:bg-slate-50"}`}
                >
                  <p className="text-xs text-slate-400 uppercase">{format(day, "EEE", { locale: es })}</p>
                  <p className={`text-base font-bold ${isToday ? "text-[#0D9488]" : isSel ? "text-[#0D9488]" : "text-slate-700"}`}>
                    {format(day, "d")}
                  </p>
                  <p className="text-xs text-slate-400">{getApptsByDay(day).length} citas</p>
                </button>
              );
            })}
          </div>
          {/* Hours */}
          <div className="divide-y divide-slate-50">
            {HOURS.map((hour) => {
              const hourAppts = getApptsByDay(selectedDay).filter(
                (a) => parseISO(a.date).getHours() === hour
              );
              return (
                <div key={hour} className="flex items-start min-h-[56px] group hover:bg-slate-50/50">
                  <div className="w-14 flex-shrink-0 pt-2 pl-3 text-xs text-slate-400 font-mono">
                    {String(hour).padStart(2, "0")}:00
                  </div>
                  <div className="flex-1 p-1.5 flex flex-wrap gap-1.5">
                    {hourAppts.map((a) => (
                      <div
                        key={a.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${STATUS_COLORS[a.status]} max-w-xs`}
                      >
                        <span className="font-semibold">{format(parseISO(a.date), "HH:mm")}</span>
                        <span className="font-medium">{a.patient.fullName}</span>
                        {isDoctor && a.reason && <span className="text-slate-500 truncate max-w-24">· {a.reason}</span>}
                        <div className="flex gap-1 ml-auto">
                          <button onClick={() => openEdit(a)} className="hover:opacity-70"><Edit className="w-3 h-3" /></button>
                          <button onClick={() => deleteAppt(a.id)} className="hover:opacity-70"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                    ))}
                    {hourAppts.length === 0 && (
                      <button
                        onClick={() => {
                          const d = new Date(selectedDay);
                          d.setHours(hour, 0, 0, 0);
                          openNew(d);
                        }}
                        className="text-xs text-transparent group-hover:text-slate-300 hover:!text-slate-400 transition-colors"
                      >
                        + Agregar cita
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAppt ? "Editar cita" : "Nueva cita"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Paciente *</Label>
              <Controller
                control={control}
                name="patientId"
                render={({ field }) => (
                  <Select key={`patient-${editingAppt?.id ?? "new"}`} onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className={errors.patientId ? "border-red-500" : ""}>
                      <SelectValue placeholder="Seleccionar paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.patientId && <p className="text-xs text-red-500">{errors.patientId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Médico *</Label>
              <Controller
                control={control}
                name="doctorId"
                render={({ field }) => (
                  <Select key={`doctor-${editingAppt?.id ?? "new"}`} onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar médico" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Fecha y hora *</Label>
              <Input
                type="datetime-local"
                {...register("date")}
                className={errors.date ? "border-red-500" : ""}
              />
              {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
            </div>

            {isDoctor && (
              <div className="space-y-1.5">
                <Label>Motivo de consulta</Label>
                <Input placeholder="Ej. Consulta general, revisión..." {...register("reason")} />
              </div>
            )}

            {editingAppt && (
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                        <SelectItem value="ATENDIDO">Atendido</SelectItem>
                        <SelectItem value="CANCELADO">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea rows={2} placeholder="Observaciones adicionales..." {...register("notes")} />
            </div>

            <DialogFooter className="gap-2 pt-2">
              {editingAppt && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 mr-auto"
                  onClick={() => { deleteAppt(editingAppt.id); setDialogOpen(false); }}
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Eliminar
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="bg-[#0D9488] hover:bg-[#0f766e] text-white">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingAppt ? "Guardar cambios" : "Crear cita"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
