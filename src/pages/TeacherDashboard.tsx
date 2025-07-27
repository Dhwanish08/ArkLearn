import { useState, useEffect } from "react";
import TopBar from "@/components/layout/TopBar";
import Sidebar from "@/components/layout/Sidebar";
import TimetableCard from "@/components/dashboard/TimetableCard";
import DailyTasksCard from "@/components/dashboard/DailyTasksCard";
import AIToolsPanel from "@/components/dashboard/AIToolsPanel";
import StatsOverview from "@/components/dashboard/StatsOverview";
import SubjectsPanel from "@/components/dashboard/SubjectsPanel";
import StudyPlanner from "@/components/dashboard/StudyPlanner";
import Flashcards from "@/components/dashboard/Flashcards";
import ProgressReports from "@/components/dashboard/ProgressReports";
import DailyTasks from "@/components/dashboard/DailyTasks";
import PomodoroTimer from "@/components/dashboard/PomodoroTimer";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/UserContext";
import { firestore } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";

const TeacherDashboard = () => {
  const { user, loading: userLoading } = useUser();
  const [userRole] = useState<"Main Admin" | "Admin" | "Teacher" | "Student">("Teacher");
  const [userName, setUserName] = useState("Dr. Sarah Johnson");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [activePage, setActivePage] = useState("home");
  const [teacherClasses, setTeacherClasses] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch teacher's name from user context
  useEffect(() => {
    if (user && user.name) setUserName(user.name);
  }, [user]);

  // Fetch teacher's classes
  useEffect(() => {
    async function fetchClasses() {
      if (!userName) return;
      setLoading(true);
      setError("");
      try {
        const q = query(collection(firestore, "classes"), where("teacherName", "==", userName));
        const snap = await getDocs(q);
        const classes = snap.docs.map(doc => doc.data().name);
        setTeacherClasses(classes);
        setSelectedClass(classes[0] || "");
      } catch (err: any) {
        setError("Failed to load classes: " + (err.message || err.toString()));
      } finally {
        setLoading(false);
      }
    }
    fetchClasses();
  }, [userName]);

  // Fetch schedule for selected date
  useEffect(() => {
    async function fetchSchedule() {
      if (!userName || !selectedDate) return;
      setLoading(true);
      setError("");
      try {
        const scheduleDoc = await getDoc(doc(firestore, `schedules/${userName.replace(/\s+/g, "_")}-${selectedDate}`));
        if (scheduleDoc.exists()) {
          setSchedule(scheduleDoc.data().periods || []);
        } else {
          setSchedule([]);
        }
      } catch (err: any) {
        setError("Failed to load schedule: " + (err.message || err.toString()));
      } finally {
        setLoading(false);
      }
    }
    fetchSchedule();
  }, [userName, selectedDate]);

  // Fetch tasks for teacher's classes and selected date
  useEffect(() => {
    async function fetchTasks() {
      if (!teacherClasses.length || !selectedDate) return;
      setLoading(true);
      setError("");
      try {
        const tasksArr: any[] = [];
        for (const cls of teacherClasses) {
          const taskDoc = await getDoc(doc(firestore, `tasks/class-${cls}-${selectedDate}`));
          if (taskDoc.exists()) {
            const docData = taskDoc.data();
            (docData.tasks || []).forEach((t: any, idx: number) => {
              tasksArr.push({
                id: `${cls}-${idx}`,
                class: cls,
                ...t
              });
            });
          }
        }
        setTasks(tasksArr);
      } catch (err: any) {
        setError("Failed to load tasks: " + (err.message || err.toString()));
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, [teacherClasses, selectedDate]);

  const handleAssignmentReview = (assignmentId: string) => {
    console.log(`Review assignment ${assignmentId}`);
    // In real app, this would open the assignment review page/modal
  };

  const handleAIToolClick = (toolId: string) => {
    console.log(`Opening AI tool: ${toolId}`);
    // In real app, this would navigate to the AI tool or open a modal
  };

  // Render the appropriate component based on active page
  const renderActivePage = () => {
    switch (activePage) {
      case "home":
        return (
          <>
            {/* Welcome Section */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold gradient-text mb-2">
                Welcome back, {userName}! 👋
              </h1>
              <p className="text-muted-foreground">
                Here's what's happening in your teaching journey today.
              </p>
            </div>

            {/* Stats Overview */}
            <StatsOverview userRole={userRole} />
            {/* Subjects Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Subjects</h2>
              <SubjectsPanel classId={selectedClass} />
            </div>
            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Class Schedule */}
              <div className="lg:col-span-1">
                <TimetableCard 
                  userRole={userRole} 
                  entries={schedule} 
                />
              </div>

              {/* Middle Column - Assignments to Review */}
              <div className="lg:col-span-1">
                <div className="p-6 rounded-xl gradient-card shadow-elegant hover-lift">
                  <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <span className="text-lg">📝</span>
                    Assignments to Review
                  </h2>
                  <div className="space-y-4">
                    {tasks.filter(task => task.type === 'assignment' && task.status === 'pending').map(a => (
                      <div key={a.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{a.title}</div>
                            <div className="text-xs text-muted-foreground">{a.subject} • Class {a.class} • Due {a.dueTime}</div>
                          </div>
                          <Button size="sm" onClick={() => handleAssignmentReview(a.id)}>
                            Review ({a.pending} pending)
                          </Button>
                        </div>
                        <div className="text-xs mt-1 text-muted-foreground">{a.submissions} submissions</div>
                      </div>
                    ))}
                    {tasks.filter(task => task.type === 'assignment' && task.status === 'pending').length === 0 && <div className="text-muted-foreground">No assignments to review.</div>}
                  </div>
                </div>
              </div>

              {/* Right Column - AI Tools */}
              <div className="lg:col-span-1">
                <AIToolsPanel onToolClick={handleAIToolClick} />
              </div>
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
                    ➕ Add Assignment
                  </button>
                  <button className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors text-sm">
                    📊 View Class Progress
                  </button>
                  <button className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors text-sm">
                    🗓️ Schedule Meeting
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
                    <span>Math Quiz Grading</span>
                    <span className="text-orange-500">Tomorrow</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>Physics Lab Review</span>
                    <span className="text-yellow-500">2 days</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>Parent Meeting</span>
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
                    <span className="text-2xl">🌟</span>
                  </div>
                  <h4 className="font-medium text-accent">Class Excellence Award</h4>
                  <p className="text-sm text-muted-foreground">Outstanding results in Mathematics</p>
                </div>
              </div>
            </div>
          </>
        );
      case "study-planner":
        return <StudyPlanner />;
      case "flashcards":
        return <Flashcards />;
      case "progress":
        return <ProgressReports />;
      case "tasks":
        return <DailyTasks />;
      case "pomodoro":
        return <PomodoroTimer />;
      case "ai-tools":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">AI Learning Tools</h1>
              <p className="text-muted-foreground">Explore AI-powered learning assistance</p>
            </div>
            <AIToolsPanel onToolClick={handleAIToolClick} />
          </div>
        );
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
            <p className="text-muted-foreground">The requested page is not available.</p>
          </div>
        );
    }
  };

  if (userLoading || loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

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

export default TeacherDashboard; 