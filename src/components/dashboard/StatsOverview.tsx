import { TrendingUp, Target, Trophy, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface Stat {
  id: string;
  label: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  progress?: number;
  trend?: "up" | "down" | "stable";
  gradient: string;
}

interface StatsOverviewProps {
  userRole: "Main Admin" | "Admin" | "Teacher" | "Student";
}

const StatsOverview = ({ userRole }: StatsOverviewProps) => {
  const studentStats: Stat[] = [
    {
      id: "attendance",
      label: "Attendance",
      value: "94%",
      subtitle: "This month",
      icon: Target,
      progress: 94,
      trend: "up",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      id: "tasks-completed",
      label: "Tasks Completed",
      value: "23/25",
      subtitle: "This week",
      icon: Trophy,
      progress: 92,
      trend: "up",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      id: "study-streak",
      label: "Study Streak",
      value: "7 days",
      subtitle: "Keep it going!",
      icon: TrendingUp,
      gradient: "from-purple-500 to-pink-500"
    },
    {
      id: "focus-time",
      label: "Focus Time",
      value: "4.2h",
      subtitle: "Today",
      icon: Clock,
      gradient: "from-orange-500 to-red-500"
    }
  ];

  const teacherStats: Stat[] = [
    {
      id: "classes-today",
      label: "Classes Today",
      value: "6",
      subtitle: "2 completed",
      icon: Target,
      progress: 33,
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      id: "pending-reviews",
      label: "Pending Reviews",
      value: "12",
      subtitle: "Tasks to grade",
      icon: Clock,
      gradient: "from-orange-500 to-red-500"
    },
    {
      id: "student-avg",
      label: "Class Average",
      value: "87%",
      subtitle: "Assignment scores",
      icon: Trophy,
      trend: "up",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      id: "ai-usage",
      label: "AI Tools Used",
      value: "15",
      subtitle: "This week",
      icon: TrendingUp,
      gradient: "from-purple-500 to-pink-500"
    }
  ];

  const adminStats: Stat[] = [
    {
      id: "total-students",
      label: "Total Students",
      value: "245",
      subtitle: "Across all classes",
      icon: Target,
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      id: "attendance-rate",
      label: "School Attendance",
      value: "91%",
      subtitle: "This month",
      icon: TrendingUp,
      progress: 91,
      trend: "up",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      id: "active-teachers",
      label: "Active Teachers",
      value: "18",
      subtitle: "Online now",
      icon: Trophy,
      gradient: "from-purple-500 to-pink-500"
    },
    {
      id: "pending-approvals",
      label: "Pending Approvals",
      value: "5",
      subtitle: "Require attention",
      icon: Clock,
      gradient: "from-orange-500 to-red-500"
    }
  ];

  const getStatsForRole = () => {
    switch (userRole) {
      case "Student": return studentStats;
      case "Teacher": return teacherStats;
      case "Admin":
      case "Main Admin": return adminStats;
      default: return studentStats;
    }
  };

  const stats = getStatsForRole();

  const getTrendIcon = (trend?: "up" | "down" | "stable") => {
    if (trend === "up") return "↗️";
    if (trend === "down") return "↘️";
    return "";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.id} className="gradient-card shadow-elegant hover-lift group">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.gradient} flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              {stat.trend && (
                <span className="text-lg">{getTrendIcon(stat.trend)}</span>
              )}
            </div>
            
            <div className="space-y-2">
              <div>
                <h3 className="text-2xl font-bold text-card-foreground">{stat.value}</h3>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
              
              {stat.progress !== undefined && (
                <div className="space-y-1">
                  <Progress value={stat.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">{stat.progress}% complete</p>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsOverview;