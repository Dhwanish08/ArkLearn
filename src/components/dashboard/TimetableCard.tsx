import { Clock, MapPin, User, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface TimetableEntry {
  id: string;
  subject: string;
  teacher: string;
  time: string;
  room: string;
  duration: number;
  status: "upcoming" | "current" | "completed";
  progress?: number;
}

interface TimetableCardProps {
  userRole: "Main Admin" | "Admin" | "Teacher" | "Student";
  entries: TimetableEntry[];
}

const TimetableCard = ({ userRole, entries }: TimetableCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "current": return "bg-success";
      case "upcoming": return "bg-primary";
      case "completed": return "bg-muted";
      default: return "bg-muted";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "current": return "Live";
      case "upcoming": return "Upcoming";
      case "completed": return "Done";
      default: return "";
    }
  };

  return (
    <Card className="gradient-card shadow-elegant hover-lift">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Today's Schedule
          </CardTitle>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.map((entry) => (
          <div 
            key={entry.id} 
            className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
              entry.status === "current" 
                ? "bg-success/5 border-success/20" 
                : "bg-muted/30 border-border"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-card-foreground">{entry.subject}</h4>
                  <Badge 
                    className={`text-xs px-2 py-0.5 ${getStatusColor(entry.status)} text-white`}
                  >
                    {getStatusText(entry.status)}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {entry.time}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {entry.room}
                  </div>
                  {userRole === "Student" && (
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {entry.teacher}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {entry.status === "current" && entry.progress !== undefined && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Class Progress</span>
                  <span>{entry.progress}% Complete</span>
                </div>
                <Progress value={entry.progress} className="h-2" />
              </div>
            )}
          </div>
        ))}
        
        {entries.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No classes scheduled for today</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TimetableCard;