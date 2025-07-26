import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { firestore } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";

const DEV_SECRET = "my-super-secret";
const CLASS_OPTIONS = ["class-10-A", "class-10-B", "class-9-A", "class-9-B"];
const EVENT_TYPES = [
  { value: "homework", label: "Homework" },
  { value: "quiz", label: "Quiz/Test" },
  { value: "assignment", label: "Project/Assignment" },
  { value: "participation", label: "Class Participation" },
  { value: "noncurr-individual", label: "Non-Curricular Individual" },
  { value: "noncurr-team", label: "Non-Curricular Team" }
];

const OUTCOMES = {
  homework: [
    { label: "Completed on time", student: 5, class: 2 },
    { label: "Late but done", student: 2, class: 1 },
    { label: "Marked absent", student: 0, class: 0 },
    { label: "Not submitted", student: -3, class: 0 }
  ],
  quiz: [
    { label: "Score 90%+", student: 10, class: 5 },
    { label: "Score 70–89%", student: 7, class: 3 },
    { label: "Score 50–69%", student: 4, class: 2 },
    { label: "Below 50%", student: 1, class: 0 },
    { label: "Absent without reason", student: -3, class: 0 }
  ],
  assignment: [
    { label: "Completed & Good Quality", student: 12, class: 5 },
    { label: "Completed Average", student: 8, class: 4 },
    { label: "Late Submission", student: 5, class: 2 },
    { label: "Not Submitted", student: -5, class: 0 }
  ],
  participation: [
    { label: "Active Participation", student: 5, class: 2 },
    { label: "Passive/Attentive", student: 2, class: 1 },
    { label: "Distractive/Disengaged", student: -2, class: 0 }
  ],
  "noncurr-individual": [
    { label: "Participated", student: 5, class: 2 },
    { label: "Won 1st Place", student: 15, class: 5 },
    { label: "Won 2nd Place", student: 10, class: 4 },
    { label: "Won 3rd Place", student: 7, class: 3 },
    { label: "Special Mention", student: 6, class: 2 },
    { label: "Absent after registering", student: -3, class: 0 }
  ],
  "noncurr-team": [
    { label: "Participated", student: 4, class: 4 },
    { label: "Team Won 1st Place", student: 10, class: 6 },
    { label: "Team Won 2nd/3rd Place", student: 7, class: 5 },
    { label: "Team Lost", student: 4, class: 2 },
    { label: "Player of the Match/Best X", student: 8, class: 3 },
    { label: "Absent after selection", student: -3, class: 0 }
  ]
};

export default function DevEventEntryPage() {
  const [secret, setSecret] = useState(localStorage.getItem("dev_secret") || "");
  const [eventType, setEventType] = useState("homework");
  const [selectedClass, setSelectedClass] = useState(CLASS_OPTIONS[0]);
  const [date, setDate] = useState("");
  const [subject, setSubject] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [outcome, setOutcome] = useState(OUTCOMES.homework[0].label);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchStudents() {
      const snap = await getDocs(collection(firestore, "users"));
      setStudents(snap.docs.filter(doc => doc.data().class === selectedClass && doc.data().role === "student"));
    }
    fetchStudents();
  }, [selectedClass]);

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

  async function handleSubmit(e: any) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const outcomeObj = OUTCOMES[eventType].find(o => o.label === outcome);
      if (!outcomeObj) throw new Error("Invalid outcome");
      // For each selected student, write to activities/{eventId}/results/{studentId}
      const eventId = `${eventType}-${selectedClass}-${date}-${subject || "event"}`;
      for (const studentId of selectedStudents) {
        await setDoc(doc(firestore, `activities/${eventId}/results/${studentId}`), {
          class: selectedClass,
          date,
          subject,
          eventType,
          outcome,
          studentPoints: outcomeObj.student,
          classPoints: outcomeObj.class
        });
      }
      setSuccess("Event results recorded successfully!");
      setSelectedStudents([]);
      setSubject("");
      setOutcome(OUTCOMES[eventType][0].label);
    } catch (err) {
      setError(err.message || "Failed to record event results.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-slate-50">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-center">Record Event Result (Developer Only)</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block mb-1 font-medium">Event Type</label>
              <select
                className="w-full p-3 rounded-lg border focus:outline-none focus:ring"
                value={eventType}
                onChange={e => {
                  setEventType(e.target.value);
                  setOutcome(OUTCOMES[e.target.value][0].label);
                }}
              >
                {EVENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
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
              <label className="block mb-1 font-medium">Date</label>
              <Input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Subject / Event Name</label>
              <Input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Mathematics, Football, Debate"
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Students</label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {students.map(s => (
                  <label key={s.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(s.id)}
                      onChange={e => {
                        if (e.target.checked) setSelectedStudents(prev => [...prev, s.id]);
                        else setSelectedStudents(prev => prev.filter(id => id !== s.id));
                      }}
                    />
                    {s.data().name} <span className="text-xs text-muted-foreground">({s.data().userId})</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block mb-1 font-medium">Outcome</label>
              <select
                className="w-full p-3 rounded-lg border focus:outline-none focus:ring"
                value={outcome}
                onChange={e => setOutcome(e.target.value)}
              >
                {OUTCOMES[eventType].map(o => (
                  <option key={o.label} value={o.label}>{o.label} (Student: {o.student}, Class: {o.class})</option>
                ))}
              </select>
            </div>
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            {success && <div className="text-green-600 text-sm text-center">{success}</div>}
            <Button type="submit" className="w-full" disabled={loading || !date || !subject || selectedStudents.length === 0}>
              {loading ? "Recording..." : "Record Result"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 