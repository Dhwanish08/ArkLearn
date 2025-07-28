import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, MessageCircle, Sparkles, BookOpen, Upload } from "lucide-react";
import { toast } from "sonner";
import LanguageSelector, { SUPPORTED_LANGUAGES } from "./LanguageSelector";

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
  "Gujarati",
  "Hindi",
  "Sanskrit",
  "General"
];

const GRADES = [
  "Elementary School",
  "Middle School", 
  "High School",
  "College"
];

const TEXTBOOK_CHAPTERS = {
  "Mathematics": [
    "Chapter 1: Number Systems",
    "Chapter 2: Algebra",
    "Chapter 3: Geometry",
    "Chapter 4: Trigonometry",
    "Chapter 5: Calculus",
    "Chapter 6: Statistics"
  ],
  "Physics": [
    "Chapter 1: Mechanics",
    "Chapter 2: Thermodynamics",
    "Chapter 3: Waves",
    "Chapter 4: Electricity",
    "Chapter 5: Magnetism",
    "Chapter 6: Modern Physics"
  ],
  "Chemistry": [
    "Chapter 1: Atomic Structure",
    "Chapter 2: Chemical Bonding",
    "Chapter 3: States of Matter",
    "Chapter 4: Chemical Reactions",
    "Chapter 5: Organic Chemistry",
    "Chapter 6: Analytical Chemistry"
  ],
  "Biology": [
    "Chapter 1: Cell Biology",
    "Chapter 2: Genetics",
    "Chapter 3: Evolution",
    "Chapter 4: Ecology",
    "Chapter 5: Human Physiology",
    "Chapter 6: Plant Biology"
  ],
  "English": [
    "Chapter 1: Grammar Fundamentals",
    "Chapter 2: Literature Analysis",
    "Chapter 3: Writing Skills",
    "Chapter 4: Reading Comprehension",
    "Chapter 5: Vocabulary Building",
    "Chapter 6: Communication Skills"
  ],
  "Gujarati": [
    "Chapter 1: વ્યાકરણ મૂળભૂત",
    "Chapter 2: સાહિત્ય વિશ્લેષણ",
    "Chapter 3: લેખન કૌશલ્ય",
    "Chapter 4: વાંચન સમજ",
    "Chapter 5: શબ્દભંડોળ",
    "Chapter 6: સંવાદ કૌશલ્ય"
  ],
  "Hindi": [
    "Chapter 1: व्याकरण मूलभूत",
    "Chapter 2: साहित्य विश्लेषण",
    "Chapter 3: लेखन कौशल",
    "Chapter 4: पठन समझ",
    "Chapter 5: शब्दभंडार",
    "Chapter 6: संवाद कौशल"
  ],
  "Sanskrit": [
    "Chapter 1: संस्कृत व्याकरण",
    "Chapter 2: वेद और उपनिषद",
    "Chapter 3: संस्कृत साहित्य",
    "Chapter 4: श्लोक और मंत्र",
    "Chapter 5: संस्कृत भाषा कौशल",
    "Chapter 6: वैदिक ज्ञान"
  ]
};

export default function SocraticTutorModal({ open, onOpenChange }: SocraticTutorModalProps) {
  const [question, setQuestion] = useState("");
  const [subject, setSubject] = useState("General");
  const [grade, setGrade] = useState("High School");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [textbookContext, setTextbookContext] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
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
          chapter: selectedChapter,
          textbookContext,
          language: selectedLanguage,
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
    setSelectedChapter("");
    setTextbookContext("");
    setSelectedLanguage("en");
  };

  const handleTextbookUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setTextbookContext(text.substring(0, 2000)); // Limit to 2000 characters
        toast.success("Textbook context loaded!");
      };
      reader.readAsText(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-500" />
            Socratic Tutor
            <span className="text-sm font-normal text-muted-foreground">
              Get step-by-step guidance with textbook context
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select value={subject} onValueChange={(value) => {
                  setSubject(value);
                  setSelectedChapter("");
                }}>
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

              <div className="space-y-2">
                <Label htmlFor="chapter">Textbook Chapter</Label>
                <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select chapter (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No specific chapter</SelectItem>
                    {TEXTBOOK_CHAPTERS[subject as keyof typeof TEXTBOOK_CHAPTERS]?.map((chapter) => (
                      <SelectItem key={chapter} value={chapter}>
                        {chapter}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <LanguageSelector
                selectedLanguage={selectedLanguage}
                onLanguageChange={setSelectedLanguage}
                showLabel={true}
              />
            </div>

            {/* Textbook Context Upload */}
            <div className="space-y-2">
              <Label htmlFor="textbook-context" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Textbook Context (Optional)
              </Label>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept=".txt,.pdf,.doc,.docx"
                  onChange={handleTextbookUpload}
                  className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => setTextbookContext("")}>
                  Clear
                </Button>
              </div>
              {textbookContext && (
                <div className="p-3 bg-blue-50 rounded-md text-sm">
                  <strong>Loaded context:</strong> {textbookContext.substring(0, 100)}...
                </div>
              )}
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
                The tutor will guide you step by step to discover answers yourself. {selectedChapter && `Currently focused on: ${selectedChapter}`}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 