"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, User, Building, Stethoscope, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const profileSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  specialty: z.string().optional().or(z.literal("")),
  cedula: z.string().optional().or(z.literal("")),
  clinicName: z.string().optional().or(z.literal("")),
  clinicAddress: z.string().optional().or(z.literal("")),
  clinicPhone: z.string().optional().or(z.literal("")),
});

type ProfileForm = z.infer<typeof profileSchema>;

interface User {
  id?: string;
  name?: string | null;
  email?: string | null;
  role?: string;
  specialty?: string | null;
  cedula?: string | null;
  clinicName?: string | null;
  clinicAddress?: string | null;
  clinicPhone?: string | null;
}

interface Props {
  user: User | null;
}

export function ConfigClient({ user }: Props) {
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      specialty: user?.specialty || "",
      cedula: user?.cedula || "",
      clinicName: user?.clinicName || "",
      clinicAddress: user?.clinicAddress || "",
      clinicPhone: user?.clinicPhone || "",
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      toast.success("Perfil actualizado. Reinicia sesión para ver los cambios en el sidebar.");
    } catch {
      toast.error("Error al guardar el perfil");
    } finally {
      setSaving(false);
    }
  };

  const roleLabel = user?.role === "MEDICO" ? "Médico" : "Recepcionista";

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Configuración</h1>
        <p className="text-slate-500 text-sm">Gestiona tu perfil y datos de la clínica</p>
      </div>

      {/* Account info */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-700 flex items-center gap-2">
            <User className="w-4 h-4" /> Cuenta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <p className="text-xs text-slate-400">Correo electrónico</p>
              <p className="text-sm font-medium text-slate-700">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-xs text-slate-400">Rol en el sistema</p>
              <Badge
                className={`mt-1 text-xs ${
                  user?.role === "MEDICO"
                    ? "bg-[#0D9488]/10 text-[#0D9488]"
                    : "bg-blue-100 text-blue-700"
                }`}
                variant="secondary"
              >
                {roleLabel}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Personal info */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-700 flex items-center gap-2">
              <Stethoscope className="w-4 h-4" /> Datos profesionales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre completo *</Label>
              <Input
                {...register("name")}
                placeholder="Dr. Juan García López"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Especialidad</Label>
                <Input
                  {...register("specialty")}
                  placeholder="Medicina General, Pediatría..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Cédula profesional</Label>
                <Input
                  {...register("cedula")}
                  placeholder="12345678"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clinic info */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-700 flex items-center gap-2">
              <Building className="w-4 h-4" /> Datos de la clínica
            </CardTitle>
            <CardDescription className="text-xs">
              Esta información aparece en las recetas médicas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre de la clínica</Label>
              <Input
                {...register("clinicName")}
                placeholder="Clínica San José"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Dirección</Label>
              <Textarea
                rows={2}
                {...register("clinicAddress")}
                placeholder="Av. Juárez 123, Col. Centro, CDMX"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input
                {...register("clinicPhone")}
                placeholder="55 1234 5678"
                type="tel"
              />
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {(user?.name || user?.specialty || user?.cedula) && (
          <Card className="border border-[#0D9488]/20 bg-teal-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Vista previa en recetas
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-600 space-y-0.5">
              <p className="font-bold text-sm text-slate-700">{user.name}</p>
              {user.specialty && <p>{user.specialty}</p>}
              {user.cedula && <p>Cédula: {user.cedula}</p>}
              {user.clinicName && <p className="mt-1 font-medium">{user.clinicName}</p>}
              {user.clinicAddress && <p>{user.clinicAddress}</p>}
              {user.clinicPhone && <p>Tel: {user.clinicPhone}</p>}
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3 pb-8">
          <Button
            type="submit"
            disabled={saving || !isDirty}
            className="bg-[#0D9488] hover:bg-[#0f766e] text-white gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>

      {/* Security section */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-700 flex items-center gap-2">
            <Shield className="w-4 h-4" /> Seguridad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">
            Para cambiar tu contraseña, contacta al administrador del sistema.
          </p>
          <p className="text-xs text-slate-400 mt-2">
            NOM-004-SSA3-2012 requiere autenticación segura para proteger los expedientes clínicos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
