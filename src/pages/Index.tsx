import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Button } from "@/components/ui/button";

const features = [
  {
    title: "AI Socratic Tutor",
    description: "Get step-by-step help from our AI tutor for any subject."
  },
  {
    title: "Smart Flashcards",
    description: "Auto-generate flashcards from your study materials."
  },
  {
    title: "Adaptive Quizzes",
    description: "Take quizzes that adapt to your learning pace."
  },
  {
    title: "Progress Tracking",
    description: "Monitor your learning progress with detailed analytics."
  }
];

export default function IndexPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/dashboard", { replace: true });
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-500 flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center text-white py-24 px-4">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4 text-center drop-shadow-lg">
          Learn Smarter with <span className="text-white/90">AI-Powered Education</span>
        </h1>
        <p className="text-lg md:text-2xl mb-8 text-center max-w-2xl text-white/80">
          Join thousands of students using our interactive platform to master any subject with personalized AI tutoring, smart flashcards, and adaptive quizzes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="px-8 py-4 text-lg font-semibold shadow-xl bg-white/30 backdrop-blur-md hover:bg-white/40 text-white border border-white/40 transition"
            onClick={() => navigate("/login")}
          >
            Get Started &rarr;
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="px-8 py-4 text-lg font-semibold bg-white/80 text-blue-700 hover:bg-white/90 border border-white/0 shadow"
            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
          >
            Learn More
          </Button>
        </div>
      </div>
      {/* Feature List */}
      <div className="bg-white py-12 px-4 shadow-inner rounded-t-3xl">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="p-6 rounded-xl bg-slate-50 shadow hover:shadow-lg transition-all">
              <h3 className="text-xl font-bold mb-2 text-blue-700">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
