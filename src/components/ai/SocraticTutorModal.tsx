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
  const [conversationHistory, setConversationHistory] = useState<Array<{type: 'student' | 'tutor', message: string}>>([]);
  const [isConversationMode, setIsConversationMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) {
      toast.error("Please enter your question");
      return;
    }

    const studentMessage = question.trim();
    setLoading(true);

    // Add student message to conversation
    const newHistory = [...conversationHistory, { type: 'student' as const, message: studentMessage }];
    setConversationHistory(newHistory);

    try {
      const res = await fetch("/api/ai/socratic-tutor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: studentMessage,
          subject,
          grade,
          conversationHistory: newHistory.slice(-4), // Send last 4 messages for context
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to get response");
        return;
      }

      const tutorMessage = data.response;
      
      // Add tutor response to conversation
      setConversationHistory([...newHistory, { type: 'tutor' as const, message: tutorMessage }]);
      setIsConversationMode(true);
      
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
    setConversationHistory([]);
    setIsConversationMode(false);
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
                    {isConversationMode ? "Continue Conversation" : "Get Socratic Guidance"}
                  </>
                )}
              </Button>
              
              {conversationHistory.length > 0 && (
                <Button type="button" variant="outline" onClick={handleReset}>
                  Start New Conversation
                </Button>
              )}
            </div>

          </form>

          {/* Chat Interface */}
          {conversationHistory.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-blue-500" />
                <h3 className="font-semibold">Conversation</h3>
              </div>
              
              {/* Chat Messages */}
              <div className="max-h-96 overflow-y-auto space-y-3 p-4 bg-gray-50 rounded-lg">
                {conversationHistory.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.type === 'student' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.type === 'student'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      <div className="text-sm">
                        {message.message.split('\n').map((line, lineIndex) => (
                          <p key={lineIndex} className="mb-2 last:mb-0">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm text-gray-600">Tutor is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
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