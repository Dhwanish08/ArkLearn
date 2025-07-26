import { useUser } from "@/context/UserContext";
import AdminDashboard from "./AdminDashboard";
import TeacherDashboard from "./TeacherDashboard";
import StudentDashboard from "./StudentDashboard";

// Optional: Helper to display pretty role labels
export function getRoleLabel(role: string) {
  switch (role) {
    case "main-admin": return "Main Admin";
    case "admin": return "Admin";
    case "teacher": return "Teacher";
    case "student": return "Student";
    default: return role;
  }
}

export default function Dashboard() {
  const { user, loading } = useUser();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in.</div>;

  switch (user.role) {
    case "main-admin":
    case "admin":
      return <AdminDashboard />;
    case "teacher":
      return <TeacherDashboard />;
    case "student":
      return <StudentDashboard />;
    default:
      return <div>Unknown role: {user.role}</div>;
  }
}