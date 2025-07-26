import { useState } from "react";
import { useUser } from "@/context/UserContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { firestore } from "@/lib/firebase";
import { collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore";

export default function DevFixUserRolesPage() {
  const { user, loading } = useUser();
  const [result, setResult] = useState<{ fixed: number; skipped: number; errors: string[] } | null>(null);
  const [running, setRunning] = useState(false);

  if (loading) return <div>Loading...</div>;
  if (!user || user.role !== "main-admin") {
    return <div className="p-8 text-center">Access denied. Main-admins only.</div>;
  }

  async function handleFix() {
    setRunning(true);
    setResult(null);
    let fixed = 0, skipped = 0, errors: string[] = [];
    try {
      const q = query(collection(firestore, "users"), where("schoolId", "==", user.schoolId));
      const snap = await getDocs(q);
      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        if (typeof data.role === "string" && data.role !== data.role.toLowerCase()) {
          try {
            await updateDoc(doc(firestore, "users", docSnap.id), { role: data.role.toLowerCase() });
            fixed++;
          } catch (err: any) {
            errors.push(`Failed for ${data.email}: ${err.message}`);
          }
        } else {
          skipped++;
        }
      }
    } catch (err: any) {
      errors.push(err.message || "Unknown error");
    }
    setResult({ fixed, skipped, errors });
    setRunning(false);
  }

  return (
    <div className="p-8 max-w-lg mx-auto">
      <Card>
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold mb-4">Fix User Roles to Lowercase</h1>
          <p className="mb-4 text-muted-foreground">This will update all user roles in your school to lowercase (e.g., Student → student). Only main-admins can run this.</p>
          <Button onClick={handleFix} disabled={running}>{running ? "Fixing..." : "Fix Roles"}</Button>
          {result && (
            <div className="mt-4">
              <div className="text-green-600">Fixed: {result.fixed}</div>
              <div className="text-muted-foreground">Skipped (already lowercase): {result.skipped}</div>
              {result.errors.length > 0 && (
                <ul className="text-xs text-red-500 mt-2 list-disc ml-4">
                  {result.errors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 