import { useState } from "react";
import {
  Home,
  BookOpen,
  Bot,
  Calendar,
  CreditCard,
  BarChart3,
  CheckSquare,
  Timer,
  Trophy,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  GraduationCap,
  Brain,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  link?: string;
}

interface SidebarProps {
  userRole: "Main Admin" | "Admin" | "Teacher" | "Student";
  activePage: string;
  onPageChange: (page: string) => void;
}

const Sidebar = ({ userRole, activePage, onPageChange }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);

  const baseMenuItems: MenuItem[] = [
    { id: "home", label: "Home", icon: Home },
    { id: "subjects", label: "Subjects", icon: BookOpen, link: "/dashboard?section=subjects" },
    { id: "ai-tools", label: "AI Tools", icon: Bot },
    { id: "study-planner", label: "Study Planner", icon: Calendar },
    { id: "flashcards", label: "Flashcards", icon: CreditCard },
    { id: "progress", label: "Progress & Reports", icon: BarChart3 },
    { id: "tasks", label: "Daily Tasks", icon: CheckSquare },
    { id: "pomodoro", label: "Pomodoro Timer", icon: Timer },
    // Remove old leaderboard item here
  ];

  const adminMenuItems: MenuItem[] = [
    { id: "manage-users", label: "Manage Users", icon: Users },
    { id: "timetable-management", label: "Timetable Management", icon: Calendar },
  ];

  const mainAdminMenuItems: MenuItem[] = [
    { id: "school-settings", label: "School Settings", icon: Settings },
  ];

  const getMenuItems = () => {
    let items = [...baseMenuItems];
    // Add Leaderboard as a link to /leaderboard
    items.push({ id: "leaderboard", label: "Leaderboard", icon: Trophy, link: "/leaderboard" });
    if (userRole === "Admin" || userRole === "Main Admin") {
      items.push(...adminMenuItems);
    }
    if (userRole === "Main Admin") {
      items.push(...mainAdminMenuItems);
    }
    return items;
  };

  const menuItems = getMenuItems();

  return (
    <aside 
      className={cn(
        "h-screen bg-card/90 backdrop-blur-sm border-r border-border transition-all duration-300 flex flex-col shadow-elegant",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" />
            <span className="font-semibold gradient-text">Dashboard</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="hover-lift"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {menuItems.map((item) => {
          const isActive = activePage === item.id;
          if (item.id === "home") {
            // Always use Link for Home
            return (
              <Link to="/dashboard" key={item.id} style={{ textDecoration: "none" }}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "w-full justify-start hover-lift",
                    collapsed ? "px-2" : "px-3",
                    isActive && "bg-gradient-to-r from-primary to-primary-glow shadow-glow"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", !collapsed && "mr-2")} />
                  {!collapsed && <span>{item.label}</span>}
                </Button>
              </Link>
            );
          }
          // If item has a link, use Link
          if (item.link) {
            return (
              <Link to={item.link} key={item.id} style={{ textDecoration: "none" }}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "w-full justify-start hover-lift",
                    collapsed ? "px-2" : "px-3",
                    isActive && "bg-gradient-to-r from-primary to-primary-glow shadow-glow"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", !collapsed && "mr-2")} />
                  {!collapsed && <span>{item.label}</span>}
                </Button>
              </Link>
            );
          }
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              onClick={() => onPageChange(item.id)}
              className={cn(
                "w-full justify-start hover-lift",
                collapsed ? "px-2" : "px-3",
                isActive && "bg-gradient-to-r from-primary to-primary-glow shadow-glow"
              )}
            >
              <item.icon className={cn("w-4 h-4", !collapsed && "mr-2")} />
              {!collapsed && <span>{item.label}</span>}
            </Button>
          );
        })}
      </nav>

      {/* AI Features Highlight */}
      {!collapsed && (
        <div className="p-4 m-2 rounded-lg bg-gradient-to-br from-accent/10 to-purple-500/10 border border-accent/20">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5 text-accent" />
            <span className="font-medium text-accent">AI Powered</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Get personalized learning insights and smart recommendations
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="p-2 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-start text-muted-foreground hover:text-destructive hover-lift",
            collapsed ? "px-2" : "px-3"
          )}
          onClick={async () => {
            await signOut(auth);
            window.location.href = "/login";
          }}
        >
          <LogOut className={cn("w-4 h-4", !collapsed && "mr-2")} />
          {!collapsed && <span>Logout</span>}
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;