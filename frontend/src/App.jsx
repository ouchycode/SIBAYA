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
import { BookOpen, Loader2 } from "lucide-react";

import RoleRouter from "./pages/RoleRouter";
import SetupRole from "./pages/SetupRole";
import Dashboard from "./pages/Dashboard";
import BookingPage from "./pages/mahasiswa/BookingPage";
import MyBookings from "./pages/mahasiswa/MyBookings";
import StudentLogbook from "./pages/mahasiswa/StudentLogbook";
import HistoryPage from "./pages/mahasiswa/HistoryPage";
import AvailabilityPage from "./pages/dosen/AvailabilityPage";
import RequestsPage from "./pages/dosen/RequestsPage";
import DosenLogbook from "./pages/dosen/DosenLogbook";
import MonitoringPage from "./pages/dosen/MonitoringPage";
import ExportPage from "./pages/dosen/ExportPage";
import PeriodsPage from "./pages/admin/PeriodsPage";
import MappingPage from "./pages/admin/MappingPage";
import UsersPage from "./pages/admin/UsersPage";
import StatisticsPage from "./pages/admin/StatisticsPage";
import AuditPage from "./pages/admin/AuditPage";
import LoginPage from "./pages/LoginPage";

const AuthenticatedApp = () => {
  const location = useLocation();
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } =
    useAuth();

  if (location.pathname === "/login") {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50">
        <div className="flex flex-col items-center text-center max-w-sm p-8 animate-in fade-in duration-500">
          <div className="w-16 h-16 bg-primary/10 rounded-md flex items-center justify-center mb-6 border border-primary/20 shadow-sm">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>

          <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />

          <h2 className="text-xl font-black text-foreground tracking-wide">
            SIBAYA
          </h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 mb-4">
            Universitas Yatsi Madani
          </p>

          <div className="h-px w-12 bg-border mb-4" />

          <p className="text-sm font-medium text-muted-foreground">
            Memuat sistem dan autentikasi...
          </p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === "user_not_registered") {
      return <UserNotRegisteredError />;
    } else if (authError.type === "auth_required") {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/setup-role" element={<SetupRole />} />
      <Route element={<RoleRouter />}>
        <Route path="/" element={<Dashboard />} />
        {/* Mahasiswa routes */}
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/logbook" element={<StudentLogbook />} />
        <Route path="/history" element={<HistoryPage />} />
        {/* Dosen routes */}
        <Route path="/availability" element={<AvailabilityPage />} />
        <Route path="/requests" element={<RequestsPage />} />
        <Route path="/logbook-dosen" element={<DosenLogbook />} />
        <Route path="/monitoring" element={<MonitoringPage />} />
        <Route path="/export" element={<ExportPage />} />
        {/* Admin routes */}
        <Route path="/periods" element={<PeriodsPage />} />
        <Route path="/mapping" element={<MappingPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/statistics" element={<StatisticsPage />} />
        <Route path="/audit" element={<AuditPage />} />
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
