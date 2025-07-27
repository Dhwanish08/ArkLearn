import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Target, Award, Calendar, BookOpen, Clock } from "lucide-react";

interface SubjectProgress {
  subject: string;
  completedTasks: number;
  totalTasks: number;
  averageScore: number;
  studyTime: number; // in hours
  lastStudied: string;
}

interface WeeklyData {
  week: string;
  tasksCompleted: number;
  studyHours: number;
  averageScore: number;
}

export default function ProgressReports() {
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [selectedSubject, setSelectedSubject] = useState("all");

  const subjects = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "History"];
  
  const progressData: SubjectProgress[] = [
    {
      subject: "Mathematics",
      completedTasks: 45,
      totalTasks: 60,
      averageScore: 87,
      studyTime: 12.5,
      lastStudied: "2025-07-27"
    },
    {
      subject: "Physics",
      completedTasks: 32,
      totalTasks: 50,
      averageScore: 92,
      studyTime: 8.2,
      lastStudied: "2025-07-26"
    },
    {
      subject: "Chemistry",
      completedTasks: 28,
      totalTasks: 45,
      averageScore: 78,
      studyTime: 6.8,
      lastStudied: "2025-07-25"
    },
    {
      subject: "Biology",
      completedTasks: 38,
      totalTasks: 55,
      averageScore: 85,
      studyTime: 9.1,
      lastStudied: "2025-07-27"
    },
    {
      subject: "English",
      completedTasks: 42,
      totalTasks: 48,
      averageScore: 89,
      studyTime: 7.5,
      lastStudied: "2025-07-26"
    },
    {
      subject: "History",
      completedTasks: 25,
      totalTasks: 40,
      averageScore: 82,
      studyTime: 5.3,
      lastStudied: "2025-07-24"
    }
  ];

  const weeklyData: WeeklyData[] = [
    { week: "Week 1", tasksCompleted: 15, studyHours: 8.5, averageScore: 85 },
    { week: "Week 2", tasksCompleted: 18, studyHours: 9.2, averageScore: 87 },
    { week: "Week 3", tasksCompleted: 22, studyHours: 10.1, averageScore: 89 },
    { week: "Week 4", tasksCompleted: 20, studyHours: 9.8, averageScore: 88 },
    { week: "Week 5", tasksCompleted: 25, studyHours: 11.5, averageScore: 91 },
    { week: "Week 6", tasksCompleted: 23, studyHours: 10.8, averageScore: 90 }
  ];

  const filteredProgress = selectedSubject === "all" 
    ? progressData 
    : progressData.filter(p => p.subject === selectedSubject);

  const totalTasks = filteredProgress.reduce((sum, p) => sum + p.totalTasks, 0);
  const completedTasks = filteredProgress.reduce((sum, p) => sum + p.completedTasks, 0);
  const averageScore = filteredProgress.length > 0 
    ? Math.round(filteredProgress.reduce((sum, p) => sum + p.averageScore, 0) / filteredProgress.length)
    : 0;
  const totalStudyTime = filteredProgress.reduce((sum, p) => sum + p.studyTime, 0);

  const getProgressPercentage = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-blue-500";
    if (percentage >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Progress & Reports</h1>
          <p className="text-muted-foreground">Track your learning progress and performance</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="semester">This Semester</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map(subject => (
                <SelectItem key={subject} value={subject}>{subject}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tasks Completed</p>
                <p className="text-2xl font-bold">{completedTasks}/{totalTasks}</p>
                <p className="text-xs text-muted-foreground">
                  {getProgressPercentage(completedTasks, totalTasks)}% complete
                </p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>{averageScore}%</p>
                <p className="text-xs text-muted-foreground">
                  {averageScore >= 90 ? "Excellent!" : averageScore >= 80 ? "Good job!" : "Keep improving!"}
                </p>
              </div>
              <Award className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Study Time</p>
                <p className="text-2xl font-bold">{totalStudyTime}h</p>
                <p className="text-xs text-muted-foreground">
                  {Math.round(totalStudyTime / 7)}h per day average
                </p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Subjects</p>
                <p className="text-2xl font-bold">{filteredProgress.length}</p>
                <p className="text-xs text-muted-foreground">
                  {filteredProgress.filter(p => p.completedTasks > 0).length} with progress
                </p>
              </div>
              <BookOpen className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Subject Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredProgress.map((subject) => (
              <div key={subject.subject} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{subject.subject}</h3>
                    <p className="text-sm text-muted-foreground">
                      {subject.completedTasks}/{subject.totalTasks} tasks completed
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${getScoreColor(subject.averageScore)}`}>
                      {subject.averageScore}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {subject.studyTime}h studied
                    </p>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(getProgressPercentage(subject.completedTasks, subject.totalTasks))}`}
                    style={{ width: `${getProgressPercentage(subject.completedTasks, subject.totalTasks)}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progress: {getProgressPercentage(subject.completedTasks, subject.totalTasks)}%</span>
                  <span>Last studied: {new Date(subject.lastStudied).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Weekly Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {weeklyData.map((week, index) => (
              <div key={week.week} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">{week.week}</h4>
                    <p className="text-sm text-muted-foreground">
                      {week.tasksCompleted} tasks, {week.studyHours}h studied
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${getScoreColor(week.averageScore)}`}>
                    {week.averageScore}%
                  </p>
                  <p className="text-sm text-muted-foreground">Average</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Study Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredProgress
              .filter(p => p.averageScore < 85)
              .map(subject => (
                <div key={subject.subject} className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Target className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="font-medium">Focus on {subject.subject}</p>
                    <p className="text-sm text-muted-foreground">
                      Your score is {subject.averageScore}%. Try spending more time on this subject.
                    </p>
                  </div>
                </div>
              ))}
            
            {filteredProgress
              .filter(p => p.studyTime < 8)
              .map(subject => (
                <div key={subject.subject} className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Increase study time for {subject.subject}</p>
                    <p className="text-sm text-muted-foreground">
                      You've studied {subject.studyTime}h. Consider dedicating more time to improve.
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 