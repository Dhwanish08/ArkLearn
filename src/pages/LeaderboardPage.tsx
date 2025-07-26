import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import Leaderboard from "@/components/dashboard/Leaderboard";
import { useState } from "react";

export default function LeaderboardPage() {
  // You may want to fetch these from context/auth in the future
  const [userRole, setUserRole] = useState<"Student" | "Main Admin" | "Admin" | "Teacher">("Student");
  const [userName, setUserName] = useState("...");
  const [selectedClass, setSelectedClass] = useState("");
  const [activePage, setActivePage] = useState("leaderboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-slate-50 flex">
      <Sidebar userRole={userRole} activePage={activePage} onPageChange={setActivePage} />
      <div className="flex-1 flex flex-col">
        <TopBar
          userRole={userRole}
          userName={userName}
          selectedClass={selectedClass}
          onClassChange={setSelectedClass}
        />
        <main className="flex-1 p-6 space-y-6 animate-fade-in">
          <Leaderboard />
        </main>
      </div>
    </div>
  );
} 