import { useState } from "react";
import { Bot, MessageCircle, Brain, FileText, Zap, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SocraticTutorModal from "@/components/ai/SocraticTutorModal";

interface AITool {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: string;
  isPopular?: boolean;
  gradient: string;
}

interface AIToolsPanelProps {
  onToolClick: (toolId: string) => void;
}

const AIToolsPanel = ({ onToolClick }: AIToolsPanelProps) => {
  const [socraticModalOpen, setSocraticModalOpen] = useState(false);

  const aiTools: AITool[] = [
    {
      id: "socratic-tutor",
      name: "Socratic Tutor",
      description: "Get step-by-step guidance for any question",
      icon: MessageCircle,
      category: "Learning",
      isPopular: true,
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      id: "flashcard-generator",
      name: "Flashcard Generator",
      description: "Create smart flashcards from any topic",
      icon: Brain,
      category: "Study",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      id: "quiz-generator",
      name: "Quiz Generator",
      description: "Generate practice quizzes instantly",
      icon: FileText,
      category: "Assessment",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      id: "grammar-assistant",
      name: "Grammar Assistant",
      description: "Improve your writing with AI feedback",
      icon: Zap,
      category: "Writing",
      gradient: "from-orange-500 to-red-500"
    },
    {
      id: "study-suggestions",
      name: "Smart Study Plan",
      description: "Personalized learning recommendations",
      icon: Sparkles,
      category: "Planning",
      isPopular: true,
      gradient: "from-indigo-500 to-purple-500"
    }
  ];

  return (
    <Card className="gradient-card shadow-elegant hover-lift">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-accent" />
          AI Learning Tools
          <Badge className="bg-accent/10 text-accent border-accent/20 animate-glow-pulse">
            Beta
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {aiTools.map((tool) => (
            <Button
              key={tool.id}
              variant="outline"
              onClick={() => {
                if (tool.id === "socratic-tutor") {
                  setSocraticModalOpen(true);
                } else {
                  onToolClick(tool.id);
                }
              }}
              className="h-auto p-4 justify-start hover-lift group relative overflow-hidden"
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-r ${tool.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
              
              <div className="flex items-start gap-3 relative z-10">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${tool.gradient} flex items-center justify-center shadow-md`}>
                  <tool.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{tool.name}</h4>
                    {tool.isPopular && (
                      <Badge className="bg-warning/10 text-warning border-warning/20 text-xs px-1.5 py-0.5">
                        Popular
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {tool.description}
                  </p>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {tool.category}
                  </Badge>
                </div>
              </div>
            </Button>
          ))}
        </div>

        {/* AI Tips */}
        <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-accent/5 to-purple-500/5 border border-accent/10">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">AI Tip</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Ask specific questions to get better results. Example: "Explain photosynthesis step by step" instead of just "photosynthesis"
          </p>
        </div>
      </CardContent>
      
      {/* Socratic Tutor Modal */}
      <SocraticTutorModal 
        open={socraticModalOpen} 
        onOpenChange={setSocraticModalOpen} 
      />
    </Card>
  );
};

export default AIToolsPanel;