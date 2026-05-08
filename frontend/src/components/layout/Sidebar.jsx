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
        "fixed left-0 top-0 h-screen bg-card text-foreground flex flex-col z-40 border-r border-border/50 shadow-[1px_0_10px_rgba(0,0,0,0.03)] transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[260px]",
      )}
    >
      {/* Logo */}
    <div
  className={cn(
    "flex items-center gap-2.5 border-b border-primary-foreground/10 transition-all",
    collapsed ? "justify-center px-0 py-4" : "px-5 py-4",
  )}
>
  <img
    src="/logo-uym.png"
    alt="Logo UYM"
    className="w-8 h-8 object-contain shrink-0"
    onError={(e) => {
      e.target.style.display = "none";
      e.target.nextSibling.style.display = "block";
    }}
  />
  <GraduationCap className="w-6 h-6 text-foreground hidden" />

  {!collapsed && (
    <p className="font-semibold text-sm text-foreground leading-tight">
      SIBAYA
    </p>
  )}
</div>

      {/* Profile */}
      <div className="border-b border-border/50 relative">
        <button
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className={cn(
            "w-full flex items-center gap-3 px-6 py-4 transition-colors hover:bg-muted/50 focus:outline-none",
            collapsed && "justify-center px-0",
          )}
          title={collapsed ? "Profil" : undefined}
        >
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border overflow-hidden">
            {user?.photo ? (
              <img
                src={user.photo}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-semibold text-muted-foreground">
                {(user?.full_name || "U")[0].toUpperCase()}
              </span>
            )}
          </div>

          {!collapsed && (
            <>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-semibold text-foreground truncate leading-tight">
                  {user?.full_name || "User Terdaftar"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">
                  {roleLabel[role]}
                </p>
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200",
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
                ? "absolute left-[76px] top-2 w-48 bg-card border border-border/50 shadow-lg rounded-md z-50 overflow-hidden"
                : "bg-muted/30 border-t border-border/50",
            )}
          >
            <Link
              to="/settings"
              className="flex items-center gap-2.5 px-6 py-3 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              <Settings className="w-4 h-4 text-muted-foreground shrink-0" />
              Pengaturan Profil
            </Link>
            <div className="h-px bg-border/50 mx-4" />
            <button
              onClick={() => sibaApi.auth.logout("/login")}
              className="flex items-center w-full gap-2.5 px-6 py-3 text-xs font-medium text-destructive hover:bg-destructive/5 transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-3">
        {!collapsed && (
          <p className="px-3 pt-2 pb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
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
                "flex items-center gap-3 py-2.5 text-sm transition-all rounded-md group",
                collapsed ? "justify-center px-0" : "px-3",
                isActive
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground font-medium",
              )}
            >
              <item.icon
                className={cn(
                  "w-[18px] h-[18px] shrink-0 transition-colors",
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
