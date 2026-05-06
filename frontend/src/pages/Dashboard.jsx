import React from "react";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import MahasiswaDashboard from "./mahasiswa/MahasiswaDashboard";
import DosenDashboard from "./dosen/DosenDashboard";
import AdminDashboard from "./admin/AdminDashboard";

export default function Dashboard() {
  const { data: user } = useCurrentUser();

  if (user?.role === "dosen") return <DosenDashboard />;
  if (user?.role === "admin") return <AdminDashboard />;
  return <MahasiswaDashboard />;
}
