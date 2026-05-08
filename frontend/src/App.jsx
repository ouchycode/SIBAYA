
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
import { useRouteTitle } from "@/lib/hooks/useRouteTitle";

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
    <div className="flex flex-col items-center text-center max-w-sm p-8">
      <Loader2 className="w-6 h-6 text-primary animate-spin mb-4" />

      <div className="h-px w-12 bg-border/60 mb-4" />
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  </div>
);

const AuthenticatedApp = () => {
  useRouteTitle(); // Set dynamic document title
  const location = useLocation();
  const { isLoadingAuth, isLoadingPublicSettings, isAuthenticated, authError } =
    useAuth();

  // Cek error spesifik (seperti akun tidak terdaftar)
  if (authError?.type === "user_not_registered") {
    return <UserNotRegisteredError />;
  }

  // Tampilkan loading selama auth masih dicek
  if (isLoadingPublicSettings || isLoadingAuth) {
    return <LoadingScreen />;
  }

  // Belum terautentikasi → izinkan akses ke /login, sisanya redirect ke /login
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
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
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
