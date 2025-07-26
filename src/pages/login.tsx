import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Form, FormItem, FormLabel, FormControl, FormMessage, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { auth, firestore } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, User, Lock, School as SchoolIcon } from "lucide-react";

export default function LoginPage() {
  const [step, setStep] = useState<"school" | "login">("school");
  const [schools, setSchools] = useState<any[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<any>(null);
  const [mainAdminEmail, setMainAdminEmail] = useState<string>("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  // Fetch schools from Firestore
  useEffect(() => {
    async function fetchSchools() {
      const snap = await getDocs(collection(firestore, "schools"));
      setSchools(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
    fetchSchools();
  }, []);

  // Fetch main admin email for selected school
  useEffect(() => {
    async function fetchMainAdminEmail() {
      if (!selectedSchool) return;
      const q = query(
        collection(firestore, "users"),
        where("schoolId", "==", selectedSchool.id),
        where("role", "==", "main-admin")
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setMainAdminEmail(snap.docs[0].data().email);
      } else {
        setMainAdminEmail("");
      }
    }
    fetchMainAdminEmail();
  }, [selectedSchool]);

  // Login form
  const form = useForm({ defaultValues: { userIdOrEmail: "", password: "" } });

  async function onSubmit(values: { userIdOrEmail: string; password: string }) {
    setError("");
    setLoading(true);
    try {
      // Find user by school and userId or email
      const q1 = query(
        collection(firestore, "users"),
        where("schoolId", "==", selectedSchool.id),
        where("userId", "==", values.userIdOrEmail)
      );
      const q2 = query(
        collection(firestore, "users"),
        where("schoolId", "==", selectedSchool.id),
        where("email", "==", values.userIdOrEmail)
      );
      let snap = await getDocs(q1);
      if (snap.empty) {
        snap = await getDocs(q2);
      }
      if (snap.empty) {
        setError("User not found for this school. Check your ID or email.");
        setLoading(false);
        return;
      }
      const userDoc = snap.docs[0];
      const user = userDoc.data();
      await signInWithEmailAndPassword(auth, user.email, values.password);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-indigo-200">
      <div className="absolute top-8 left-0 w-full flex justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-primary mb-1">ArkLearn</h1>
          <p className="text-lg text-muted-foreground">AI-Powered Education Management</p>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-start py-32 px-4">
        <Card className="w-full max-w-xl shadow-2xl rounded-2xl p-0">
          {step === "school" ? (
            <CardContent className="py-12 px-10">
              <h2 className="text-2xl font-bold mb-2 text-center">Select Your School</h2>
              <p className="text-muted-foreground mb-8 text-center">Choose your institution to continue</p>
              <div className="space-y-4 mb-6">
                {schools
                  .filter(school => school.name.toLowerCase().includes(search.toLowerCase()))
                  .map(school => (
                    <button
                      key={school.id}
                      type="button"
                      className={`w-full flex items-center gap-4 p-5 rounded-xl border transition shadow-sm text-left
                        ${selectedSchool?.id === school.id
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-slate-200 bg-white hover:bg-slate-50'}
                      `}
                      onClick={() => setSelectedSchool(school)}
                    >
                      <span className="flex items-center justify-center w-12 h-12 rounded-lg bg-slate-100">
                        <SchoolIcon className="w-7 h-7 text-slate-500" />
                      </span>
                      <span>
                        <div className="font-semibold text-lg leading-tight">{school.name}</div>
                        {school.location && (
                          <div className="text-sm text-muted-foreground">{school.location}</div>
                        )}
                      </span>
                    </button>
                  ))}
              </div>
              <input
                type="text"
                className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring text-base mb-4"
                placeholder="Or search for your school..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <Button
                className="w-full mt-2 text-lg py-3"
                disabled={!selectedSchool}
                onClick={() => setStep("login")}
              >
                Next
              </Button>
            </CardContent>
          ) : (
            <CardContent className="py-10 px-8">
              <div className="flex items-center gap-3 mb-4">
                <Button variant="ghost" size="icon" onClick={() => setStep("school")}>←</Button>
                <div className="flex items-center gap-2">
                  <SchoolIcon className="w-6 h-6 text-primary" />
                  <div>
                    <div className="font-semibold text-lg leading-tight">{selectedSchool?.name}</div>
                    {selectedSchool?.location && (
                      <div className="text-xs text-muted-foreground">{selectedSchool.location}</div>
                    )}
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
              <p className="text-muted-foreground mb-6">Sign in to your account</p>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="userIdOrEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username or Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><User className="w-4 h-4" /></span>
                            <Input type="text" placeholder="Enter your username or email" autoComplete="username" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><Lock className="w-4 h-4" /></span>
                            <Input type={showPassword ? "text" : "password"} placeholder="Enter your password" autoComplete="current-password" className="pl-10 pr-10" {...field} />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                              onClick={() => setShowPassword(v => !v)}
                              tabIndex={-1}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span></span>
                    <a href="#" className="text-primary hover:underline">Forgot password?</a>
                  </div>
                  {error && <div className="text-red-500 text-sm text-center">{error}</div>}
                  <Button type="submit" className="w-full mt-2" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                  <div className="mt-6 text-center text-muted-foreground text-sm">
                    {mainAdminEmail ? (
                      <a href={`mailto:${mainAdminEmail}`} className="text-primary hover:underline">Contact your school administrator</a>
                    ) : (
                      "Need help? Contact your school administrator"
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
