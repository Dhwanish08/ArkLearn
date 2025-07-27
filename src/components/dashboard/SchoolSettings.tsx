import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Save, Building, Bell, Shield, Database } from "lucide-react";

interface SchoolConfig {
  schoolName: string;
  schoolEmail: string;
  schoolPhone: string;
  schoolAddress: string;
  academicYear: string;
  semester: string;
  maxStudentsPerClass: number;
  aiFeaturesEnabled: boolean;
  notificationsEnabled: boolean;
  maintenanceMode: boolean;
}

export default function SchoolSettings() {
  const [config, setConfig] = useState<SchoolConfig>({
    schoolName: "Smart Class Academy",
    schoolEmail: "admin@smartclassacademy.com",
    schoolPhone: "+1 (555) 123-4567",
    schoolAddress: "123 Education Street, Learning City, LC 12345",
    academicYear: "2025-2026",
    semester: "Fall",
    maxStudentsPerClass: 30,
    aiFeaturesEnabled: true,
    notificationsEnabled: true,
    maintenanceMode: false
  });

  const [activeTab, setActiveTab] = useState("general");

  const academicYears = ["2024-2025", "2025-2026", "2026-2027"];
  const semesters = ["Fall", "Spring", "Summer"];

  const saveSettings = () => {
    // In a real app, this would save to the database
    console.log("Saving settings:", config);
    // You could add a toast notification here
  };

  const tabs = [
    { id: "general", label: "General", icon: Building },
    { id: "ai", label: "AI Features", icon: Database },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text mb-2">School Settings</h1>
        <p className="text-muted-foreground">Configure school-wide settings and preferences</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2"
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* General Settings */}
      {activeTab === "general" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              General Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="schoolName">School Name</Label>
                <Input
                  id="schoolName"
                  value={config.schoolName}
                  onChange={(e) => setConfig({...config, schoolName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="schoolEmail">School Email</Label>
                <Input
                  id="schoolEmail"
                  type="email"
                  value={config.schoolEmail}
                  onChange={(e) => setConfig({...config, schoolEmail: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="schoolPhone">School Phone</Label>
                <Input
                  id="schoolPhone"
                  value={config.schoolPhone}
                  onChange={(e) => setConfig({...config, schoolPhone: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="academicYear">Academic Year</Label>
                <Select value={config.academicYear} onValueChange={(value) => setConfig({...config, academicYear: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="semester">Current Semester</Label>
                <Select value={config.semester} onValueChange={(value) => setConfig({...config, semester: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map(semester => (
                      <SelectItem key={semester} value={semester}>{semester}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="maxStudents">Max Students Per Class</Label>
                <Input
                  id="maxStudents"
                  type="number"
                  min="1"
                  max="50"
                  value={config.maxStudentsPerClass}
                  onChange={(e) => setConfig({...config, maxStudentsPerClass: parseInt(e.target.value) || 30})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="schoolAddress">School Address</Label>
              <Input
                id="schoolAddress"
                value={config.schoolAddress}
                onChange={(e) => setConfig({...config, schoolAddress: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Features Settings */}
      {activeTab === "ai" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              AI Features Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Enable AI Features</h3>
                  <p className="text-sm text-muted-foreground">
                    Allow students and teachers to use AI-powered tools like Socratic Tutor
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.aiFeaturesEnabled}
                  onChange={(e) => setConfig({...config, aiFeaturesEnabled: e.target.checked})}
                  className="w-4 h-4"
                />
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">AI Features Include:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Socratic Tutor - AI-powered study assistance</li>
                  <li>• Smart Flashcards - AI-generated study cards</li>
                  <li>• Quiz Generator - Automated quiz creation</li>
                  <li>• Grammar Assistant - Writing improvement tools</li>
                  <li>• Smart Study Plans - Personalized learning paths</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications Settings */}
      {activeTab === "notifications" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Enable Notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    Allow system-wide notifications for users
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.notificationsEnabled}
                  onChange={(e) => setConfig({...config, notificationsEnabled: e.target.checked})}
                  className="w-4 h-4"
                />
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-800 mb-2">Notification Types:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Assignment due dates and reminders</li>
                  <li>• Grade updates and feedback</li>
                  <li>• Class announcements and updates</li>
                  <li>• System maintenance notifications</li>
                  <li>• AI feature availability updates</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Settings */}
      {activeTab === "security" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security & Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Maintenance Mode</h3>
                  <p className="text-sm text-muted-foreground">
                    Temporarily disable access for system maintenance
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.maintenanceMode}
                  onChange={(e) => setConfig({...config, maintenanceMode: e.target.checked})}
                  className="w-4 h-4"
                />
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h4 className="font-medium text-red-800 mb-2">Security Features:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Content moderation for AI interactions</li>
                  <li>• Rate limiting on API endpoints</li>
                  <li>• User authentication and authorization</li>
                  <li>• Data encryption and privacy protection</li>
                  <li>• Regular security audits and updates</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} className="flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save Settings
        </Button>
      </div>
    </div>
  );
} 