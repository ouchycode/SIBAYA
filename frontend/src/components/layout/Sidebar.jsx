import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  Clock,
  Users,
  FileText,
  BarChart3,
  History,
  Shield,
  LogOut,
  GraduationCap,
  UserCheck,
  CalendarDays,
  ClipboardList,
  Settings,
  ChevronDown,
} from "lucide-react";
import { sibaApi } from "@/api/apiClient";

const menuConfig = {
  mahasiswa: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    { label: "Booking Bimbingan", icon: CalendarDays, path: "/booking" },
    { label: "Pengajuan Saya", icon: ClipboardList, path: "/my-bookings" },
    { label: "Logbook", icon: BookOpen, path: "/logbook" },
    { label: "Riwayat", icon: History, path: "/history" },
  ],
  dosen: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    { label: "Ketersediaan", icon: Clock, path: "/availability" },
    { label: "Permintaan Masuk", icon: ClipboardList, path: "/requests" },
    { label: "Logbook", icon: BookOpen, path: "/logbook-dosen" },
    { label: "Monitoring", icon: BarChart3, path: "/monitoring" },
    { label: "Rekap & Export", icon: FileText, path: "/export" },
  ],
  admin: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    { label: "Periode", icon: Calendar, path: "/periods" },
    { label: "Mapping Dosen", icon: UserCheck, path: "/mapping" },
    { label: "Kelola User", icon: Users, path: "/users" },
    { label: "Statistik", icon: BarChart3, path: "/statistics" },
    { label: "Audit Trail", icon: Shield, path: "/audit" },
  ],
};

export default function Sidebar({ user, collapsed, onToggle: _onToggle }) {
  const location = useLocation();
  const role = user?.role || "mahasiswa";
  const menu = menuConfig[role] || menuConfig.mahasiswa;
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const roleLabel = {
    mahasiswa: "Mahasiswa",
    dosen: "Dosen",
    admin: "Administrator",
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-primary text-primary-foreground flex flex-col z-40 border-r border-primary-foreground/10 transition-all duration-300",
        collapsed ? "w-[64px]" : "w-[240px]",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-3 border-b border-primary-foreground/10",
          collapsed ? "justify-center px-0 py-5" : "px-5 py-5",
        )}
      >
        <div className="w-9 h-9 rounded-full bg-primary-foreground flex items-center justify-center shrink-0 border border-primary-foreground/20">
          <img
            src="/logo-uym.png"
            alt="Logo UYM"
            className="w-full h-full object-contain p-1.5 rounded-full"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "block";
            }}
          />
          <GraduationCap className="w-4 h-4 text-primary hidden" />
        </div>

        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-bold text-sm text-primary-foreground leading-tight tracking-wide">
              SIBAYA
            </p>
            <p className="text-[10px] text-primary-foreground/60 tracking-widest uppercase mt-0.5">
              Univ. Yatsi Madani
            </p>
          </div>
        )}
      </div>

      {/* Profile */}
      <div className="border-b border-primary-foreground/10">
        <button
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-primary-foreground/5 focus:outline-none",
            collapsed && "justify-center px-0",
          )}
          title={collapsed ? "Profil" : undefined}
        >
          <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0 border border-primary-foreground/15 overflow-hidden">
            {user?.photo ? (
              <img
                src={user.photo}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-bold text-primary-foreground">
                {(user?.full_name || "U")[0].toUpperCase()}
              </span>
            )}
          </div>

          {!collapsed && (
            <>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-semibold text-primary-foreground truncate leading-tight">
                  {user?.full_name || "User Terdaftar"}
                </p>
                <p className="text-[10px] text-primary-foreground/60 uppercase tracking-wider mt-0.5">
                  {roleLabel[role]}
                </p>
              </div>
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 text-primary-foreground/40 shrink-0 transition-transform duration-200",
                  isProfileOpen && "rotate-180",
                )}
              />
            </>
          )}
        </button>

        {/* Dropdown */}
        {isProfileOpen && (
          <div
            className={cn(
              "animate-in fade-in slide-in-from-top-1",
              collapsed
                ? "absolute left-[68px] top-[108px] w-44 bg-primary border border-primary-foreground/10 shadow-xl z-50"
                : "bg-primary-foreground/5 border-t border-primary-foreground/10",
            )}
          >
            <Link
              to="/settings"
              className="flex items-center gap-3 px-5 py-3 text-xs text-primary-foreground/75 hover:text-primary-foreground hover:bg-primary-foreground/5 transition-colors"
            >
              <Settings className="w-3.5 h-3.5 shrink-0" />
              Pengaturan Akun
            </Link>
            <div className="h-px bg-primary-foreground/10 mx-4" />
            <button
              onClick={() => sibaApi.auth.logout("/login")}
              className="flex items-center w-full gap-3 px-5 py-3 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              Keluar Sistem
            </button>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {!collapsed && (
          <p className="px-5 pt-1 pb-2 text-[10px] font-semibold text-primary-foreground/40 uppercase tracking-widest">
            Menu Utama
          </p>
        )}

        {menu.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 py-2.5 text-sm transition-colors border-l-[3px]",
                collapsed ? "justify-center px-0" : "px-5",
                isActive
                  ? "border-accent bg-primary-foreground/10 text-primary-foreground font-semibold"
                  : "border-transparent text-primary-foreground/65 hover:bg-primary-foreground/5 hover:text-primary-foreground font-medium",
              )}
            >
              <item.icon
                className={cn(
                  "w-4 h-4 shrink-0",
                  isActive ? "text-accent" : "text-primary-foreground/60",
                )}
              />
              {!collapsed && (
                <span className="truncate text-[13px]">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
