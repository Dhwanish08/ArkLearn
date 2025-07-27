import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, Clock, BookOpen, Target, Loader2 } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { firestore } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  onSnapshot,
  serverTimestamp 
} from "firebase/firestore";
import { toast } from "sonner";

interface StudySession {
  id: string;
  userId: string;
  subject: string;
  chapter: string;
  date: string;
  time: string;
  duration: number;
  completed: boolean;
  createdAt: any;
  updatedAt: any;
}

export default function StudyPlanner() {
  const { user } = useUser();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [newSession, setNewSession] = useState({
    subject: "",
    chapter: "",
    date: "",
    time: "",
    duration: 30
  });

  const subjects = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "History"];

  // Chapter data for each subject
  const chaptersData = {
    "Mathematics": [
      "Chapter 1: Number Systems",
      "Chapter 2: Algebra Basics",
      "Chapter 3: Linear Equations",
      "Chapter 4: Quadratic Equations",
      "Chapter 5: Geometry",
      "Chapter 6: Trigonometry",
      "Chapter 7: Statistics",
      "Chapter 8: Probability"
    ],
    "Physics": [
      "Chapter 1: Introduction to Physics",
      "Chapter 2: Motion and Forces",
      "Chapter 3: Newton's Laws of Motion",
      "Chapter 4: Work and Energy",
      "Chapter 5: Waves and Sound",
      "Chapter 6: Electricity and Magnetism",
      "Chapter 7: Light and Optics",
      "Chapter 8: Modern Physics"
    ],
    "Chemistry": [
      "Chapter 1: Introduction to Chemistry",
      "Chapter 2: Atomic Structure",
      "Chapter 3: Chemical Bonding",
      "Chapter 4: Chemical Reactions",
      "Chapter 5: Acids and Bases",
      "Chapter 6: Organic Chemistry",
      "Chapter 7: Environmental Chemistry",
      "Chapter 8: Biochemistry"
    ],
    "Biology": [
      "Chapter 1: Introduction to Biology",
      "Chapter 2: Cell Biology",
      "Chapter 3: Genetics",
      "Chapter 4: Evolution",
      "Chapter 5: Ecology",
      "Chapter 6: Human Anatomy",
      "Chapter 7: Plant Biology",
      "Chapter 8: Microbiology"
    ],
    "English": [
      "Chapter 1: Grammar Fundamentals",
      "Chapter 2: Literature Analysis",
      "Chapter 3: Writing Skills",
      "Chapter 4: Reading Comprehension",
      "Chapter 5: Vocabulary Building",
      "Chapter 6: Creative Writing",
      "Chapter 7: Essay Writing",
      "Chapter 8: Communication Skills"
    ],
    "History": [
      "Chapter 1: Ancient Civilizations",
      "Chapter 2: Medieval Period",
      "Chapter 3: Renaissance and Reformation",
      "Chapter 4: Age of Exploration",
      "Chapter 5: Industrial Revolution",
      "Chapter 6: World Wars",
      "Chapter 7: Cold War Era",
      "Chapter 8: Modern History"
    ]
  };

  // Get chapters for selected subject
  const getChaptersForSubject = (subject: string) => {
    return chaptersData[subject as keyof typeof chaptersData] || [];
  };

  // Load user's study sessions with pagination
  useEffect(() => {
    if (!user?.uid) return;

    const sessionsRef = collection(firestore, "studySessions");
    const q = query(
      sessionsRef,
      where("userId", "==", user.uid),
      orderBy("date", "desc"),
      orderBy("createdAt", "desc"),
      limit(20) // Load 20 sessions at a time
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StudySession[];
      
      setSessions(sessionsData);
      setLoading(false);
      setHasMore(snapshot.docs.length === 20);
    }, (error) => {
      console.error("Error loading sessions:", error);
      toast.error("Failed to load study sessions");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Add new study session
  const addSession = async () => {
    if (!user?.uid || !newSession.subject || !newSession.chapter || !newSession.date || !newSession.time) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const sessionData = {
        userId: user.uid,
        subject: newSession.subject,
        chapter: newSession.chapter,
        date: newSession.date,
        time: newSession.time,
        duration: newSession.duration,
        completed: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(firestore, "studySessions"), sessionData);
      
      setNewSession({ subject: "", chapter: "", date: "", time: "", duration: 30 });
      toast.success("Study session added successfully!");
    } catch (error) {
      console.error("Error adding session:", error);
      toast.error("Failed to add study session");
    } finally {
      setSaving(false);
    }
  };

  // Toggle session completion
  const toggleSession = async (id: string) => {
    try {
      const sessionRef = doc(firestore, "studySessions", id);
      const session = sessions.find(s => s.id === id);
      if (!session) return;

      await updateDoc(sessionRef, {
        completed: !session.completed,
        updatedAt: serverTimestamp()
      });
      
      toast.success(session.completed ? "Session marked as incomplete" : "Session completed!");
    } catch (error) {
      console.error("Error updating session:", error);
      toast.error("Failed to update session");
    }
  };

  // Delete session
  const deleteSession = async (id: string) => {
    try {
      await deleteDoc(doc(firestore, "studySessions", id));
      toast.success("Session deleted successfully!");
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Failed to delete session");
    }
  };

  // Load more sessions (pagination)
  const loadMoreSessions = async () => {
    if (!user?.uid || !hasMore) return;

    setLoading(true);
    try {
      const sessionsRef = collection(firestore, "studySessions");
      const q = query(
        sessionsRef,
        where("userId", "==", user.uid),
        orderBy("date", "desc"),
        orderBy("createdAt", "desc"),
        limit(20)
      );

      const snapshot = await getDocs(q);
      const newSessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StudySession[];

      setSessions(prev => [...prev, ...newSessions]);
      setHasMore(snapshot.docs.length === 20);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error("Error loading more sessions:", error);
      toast.error("Failed to load more sessions");
    } finally {
      setLoading(false);
    }
  };

  const todaySessions = sessions.filter(session => session.date === new Date().toISOString().split('T')[0]);
  const upcomingSessions = sessions.filter(session => session.date > new Date().toISOString().split('T')[0]);

  if (loading && sessions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading your study sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Study Planner</h1>
          <p className="text-muted-foreground">Plan and track your study sessions</p>
        </div>
        <Button className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          View Calendar
        </Button>
      </div>

      {/* Add New Session */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Study Session
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Select value={newSession.subject} onValueChange={(value) => setNewSession({...newSession, subject: value, chapter: ""})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="chapter">Chapter</Label>
              <Select 
                value={newSession.chapter} 
                onValueChange={(value) => setNewSession({...newSession, chapter: value})}
                disabled={!newSession.subject}
              >
                <SelectTrigger>
                  <SelectValue placeholder={newSession.subject ? "Select chapter" : "Select subject first"} />
                </SelectTrigger>
                <SelectContent>
                  {getChaptersForSubject(newSession.subject).map(chapter => (
                    <SelectItem key={chapter} value={chapter}>{chapter}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={newSession.date}
                onChange={(e) => setNewSession({...newSession, date: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={newSession.time}
                onChange={(e) => setNewSession({...newSession, time: e.target.value})}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addSession} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Session"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-green-500" />
            Today's Sessions ({todaySessions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todaySessions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No sessions scheduled for today</p>
          ) : (
            <div className="space-y-3">
              {todaySessions.map(session => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={session.completed}
                      onChange={() => toggleSession(session.id)}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="font-medium">{session.chapter}</div>
                      <div className="text-sm text-muted-foreground">{session.subject}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 inline mr-1" />
                      {session.time} ({session.duration}min)
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSession(session.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            Upcoming Sessions ({upcomingSessions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingSessions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No upcoming sessions</p>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map(session => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{session.chapter}</div>
                    <div className="text-sm text-muted-foreground">{session.subject}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      {new Date(session.date).toLocaleDateString()} at {session.time}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSession(session.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Load More Button */}
          {hasMore && (
            <div className="mt-4 text-center">
              <Button 
                variant="outline" 
                onClick={loadMoreSessions}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More Sessions"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 