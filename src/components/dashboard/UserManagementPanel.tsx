import { useState, useEffect, useCallback } from "react";
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
  Eye,
  UploadCloud
} from "lucide-react";
import { collection, getDocs, query, where, updateDoc, deleteDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { auth } from "@/lib/firebase";
import { setDoc, doc } from "firebase/firestore";
import { useUser } from "@/context/UserContext";
import Papa from "papaparse";

interface UserManagementPanelProps {
  userRole: "Main Admin" | "Admin";
}

const UserManagementPanel = ({ userRole }: UserManagementPanelProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const canCreateAdmins = userRole === "Main Admin";

  // Real Firestore data
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { user } = useUser();
  // Add User Modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    role: userRole === "Main Admin" ? "admin" : "teacher",
    class: "",
    userId: "",
    password: "",
  });
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addMessage, setAddMessage] = useState("");
  const [addError, setAddError] = useState("");

  // Edit User Modal state
  const [editUser, setEditUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: "", role: "student", class: "" });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editMessage, setEditMessage] = useState("");
  const [editError, setEditError] = useState("");

  // Delete User Modal state
  const [deleteUser, setDeleteUser] = useState<any>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");

  // CSV import state
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResult, setCsvResult] = useState<{ success: number; failed: number; errors: string[] }>({ success: 0, failed: 0, errors: [] });

  // Password Reset State
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");

  // Add state for set password modal
  const [setPasswordUser, setSetPasswordUser] = useState<any>(null);
  const [setPasswordValue, setSetPasswordValue] = useState("");
  const [setPasswordLoading, setSetPasswordLoading] = useState(false);
  const [setPasswordMessage, setSetPasswordMessage] = useState("");
  const [setPasswordError, setSetPasswordError] = useState("");

  // Add state for bulk selection
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState("");
  const [bulkDeleteMessage, setBulkDeleteMessage] = useState("");

  // Add fetchUsers as a stable callback
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
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
  }, []);

  // Use fetchUsers in useEffect
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function getRoleOptions() {
    if (userRole === "Main Admin") {
      return [
        { value: "admin", label: "Admin" },
        { value: "teacher", label: "Teacher" },
        { value: "student", label: "Student" },
      ];
    }
    return [
      { value: "teacher", label: "Teacher" },
      { value: "student", label: "Student" },
    ];
  }

  async function handleAddUserSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAddSubmitting(true);
    setAddMessage("");
    setAddError("");
    try {
      // Call backend Cloud Function instead of createUserWithEmailAndPassword
      const response = await fetch("https://us-central1-eduai-466305.cloudfunctions.net/createUserByAdmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.name,
          email: addForm.email,
          password: addForm.password,
          role: addForm.role.toLowerCase(),
          class: addForm.class,
          userId: addForm.userId,
          schoolId: user?.schoolId || "",
        }),
      });
      const data = await response.json();
      if (data.success) {
        setAddMessage("User created successfully!");
        setAddForm({ name: "", email: "", role: userRole === "Main Admin" ? "admin" : "teacher", class: "", userId: "", password: "" });
        fetchUsers();
      } else {
        setAddError(data.error || "Failed to create user.");
      }
    } catch (err: any) {
      setAddError(err.message || "Failed to create user.");
    } finally {
      setAddSubmitting(false);
    }
  }

  async function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvImporting(true);
    setCsvResult({ success: 0, failed: 0, errors: [] });
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: any) => {
        let success = 0, failed = 0, errors: string[] = [];
        for (const row of results.data) {
          try {
            if (!row.name || !row.email || !row.class || !row.userId || !row.password) {
              failed++;
              errors.push(`Missing fields for user: ${JSON.stringify(row)}`);
              continue;
            }
            // Use backend Cloud Function for user creation
            const response = await fetch("https://us-central1-eduai-466305.cloudfunctions.net/createUserByAdmin", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: row.name,
                email: row.email,
                password: row.password,
                role: "student",
                class: row.class,
                userId: row.userId,
                schoolId: user?.schoolId || "",
              }),
            });
            const data = await response.json();
            if (data.success) {
              success++;
            } else {
              failed++;
              errors.push(`Failed for ${row.email}: ${data.error || "Unknown error"}`);
            }
          } catch (err: any) {
            failed++;
            errors.push(`Failed for ${row.email}: ${err.message}`);
          }
        }
        setCsvResult({ success, failed, errors });
        setCsvImporting(false);
        fetchUsers();
      },
      error: (err: any) => {
        setCsvResult({ success: 0, failed: 0, errors: [err.message] });
        setCsvImporting(false);
      },
    });
  }

  function openEditModal(u: any) {
    setEditUser(u);
    setEditForm({ name: u.name, role: u.role, class: u.class });
    setEditMessage("");
    setEditError("");
  }
  function closeEditModal() {
    setEditUser(null);
    setEditForm({ name: "", role: "student", class: "" });
    setEditMessage("");
    setEditError("");
  }
  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    setEditSubmitting(true);
    setEditMessage("");
    setEditError("");
    try {
      await updateDoc(doc(firestore, "users", editUser.id), {
        name: editForm.name,
        role: editForm.role.toLowerCase(),
        class: editForm.class,
      });
      setEditMessage("User updated successfully!");
      setTimeout(() => closeEditModal(), 1000);
      fetchUsers();
    } catch (err: any) {
      setEditError(err.message || "Failed to update user.");
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDeleteUser() {
    if (!deleteUser) return;
    setDeleteSubmitting(true);
    setDeleteError("");
    setDeleteMessage("");
    try {
      // Prevent self-delete
      if (user && deleteUser.id === user.uid) {
        throw new Error("You cannot delete your own account while logged in.");
      }
      await deleteDoc(doc(firestore, "users", deleteUser.id));
      // Call Cloud Function to delete from Auth
      const response = await fetch("https://us-central1-eduai-466305.cloudfunctions.net/deleteUsersByAdmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: [deleteUser.id] }),
      });
      const data = await response.json();
      if (data.success && data.results[0].status === "deleted") {
        setDeleteMessage("User deleted from Firestore and Auth.");
      } else {
        setDeleteError(data.results[0]?.error || "Failed to delete user from Auth.");
      }
      setTimeout(() => setDeleteUser(null), 1000);
      fetchUsers();
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete user.");
    } finally {
      setDeleteSubmitting(false);
    }
  }

  // Password Reset State
  async function handleSendPasswordReset(email: string) {
    setResetLoading(true);
    setResetMessage("");
    setResetError("");
    try {
      const response = await fetch("https://us-central1-eduai-466305.cloudfunctions.net/sendPasswordResetEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (data.success) {
        setResetMessage(`Password reset email sent to ${email}`);
      } else {
        setResetError(data.error || "Failed to send password reset email.");
      }
    } catch (err: any) {
      setResetError(err.message || "Failed to send password reset email.");
    } finally {
      setResetLoading(false);
    }
  }

  async function handleSetPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSetPasswordLoading(true);
    setSetPasswordMessage("");
    setSetPasswordError("");
    try {
      const response = await fetch("https://us-central1-eduai-466305.cloudfunctions.net/adminSetUserPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: setPasswordUser.email, password: setPasswordValue }),
      });
      const data = await response.json();
      if (data.success) {
        setSetPasswordMessage("Password updated successfully!");
        setSetPasswordValue("");
        setTimeout(() => setSetPasswordUser(null), 1000);
      } else {
        setSetPasswordError(data.error || "Failed to set password.");
      }
    } catch (err: any) {
      setSetPasswordError(err.message || "Failed to set password.");
    } finally {
      setSetPasswordLoading(false);
    }
  }

  // Bulk delete handler
  async function handleBulkDelete() {
    if (selectedUserIds.length === 0) return;
    setBulkDeleteLoading(true);
    setBulkDeleteError("");
    setBulkDeleteMessage("");
    try {
      // Delete from Firestore
      await Promise.all(selectedUserIds.map(uid => deleteDoc(doc(firestore, "users", uid))));
      setBulkDeleteMessage("Users deleted from Firestore. Deleting from Auth...");
      // Call Cloud Function to delete from Auth
      const response = await fetch("https://us-central1-eduai-466305.cloudfunctions.net/deleteUsersByAdmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selectedUserIds }),
      });
      const data = await response.json();
      if (data.success) {
        const deleted = data.results.filter((r: any) => r.status === "deleted");
        const failed = data.results.filter((r: any) => r.status === "error");
        setBulkDeleteMessage(`Deleted from Auth: ${deleted.length}. Failed: ${failed.length}${failed.length ? ". " + failed.map((f: any) => `${f.uid}: ${f.error}`).join(", ") : ""}`);
      } else {
        setBulkDeleteError(data.error || "Failed to delete users from Auth.");
      }
      setSelectedUserIds([]);
      fetchUsers();
    } catch (err: any) {
      setBulkDeleteError(err.message || "Failed to delete users.");
    } finally {
      setBulkDeleteLoading(false);
    }
  }

  // Helper to toggle selection
  function toggleUserSelection(userId: string) {
    setSelectedUserIds(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  }
  function selectAll(users: any[]) {
    setSelectedUserIds(users.map(u => u.id));
  }
  function deselectAll() {
    setSelectedUserIds([]);
  }

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
    <div className="space-y-6">
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
          <Button className="gradient-button" onClick={() => setAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add New User
          </Button>
        </div>
        <TabsContent value="students">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Student Management</h3>
              </div>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading students...</div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">{error}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <input type="checkbox"
                          checked={filteredStudents.length > 0 && selectedUserIds.length === filteredStudents.length}
                          onChange={e => e.target.checked ? selectAll(filteredStudents) : deselectAll()}
                        />
                      </TableHead>
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
                        <TableCell>
                          <input type="checkbox"
                            checked={selectedUserIds.includes(student.id)}
                            onChange={() => toggleUserSelection(student.id)}
                          />
                        </TableCell>
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
                            <Button size="sm" variant="outline" onClick={() => openEditModal(student)}><Edit className="w-4 h-4" /></Button>
                            <Button size="sm" variant="outline" onClick={() => setDeleteUser(student)}><Trash2 className="w-4 h-4" /></Button>
                            <Button size="sm" variant="outline" onClick={() => setSetPasswordUser(student)} disabled={setPasswordLoading}>Reset Password</Button>
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
              </div>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading teachers...</div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">{error}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <input type="checkbox"
                          checked={filteredTeachers.length > 0 && selectedUserIds.length === filteredTeachers.length}
                          onChange={e => e.target.checked ? selectAll(filteredTeachers) : deselectAll()}
                        />
                      </TableHead>
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
                        <TableCell>
                          <input type="checkbox"
                            checked={selectedUserIds.includes(teacher.id)}
                            onChange={() => toggleUserSelection(teacher.id)}
                          />
                        </TableCell>
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
                            <Button size="sm" variant="outline" onClick={() => openEditModal(teacher)}><Edit className="w-4 h-4" /></Button>
                            <Button size="sm" variant="outline" onClick={() => setDeleteUser(teacher)}><Trash2 className="w-4 h-4" /></Button>
                            <Button size="sm" variant="outline" onClick={() => setSetPasswordUser(teacher)} disabled={setPasswordLoading}>Reset Password</Button>
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
                        <TableHead>
                          <input type="checkbox"
                            checked={filteredAdmins.length > 0 && selectedUserIds.length === filteredAdmins.length}
                            onChange={e => e.target.checked ? selectAll(filteredAdmins) : deselectAll()}
                          />
                        </TableHead>
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
                          <TableCell>
                            <input type="checkbox"
                              checked={selectedUserIds.includes(admin.id)}
                              onChange={() => toggleUserSelection(admin.id)}
                            />
                          </TableCell>
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
                              <Button size="sm" variant="outline" onClick={() => openEditModal(admin)}><Edit className="w-4 h-4" /></Button>
                              <Button size="sm" variant="outline" onClick={() => setDeleteUser(admin)}><Trash2 className="w-4 h-4" /></Button>
                              <Button size="sm" variant="outline" onClick={() => setSetPasswordUser(admin)} disabled={setPasswordLoading}>Reset Password</Button>
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
      {/* Bulk delete button and feedback */}
      {selectedUserIds.length > 0 && (
        <div className="flex items-center gap-3 mt-2">
          <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={bulkDeleteLoading}>
            {bulkDeleteLoading ? "Deleting..." : `Delete Selected (${selectedUserIds.length})`}
          </Button>
          {bulkDeleteError && <span className="text-red-500 text-sm">{bulkDeleteError}</span>}
          {bulkDeleteMessage && <span className="text-green-600 text-sm">{bulkDeleteMessage}</span>}
        </div>
      )}
      {/* CSV Import Section */}
      <Card className="p-6 bg-gradient-to-br from-blue-50/60 to-slate-100/60 border-blue-100 shadow-md mt-8">
        <div className="flex items-center gap-3 mb-3">
          <UploadCloud className="w-6 h-6 text-blue-500" />
          <h3 className="font-semibold text-lg">Mass Import Students (CSV)</h3>
        </div>
        <label className="block mb-2 text-sm font-medium text-muted-foreground">Upload a CSV file to add multiple students at once.</label>
        <input
          type="file"
          accept=".csv"
          onChange={handleCsvImport}
          disabled={csvImporting}
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <div className="text-xs text-muted-foreground mt-2">
          <span className="font-semibold">CSV columns:</span> <span className="font-mono">name, email, class, userId, password</span>
        </div>
        <div className="text-xs mt-1">
          <span className="font-semibold text-blue-700">Example row:</span> <span className="font-mono bg-blue-50 px-2 py-1 rounded text-blue-900">John Doe,john@example.com,10-A,JD123,secret123</span>
        </div>
        {csvImporting && <div className="text-blue-600 mt-3">Importing...</div>}
        {(csvResult.success > 0 || csvResult.failed > 0) && (
          <div className="mt-3">
            <div className="text-green-600">Imported: {csvResult.success}</div>
            <div className="text-red-500">Failed: {csvResult.failed}</div>
            {csvResult.errors.length > 0 && (
              <ul className="text-xs text-red-500 mt-1 list-disc ml-4">
                {csvResult.errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            )}
          </div>
        )}
      </Card>
      {/* Add User Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleAddUserSubmit}>
            <div>
              <label className="block mb-1 font-medium">Name</label>
              <Input value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="block mb-1 font-medium">Email</label>
              <Input type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label className="block mb-1 font-medium">Role</label>
              <select className="w-full p-2 rounded border" value={addForm.role} onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))}>
                {getRoleOptions().map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Class</label>
              <Input value={addForm.class} onChange={e => setAddForm(f => ({ ...f, class: e.target.value }))} required />
            </div>
            <div>
              <label className="block mb-1 font-medium">User ID</label>
              <Input value={addForm.userId} onChange={e => setAddForm(f => ({ ...f, userId: e.target.value }))} required />
            </div>
            <div>
              <label className="block mb-1 font-medium">Password</label>
              <Input type="password" value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} required minLength={6} />
            </div>
            {addMessage && <div className="text-green-600 text-sm">{addMessage}</div>}
            {addError && <div className="text-red-500 text-sm">{addError}</div>}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setAddModalOpen(false)} disabled={addSubmitting}>Cancel</Button>
              <Button type="submit" className="w-full" disabled={addSubmitting}>{addSubmitting ? "Creating..." : "Add User"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Edit User Modal */}
      <Dialog open={!!editUser} onOpenChange={v => !v && closeEditModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleEditSubmit}>
            <div>
              <label className="block mb-1 font-medium">Name</label>
              <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="block mb-1 font-medium">Role</label>
              <select className="w-full p-2 rounded border" value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
                {getRoleOptions().map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Class</label>
              <Input value={editForm.class} onChange={e => setEditForm(f => ({ ...f, class: e.target.value }))} required />
            </div>
            {editMessage && <div className="text-green-600 text-sm">{editMessage}</div>}
            {editError && <div className="text-red-500 text-sm">{editError}</div>}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={closeEditModal}>Cancel</Button>
              <Button type="submit" disabled={editSubmitting}>{editSubmitting ? "Saving..." : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Delete User Modal */}
      <Dialog open={!!deleteUser} onOpenChange={v => !v && setDeleteUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <div className="mb-4">Are you sure you want to delete <b>{deleteUser?.name}</b> ({deleteUser?.email})? This action cannot be undone.</div>
          {deleteError && <div className="text-red-500 text-sm mb-2">{deleteError}</div>}
          {deleteMessage && <div className="text-green-600 text-sm mb-2">{deleteMessage}</div>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setDeleteUser(null)} disabled={deleteSubmitting}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={handleDeleteUser} disabled={deleteSubmitting || (user && deleteUser && deleteUser.id === user.uid)}>
              {deleteSubmitting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Password Reset Feedback */}
      {resetMessage && <div className="text-green-600 text-sm mt-4">{resetMessage}</div>}
      {resetError && <div className="text-red-500 text-sm mt-4">{resetError}</div>}
      {/* Set Password Modal */}
      <Dialog open={!!setPasswordUser} onOpenChange={v => !v && setSetPasswordUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password for {setPasswordUser?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSetPasswordSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="Enter new password (e.g., birthdate)"
              value={setPasswordValue}
              onChange={e => setSetPasswordValue(e.target.value)}
              required
              minLength={6}
            />
            {setPasswordMessage && <div className="text-green-600 text-sm">{setPasswordMessage}</div>}
            {setPasswordError && <div className="text-red-500 text-sm">{setPasswordError}</div>}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setSetPasswordUser(null)} disabled={setPasswordLoading}>Cancel</Button>
              <Button type="submit" disabled={setPasswordLoading || setPasswordValue.length < 6}>
                {setPasswordLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementPanel; 