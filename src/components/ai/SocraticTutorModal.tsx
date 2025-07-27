import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, MessageCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface SocraticTutorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "History",
  "Geography",
  "Computer Science",
  "Economics",
  "Psychology",
  "General"
];

const GRADES = [
  "Elementary School",
  "Middle School", 
  "High School",
  "College"
];

export default function SocraticTutorModal({ open, onOpenChange }: SocraticTutorModalProps) {
  const [question, setQuestion] = useState("");
  const [subject, setSubject] = useState("General");
  const [grade, setGrade] = useState("High School");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [remainingRequests, setRemainingRequests] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) {
      toast.error("Please enter your question");
      return;
    }

    setLoading(true);
    setResponse("");

    try {
      const res = await fetch("/api/ai/socratic-tutor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: question.trim(),
          subject,
          grade,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          toast.error(`Rate limit exceeded. Please wait before trying again.`);
        } else {
          toast.error(data.error || "Failed to get response");
        }
        return;
      }

      setResponse(data.response);
      setRemainingRequests(data.remaining);
      toast.success("Got your Socratic guidance!");
      
    } catch (error) {
      console.error("Socratic tutor error:", error);
      toast.error("Failed to connect to AI service");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setQuestion("");
    setResponse("");
    setRemainingRequests(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-500" />
            Socratic Tutor
            <span className="text-sm font-normal text-muted-foreground">
              Get step-by-step guidance
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((subj) => (
                      <SelectItem key={subj} value={subj}>
                        {subj}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade">Grade Level</Label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADES.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="question">Your Question</Label>
              <Textarea
                id="question"
                placeholder="Ask me anything! I'll guide you to discover the answer yourself..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="min-h-[120px] resize-none"
                maxLength={1000}
              />
              <div className="text-xs text-muted-foreground text-right">
                {question.length}/1000 characters
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading || !question.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Getting Guidance...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Get Socratic Guidance
                  </>
                )}
              </Button>
              
              {response && (
                <Button type="button" variant="outline" onClick={handleReset}>
                  Ask New Question
                </Button>
              )}
            </div>

            {remainingRequests !== null && (
              <div className="text-xs text-muted-foreground">
                Requests remaining: {remainingRequests}
              </div>
            )}
          </form>

          {/* Response Display */}
          {response && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-blue-500" />
                <h3 className="font-semibold">Socratic Guidance</h3>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="prose prose-sm max-w-none">
                  {response.split('\n').map((line, index) => {
                    // Handle numbered sections (1. Acknowledging their question warmly)
                    if (/^\d+\.\s+[A-Za-z\s]+:/.test(line)) {
                      return (
                        <h4 key={index} className="text-base font-semibold mt-4 mb-2 text-blue-600">
                          {line}
                        </h4>
                      );
                    }
                    // Handle bullet points
                    if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
                      return (
                        <li key={index} className="ml-4 mb-1">
                          {line.trim().substring(1).trim()}
                        </li>
                      );
                    }
                    // Regular paragraphs
                    if (line.trim()) {
                      return <p key={index} className="mb-3 leading-relaxed">{line}</p>;
                    }
                    // Empty lines
                    return <br key={index} />;
                  })}
                </div>
              </div>

              <div className="text-xs text-muted-foreground bg-green-50 p-3 rounded-lg border border-green-200">
                <strong>💡 Tip:</strong> This is a conversational tutor! Feel free to ask follow-up questions or ask for clarification. 
                The tutor will guide you step by step to discover answers yourself.
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 