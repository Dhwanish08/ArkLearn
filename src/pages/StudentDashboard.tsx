import { useState } from "react";
import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/layout/TopBar";
import Sidebar from "@/components/layout/Sidebar";
import TimetableCard from "@/components/dashboard/TimetableCard";
import DailyTasksCard from "@/components/dashboard/DailyTasksCard";
import AIToolsPanel from "@/components/dashboard/AIToolsPanel";
import StatsOverview from "@/components/dashboard/StatsOverview";
import SubjectsPanel from "@/components/dashboard/SubjectsPanel";

function getFakeTimetable(user): Array<{
  id: string;
  subject: string;
  teacher: string;
  time: string;
  room: string;
  duration: number;
  status: "current" | "upcoming" | "completed";
  progress?: number;
}> {
  return [
    {
      id: "1",
      subject: "Mathematics",
      teacher: user ? user.name : "Dr. Sarah Johnson",
      time: "9:00 - 10:00 AM",
      room: "Room 201",
      duration: 60,
      status: "current",
      progress: 45
    },
    {
      id: "2",
      subject: "Physics",
      teacher: "Prof. Michael Chen",
      time: "10:15 - 11:15 AM",
      room: "Lab 1",
      duration: 60,
      status: "upcoming"
    },
    {
      id: "3",
      subject: "Chemistry",
      teacher: "Dr. Emily Davis",
      time: "11:30 - 12:30 PM",
      room: "Lab 2",
      duration: 60,
      status: "upcoming"
    },
    {
      id: "4",
      subject: "English Literature",
      teacher: "Ms. Rachel Green",
      time: "1:30 - 2:30 PM",
      room: "Room 105",
      duration: 60,
      status: "upcoming"
    }
  ];
}

function getFakeTasks(user): Array<{
  id: string;
  subject: string;
  title: string;
  description: string;
  dueTime: string;
  status: "completed" | "pending-approval" | "incomplete" | "absent";
  submittedAt?: string;
  teacherComment?: string;
}> {
  return [
    {
      id: "1",
      subject: "Mathematics",
      title: "Quadratic Equations Practice",
      description: "Complete exercises 1-15 from chapter 4",
      dueTime: "5:00 PM",
      status: "completed",
      submittedAt: "2:30 PM",
      teacherComment: `Great work, ${user ? user.name : "Student"}! Your methodology is improving.`
    },
    {
      id: "2",
      subject: "Physics",
      title: "Newton's Laws Lab Report",
      description: "Submit your lab report on Newton's laws experiment",
      dueTime: "6:00 PM",
      status: "pending-approval",
      submittedAt: "3:45 PM"
    },
    {
      id: "3",
      subject: "Chemistry",
      title: "Chemical Bonding Notes",
      description: "Read chapter 5 and make summary notes",
      dueTime: "Tomorrow 9:00 AM",
      status: "incomplete"
    }
  ];
}

const StudentDashboard = () => {
  const { user, loading } = useUser();
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState("home");
  const [selectedClass, setSelectedClass] = useState<string>(user?.class || "class-10-a");
  const [tasksData, setTasksData] = useState(() => getFakeTasks(user));

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in.</div>;

  // Map userRole to the expected union type for all components
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
  const userName = user.name || "Student";
  const timetableData = getFakeTimetable(user);
  const taskCompletionRate = Math.round(
    (tasksData.filter(task => task.status === "completed").length / tasksData.length) * 100
  );

  const handleTaskStatusChange = (taskId: string, status: "completed" | "pending-approval" | "incomplete" | "absent") => {
    setTasksData(prev => prev.map(task => task.id === taskId ? { ...task, status } : task));
  };

  const handleAddTask = () => {};
  const handleAIToolClick = (toolId: string) => {};

  // Sidebar navigation: Home button navigates to /dashboard, others just set activePage
  const handleSidebarPageChange = (page: string) => {
    setActivePage(page);
    if (page === "home") {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-slate-50 flex">
      {/* Sidebar */}
      <Sidebar 
        userRole={userRole} 
        activePage={activePage} 
        onPageChange={handleSidebarPageChange} 
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
          {/* Welcome Section */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold gradient-text mb-2">
              Welcome back, {userName}! 👋
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening in your learning journey today.
            </p>
          </div>
          {/* Stats Overview */}
          <StatsOverview userRole={userRole} />
          {/* Subjects Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Subjects</h2>
            <SubjectsPanel classId={user.class} />
          </div>
          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Left Column - Timetable */}
            <div className="lg:col-span-1 flex flex-col">
              <TimetableCard 
                userRole={userRole} 
                entries={timetableData} 
              />
            </div>
            {/* Middle Column - Daily Tasks (wider) */}
            <div className="lg:col-span-2 flex flex-col">
              <DailyTasksCard
                userRole={userRole}
                tasks={tasksData}
                completionRate={taskCompletionRate}
                onTaskStatusChange={handleTaskStatusChange}
                onAddTask={handleAddTask}
              />
            </div>
          </div>
          {/* AI Learning Tools - full width below */}
          <div className="mt-2">
            <AIToolsPanel onToolClick={handleAIToolClick} />
          </div>
          {/* Additional Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Quick Actions Card */}
            <div className="p-6 rounded-xl gradient-card shadow-elegant hover-lift">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <span className="text-lg">⚡</span>
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors text-sm">
                  📝 Start Study Session
                </button>
                <button className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors text-sm">
                  📚 Review Flashcards
                </button>
                <button className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors text-sm">
                  🎯 Check Progress
                </button>
              </div>
            </div>
            {/* Upcoming Deadlines */}
            <div className="p-6 rounded-xl gradient-card shadow-elegant hover-lift">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <span className="text-lg">⏰</span>
                Upcoming Deadlines
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span>Chemistry Lab Report</span>
                  <span className="text-orange-500">Tomorrow</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Math Quiz</span>
                  <span className="text-yellow-500">2 days</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>English Essay</span>
                  <span className="text-green-500">1 week</span>
                </div>
              </div>
            </div>
            {/* Achievement Badge */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-accent/10 to-purple-500/10 border border-accent/20 hover-lift">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <span className="text-lg">🏆</span>
                Latest Achievement
              </h3>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-r from-accent to-purple-500 flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🔥</span>
                </div>
                <h4 className="font-medium text-accent">Week Streak Master</h4>
                <p className="text-sm text-muted-foreground">7 consecutive days of study</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard; 