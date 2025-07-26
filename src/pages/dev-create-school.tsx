import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { firestore, auth } from "@/lib/firebase";
import { collection, addDoc, setDoc, doc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

// Simple dev-only protection: require a secret in localStorage
const DEV_SECRET = "my-super-secret";

export default function DevCreateSchoolPage() {
  const [secret, setSecret] = useState(localStorage.getItem("dev_secret") || "");
  const [form, setForm] = useState({
    schoolName: "",
    schoolCode: "",
    adminName: "",
    adminUserId: "",
    adminEmail: "",
    adminPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  if (secret !== DEV_SECRET) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-slate-50">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">Developer Access</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="password"
              placeholder="Enter developer secret"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              className="mb-4"
            />
            <Button
              className="w-full"
              onClick={() => localStorage.setItem("dev_secret", secret)}
              disabled={!secret}
            >
              Unlock
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      // 1. Create school in Firestore
      const schoolRef = await addDoc(collection(firestore, "schools"), {
        name: form.schoolName,
        code: form.schoolCode
      });
      // 2. Create main admin in Firebase Auth
      const userCred = await createUserWithEmailAndPassword(auth, form.adminEmail, form.adminPassword);
      // 3. Add main admin to Firestore users collection
      await setDoc(doc(firestore, "users", userCred.user.uid), {
        name: form.adminName,
        userId: form.adminUserId,
        email: form.adminEmail,
        role: "main-admin",
        schoolId: schoolRef.id
      });
      setSuccess("School and main admin created successfully!");
      setForm({
        schoolName: "",
        schoolCode: "",
        adminName: "",
        adminUserId: "",
        adminEmail: "",
        adminPassword: ""
      });
    } catch (err: any) {
      setError(err.message || "Failed to create school and main admin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-slate-50">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-center">Create School & Main Admin (Developer Only)</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block mb-1 font-medium">School Name</label>
              <Input
                value={form.schoolName}
                onChange={e => setForm(f => ({ ...f, schoolName: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">School Code</label>
              <Input
                value={form.schoolCode}
                onChange={e => setForm(f => ({ ...f, schoolCode: e.target.value }))}
                required
              />
            </div>
            <div className="pt-2 border-t mt-2">
              <label className="block mb-1 font-medium">Main Admin Name</label>
              <Input
                value={form.adminName}
                onChange={e => setForm(f => ({ ...f, adminName: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Main Admin User ID</label>
              <Input
                value={form.adminUserId}
                onChange={e => setForm(f => ({ ...f, adminUserId: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Main Admin Email</label>
              <Input
                type="email"
                value={form.adminEmail}
                onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Main Admin Password</label>
              <Input
                type="password"
                value={form.adminPassword}
                onChange={e => setForm(f => ({ ...f, adminPassword: e.target.value }))}
                required
              />
            </div>
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            {success && <div className="text-green-600 text-sm text-center">{success}</div>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create School & Main Admin"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 