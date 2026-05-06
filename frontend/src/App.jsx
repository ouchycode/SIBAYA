import { Toaster } from "@/components/ui/toaster";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import { RoleBasedRoute } from "@/components/RoleBasedRoute";
import { BookOpen, Loader2 } from "lucide-react";

import RoleRouter from "./pages/RoleRouter";
import SetupRole from "./pages/SetupRole";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";

// Mahasiswa pages
import BookingPage from "./pages/mahasiswa/BookingPage";
import MyBookings from "./pages/mahasiswa/MyBookings";
import StudentLogbook from "./pages/mahasiswa/StudentLogbook";
import HistoryPage from "./pages/mahasiswa/HistoryPage";

// Dosen pages
import AvailabilityPage from "./pages/dosen/AvailabilityPage";
import RequestsPage from "./pages/dosen/RequestsPage";
import DosenLogbook from "./pages/dosen/DosenLogbook";
import MonitoringPage from "./pages/dosen/MonitoringPage";
import ExportPage from "./pages/dosen/ExportPage";

// Admin pages
import PeriodsPage from "./pages/admin/PeriodsPage";
import MappingPage from "./pages/admin/MappingPage";
import UsersPage from "./pages/admin/UsersPage";
import StatisticsPage from "./pages/admin/StatisticsPage";
import AuditPage from "./pages/admin/AuditPage";

const LoadingScreen = ({ message = "Memuat sistem dan autentikasi..." }) => (
  <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50">
    <div className="flex flex-col items-center text-center max-w-sm p-8 animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center p-2 mb-6 border border-border shadow-sm">
        <img
          src="/logo-uym.png"
          alt="Logo UYM"
          className="w-full h-full object-contain"
          onError={(e) => {
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "flex";
          }}
        />
        <div className="hidden bg-primary/10 w-full h-full rounded-full items-center justify-center">
          <BookOpen className="w-8 h-8 text-primary" />
        </div>
      </div>
      <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
      <h2 className="text-xl font-black text-foreground tracking-wide">
        SIBAYA
      </h2>
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 mb-4">
        Universitas Yatsi Madani
      </p>
      <div className="h-px w-12 bg-border mb-4" />
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  </div>
);

const AuthenticatedApp = () => {
  const location = useLocation();
  const { isLoadingAuth, isLoadingPublicSettings, isAuthenticated, authError } =
    useAuth();

  // Selalu izinkan halaman login diakses tanpa cek auth
  if (location.pathname === "/login") {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Tampilkan loading selama auth masih dicek
  if (isLoadingPublicSettings || isLoadingAuth) {
    return <LoadingScreen />;
  }

  // Setelah loading selesai: cek error spesifik
  if (authError?.type === "user_not_registered") {
    return <UserNotRegisteredError />;
  }

  // Belum terautentikasi → langsung redirect ke /login (bukan 404)
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Sudah login → render semua route
  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/setup-role" element={<SetupRole />} />

      {/* Semua route yang perlu auth & layout pakai RoleRouter sebagai outlet wrapper */}
      <Route element={<RoleRouter />}>
        {/* Dashboard — bisa diakses semua role */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* ===== MAHASISWA ONLY ===== */}
        <Route element={<RoleBasedRoute allowedRoles={["mahasiswa"]} />}>
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/logbook" element={<StudentLogbook />} />
          <Route path="/history" element={<HistoryPage />} />
        </Route>

        {/* ===== DOSEN ONLY ===== */}
        <Route element={<RoleBasedRoute allowedRoles={["dosen"]} />}>
          <Route path="/availability" element={<AvailabilityPage />} />
          <Route path="/requests" element={<RequestsPage />} />
          <Route path="/logbook-dosen" element={<DosenLogbook />} />
          <Route path="/monitoring" element={<MonitoringPage />} />
          <Route path="/export" element={<ExportPage />} />
        </Route>

        {/* ===== ADMIN ONLY ===== */}
        <Route element={<RoleBasedRoute allowedRoles={["admin"]} />}>
          <Route path="/periods" element={<PeriodsPage />} />
          <Route path="/mapping" element={<MappingPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path="/audit" element={<AuditPage />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
