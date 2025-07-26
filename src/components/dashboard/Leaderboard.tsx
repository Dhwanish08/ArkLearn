import { useEffect, useState } from "react";
import { firestore } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const CLASS_OPTIONS = ["class-10-A", "class-10-B", "class-10-C", "class-9-A", "class-9-B"];
const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "English"];

function getSubjectScores(students: any[], subject: string) {
  // Aggregate subject scores for a class
  let total = 0;
  let count = 0;
  for (const student of students) {
    if (student.scores && typeof student.scores[subject] === "number") {
      total += student.scores[subject];
      count++;
    }
  }
  return count > 0 ? Math.round(total / count) : 0;
}

export default function Leaderboard() {
  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [subjectLeaders, setSubjectLeaders] = useState<any>({});
  const [achievements, setAchievements] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [pointsModalOpen, setPointsModalOpen] = useState(false);
  const [tab, setTab] = useState("overall");

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      setError("");
      try {
        const usersSnap = await getDocs(collection(firestore, "users"));
        const studentsByClass: Record<string, any[]> = {};
        for (const classId of CLASS_OPTIONS) {
          studentsByClass[classId] = usersSnap.docs
            .filter(doc => doc.data().class === classId && doc.data().role === "student")
            .map(doc => ({ id: doc.id, ...doc.data() }));
        }
        // Calculate overall leaderboard
        const leaderboardData = CLASS_OPTIONS.map(classId => {
          const students = studentsByClass[classId];
          // Example: totalPoints, completion, subject scores, top performers
          const totalPoints = students.reduce((sum, s) => sum + (s.totalPoints || 0), 0);
          const completion = students.length > 0 ? Math.round(students.reduce((sum, s) => sum + (s.completion || 0), 0) / students.length) : 0;
          const subjectScores = {} as Record<string, number>;
          for (const subject of SUBJECTS) {
            subjectScores[subject] = getSubjectScores(students, subject);
          }
          // Top performers: top 3 by totalPoints
          const topPerformers = [...students].sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0)).slice(0, 3);
          return {
            classId,
            students,
            totalPoints,
            completion,
            subjectScores,
            topPerformers
          };
        });
        leaderboardData.sort((a, b) => b.totalPoints - a.totalPoints);
        setLeaderboard(leaderboardData);
        // Subject leaders
        const leaders: any = {};
        for (const subject of SUBJECTS) {
          let bestClass = null;
          let bestScore = -1;
          for (const row of leaderboardData) {
            if (row.subjectScores[subject] > bestScore) {
              bestScore = row.subjectScores[subject];
              bestClass = row.classId;
            }
          }
          leaders[subject] = { classId: bestClass, score: bestScore };
        }
        setSubjectLeaders(leaders);
        // Achievements (example logic)
        setAchievements([
          {
            type: "Most Improved",
            classId: leaderboardData[0]?.classId,
            stat: "+15% this month"
          },
          {
            type: "Best Participation",
            classId: leaderboardData[0]?.classId,
            stat: `${leaderboardData[0]?.completion || 0}% completion rate`
          },
          {
            type: "Streak Champion",
            classId: leaderboardData[1]?.classId,
            stat: "Longest streak"
          }
        ]);
      } catch (err: any) {
        setError(err.message || "Failed to load leaderboard.");
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  return (
    <Card className="gradient-card shadow-elegant hover-lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">Class Leaderboard <span role="img" aria-label="trophy">🏆</span></CardTitle>
        <div className="text-sm text-muted-foreground mt-1">Track and compare performance across all classes</div>
      </CardHeader>
      <CardContent>
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button variant={tab === "overall" ? "default" : "ghost"} onClick={() => setTab("overall")}>Overall Rankings</Button>
          <Button variant={tab === "subjects" ? "default" : "ghost"} onClick={() => setTab("subjects")}>Subject Leaders</Button>
          <Button variant={tab === "achievements" ? "default" : "ghost"} onClick={() => setTab("achievements")}>Achievements</Button>
          <Button variant="outline" className="ml-auto" onClick={() => setPointsModalOpen(true)}>How Points Work</Button>
        </div>
        {error && <div className="text-red-500 text-sm text-center mb-2">{error}</div>}
        {loading ? (
          <div className="text-muted-foreground mt-4">Loading leaderboard...</div>
        ) : (
          <>
            {/* Overall Rankings Tab */}
            {tab === "overall" && (
              <div className="space-y-6">
                {leaderboard.map((row, i) => (
                  <div key={row.classId} className="bg-white rounded-xl shadow p-6 mb-2 border border-muted/30">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-2xl font-bold text-primary flex items-center gap-2">
                        {i === 0 && <span role="img" aria-label="trophy">🥇</span>}
                        {i === 1 && <span role="img" aria-label="trophy">🥈</span>}
                        {i === 2 && <span role="img" aria-label="trophy">🥉</span>}
                        {row.classId}
                      </span>
                      <span className="text-muted-foreground ml-2">Rank #{i + 1} • {row.students.length} students</span>
                      <span className="ml-auto text-2xl font-bold text-green-700">{row.totalPoints}</span>
                    </div>
                    <div className="mb-2">
                      <div className="font-medium text-muted-foreground">Overall Score</div>
                      <div className="w-full bg-muted/30 rounded-full h-3 mt-1">
                        <div className="bg-primary h-3 rounded-full" style={{ width: `${row.completion}%` }}></div>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span>Task Completion</span>
                        <span>{row.completion}%</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      {SUBJECTS.map(subject => (
                        <div key={subject} className="bg-muted/10 rounded-lg p-3 text-center">
                          <div className="font-semibold text-muted-foreground">{subject}</div>
                          <div className="text-xl font-bold text-primary mt-1">{row.subjectScores[subject]}%</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <div className="font-medium mb-1">Top Performers</div>
                      <div className="flex flex-wrap gap-2">
                        {row.topPerformers.map((student: any, idx: number) => (
                          <span key={student.id} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                            {student.name || student.id}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Subject Leaders Tab */}
            {tab === "subjects" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {SUBJECTS.map(subject => (
                  <div key={subject} className="bg-white rounded-xl shadow p-6 border border-muted/30 flex flex-col items-center">
                    <div className="flex items-center gap-2 text-xl font-bold text-primary mb-2">
                      <span role="img" aria-label="medal">🏅</span> {subject}
                    </div>
                    <div className="text-2xl font-bold mb-1">Class {subjectLeaders[subject]?.classId || "-"}</div>
                    <div className="text-3xl font-extrabold text-green-700 mb-2">{subjectLeaders[subject]?.score || 0}%</div>
                    <span className="bg-green-500/90 text-white px-4 py-1 rounded-full text-sm font-semibold">Subject Leader</span>
                  </div>
                ))}
              </div>
            )}
            {/* Achievements Tab */}
            {tab === "achievements" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {achievements.map((ach, idx) => (
                  <div key={idx} className="bg-white rounded-xl shadow p-6 border border-muted/30 flex flex-col items-center">
                    <div className="text-2xl font-bold mb-2">
                      {ach.type === "Most Improved" && <span role="img" aria-label="trophy">🏆</span>}
                      {ach.type === "Best Participation" && <span role="img" aria-label="user">👥</span>}
                      {ach.type === "Streak Champion" && <span role="img" aria-label="star">⭐</span>}
                      {ach.type}
                    </div>
                    <div className="text-xl font-semibold mb-1">Class {ach.classId}</div>
                    <div className="text-green-700 font-bold text-lg">{ach.stat}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
      {/* How Points Work Modal */}
      <Dialog open={pointsModalOpen} onOpenChange={setPointsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>How Points Work</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <h3 className="font-semibold">Curricular Activities</h3>
            <table className="w-full text-xs border mb-2">
              <thead><tr><th>Activity</th><th>Student Points</th><th>Class Points</th></tr></thead>
              <tbody>
                <tr><td>Homework (on time, approved)</td><td>+5</td><td>+2</td></tr>
                <tr><td>Homework (late)</td><td>+2</td><td>+1</td></tr>
                <tr><td>Homework (not submitted)</td><td>-3</td><td>0</td></tr>
                <tr><td>Quiz 90%+</td><td>+10</td><td>+5</td></tr>
                <tr><td>Quiz 70–89%</td><td>+7</td><td>+3</td></tr>
                <tr><td>Quiz 50–69%</td><td>+4</td><td>+2</td></tr>
                <tr><td>Quiz &lt;50%</td><td>+1</td><td>0</td></tr>
                <tr><td>Absent (quiz)</td><td>-3</td><td>0</td></tr>
                <tr><td>Assignment (good)</td><td>+12</td><td>+5</td></tr>
                <tr><td>Assignment (average)</td><td>+8</td><td>+4</td></tr>
                <tr><td>Assignment (late)</td><td>+5</td><td>+2</td></tr>
                <tr><td>Assignment (not submitted)</td><td>-5</td><td>0</td></tr>
                <tr><td>Participation (active)</td><td>+5</td><td>+2</td></tr>
                <tr><td>Participation (attentive)</td><td>+2</td><td>+1</td></tr>
                <tr><td>Participation (disengaged)</td><td>-2</td><td>0</td></tr>
              </tbody>
            </table>
            <h3 className="font-semibold">Non-Curricular Activities</h3>
            <table className="w-full text-xs border mb-2">
              <thead><tr><th>Outcome</th><th>Student Points</th><th>Class Points</th></tr></thead>
              <tbody>
                <tr><td>Participated (individual)</td><td>+5</td><td>+2</td></tr>
                <tr><td>1st Place (individual)</td><td>+15</td><td>+5</td></tr>
                <tr><td>2nd Place (individual)</td><td>+10</td><td>+4</td></tr>
                <tr><td>3rd Place (individual)</td><td>+7</td><td>+3</td></tr>
                <tr><td>Special Mention</td><td>+6</td><td>+2</td></tr>
                <tr><td>Absent after registering</td><td>-3</td><td>0</td></tr>
                <tr><td>Participated (team)</td><td>+4</td><td>+4</td></tr>
                <tr><td>Team 1st Place</td><td>+10</td><td>+6</td></tr>
                <tr><td>Team 2nd/3rd Place</td><td>+7</td><td>+5</td></tr>
                <tr><td>Team Lost</td><td>+4</td><td>+2</td></tr>
                <tr><td>Player of the Match</td><td>+8</td><td>+3</td></tr>
                <tr><td>Absent after selection</td><td>-3</td><td>0</td></tr>
              </tbody>
            </table>
            <h3 className="font-semibold">Bonuses & Leaderboard</h3>
            <ul className="list-disc pl-5">
              <li>+10 class bonus if all students submit tasks for the day</li>
              <li>Class leaderboard ranks classes by total points (curricular + non-curricular)</li>
              <li>School leaderboard ranks all classes in the school</li>
              <li>Streaks and completion % are tracked for extra recognition</li>
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
} 