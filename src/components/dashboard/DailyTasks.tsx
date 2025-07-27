import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckSquare, Plus, Trash2, Calendar, Clock, Target, Loader2 } from "lucide-react";
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

interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  subject: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  completed: boolean;
  createdAt: any;
  updatedAt: any;
}

export default function DailyTasks() {
  const { user } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    subject: "",
    priority: "medium" as const,
    dueDate: ""
  });

  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  const subjects = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "History"];

  // Load user's tasks with real-time updates
  useEffect(() => {
    if (!user?.uid) return;

    const tasksRef = collection(firestore, "tasks");
    const q = query(
      tasksRef,
      where("userId", "==", user.uid),
      orderBy("dueDate", "asc"),
      orderBy("createdAt", "desc"),
      limit(50) // Load 50 tasks at a time
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      
      setTasks(tasksData);
      setLoading(false);
    }, (error) => {
      console.error("Error loading tasks:", error);
      toast.error("Failed to load tasks");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const addTask = async () => {
    if (!user?.uid || !newTask.title || !newTask.subject || !newTask.dueDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const taskData = {
        userId: user.uid,
        title: newTask.title,
        description: newTask.description,
        subject: newTask.subject,
        priority: newTask.priority,
        dueDate: newTask.dueDate,
        completed: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(firestore, "tasks"), taskData);
      
      setNewTask({ title: "", description: "", subject: "", priority: "medium", dueDate: "" });
      toast.success("Task added successfully!");
    } catch (error) {
      console.error("Error adding task:", error);
      toast.error("Failed to add task");
    } finally {
      setSaving(false);
    }
  };

  const toggleTask = async (id: string) => {
    try {
      const taskRef = doc(firestore, "tasks", id);
      const task = tasks.find(t => t.id === id);
      if (!task) return;

      await updateDoc(taskRef, {
        completed: !task.completed,
        updatedAt: serverTimestamp()
      });
      
      toast.success(task.completed ? "Task marked as incomplete" : "Task completed!");
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await deleteDoc(doc(firestore, "tasks", id));
      toast.success("Task deleted successfully!");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading your tasks...</p>
        </div>
      </div>
    );
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === "pending") return !task.completed;
    if (filter === "completed") return task.completed;
    return true;
  });

  const pendingTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);
  const overdueTasks = pendingTasks.filter(task => new Date(task.dueDate) < new Date());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text mb-2">Daily Tasks</h1>
        <p className="text-muted-foreground">Manage your daily assignments and study tasks</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold">{tasks.length}</p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingTasks.length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedTasks.length}</p>
              </div>
              <CheckSquare className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{overdueTasks.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add New Task */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Task
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                placeholder="Enter task title"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Select value={newTask.subject} onValueChange={(value) => setNewTask({...newTask, subject: value})}>
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
              <Label htmlFor="priority">Priority</Label>
              <Select value={newTask.priority} onValueChange={(value: any) => setNewTask({...newTask, priority: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addTask} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Task"
                )}
              </Button>
            </div>
          </div>
          <div className="mt-4">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              placeholder="Enter task description"
              value={newTask.description}
              onChange={(e) => setNewTask({...newTask, description: e.target.value})}
            />
          </div>
        </CardContent>
      </Card>

      {/* Task Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          All ({tasks.length})
        </Button>
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          onClick={() => setFilter("pending")}
        >
          Pending ({pendingTasks.length})
        </Button>
        <Button
          variant={filter === "completed" ? "default" : "outline"}
          onClick={() => setFilter("completed")}
        >
          Completed ({completedTasks.length})
        </Button>
      </div>

      {/* Task List */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {filter === "all" ? "No tasks created yet" : 
               filter === "pending" ? "No pending tasks" : "No completed tasks"}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map(task => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    task.completed ? 'bg-gray-50' : ''
                  } ${
                    !task.completed && new Date(task.dueDate) < new Date() ? 'border-red-300 bg-red-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-sm text-muted-foreground">{task.description}</div>
                      )}
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-muted-foreground">{task.subject}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                          {getPriorityIcon(task.priority)} {task.priority}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                        {!task.completed && new Date(task.dueDate) < new Date() && (
                          <span className="text-xs text-red-600 font-medium">OVERDUE</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTask(task.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 