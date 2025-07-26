import { useState, useEffect } from "react";
import TopBar from "@/components/layout/TopBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  UserPlus,
  GraduationCap,
  Users,
  Shield,
  Eye
} from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firestore } from "@/lib/firebase";

const UserManagement = () => {
  const [userRole] = useState<"Main Admin" | "Admin">("Admin");
  const [userName] = useState("Admin User");
  const [selectedClass, setSelectedClass] = useState<string>("all-classes");
  const [activePage] = useState("manage-users");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const canCreateAdmins = userRole === "Main Admin";

  // Real Firestore data
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    async function fetchUsers() {
      try {
        const studentsSnap = await getDocs(query(collection(firestore, "users"), where("role", "==", "student")));
        const teachersSnap = await getDocs(query(collection(firestore, "users"), where("role", "==", "teacher")));
        const adminsSnap = await getDocs(query(collection(firestore, "users"), where("role", "==", "admin")));
        setStudents(studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setTeachers(teachersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setAdmins(adminsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      } catch (err: any) {
        setError("Failed to load users: " + (err.message || err.toString()));
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  // Filtering
  const filteredStudents = students.filter((student) =>
    (student.name?.toLowerCase().includes(searchTerm.toLowerCase()) || student.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterStatus === "all" || student.status === filterStatus)
  );
  const filteredTeachers = teachers.filter((teacher) =>
    (teacher.name?.toLowerCase().includes(searchTerm.toLowerCase()) || teacher.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterStatus === "all" || teacher.status === filterStatus)
  );
  const filteredAdmins = admins.filter((admin) =>
    (admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) || admin.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterStatus === "all" || admin.status === filterStatus)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-slate-50 flex flex-col">
      {/* Top Bar */}
      <TopBar 
        userRole={userRole}
        userName={userName}
        selectedClass={selectedClass}
        onClassChange={setSelectedClass}
      />
      {/* User Management Content */}
      <main className="flex-1 p-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2 flex items-center gap-2">
              <Users className="w-8 h-8" />
              User Management
            </h1>
            <p className="text-muted-foreground">
              Create and manage users across your educational platform.
            </p>
            <Badge variant="outline" className="mt-2">
              {userRole === "Main Admin" ? "🟦 Full Access" : "🟧 Limited Access"}
            </Badge>
          </div>
        </div>
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 gradient-card">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Students</p>
                <p className="text-2xl font-bold">{students.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 gradient-card">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Teachers</p>
                <p className="text-2xl font-bold">{teachers.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 gradient-card">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold">{admins.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 gradient-card">
            <div className="flex items-center gap-3">
              <UserPlus className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">
                  {students.length + teachers.length + admins.length}
                </p>
              </div>
            </div>
          </Card>
        </div>
        {/* Search and Filters */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>
        {/* User Management Tabs */}
        <Tabs defaultValue="students" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="students">👨‍🎓 Students</TabsTrigger>
              <TabsTrigger value="teachers">👩‍🏫 Teachers</TabsTrigger>
              {canCreateAdmins && (
                <TabsTrigger value="admins">🛡️ Admins</TabsTrigger>
              )}
            </TabsList>
            <Button className="gradient-button">
              <Plus className="w-4 h-4 mr-2" />
              Add New User
            </Button>
          </div>
          <TabsContent value="students">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Student Management</h3>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Student
                  </Button>
                </div>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading students...</div>
                ) : error ? (
                  <div className="text-center py-8 text-red-500">{error}</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Join Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{student.class}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={student.status === "active" ? "default" : "secondary"}>
                              {student.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{student.joinDate}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="teachers">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Teacher Management</h3>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Teacher
                  </Button>
                </div>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading teachers...</div>
                ) : error ? (
                  <div className="text-center py-8 text-red-500">{error}</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Subjects</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Join Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTeachers.map((teacher) => (
                        <TableRow key={teacher.id}>
                          <TableCell className="font-medium">{teacher.name}</TableCell>
                          <TableCell>{teacher.email}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {(teacher.subjects || []).map((subject: string) => (
                                <Badge key={subject} variant="outline" className="text-xs">
                                  {subject}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={teacher.status === "active" ? "default" : "secondary"}>
                              {teacher.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{teacher.joinDate}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </Card>
          </TabsContent>
          {canCreateAdmins && (
            <TabsContent value="admins">
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Admin Management</h3>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Admin
                    </Button>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      🟦 <strong>Main-Admin Privileges:</strong> Only Main-Admin users can create and manage other Admin accounts.
                    </p>
                  </div>
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading admins...</div>
                  ) : error ? (
                    <div className="text-center py-8 text-red-500">{error}</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Join Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAdmins.map((admin) => (
                          <TableRow key={admin.id}>
                            <TableCell className="font-medium">{admin.name}</TableCell>
                            <TableCell>{admin.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{admin.role}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={admin.status === "active" ? "default" : "secondary"}>
                                {admin.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{admin.joinDate}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default UserManagement; 