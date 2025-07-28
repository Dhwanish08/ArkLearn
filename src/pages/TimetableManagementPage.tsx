import { useState } from "react";
import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/layout/TopBar";
import Sidebar from "@/components/layout/Sidebar";
import TimetableManager from "@/components/admin/TimetableManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft } from "lucide-react";

export default function TimetableManagementPage() {
  const { user, loading } = useUser();
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState("class-10-a");
  const [activePage, setActivePage] = useState("timetable-management");

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in.</div>;

  // Check if user has admin privileges
  const userRole: "Student" | "Main Admin" | "Admin" | "Teacher" =
    user.role === "student"
      ? "Student"
      : user.role === "main-admin"
      ? "Main Admin"
      : user.role === "admin"
      ? "Admin"
      : user.role === "teacher"
      ? "Teacher"
      : "Student";

  if (userRole !== "Admin" && userRole !== "Main Admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You don't have permission to access timetable management.
            </p>
            <Button onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userName = user.name || "Admin User";

  return (
    <div className="min-h-screen bg-background">
      <TopBar
        userRole={userRole}
        userName={userName}
        selectedClass={selectedClass}
        onClassChange={setSelectedClass}
      />
      
      <div className="flex">
        <Sidebar
          userRole={userRole}
          activePage={activePage}
          onPageChange={setActivePage}
        />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/dashboard")}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold gradient-text mb-2 flex items-center gap-2">
                    <Calendar className="w-6 h-6" />
                    Timetable Management
                  </h1>
                  <p className="text-muted-foreground">
                    Manage class schedules and timetables for your school
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Class:</span>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="class-10-a">Class 10-A</SelectItem>
                        <SelectItem value="class-10-b">Class 10-B</SelectItem>
                        <SelectItem value="class-9-a">Class 9-A</SelectItem>
                        <SelectItem value="class-9-b">Class 9-B</SelectItem>
                        <SelectItem value="class-8-a">Class 8-A</SelectItem>
                        <SelectItem value="class-8-b">Class 8-B</SelectItem>
                        <SelectItem value="class-7-a">Class 7-A</SelectItem>
                        <SelectItem value="class-7-b">Class 7-B</SelectItem>
                        <SelectItem value="class-6-a">Class 6-A</SelectItem>
                        <SelectItem value="class-6-b">Class 6-B</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Timetable Manager */}
            <TimetableManager selectedClass={selectedClass} />
          </div>
        </main>
      </div>
    </div>
  );
} 