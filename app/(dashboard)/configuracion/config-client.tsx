"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  User,
  Building,
  Stethoscope,
  Shield,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
type WhatsAppStatus = "disconnected" | "connecting" | "connected";

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

  // WhatsApp state
  const [waStatus, setWaStatus] = useState<WhatsAppStatus>("disconnected");
  const [waQR, setWaQR] = useState<string | null>(null);
  const [waLoading, setWaLoading] = useState(false);

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

  // Fetch initial WhatsApp status
  useEffect(() => {
    fetch("/api/whatsapp/connect")
      .then((r) => r.json())
      .then((d) => {
        setWaStatus(d.status);
        setWaQR(d.qr);
      })
      .catch(() => {});
  }, []);

  // Poll every 2 s while connecting
  useEffect(() => {
    if (waStatus !== "connecting") return;
    const id = setInterval(() => {
      fetch("/api/whatsapp/connect")
        .then((r) => r.json())
        .then((d) => {
          setWaStatus(d.status);
          setWaQR(d.qr);
        })
        .catch(() => {});
    }, 2000);
    return () => clearInterval(id);
  }, [waStatus]);

  const handleConnect = async () => {
    setWaLoading(true);
    try {
      const res = await fetch("/api/whatsapp/connect", { method: "POST" });
      if (res.ok) setWaStatus("connecting");
      else toast.error("Error al iniciar conexión");
    } catch {
      toast.error("Error al conectar WhatsApp");
    } finally {
      setWaLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setWaLoading(true);
    try {
      await fetch("/api/whatsapp/connect", { method: "DELETE" });
      setWaStatus("disconnected");
      setWaQR(null);
    } catch {
      toast.error("Error al desconectar WhatsApp");
    } finally {
      setWaLoading(false);
    }
  };

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

      {/* WhatsApp */}
      <Card id="whatsapp" className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-700 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" /> Conexión WhatsApp
          </CardTitle>
          <CardDescription className="text-xs">
            Vincula tu WhatsApp para enviar recetas directamente a los pacientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  waStatus === "connected"
                    ? "bg-green-500"
                    : waStatus === "connecting"
                    ? "bg-yellow-400 animate-pulse"
                    : "bg-red-500"
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  waStatus === "connected"
                    ? "text-green-700"
                    : waStatus === "connecting"
                    ? "text-yellow-700"
                    : "text-red-700"
                }`}
              >
                {waStatus === "connected"
                  ? "Conectado ✅"
                  : waStatus === "connecting"
                  ? "Conectando..."
                  : "Desconectado"}
              </span>
            </div>

            <div className="flex gap-2">
              {waStatus === "disconnected" && (
                <Button
                  type="button"
                  onClick={handleConnect}
                  disabled={waLoading}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                >
                  {waLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <MessageCircle className="w-3 h-3" />
                  )}
                  Conectar WhatsApp
                </Button>
              )}
              {waStatus === "connected" && (
                <Button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={waLoading}
                  variant="outline"
                  size="sm"
                  className="border-red-200 text-red-600 hover:bg-red-50 gap-1.5"
                >
                  {waLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                  Desconectar
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* QR code */}
          {waStatus === "connecting" && waQR && (
            <div className="flex flex-col items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <img src={waQR} alt="QR WhatsApp" className="w-64 h-64 rounded-lg" />
              <p className="text-xs text-slate-500 text-center max-w-xs leading-relaxed">
                Abre WhatsApp en tu celular → Dispositivos vinculados →{" "}
                Vincular un dispositivo → Escanea este código
              </p>
            </div>
          )}

          {waStatus === "connecting" && !waQR && (
            <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              Iniciando WhatsApp, espera un momento...
            </div>
          )}

          {waStatus === "connected" && (
            <p className="text-sm text-green-700 bg-green-50 p-3 rounded-lg">
              ✅ Ya puedes enviar recetas por WhatsApp desde la vista de receta del paciente.
            </p>
          )}

          {waStatus === "disconnected" && (
            <p className="text-xs text-slate-400">
              Una vez conectado, podrás enviar recetas en PDF directamente al WhatsApp de tus pacientes.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Security */}
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
