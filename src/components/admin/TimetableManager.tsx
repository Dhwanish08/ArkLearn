import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Copy,
  Download,
  Upload
} from "lucide-react";
import CSVImportModal from "./CSVImportModal";
import { firestore } from "@/lib/firebase";
import { collection, doc, getDocs, setDoc, deleteDoc, query, where } from "firebase/firestore";
import { toast } from "sonner";
import Papa from "papaparse";

interface Period {
  id: string;
  subject: string;
  teacher: string;
  startTime: string;
  endTime: string;
  room: string;
  type: "subject" | "break" | "lunch";
}

interface DaySchedule {
  day: string;
  periods: Period[];
}

interface TimetableManagerProps {
  selectedClass: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TIME_SLOTS = [
  "08:00", "08:15", "08:30", "08:45", "09:00", "09:15", "09:30", "09:45",
  "10:00", "10:15", "10:30", "10:45", "11:00", "11:15", "11:30", "11:45",
  "12:00", "12:15", "12:30", "12:45", "13:00", "13:15", "13:30", "13:45",
  "14:00", "14:15", "14:30", "14:45", "15:00", "15:15", "15:30", "15:45",
  "16:00", "16:15", "16:30", "16:45"
];

const SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology", "English", "Hindi", 
  "Gujarati", "Sanskrit", "History", "Geography", "Computer Science", 
  "Economics", "Business Studies", "Accountancy", "Statistics"
];

const ROOMS = [
  "Room 101", "Room 102", "Room 103", "Room 201", "Room 202", "Room 203",
  "Lab 1", "Lab 2", "Computer Lab", "Library", "Auditorium", "Sports Ground"
];

export default function TimetableManager({ selectedClass }: TimetableManagerProps) {
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [selectedDay, setSelectedDay] = useState("");
  const [periodForm, setPeriodForm] = useState({
    subject: "",
    teacher: "",
    startTime: "",
    endTime: "",
    room: "",
    type: "subject" as const
  });

  // Copy/Import states
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [sourceClass, setSourceClass] = useState("");
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [csvImportModalOpen, setCsvImportModalOpen] = useState(false);

  useEffect(() => {
    fetchTeachers();
    fetchSchedules();
    fetchAvailableClasses();
  }, [selectedClass]);

  const fetchTeachers = async () => {
    try {
      const teachersSnap = await getDocs(query(collection(firestore, "users"), where("role", "==", "teacher")));
      setTeachers(teachersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Error fetching teachers:", err);
    }
  };

  const fetchSchedules = async () => {
    if (!selectedClass) return;
    
    setLoading(true);
    setError("");
    try {
      const schedulesData: DaySchedule[] = [];
      
      for (const day of DAYS) {
        const docRef = doc(firestore, "timetables", `${selectedClass}-${day}`);
        const docSnap = await getDocs(collection(firestore, "timetables"));
        const dayDoc = docSnap.docs.find(d => d.id === `${selectedClass}-${day}`);
        
        if (dayDoc) {
          const data = dayDoc.data();
          schedulesData.push({
            day,
            periods: data.periods?.map((p: any, index: number) => ({
              id: `${day}-${index}`,
              subject: p.subject || "",
              teacher: p.teacher || "",
              startTime: p.startTime || p.time?.split(" - ")[0] || "",
              endTime: p.endTime || p.time?.split(" - ")[1] || "",
              room: p.room || "",
              type: p.type || (p.subject ? "subject" : "break")
            })) || []
          });
        } else {
          schedulesData.push({ day, periods: [] });
        }
      }
      
      setSchedules(schedulesData);
    } catch (err: any) {
      setError("Failed to load schedules: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableClasses = async () => {
    try {
      const classesSnap = await getDocs(collection(firestore, "classes"));
      const classes = classesSnap.docs.map(doc => doc.id);
      setAvailableClasses(classes.filter(c => c !== selectedClass));
    } catch (err) {
      console.error("Error fetching classes:", err);
    }
  };

  const handleAddPeriod = (day: string) => {
    setSelectedDay(day);
    setSelectedPeriod(null);
    setPeriodForm({
      subject: "",
      teacher: "",
      startTime: "08:00",
      endTime: "09:00",
      room: "Room 101",
      type: "subject"
    });
    setEditModalOpen(true);
  };

  const handleEditPeriod = (period: Period, day: string) => {
    setSelectedDay(day);
    setSelectedPeriod(period);
    setPeriodForm({
      subject: period.subject,
      teacher: period.teacher,
      startTime: period.startTime,
      endTime: period.endTime,
      room: period.room,
      type: period.type
    });
    setEditModalOpen(true);
  };

  const handleSavePeriod = async () => {
    if (!periodForm.subject && periodForm.type === "subject") {
      toast.error("Subject is required");
      return;
    }

    const newPeriod: Period = {
      id: selectedPeriod?.id || `${selectedDay}-${Date.now()}`,
      subject: periodForm.subject,
      teacher: periodForm.teacher,
      startTime: periodForm.startTime,
      endTime: periodForm.endTime,
      room: periodForm.room,
      type: periodForm.type
    };

    const updatedSchedules = schedules.map(schedule => {
      if (schedule.day === selectedDay) {
        if (selectedPeriod) {
          // Edit existing period
          const updatedPeriods = schedule.periods.map(p => 
            p.id === selectedPeriod.id ? newPeriod : p
          );
          return { ...schedule, periods: updatedPeriods };
        } else {
          // Add new period
          return { ...schedule, periods: [...schedule.periods, newPeriod] };
        }
      }
      return schedule;
    });

    setSchedules(updatedSchedules);
    await saveScheduleToFirestore(selectedDay, updatedSchedules.find(s => s.day === selectedDay)?.periods || []);
    setEditModalOpen(false);
    toast.success(selectedPeriod ? "Period updated successfully!" : "Period added successfully!");
  };

  const handleDeletePeriod = async (periodId: string, day: string) => {
    const updatedSchedules = schedules.map(schedule => {
      if (schedule.day === day) {
        return {
          ...schedule,
          periods: schedule.periods.filter(p => p.id !== periodId)
        };
      }
      return schedule;
    });

    setSchedules(updatedSchedules);
    await saveScheduleToFirestore(day, updatedSchedules.find(s => s.day === day)?.periods || []);
    toast.success("Period deleted successfully!");
  };

  const saveScheduleToFirestore = async (day: string, periods: Period[]) => {
    try {
      const docRef = doc(firestore, "timetables", `${selectedClass}-${day}`);
      await setDoc(docRef, { periods });
    } catch (err) {
      console.error("Error saving schedule:", err);
      toast.error("Failed to save schedule");
    }
  };

  const handleCopyTimetable = async () => {
    if (!sourceClass) {
      toast.error("Please select a source class");
      return;
    }

    try {
      const sourceSchedules: DaySchedule[] = [];
      
      for (const day of DAYS) {
        const docSnap = await getDocs(collection(firestore, "timetables"));
        const dayDoc = docSnap.docs.find(d => d.id === `${sourceClass}-${day}`);
        
        if (dayDoc) {
          const data = dayDoc.data();
          sourceSchedules.push({
            day,
            periods: data.periods?.map((p: any, index: number) => ({
              id: `${day}-${index}`,
              subject: p.subject || "",
              teacher: p.teacher || "",
              startTime: p.startTime || p.time?.split(" - ")[0] || "",
              endTime: p.endTime || p.time?.split(" - ")[1] || "",
              room: p.room || "",
              type: p.type || (p.subject ? "subject" : "break")
            })) || []
          });
        }
      }

      setSchedules(sourceSchedules);
      
      // Save to new class
      for (const schedule of sourceSchedules) {
        await saveScheduleToFirestore(schedule.day, schedule.periods);
      }
      
      setCopyModalOpen(false);
      toast.success(`Timetable copied from ${sourceClass} successfully!`);
    } catch (err) {
      toast.error("Failed to copy timetable");
    }
  };

  const exportTimetable = () => {
    const csvData = schedules.map(schedule => 
      schedule.periods.map(period => ({
        Day: schedule.day,
        Subject: period.subject,
        Teacher: period.teacher,
        StartTime: period.startTime,
        EndTime: period.endTime,
        Room: period.room,
        Type: period.type
      }))
    ).flat();

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedClass}-timetable.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="text-center py-8">Loading timetable...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Timetable Management</h2>
          <p className="text-muted-foreground">Manage class schedules for {selectedClass}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCopyModalOpen(true)}>
            <Copy className="w-4 h-4 mr-2" />
            Copy from Another Class
          </Button>
          <Button variant="outline" onClick={() => setCsvImportModalOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline" onClick={exportTimetable}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {schedules.map((schedule) => (
          <Card key={schedule.day} className="min-h-[400px]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg">{schedule.day}</span>
                <Button
                  size="sm"
                  onClick={() => handleAddPeriod(schedule.day)}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {schedule.periods.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No periods scheduled</p>
                  </div>
                ) : (
                  schedule.periods
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((period) => (
                      <div
                        key={period.id}
                        className={`p-3 rounded-lg border transition-all hover:shadow-sm ${
                          period.type === "subject" 
                            ? "bg-blue-50 border-blue-200" 
                            : period.type === "break"
                            ? "bg-yellow-50 border-yellow-200"
                            : "bg-green-50 border-green-200"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm">
                                {period.type === "subject" ? period.subject : period.type.toUpperCase()}
                              </h4>
                              <Badge variant="outline" className="text-xs">
                                {period.type}
                              </Badge>
                            </div>
                            {period.type === "subject" && (
                              <div className="text-xs text-muted-foreground space-y-1">
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {period.teacher}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {period.room}
                                </div>
                              </div>
                            )}
                            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {period.startTime} - {period.endTime}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditPeriod(period, schedule.day)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeletePeriod(period.id, schedule.day)}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Period Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedPeriod ? "Edit Period" : "Add Period"} - {selectedDay}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <Select value={periodForm.type} onValueChange={(value: any) => setPeriodForm({ ...periodForm, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subject">Subject</SelectItem>
                  <SelectItem value="break">Break</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {periodForm.type === "subject" && (
              <>
                <div>
                  <Label>Subject</Label>
                  <Select value={periodForm.subject} onValueChange={(value) => setPeriodForm({ ...periodForm, subject: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Teacher</Label>
                  <Select value={periodForm.teacher} onValueChange={(value) => setPeriodForm({ ...periodForm, teacher: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.name}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Room</Label>
                  <Select value={periodForm.room} onValueChange={(value) => setPeriodForm({ ...periodForm, room: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROOMS.map((room) => (
                        <SelectItem key={room} value={room}>
                          {room}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time</Label>
                <Select value={periodForm.startTime} onValueChange={(value) => setPeriodForm({ ...periodForm, startTime: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>End Time</Label>
                <Select value={periodForm.endTime} onValueChange={(value) => setPeriodForm({ ...periodForm, endTime: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePeriod}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Copy Timetable Modal */}
      <Dialog open={copyModalOpen} onOpenChange={setCopyModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Copy Timetable from Another Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Source Class</Label>
              <Select value={sourceClass} onValueChange={setSourceClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class to copy from" />
                </SelectTrigger>
                <SelectContent>
                  {availableClasses.map((className) => (
                    <SelectItem key={className} value={className}>
                      {className}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              This will replace the current timetable for {selectedClass} with the timetable from the selected class.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCopyModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCopyTimetable}>
              <Copy className="w-4 h-4 mr-2" />
              Copy Timetable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Import Modal */}
      <CSVImportModal 
        open={csvImportModalOpen} 
        onOpenChange={setCsvImportModalOpen}
        selectedClass={selectedClass}
        onImportComplete={fetchSchedules}
      />
    </div>
  );
} 