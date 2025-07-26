import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { firestore } from "@/lib/firebase";
import { collection, setDoc, doc } from "firebase/firestore";

const DEV_SECRET = "my-super-secret";
const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "English",
  "Biology",
  "History",
  "Computer Science"
];
const TEACHERS = [
  "Dr. Sarah Johnson",
  "Prof. Michael Chen",
  "Dr. Emily Davis",
  "Ms. Rachel Green",
  "Mr. John Smith",
  "Ms. Priya Patel",
  "Mr. David Lee"
];
const CLASS_OPTIONS = ["class-10-A", "class-10-B", "class-9-A", "class-9-B"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function getTimeSlot(index) {
  // 8:00 AM start, 1 hour per subject, breaks/lunch as described
  const base = 8 * 60; // minutes
  if (index === 2) return { start: "10:00", end: "10:20", label: "Break" };
  if (index === 5) return { start: "12:20", end: "13:10", label: "Lunch" };
  if (index === 7) return { start: "14:10", end: "14:30", label: "Break" };
  // Subjects
  let slot = index;
  if (index > 2) slot--;
  if (index > 5) slot--;
  if (index > 7) slot--;
  const start = base + slot * 60;
  const end = start + 60;
  return {
    start: `${String(Math.floor(start / 60)).padStart(2, "0")}:${String(start % 60).padStart(2, "0")}`,
    end: `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`
  };
}

export default function DevSeedDataPage() {
  const [secret, setSecret] = useState(localStorage.getItem("dev_secret") || "");
  const [selectedClass, setSelectedClass] = useState(CLASS_OPTIONS[0]);
  const [weekStart, setWeekStart] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
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

  async function handleSeed(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      // Seed classes collection
      for (let i = 0; i < CLASS_OPTIONS.length; i++) {
        await setDoc(doc(firestore, "classes", CLASS_OPTIONS[i]), {
          id: CLASS_OPTIONS[i],
          name: CLASS_OPTIONS[i].replace("class-", ""),
          teacherName: TEACHERS[i % TEACHERS.length],
        });
      }
      // For each day (Mon-Fri)
      for (let d = 0; d < 5; d++) {
        const day = DAYS[d];
        // Timetable: 7 subjects + 3 breaks
        const periods = [];
        let subjIdx = 0;
        for (let i = 0; i < 10; i++) {
          const slot = getTimeSlot(i);
          if (slot.label === "Break" || slot.label === "Lunch") {
            periods.push({
              type: slot.label,
              time: `${slot.start} - ${slot.end}`
            });
          } else {
            periods.push({
              subject: SUBJECTS[subjIdx],
              teacher: TEACHERS[subjIdx],
              time: `${slot.start} - ${slot.end}`,
              room: `Room ${201 + subjIdx}`
            });
            subjIdx++;
          }
        }
        await setDoc(doc(firestore, `timetables/${selectedClass}-${day}`), { periods });
        // Daily tasks: 7 homework, 4 assignments (Mon only)
        const date = new Date(weekStart);
        date.setDate(date.getDate() + d);
        const dateStr = date.toISOString().slice(0, 10);
        const tasks = SUBJECTS.map((subject, i) => ({
          subject,
          type: "homework",
          title: `${subject} Homework`,
          description: `Complete today's homework for ${subject}`,
          dueTime: "17:00"
        }));
        if (d === 0) {
          // Monday: add 4 assignments
          for (let i = 0; i < 4; i++) {
            tasks.push({
              subject: SUBJECTS[i],
              type: "assignment",
              title: `${SUBJECTS[i]} Assignment`,
              description: `Weekly assignment for ${SUBJECTS[i]}`,
              dueTime: "17:00"
            });
          }
        }
        await setDoc(doc(firestore, `tasks/${selectedClass}-${dateStr}`), { tasks });
      }
      // Seed schedules for each teacher for the week
      for (let t = 0; t < TEACHERS.length; t++) {
        const teacherName = TEACHERS[t];
        for (let d = 0; d < 5; d++) {
          const day = DAYS[d];
          const date = new Date(weekStart);
          date.setDate(date.getDate() + d);
          const dateStr = date.toISOString().slice(0, 10);
          // Find all classes/periods for this teacher on this day
          let teacherPeriods = [];
          for (let c = 0; c < CLASS_OPTIONS.length; c++) {
            const timetableDoc = await doc(firestore, `timetables/${CLASS_OPTIONS[c]}-${day}`);
            // For seeding, we know the periods structure
            let subjIdx = 0;
            for (let i = 0; i < 10; i++) {
              const slot = getTimeSlot(i);
              if (slot.label !== "Break" && slot.label !== "Lunch") {
                if (TEACHERS[subjIdx] === teacherName) {
                  teacherPeriods.push({
                    class: CLASS_OPTIONS[c],
                    subject: SUBJECTS[subjIdx],
                    time: `${slot.start} - ${slot.end}`,
                    room: `Room ${201 + subjIdx}`,
                    slot: i + 1
                  });
                }
                subjIdx++;
              }
            }
          }
          await setDoc(doc(firestore, `schedules/${teacherName.replace(/\s+/g, "_")}-${dateStr}`), {
            teacherName,
            date: dateStr,
            periods: teacherPeriods
          });
        }
      }
      setSuccess("Sample timetable, daily tasks, classes, and teacher schedules seeded successfully!");
    } catch (err) {
      setError(err.message || "Failed to seed data.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-slate-50">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-center">Seed Sample Timetable & Tasks (Developer Only)</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSeed}>
            <div>
              <label className="block mb-1 font-medium">Class</label>
              <select
                className="w-full p-3 rounded-lg border focus:outline-none focus:ring"
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
              >
                {CLASS_OPTIONS.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
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
            {success && <div className="text-green-600 text-sm text-center">{success}</div>}
            <Button type="submit" className="w-full" disabled={loading || !weekStart}>
              {loading ? "Seeding..." : "Seed Sample Data"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 