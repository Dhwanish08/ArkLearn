import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Pause, RotateCcw, Settings, Timer, Coffee } from "lucide-react";

type TimerMode = 'work' | 'break' | 'longBreak';

interface TimerSettings {
  workTime: number;
  breakTime: number;
  longBreakTime: number;
  longBreakInterval: number;
}

export default function PomodoroTimer() {
  const [settings, setSettings] = useState<TimerSettings>({
    workTime: 25,
    breakTime: 5,
    longBreakTime: 15,
    longBreakInterval: 4
  });

  const [timeLeft, setTimeLeft] = useState(settings.workTime * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<TimerMode>('work');
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState(settings);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer finished
            if (mode === 'work') {
              setCompletedPomodoros(prev => prev + 1);
              const shouldTakeLongBreak = (completedPomodoros + 1) % settings.longBreakInterval === 0;
              setMode(shouldTakeLongBreak ? 'longBreak' : 'break');
              return (shouldTakeLongBreak ? settings.longBreakTime : settings.breakTime) * 60;
            } else {
              setMode('work');
              return settings.workTime * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, mode, settings, completedPomodoros]);

  useEffect(() => {
    // Reset timer when settings change
    if (mode === 'work') {
      setTimeLeft(settings.workTime * 60);
    } else if (mode === 'break') {
      setTimeLeft(settings.breakTime * 60);
    } else {
      setTimeLeft(settings.longBreakTime * 60);
    }
  }, [settings, mode]);

  const startTimer = () => {
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(settings.workTime * 60);
    setMode('work');
  };

  const skipTimer = () => {
    if (mode === 'work') {
      setCompletedPomodoros(prev => prev + 1);
      const shouldTakeLongBreak = (completedPomodoros + 1) % settings.longBreakInterval === 0;
      setMode(shouldTakeLongBreak ? 'longBreak' : 'break');
      setTimeLeft((shouldTakeLongBreak ? settings.longBreakTime : settings.breakTime) * 60);
    } else {
      setMode('work');
      setTimeLeft(settings.workTime * 60);
    }
  };

  const saveSettings = () => {
    setSettings(tempSettings);
    setShowSettings(false);
    resetTimer();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const totalTime = mode === 'work' ? settings.workTime * 60 : 
                     mode === 'break' ? settings.breakTime * 60 : 
                     settings.longBreakTime * 60;
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  const getModeColor = () => {
    switch (mode) {
      case 'work': return 'text-red-500';
      case 'break': return 'text-green-500';
      case 'longBreak': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getModeIcon = () => {
    switch (mode) {
      case 'work': return <Timer className="w-6 h-6" />;
      case 'break': 
      case 'longBreak': return <Coffee className="w-6 h-6" />;
      default: return <Timer className="w-6 h-6" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Pomodoro Timer</h1>
          <p className="text-muted-foreground">Stay focused with timed work sessions</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </div>

      {/* Timer Display */}
      <Card>
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            {/* Mode Indicator */}
            <div className={`flex items-center justify-center gap-2 text-lg font-medium ${getModeColor()}`}>
              {getModeIcon()}
              <span>
                {mode === 'work' ? 'Work Time' : 
                 mode === 'break' ? 'Short Break' : 'Long Break'}
              </span>
            </div>

            {/* Timer */}
            <div className="text-6xl font-mono font-bold">
              {formatTime(timeLeft)}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-1000 ${
                  mode === 'work' ? 'bg-red-500' : 
                  mode === 'break' ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${getProgress()}%` }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              {!isRunning ? (
                <Button onClick={startTimer} size="lg" className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Start
                </Button>
              ) : (
                <Button onClick={pauseTimer} size="lg" variant="outline" className="flex items-center gap-2">
                  <Pause className="w-5 h-5" />
                  Pause
                </Button>
              )}
              
              <Button onClick={resetTimer} variant="outline" size="lg" className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5" />
                Reset
              </Button>
              
              <Button onClick={skipTimer} variant="outline" size="lg">
                Skip
              </Button>
            </div>

            {/* Stats */}
            <div className="text-sm text-muted-foreground">
              Completed Pomodoros: {completedPomodoros}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle>Timer Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="workTime">Work Time (minutes)</Label>
                <Input
                  id="workTime"
                  type="number"
                  min="1"
                  max="60"
                  value={tempSettings.workTime}
                  onChange={(e) => setTempSettings({...tempSettings, workTime: parseInt(e.target.value) || 25})}
                />
              </div>
              <div>
                <Label htmlFor="breakTime">Break Time (minutes)</Label>
                <Input
                  id="breakTime"
                  type="number"
                  min="1"
                  max="30"
                  value={tempSettings.breakTime}
                  onChange={(e) => setTempSettings({...tempSettings, breakTime: parseInt(e.target.value) || 5})}
                />
              </div>
              <div>
                <Label htmlFor="longBreakTime">Long Break Time (minutes)</Label>
                <Input
                  id="longBreakTime"
                  type="number"
                  min="1"
                  max="60"
                  value={tempSettings.longBreakTime}
                  onChange={(e) => setTempSettings({...tempSettings, longBreakTime: parseInt(e.target.value) || 15})}
                />
              </div>
              <div>
                <Label htmlFor="longBreakInterval">Long Break Interval (pomodoros)</Label>
                <Input
                  id="longBreakInterval"
                  type="number"
                  min="1"
                  max="10"
                  value={tempSettings.longBreakInterval}
                  onChange={(e) => setTempSettings({...tempSettings, longBreakInterval: parseInt(e.target.value) || 4})}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={saveSettings}>Save Settings</Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setTempSettings(settings);
                  setShowSettings(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Pomodoro Technique Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li>• Work for 25 minutes, then take a 5-minute break</li>
            <li>• After 4 work sessions, take a longer 15-minute break</li>
            <li>• Use breaks to stretch, walk, or relax your eyes</li>
            <li>• Avoid checking your phone during work sessions</li>
            <li>• Keep track of completed pomodoros to measure productivity</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
} 