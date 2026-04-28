"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  LogOut,
  Stethoscope,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const DOCTOR_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/pacientes", label: "Pacientes", icon: Users },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

const RECEPTIONIST_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/pacientes", label: "Pacientes", icon: Users },
];

interface SidebarProps {
  userName: string;
  userRole: string;
  userInitials: string;
  userSpecialty?: string;
}

export function Sidebar({ userName, userRole, userInitials, userSpecialty }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isDoctor = userRole === "MEDICO";
  const navItems = isDoctor ? DOCTOR_NAV : RECEPTIONIST_NAV;
  const accentColor = isDoctor ? "#0D9488" : "#1E40AF";
  const accentHover = isDoctor ? "#0f766e" : "#1d3ea0";
  const accentBg = isDoctor ? "bg-[#0D9488]" : "bg-[#1E40AF]";

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-200">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: accentColor }}
        >
          <Stethoscope className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-slate-800 text-sm leading-tight">MediConsulta</p>
          <p className="text-xs text-slate-500 leading-tight">Sistema Médico</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              )}
              style={isActive ? { backgroundColor: accentColor } : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-slate-200">
        <div className="flex items-center gap-3 px-2 py-2 mb-2 rounded-lg bg-slate-50">
          <Avatar className="w-8 h-8">
            <AvatarFallback
              className="text-white text-xs font-semibold"
              style={{ backgroundColor: accentColor }}
            >
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-800 truncate">{userName}</p>
            {isDoctor && userSpecialty ? (
              <p className="text-xs text-slate-500 truncate">{userSpecialty}</p>
            ) : null}
            <Badge
              className="text-[10px] px-1.5 py-0 mt-0.5 text-white border-0"
              style={{ backgroundColor: accentColor }}
            >
              {isDoctor ? "Médico" : "Recepción"}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50 text-xs"
        >
          <LogOut className="w-3.5 h-3.5 mr-2" />
          Cerrar sesión
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-9 h-9 rounded-lg text-white flex items-center justify-center shadow-md"
        style={{ backgroundColor: accentColor }}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-slate-200 h-screen sticky top-0 flex-shrink-0">
        <NavContent />
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-56 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <NavContent />
      </aside>
    </>
  );
}
