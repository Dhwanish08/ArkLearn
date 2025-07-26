import { Bell, ChevronDown, Search, Settings, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import schoolLogo from "@/assets/school-logo.svg";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface TopBarProps {
  userRole: "Main Admin" | "Admin" | "Teacher" | "Student";
  userName: string;
  selectedClass?: string;
  onClassChange?: (classId: string) => void;
}

const TopBar = ({ userRole, userName, selectedClass, onClassChange }: TopBarProps) => {
  const showClassSelector = userRole === "Main Admin" || userRole === "Admin";
  
  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm shadow-elegant flex items-center justify-between px-6">
      {/* Left Section - Logo and School Name */}
      <div className="flex items-center gap-4">
        <img 
          src={schoolLogo} 
          alt="EduFuture AI" 
          className="w-8 h-8 rounded-lg shadow-md"
        />
        <div>
          <h1 className="text-xl font-bold gradient-text">EduFuture AI</h1>
          <p className="text-xs text-muted-foreground">Smart Learning Platform</p>
        </div>
      </div>

      {/* Center Section - Class Selector & Search */}
      <div className="flex items-center gap-4 flex-1 max-w-2xl">
        {showClassSelector && (
          <Select value={selectedClass} onValueChange={onClassChange}>
            <SelectTrigger className="w-48 glass-card">
              <SelectValue placeholder="Select Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="class-10-a">Class 10-A</SelectItem>
              <SelectItem value="class-10-b">Class 10-B</SelectItem>
              <SelectItem value="class-9-a">Class 9-A</SelectItem>
              <SelectItem value="class-9-b">Class 9-B</SelectItem>
            </SelectContent>
          </Select>
        )}
        
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search anything..." 
            className="pl-10 glass-card border-0"
          />
        </div>
      </div>

      {/* Right Section - Notifications and Profile */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative hover-lift">
          <Bell className="w-5 h-5" />
          <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs bg-accent">
            3
          </Badge>
        </Button>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 hover-lift">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">{userRole}</p>
              </div>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 glass-card">
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={async () => {
              await signOut(auth);
              window.location.href = "/login";
            }}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default TopBar;