import { useEffect, useState } from "react";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SubjectsPanelProps {
  classId: string;
}

export default function SubjectsPanel({ classId }: SubjectsPanelProps) {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchSubjects() {
      setLoading(true);
      setError("");
      try {
        // 1. Get the class document
        const classRef = doc(firestore, "classes", classId);
        const classSnap = await getDoc(classRef);
        if (!classSnap.exists()) {
          setSubjects([]);
          setLoading(false);
          return;
        }
        const subjectCodes: string[] = classSnap.data().subjects || [];
        if (!subjectCodes.length) {
          setSubjects([]);
          setLoading(false);
          return;
        }
        // 2. Fetch subject details for those codes (Firestore 'in' queries limited to 10)
        const batches = [];
        for (let i = 0; i < subjectCodes.length; i += 10) {
          const batchCodes = subjectCodes.slice(i, i + 10);
          const q = query(
            collection(firestore, "subjects"),
            where("code", "in", batchCodes),
            orderBy("name")
          );
          batches.push(getDocs(q));
        }
        const results = await Promise.all(batches);
        const allSubjects = results.flatMap(snap =>
          snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as Record<string, any>) }))
        );
        // Sort by the order in subjectCodes
        allSubjects.sort(
          (a, b) => subjectCodes.indexOf(a.code) - subjectCodes.indexOf(b.code)
        );
        setSubjects(allSubjects);
      } catch (err: any) {
        setError(err.message || "Failed to load subjects.");
      } finally {
        setLoading(false);
      }
    }
    fetchSubjects();
  }, [classId]);

  if (loading) return <div>Loading subjects...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (subjects.length === 0) return <div>No subjects found.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {subjects.map(subject => (
        <Card key={subject.id} className="p-4 flex flex-col gap-2">
          <div className="text-lg font-semibold">{subject.name}</div>
          <div>
            <Badge variant="outline">{subject.code}</Badge>
          </div>
        </Card>
      ))}
    </div>
  );
} 