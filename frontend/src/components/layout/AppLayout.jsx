import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import Footer from "./Footer";
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
  "/settings": "Pengaturan Profil",
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
    <div className="min-h-screen bg-muted/30 selection:bg-primary selection:text-primary-foreground">
      {/* Overlay Mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "hidden lg:block z-50",
          mobileOpen && "!block fixed inset-y-0 left-0 shadow-xl",
        )}
      >
        <Sidebar
          user={user}
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
      </div>

      {/* Main */}
      <div
        className={cn(
          "transition-all duration-300 flex flex-col min-h-screen",
          collapsed ? "lg:ml-[64px]" : "lg:ml-[240px]",
        )}
      >
        <TopBar
          user={user}
          onToggleSidebar={() => setMobileOpen(!mobileOpen)}
          title={title}
        />

        <main className="flex-1 p-4 sm:p-5 lg:p-6 w-full max-w-[1400px] mx-auto animate-in fade-in duration-200">
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
}
