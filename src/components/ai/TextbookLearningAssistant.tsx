import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BookOpen, FileText, Brain, Sparkles, Upload, Download } from "lucide-react";
import { toast } from "sonner";
import LanguageSelector from "./LanguageSelector";

interface TextbookLearningAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LEARNING_MODES = [
  { id: "summary", name: "Chapter Summary", description: "Generate a comprehensive summary of the chapter" },
  { id: "key-points", name: "Key Points", description: "Extract main concepts and key points" },
  { id: "questions", name: "Practice Questions", description: "Generate practice questions based on content" },
  { id: "flashcards", name: "Flashcards", description: "Create flashcards for important concepts" },
  { id: "explain", name: "Explain Concepts", description: "Get detailed explanations of complex topics" },
  { id: "examples", name: "Real Examples", description: "Find practical examples and applications" }
];

export default function TextbookLearningAssistant({ open, onOpenChange }: TextbookLearningAssistantProps) {
  const [textbookContent, setTextbookContent] = useState("");
  const [selectedMode, setSelectedMode] = useState("summary");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [fileName, setFileName] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setTextbookContent(text.substring(0, 5000)); // Limit to 5000 characters
        toast.success("Textbook content loaded!");
      };
      reader.readAsText(file);
    }
  };

  const handleGenerate = async () => {
    if (!textbookContent.trim()) {
      toast.error("Please upload textbook content first");
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const res = await fetch("/api/ai/textbook-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: textbookContent,
          mode: selectedMode,
          language: selectedLanguage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to generate content");
        return;
      }

      setResult(data.result);
      toast.success("Generated successfully!");
      
    } catch (error) {
      console.error("Textbook assistant error:", error);
      toast.error("Failed to connect to AI service");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedMode}-${fileName || 'textbook-content'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setTextbookContent("");
    setSelectedMode("summary");
    setSelectedLanguage("en");
    setResult("");
    setFileName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-500" />
            Textbook Learning Assistant
            <span className="text-sm font-normal text-muted-foreground">
              AI-powered textbook analysis and learning tools
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Textbook Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="textbook-file">Textbook File</Label>
                  <input
                    type="file"
                    accept=".txt,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                  {fileName && (
                    <p className="text-sm text-green-600">✓ {fileName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Or Paste Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Paste your textbook content here..."
                    value={textbookContent}
                    onChange={(e) => setTextbookContent(e.target.value)}
                    className="min-h-[200px] resize-none"
                    maxLength={5000}
                  />
                  <div className="text-xs text-muted-foreground text-right">
                    {textbookContent.length}/5000 characters
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Learning Mode
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Learning Mode</Label>
                  <Select value={selectedMode} onValueChange={setSelectedMode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose learning mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEARNING_MODES.map((mode) => (
                        <SelectItem key={mode.id} value={mode.id}>
                          <div>
                            <div className="font-medium">{mode.name}</div>
                            <div className="text-xs text-muted-foreground">{mode.description}</div>
                          </div>
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

                <Button 
                  onClick={handleGenerate} 
                  disabled={loading || !textbookContent.trim()}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate {LEARNING_MODES.find(m => m.id === selectedMode)?.name}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Output Section */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Generated Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm">{result}</pre>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleDownload} variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button onClick={handleReset} variant="outline" size="sm">
                        Start Over
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Upload textbook content and select a learning mode to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">💡 Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p>• Upload complete chapters for better results</p>
                <p>• Use "Chapter Summary" for quick overviews</p>
                <p>• "Practice Questions" helps with exam preparation</p>
                <p>• "Flashcards" are perfect for memorization</p>
                <p>• Choose your preferred language for explanations</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 