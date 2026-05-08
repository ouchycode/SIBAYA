import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function useRouteTitle() {
  const location = useLocation();

  useEffect(() => {
    const routeTitles = {
      "/login": "Login",
      "/setup-role": "Setup Role",
      "/": "Dashboard",
      "/settings": "Pengaturan Profil",

      // Mahasiswa
      "/booking": "Pengajuan Bimbingan",
      "/my-bookings": "Status Booking",
      "/logbook": "Logbook Bimbingan",
      "/history": "Riwayat Bimbingan",

      // Dosen
      "/availability": "Jadwal Ketersediaan",
      "/requests": "Permintaan Bimbingan",
      "/logbook-dosen": "Logbook Mahasiswa",
      "/monitoring": "Monitoring Mahasiswa",
      "/export": "Export Data Laporan",

      // Admin
      "/periods": "Manajemen Periode",
      "/mapping": "Pemetaan Bimbingan",
      "/users": "Manajemen Pengguna",
      "/statistics": "Statistik Akademik",
      "/audit": "Log Audit Sistem",
    };

    // Cari exact match
    let title = routeTitles[location.pathname];

    // Fallback jika tidak match persis
    if (!title) {
      if (location.pathname.startsWith("/users/")) {
        title = "Detail Pengguna";
      } else {
        title = "Portal Akademik";
      }
    }

    document.title = `${title} - SIBAYA`;
  }, [location.pathname]);
}
