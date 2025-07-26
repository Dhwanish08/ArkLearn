import { CheckCircle, Clock, AlertCircle, Plus, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Task {
  id: string;
  subject: string;
  title: string;
  description: string;
  dueTime: string;
  status: "completed" | "incomplete" | "absent" | "pending-approval";
  submittedAt?: string;
  teacherComment?: string;
}

interface DailyTasksCardProps {
  userRole: "Main Admin" | "Admin" | "Teacher" | "Student";
  tasks: Task[];
  completionRate: number;
  onTaskStatusChange?: (taskId: string, status: Task["status"]) => void;
  onAddTask?: () => void;
}

const DailyTasksCard = ({ 
  userRole, 
  tasks, 
  completionRate, 
  onTaskStatusChange, 
  onAddTask 
}: DailyTasksCardProps) => {
  const canAddTasks = userRole === "Teacher" || userRole === "Admin" || userRole === "Main Admin";
  const isStudent = userRole === "Student";

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4 text-success" />;
      case "pending-approval": return <Clock className="w-4 h-4 text-warning" />;
      case "incomplete": return <AlertCircle className="w-4 h-4 text-destructive" />;
      case "absent": return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: Task["status"]) => {
    const variants = {
      "completed": "bg-success/10 text-success border-success/20",
      "pending-approval": "bg-warning/10 text-warning border-warning/20",
      "incomplete": "bg-destructive/10 text-destructive border-destructive/20",
      "absent": "bg-muted text-muted-foreground border-muted"
    };

    const labels = {
      "completed": "Completed",
      "pending-approval": "Pending Review",
      "incomplete": "Incomplete",
      "absent": "Absent"
    };

    return (
      <Badge className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  return (
    <Card className="gradient-card shadow-elegant hover-lift">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            Daily Tasks
          </CardTitle>
          {canAddTasks && (
            <Button size="sm" onClick={onAddTask} className="shadow-md">
              <Plus className="w-4 h-4 mr-1" />
              Add Task
            </Button>
          )}
        </div>
        {isStudent && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Completion Rate</span>
              <span className="font-medium">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.map((task) => (
          <div 
            key={task.id} 
            className="p-4 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    {task.subject}
                  </Badge>
                  <span className="text-sm text-muted-foreground">Due: {task.dueTime}</span>
                </div>
                <h4 className="font-medium text-card-foreground mb-1">{task.title}</h4>
                <p className="text-sm text-muted-foreground">{task.description}</p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                {getStatusIcon(task.status)}
                {getStatusBadge(task.status)}
              </div>
            </div>

            {isStudent && (
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant={task.status === "completed" ? "default" : "outline"}
                  onClick={() => onTaskStatusChange?.(task.id, "completed")}
                  className="text-xs"
                >
                  ✓ Complete
                </Button>
                <Button
                  size="sm"
                  variant={task.status === "incomplete" ? "destructive" : "outline"}
                  onClick={() => onTaskStatusChange?.(task.id, "incomplete")}
                  className="text-xs"
                >
                  ✗ Incomplete
                </Button>
                <Button
                  size="sm"
                  variant={task.status === "absent" ? "secondary" : "outline"}
                  onClick={() => onTaskStatusChange?.(task.id, "absent")}
                  className="text-xs"
                >
                  🚫 Absent
                </Button>
              </div>
            )}

            {task.teacherComment && (
              <div className="mt-3 p-2 bg-muted/50 rounded text-sm">
                <div className="flex items-center gap-1 mb-1">
                  <MessageSquare className="w-3 h-3 text-muted-foreground" />
                  <span className="font-medium text-muted-foreground">Teacher's Note:</span>
                </div>
                <p className="text-muted-foreground">{task.teacherComment}</p>
              </div>
            )}
          </div>
        ))}
        
        {tasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No tasks assigned for today</p>
            {canAddTasks && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onAddTask}
                className="mt-2"
              >
                <Plus className="w-4 h-4 mr-1" />
                Create First Task
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyTasksCard;