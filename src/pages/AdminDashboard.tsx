import { useState, useEffect } from "react";
import TopBar from "@/components/layout/TopBar";
import Sidebar from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap, CheckSquare, Trophy, LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth, firestore } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";
import { collection, getCountFromServer, query, where } from "firebase/firestore";
import UserManagementPanel from "@/components/dashboard/UserManagementPanel";
import ManageUsers from "@/components/dashboard/ManageUsers";
import SchoolSettings from "@/components/dashboard/SchoolSettings";
import { useUser } from "@/context/UserContext";

const AdminDashboard = () => {
  const { user, loading } = useUser();
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState<string>("all-classes");
  const [activePage, setActivePage] = useState("admin-dashboard");
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [analytics, setAnalytics] = useState({ totalTasks: 0, avgCompletion: 0, mostActiveClass: "-" });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState("");

  // Determine role label for UI and permissions
  const userRole = user?.role === "main-admin" ? "Main Admin" : "Admin";
  const userName = user?.name || (userRole === "Main Admin" ? "Main Admin User" : "Admin User");

  useEffect(() => {
    setStatsLoading(true);
    setStatsError("");
    async function fetchStats() {
      try {
        const studentsSnap = await getCountFromServer(query(collection(firestore, "users"), where("role", "==", "student")));
        const teachersSnap = await getCountFromServer(query(collection(firestore, "users"), where("role", "==", "teacher")));
        const tasksSnap = await getCountFromServer(collection(firestore, "tasks"));
        setStats({
          totalStudents: studentsSnap.data().count,
          totalTeachers: teachersSnap.data().count,
          totalClasses: 0, // Add class count if you have a classes collection
          activeTasks: tasksSnap.data().count,
          completionRate: 87, // TODO: calculate real completion rate
          monthlyGrowth: 12
        });
        setStatsLoading(false);
      } catch (err: any) {
        setStatsError("Failed to load stats: " + (err.message || err.toString()));
        setStatsLoading(false);
      }
    }
    fetchStats();
  }, []);

  useEffect(() => {
    setAnalyticsLoading(true);
    setAnalyticsError("");
    async function fetchAnalytics() {
      try {
        // TODO: Implement real analytics logic
        setAnalytics({ totalTasks: stats?.activeTasks || 0, avgCompletion: 87, mostActiveClass: "Class 10-A" });
        setAnalyticsLoading(false);
      } catch (err: any) {
        setAnalyticsError("Failed to load analytics: " + (err.message || err.toString()));
        setAnalyticsLoading(false);
      }
    }
    fetchAnalytics();
  }, [stats]);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/login";
  };

  // Render the appropriate component based on active page
  const renderActivePage = () => {
    switch (activePage) {
      case "home":
        return (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold gradient-text mb-2 flex items-center gap-2">
                  {userRole === "Main Admin" ? "🟦" : "🟧"} Admin Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Welcome back, {userName}! Manage your school's academic activities.
                </p>
                <Badge variant="outline" className="mt-2">
                  {userRole === "Main Admin" ? "Main-Admin Privileges" : "Admin Privileges"}
                </Badge>
              </div>
            </div>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-6 gradient-card hover-lift">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Students</p>
                    <p className="text-2xl font-bold">{stats?.totalStudents || "Loading..."}</p>
                  </div>
                  <Users className="w-8 h-8 text-primary" />
                </div>
              </Card>
              <Card className="p-6 gradient-card hover-lift">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Teachers</p>
                    <p className="text-2xl font-bold">{stats?.totalTeachers || "Loading..."}</p>
                  </div>
                  <GraduationCap className="w-8 h-8 text-primary" />
                </div>
              </Card>
              <Card className="p-6 gradient-card hover-lift">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Tasks</p>
                    <p className="text-2xl font-bold">{stats?.activeTasks || "Loading..."}</p>
                  </div>
                  <CheckSquare className="w-8 h-8 text-primary" />
                </div>
              </Card>
              <Card className="p-6 gradient-card hover-lift">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completion Rate</p>
                    <p className="text-2xl font-bold">{stats?.completionRate || "Loading..."}%</p>
                  </div>
                  <Trophy className="w-8 h-8 text-primary" />
                </div>
              </Card>
            </div>
            {/* User Management Panel */}
            <div className="my-8">
              <UserManagementPanel userRole={userRole} />
            </div>
          </>
        );
      case "manage-users":
        return <ManageUsers />;
      case "school-settings":
        return <SchoolSettings />;
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
            <p className="text-muted-foreground">The requested page is not available.</p>
          </div>
        );
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user || (user.role !== "main-admin" && user.role !== "admin")) {
    return <div className="p-8 text-center">Access denied. Admins only.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-slate-50 flex">
      {/* Sidebar */}
      <Sidebar 
        userRole={userRole} 
        activePage={activePage} 
        onPageChange={setActivePage} 
      />
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <TopBar 
          userRole={userRole}
          userName={userName}
          selectedClass={selectedClass}
          onClassChange={setSelectedClass}
        />
        {/* Dashboard Content */}
        <main className="flex-1 p-6 space-y-6 animate-fade-in">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard; 