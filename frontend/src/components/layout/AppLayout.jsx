import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { cn } from "@/lib/utils";

const pageTitles = {
  "/": "Dashboard Utama",
  "/booking": "Booking Bimbingan",
  "/my-bookings": "Pengajuan Saya",
  "/logbook": "Logbook Bimbingan",
  "/history": "Riwayat Bimbingan",
  "/availability": "Ketersediaan Dosen",
  "/requests": "Permintaan Bimbingan Masuk",
  "/logbook-dosen": "Logbook Bimbingan",
  "/monitoring": "Monitoring Mahasiswa",
  "/export": "Rekap & Export Data",
  "/periods": "Manajemen Periode Akademik",
  "/mapping": "Mapping Dosen Pembimbing",
  "/users": "Kelola Pengguna",
  "/statistics": "Statistik Akademik",
  "/audit": "Audit Trail Sistem",
};

export default function AppLayout({ user }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const title = pageTitles[location.pathname] || "SIBAYA UYM";

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background selection:bg-primary/30 selection:text-primary-foreground">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-sidebar-background/40 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          "hidden lg:block z-50",
          mobileOpen && "!block fixed inset-y-0 left-0",
        )}
      >
        <Sidebar
          user={user}
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
      </div>

      <div
        className={cn(
          "transition-all duration-300 flex flex-col min-h-screen",
          collapsed ? "lg:ml-[72px]" : "lg:ml-64",
        )}
      >
        <TopBar
          user={user}
          onToggleSidebar={() => setMobileOpen(!mobileOpen)}
          title={title}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 w-full max-w-[1600px] mx-auto animate-in fade-in duration-500">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
