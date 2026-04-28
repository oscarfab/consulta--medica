"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

const patientSchema = z.object({
  fullName: z.string().min(2, "Mínimo 2 caracteres"),
  birthdate: z.string().min(1, "Fecha requerida"),
  sex: z.enum(["MASCULINO", "FEMENINO", "OTRO"]),
  curp: z.string().optional().or(z.literal("")),
  bloodType: z.enum(["A_POS", "A_NEG", "B_POS", "B_NEG", "AB_POS", "AB_NEG", "O_POS", "O_NEG", "DESCONOCIDO"]).optional(),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
  whatsapp: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  zipCode: z.string().optional().or(z.literal("")),
  emergencyContact: z.string().optional().or(z.literal("")),
  emergencyPhone: z.string().optional().or(z.literal("")),
  insuranceName: z.string().optional().or(z.literal("")),
  insuranceNumber: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type PatientFormData = z.infer<typeof patientSchema>;

interface PatientFormProps {
  patientId?: string;
  defaultValues?: Partial<PatientFormData>;
}

const BLOOD_OPTIONS = [
  { value: "A_POS", label: "A+" },
  { value: "A_NEG", label: "A-" },
  { value: "B_POS", label: "B+" },
  { value: "B_NEG", label: "B-" },
  { value: "AB_POS", label: "AB+" },
  { value: "AB_NEG", label: "AB-" },
  { value: "O_POS", label: "O+" },
  { value: "O_NEG", label: "O-" },
  { value: "DESCONOCIDO", label: "Desconocido" },
];

const MEXICAN_STATES = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas",
  "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango", "Estado de México",
  "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "Michoacán", "Morelos", "Nayarit",
  "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí",
  "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán",
  "Zacatecas",
];

export function PatientForm({ patientId, defaultValues }: PatientFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const isEdit = !!patientId;

  const { register, handleSubmit, control, formState: { errors } } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      bloodType: "DESCONOCIDO",
      ...defaultValues,
    },
  });

  const onSubmit = async (data: PatientFormData) => {
    setSaving(true);
    try {
      const url = isEdit ? `/api/patients/${patientId}` : "/api/patients";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error();
      const patient = await res.json();
      toast.success(isEdit ? "Paciente actualizado" : "Paciente registrado");
      router.push(`/pacientes/${patient.id}`);
    } catch {
      toast.error("Error al guardar el paciente");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/pacientes">
          <Button variant="ghost" size="icon" className="text-slate-500">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isEdit ? "Editar paciente" : "Nuevo paciente"}
          </h1>
          <p className="text-slate-500 text-sm">
            {isEdit ? "Actualiza los datos del paciente" : "Registra un nuevo paciente en el sistema"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Datos personales */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-700">Datos personales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre completo *</Label>
              <Input
                placeholder="Apellido Paterno Apellido Materno Nombre(s)"
                {...register("fullName")}
                className={errors.fullName ? "border-red-500" : ""}
              />
              {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Fecha de nacimiento *</Label>
                <Input
                  type="date"
                  {...register("birthdate")}
                  className={errors.birthdate ? "border-red-500" : ""}
                />
                {errors.birthdate && <p className="text-xs text-red-500">{errors.birthdate.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Sexo *</Label>
                <Controller
                  control={control}
                  name="sex"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className={errors.sex ? "border-red-500" : ""}>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MASCULINO">Masculino</SelectItem>
                        <SelectItem value="FEMENINO">Femenino</SelectItem>
                        <SelectItem value="OTRO">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Grupo sanguíneo</Label>
                <Controller
                  control={control}
                  name="bloodType"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {BLOOD_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>CURP</Label>
                <Input
                  placeholder="XXXX000000XXXXXXXX00"
                  className="uppercase"
                  maxLength={18}
                  {...register("curp")}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Teléfono</Label>
                <Input placeholder="55 1234 5678" type="tel" {...register("phone")} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Correo electrónico</Label>
                <Input placeholder="paciente@correo.com" type="email" {...register("email")} />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>WhatsApp</Label>
                <Input placeholder="+52 55 1234 5678" type="tel" {...register("whatsapp")} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Domicilio */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-700">Domicilio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Calle y número</Label>
              <Input placeholder="Av. Reforma 100, Col. Centro" {...register("address")} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Ciudad</Label>
                <Input placeholder="Ciudad de México" {...register("city")} />
              </div>
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Controller
                  control={control}
                  name="state"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {MEXICAN_STATES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>C.P.</Label>
                <Input placeholder="06600" maxLength={5} {...register("zipCode")} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contacto de emergencia */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-700">Contacto de emergencia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <Input placeholder="Nombre del contacto" {...register("emergencyContact")} />
              </div>
              <div className="space-y-1.5">
                <Label>Teléfono</Label>
                <Input placeholder="55 9876 5432" type="tel" {...register("emergencyPhone")} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seguro médico */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-700">Seguro médico (opcional)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Aseguradora</Label>
                <Input placeholder="IMSS, ISSSTE, GNP, etc." {...register("insuranceName")} />
              </div>
              <div className="space-y-1.5">
                <Label>Número de póliza</Label>
                <Input placeholder="12345678" {...register("insuranceNumber")} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notas */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-700">Notas adicionales</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea rows={3} placeholder="Observaciones generales del paciente..." {...register("notes")} />
          </CardContent>
        </Card>

        <div className="flex gap-3 pt-2">
          <Link href="/pacientes">
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
          <Button
            type="submit"
            disabled={saving}
            className="bg-[#0D9488] hover:bg-[#0f766e] text-white gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Guardando..." : isEdit ? "Actualizar paciente" : "Registrar paciente"}
          </Button>
        </div>
      </form>
    </div>
  );
}
