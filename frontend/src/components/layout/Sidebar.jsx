import React from "react";
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

  const roleLabel = {
    mahasiswa: "Mahasiswa",
    dosen: "Dosen",
    admin: "Administrator",
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-primary text-primary-foreground flex flex-col z-40 border-r border-primary-foreground/10",
        collapsed ? "w-[72px]" : "w-[260px]",
      )}
    >
      {/* Header - Formal & Solid */}
      <div className="px-5 pt-8 pb-6 flex items-center gap-4">
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-md bg-primary-foreground flex items-center justify-center p-1.5 shadow-sm">
            <img
              src="/logo-uym.png"
              alt="Logo UYM"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "block";
              }}
            />
            <GraduationCap className="w-7 h-7 text-primary hidden" />
          </div>
          {/* Status indikator */}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent rounded-full border-[3px] border-primary" />
        </div>

        {!collapsed && (
          <div className="flex flex-col">
            <h1 className="font-black text-xl tracking-tight leading-none text-primary-foreground">
              SIBAYA
            </h1>
            <p className="text-[10px] text-accent font-extrabold uppercase tracking-widest mt-1.5">
              Univ. Yatsi Madani
            </p>
          </div>
        )}
      </div>

      {/* Navigation - Clean Active State */}
      <nav className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto custom-scrollbar">
        {menu.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3.5 px-3 py-3 rounded-md group",
                isActive
                  ? "bg-primary-foreground text-primary shadow-sm font-bold"
                  : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground font-medium",
              )}
            >
              <item.icon
                className={cn(
                  "w-[20px] h-[20px] shrink-0",
                  isActive ? "text-primary" : "group-hover:text-accent",
                )}
              />

              {!collapsed && (
                <span className="truncate tracking-wide">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section - Solid Box Style */}
      <div className="p-4 mt-auto">
        <div
          className={cn(
            "bg-primary-foreground/10 border border-primary-foreground/10 rounded-md p-3",
            collapsed
              ? "flex flex-col items-center gap-3"
              : "flex flex-col gap-4",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-3",
              collapsed && "justify-center",
            )}
          >
            <div className="w-10 h-10 rounded bg-accent text-accent-foreground flex items-center justify-center shrink-0 overflow-hidden">
              {user?.photo ? (
                <img src={user.photo} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-base font-black">
                  {(user?.full_name || "U")[0].toUpperCase()}
                </span>
              )}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-primary-foreground truncate">
                  {user?.full_name || "User Mahasiswa"}
                </p>
                <p className="text-[10px] text-primary-foreground/70 font-semibold uppercase tracking-wider mt-0.5 truncate">
                  {roleLabel[role]}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 w-full mt-3">
            <Link
              to="/settings"
              className={cn(
                "flex items-center justify-center gap-2 rounded-md font-bold text-xs",
                collapsed
                  ? "w-10 h-10 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                  : "w-full py-2.5 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20",
              )}
              title={collapsed ? "Pengaturan" : undefined}
            >
              <Settings className="w-[18px] h-[18px]" />
              {!collapsed && <span>Pengaturan Profil</span>}
            </Link>

            <button
              onClick={() => sibaApi.auth.logout("/login")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md font-bold text-xs",
                collapsed
                  ? "w-10 h-10 bg-destructive/20 text-destructive-foreground hover:bg-destructive"
                  : "w-full py-2.5 bg-primary-foreground/10 text-primary-foreground hover:bg-destructive hover:text-destructive-foreground",
              )}
              title={collapsed ? "Keluar" : undefined}
            >
              <LogOut className="w-[18px] h-[18px]" />
              {!collapsed && <span>Keluar Sistem</span>}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
