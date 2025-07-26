import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { firestore } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

const DEV_SECRET = "my-super-secret";
const CLASS_OPTIONS = ["class-10-A", "class-10-B", "class-9-A", "class-9-B"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function getDatesOfWeek(startDateStr) {
  const dates = [];
  const start = new Date(startDateStr);
  for (let i = 0; i < 5; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export default function DevLeaderboardAggregatePage() {
  const [secret, setSecret] = useState(localStorage.getItem("dev_secret") || "");
  const [selectedClasses, setSelectedClasses] = useState(CLASS_OPTIONS);
  const [weekStart, setWeekStart] = useState("");
  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [error, setError] = useState("");

  if (secret !== DEV_SECRET) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-slate-50">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">Developer Access</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="password"
              placeholder="Enter developer secret"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              className="mb-4"
            />
            <Button
              className="w-full"
              onClick={() => localStorage.setItem("dev_secret", secret)}
              disabled={!secret}
            >
              Unlock
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  async function handleAggregate(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setLeaderboard([]);
    try {
      const weekDates = getDatesOfWeek(weekStart);
      const results: any[] = [];
      for (const classId of selectedClasses) {
        // 1. Get all students in class
        const studentsSnap = await getDocs(collection(firestore, "users"));
        const students = studentsSnap.docs.filter(doc => doc.data().class === classId && doc.data().role === "student");
        const studentIds = students.map(s => s.id);
        let totalPoints = 0;
        let streak = 0;
        let maxStreak = 0;
        let daysWith100 = 0;
        let totalTasks = 0;
        let completedTasks = 0;
        let quizScores: number[] = [];
        for (const date of weekDates) {
          let allSubmitted = true;
          let dayPoints = 0;
          for (const student of students) {
            const subRef = doc(firestore, `submissions/${classId}-${date}/${student.id}`);
            const snap = await getDoc(subRef);
            const submission = snap.exists() ? snap.data() : {};
            for (const [taskId, value] of Object.entries(submission)) {
              let status = typeof value === "string" ? value : value.status;
              let approved = typeof value === "object" && value.approved;
              let submittedAt = typeof value === "object" && value.submittedAt;
              let feedback = typeof value === "object" && value.feedback;
              // Points logic
              if (status === "completed" && approved) {
                dayPoints += 5;
                // +2 bonus if completed on same day (assume submittedAt is ISO string)
                if (submittedAt && submittedAt.slice(0, 10) === date) dayPoints += 2;
                completedTasks++;
              } else if (status === "absent") {
                dayPoints -= 1;
              } else if (status === "incomplete") {
                // 0 points
              }
              // Quiz score (if present)
              if (typeof value === "object" && typeof value.quizScore === "number") {
                quizScores.push(value.quizScore);
                dayPoints += value.quizScore;
              }
              totalTasks++;
            }
            if (Object.keys(submission).length === 0) allSubmitted = false;
          }
          // Class bonus
          if (allSubmitted && students.length > 0) {
            dayPoints += 10;
            daysWith100++;
            streak++;
            if (streak > maxStreak) maxStreak = streak;
          } else {
            streak = 0;
          }
          totalPoints += dayPoints;
        }
        const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const weeklyQuizAvg = quizScores.length > 0 ? (quizScores.reduce((a, b) => a + b, 0) / quizScores.length).toFixed(2) : "-";
        results.push({
          classId,
          totalPoints,
          streak: maxStreak,
          completionPercent,
          weeklyQuizAvg
        });
      }
      // Sort by totalPoints descending
      results.sort((a, b) => b.totalPoints - a.totalPoints);
      setLeaderboard(results);
    } catch (err) {
      setError(err.message || "Failed to aggregate leaderboard.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-slate-50">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-center">Aggregate Class Leaderboard (Developer Only)</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleAggregate}>
            <div>
              <label className="block mb-1 font-medium">Week Start Date (Monday)</label>
              <Input
                type="date"
                value={weekStart}
                onChange={e => setWeekStart(e.target.value)}
                required
              />
            </div>
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            <Button type="submit" className="w-full" disabled={loading || !weekStart}>
              {loading ? "Aggregating..." : "Aggregate Leaderboard"}
            </Button>
          </form>
          {leaderboard.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-2">Leaderboard</h3>
              <table className="w-full border rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-muted">
                    <th className="p-2 text-left">Rank</th>
                    <th className="p-2 text-left">Class</th>
                    <th className="p-2 text-left">Total Points</th>
                    <th className="p-2 text-left">Streak 🔥</th>
                    <th className="p-2 text-left">Task Completion %</th>
                    <th className="p-2 text-left">Weekly Quiz Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((row, i) => (
                    <tr key={row.classId} className={i === 0 ? "bg-accent/10" : ""}>
                      <td className="p-2">{i + 1}</td>
                      <td className="p-2 font-semibold">{row.classId}</td>
                      <td className="p-2">{row.totalPoints}</td>
                      <td className="p-2">{row.streak}</td>
                      <td className="p-2">{row.completionPercent}%</td>
                      <td className="p-2">{row.weeklyQuizAvg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 