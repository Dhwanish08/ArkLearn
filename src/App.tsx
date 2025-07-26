import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import LoginPage from "./pages/login";
import Dashboard from "./pages/Dashboard";
import DevCreateSchoolPage from "./pages/dev-create-school";
import DevSeedDataPage from "./pages/dev-seed-data";
import LeaderboardPage from "./pages/LeaderboardPage";
import NotFound from "./pages/NotFound";
import { UserProvider } from "@/context/UserContext";
import AdminUserManagement from "./pages/AdminUserManagement";

const queryClient = new QueryClient();

const App = () => (
  <UserProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dev-create-school" element={<DevCreateSchoolPage />} />
            <Route path="/dev-seed-data" element={<DevSeedDataPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/admin-users" element={<AdminUserManagement />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </UserProvider>
);

export default App;
