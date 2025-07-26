import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { auth, firestore } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc, collection, getDocs, query, where, updateDoc, deleteDoc } from "firebase/firestore";
import { deleteUser as firebaseDeleteUser } from "firebase/auth";
import Papa from "papaparse";

export default function AdminUserManagement() {
  const { user, loading } = useUser();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "Student",
    class: "",
    userId: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // User list state
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");

  // Edit modal state
  const [editUser, setEditUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: "", role: "Student", class: "" });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editMessage, setEditMessage] = useState("");
  const [editError, setEditError] = useState("");

  // Delete modal state
  const [deleteUser, setDeleteUser] = useState<any>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");

  // CSV import state
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResult, setCsvResult] = useState<{ success: number; failed: number; errors: string[] }>({ success: 0, failed: 0, errors: [] });

  useEffect(() => {
    if (!user) return;
    async function fetchUsers() {
      setUsersLoading(true);
      setUsersError("");
      try {
        const q = query(
          collection(firestore, "users"),
          where("schoolId", "==", user.schoolId),
          where("role", "in", ["Student", "Teacher"])
        );
        const snap = await getDocs(q);
        setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err: any) {
        setUsersError(err.message || "Failed to fetch users.");
      } finally {
        setUsersLoading(false);
      }
    }
    fetchUsers();
  }, [user, message, editMessage]); // refetch on user, after adding, or after editing

  if (loading) return <div>Loading...</div>;
  if (!user || (user.role !== "admin" && user.role !== "main-admin")) {
    return <div className="p-8 text-center">Access denied. Admins only.</div>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      // 1. Create user in Firebase Auth
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      // 2. Add user to Firestore
      await setDoc(doc(firestore, "users", cred.user.uid), {
        name: form.name,
        email: form.email,
        role: form.role.toLowerCase(),
        class: form.class,
        userId: form.userId,
        schoolId: user.schoolId,
      });
      setMessage("User created successfully!");
      setForm({ name: "", email: "", role: "Student", class: "", userId: "", password: "" });
    } catch (err: any) {
      setError(err.message || "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  }

  // Edit user handlers
  function openEditModal(u: any) {
    setEditUser(u);
    setEditForm({ name: u.name, role: u.role, class: u.class });
    setEditMessage("");
    setEditError("");
  }
  function closeEditModal() {
    setEditUser(null);
    setEditForm({ name: "", role: "Student", class: "" });
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
      // 1. Delete from Firestore
      await deleteDoc(doc(firestore, "users", deleteUser.id));
      // 2. Note: Deleting from Firebase Auth requires admin privileges and must be done from a backend.
      if (auth.currentUser && auth.currentUser.uid === deleteUser.id) {
        // Prevent self-delete
        throw new Error("You cannot delete your own account while logged in.");
      }
      setDeleteMessage("User deleted from database. To fully remove from Auth, use the Firebase Admin SDK.");
      setTimeout(() => setDeleteUser(null), 1000);
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete user.");
    } finally {
      setDeleteSubmitting(false);
    }
  }

  function getRoleOptions() {
    if (user.role === "main-admin") {
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

  // CSV import handler
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
            // Only allow student role for CSV import
            const cred = await createUserWithEmailAndPassword(auth, row.email, row.password);
            await setDoc(doc(firestore, "users", cred.user.uid), {
              name: row.name,
              email: row.email,
              role: "student",
              class: row.class,
              userId: row.userId,
              schoolId: user.schoolId,
            });
            success++;
          } catch (err: any) {
            failed++;
            errors.push(`Failed for ${row.email}: ${err.message}`);
          }
        }
        setCsvResult({ success, failed, errors });
        setCsvImporting(false);
      },
      error: (err: any) => {
        setCsvResult({ success: 0, failed: 0, errors: [err.message] });
        setCsvImporting(false);
      },
    });
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Add Student or Teacher</h1>
      <Card>
        <CardContent className="p-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block mb-1 font-medium">Name</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="block mb-1 font-medium">Email</label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label className="block mb-1 font-medium">Role</label>
              <select className="w-full p-2 rounded border" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                {getRoleOptions().map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Class</label>
              <Input value={form.class} onChange={e => setForm(f => ({ ...f, class: e.target.value }))} required />
            </div>
            <div>
              <label className="block mb-1 font-medium">User ID</label>
              <Input value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))} required />
            </div>
            <div>
              <label className="block mb-1 font-medium">Password</label>
              <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} />
            </div>
            {message && <div className="text-green-600 text-sm">{message}</div>}
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <Button type="submit" className="w-full" disabled={submitting}>{submitting ? "Creating..." : "Add User"}</Button>
          </form>
        </CardContent>
      </Card>

      {/* CSV Import Section */}
      <div className="mt-8">
        <h3 className="font-semibold mb-2">Mass Import Students (CSV)</h3>
        <input type="file" accept=".csv" onChange={handleCsvImport} disabled={csvImporting} />
        <div className="text-xs text-muted-foreground mt-1">CSV columns: name, email, class, userId, password</div>
        {csvImporting && <div className="text-blue-600 mt-2">Importing...</div>}
        {(csvResult.success > 0 || csvResult.failed > 0) && (
          <div className="mt-2">
            <div className="text-green-600">Imported: {csvResult.success}</div>
            <div className="text-red-500">Failed: {csvResult.failed}</div>
            {csvResult.errors.length > 0 && (
              <ul className="text-xs text-red-500 mt-1 list-disc ml-4">
                {csvResult.errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>

      <h2 className="text-xl font-bold mt-10 mb-4">Existing Users</h2>
      {usersLoading ? (
        <div>Loading users...</div>
      ) : usersError ? (
        <div className="text-red-500">{usersError}</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border mt-2">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-left">Class</th>
                <th className="px-4 py-2 text-left">User ID</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-2">{u.name}</td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">{u.role}</td>
                  <td className="px-4 py-2">{u.class}</td>
                  <td className="px-4 py-2">{u.userId}</td>
                  <td className="px-4 py-2">
                    <Button size="sm" variant="outline" onClick={() => openEditModal(u)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" className="ml-2" onClick={() => setDeleteUser(u)} disabled={u.id === user.uid}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-2 text-center text-muted-foreground">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

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
            <Button type="button" variant="destructive" onClick={handleDeleteUser} disabled={deleteSubmitting || (deleteUser && deleteUser.id === user.uid)}>
              {deleteSubmitting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 