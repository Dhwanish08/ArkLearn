import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, RotateCcw, ChevronLeft, ChevronRight, Check, X } from "lucide-react";

interface Flashcard {
  id: string;
  subject: string;
  front: string;
  back: string;
  mastered: boolean;
}

export default function Flashcards() {
  const [cards, setCards] = useState<Flashcard[]>([
    {
      id: "1",
      subject: "Mathematics",
      front: "What is the quadratic formula?",
      back: "x = (-b ± √(b² - 4ac)) / 2a",
      mastered: false
    },
    {
      id: "2",
      subject: "Physics",
      front: "What are Newton's three laws of motion?",
      back: "1. An object at rest stays at rest unless acted upon by a force. 2. Force equals mass times acceleration. 3. For every action, there is an equal and opposite reaction.",
      mastered: false
    },
    {
      id: "3",
      subject: "Chemistry",
      front: "What is the chemical formula for water?",
      back: "H₂O",
      mastered: true
    }
  ]);

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [newCard, setNewCard] = useState({
    subject: "",
    front: "",
    back: ""
  });

  const subjects = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "History"];

  const addCard = () => {
    if (!newCard.subject || !newCard.front || !newCard.back) {
      return;
    }

    const card: Flashcard = {
      id: Date.now().toString(),
      subject: newCard.subject,
      front: newCard.front,
      back: newCard.back,
      mastered: false
    };

    setCards([...cards, card]);
    setNewCard({ subject: "", front: "", back: "" });
  };

  const deleteCard = (id: string) => {
    setCards(cards.filter(card => card.id !== id));
    if (currentCardIndex >= cards.length - 1) {
      setCurrentCardIndex(Math.max(0, cards.length - 2));
    }
  };

  const toggleMastered = (id: string) => {
    setCards(cards.map(card => 
      card.id === id ? { ...card, mastered: !card.mastered } : card
    ));
  };

  const nextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
      setShowAnswer(false);
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
      setShowAnswer(false);
    }
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const currentCard = cards[currentCardIndex];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text mb-2">Flashcards</h1>
        <p className="text-muted-foreground">Create and study flashcards for any subject</p>
      </div>

      {/* Add New Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Flashcard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Select value={newCard.subject} onValueChange={(value) => setNewCard({...newCard, subject: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="front">Front (Question)</Label>
              <Input
                id="front"
                placeholder="Enter question or term"
                value={newCard.front}
                onChange={(e) => setNewCard({...newCard, front: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="back">Back (Answer)</Label>
              <Input
                id="back"
                placeholder="Enter answer or definition"
                value={newCard.back}
                onChange={(e) => setNewCard({...newCard, back: e.target.value})}
              />
            </div>
          </div>
          <Button onClick={addCard} className="mt-4">
            Add Card
          </Button>
        </CardContent>
      </Card>

      {/* Study Area */}
      {cards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Study Cards ({currentCardIndex + 1} of {cards.length})</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleMastered(currentCard.id)}
                  className={currentCard?.mastered ? "bg-green-100 text-green-700" : ""}
                >
                  {currentCard?.mastered ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  {currentCard?.mastered ? "Mastered" : "Mark Mastered"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteCard(currentCard.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Delete
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="relative w-full max-w-md">
                {/* Flashcard */}
                <div
                  className={`w-full h-64 border-2 rounded-lg cursor-pointer transition-all duration-500 transform ${
                    isFlipped ? 'rotate-y-180' : ''
                  }`}
                  onClick={flipCard}
                >
                  <div className={`w-full h-full p-6 flex items-center justify-center text-center ${
                    isFlipped ? 'hidden' : 'block'
                  }`}>
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">{currentCard?.subject}</div>
                      <div className="text-lg font-medium">{currentCard?.front}</div>
                      <div className="text-xs text-muted-foreground mt-4">Click to flip</div>
                    </div>
                  </div>
                  <div className={`w-full h-full p-6 flex items-center justify-center text-center bg-blue-50 ${
                    isFlipped ? 'block' : 'hidden'
                  }`}>
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Answer</div>
                      <div className="text-lg">{currentCard?.back}</div>
                      <div className="text-xs text-muted-foreground mt-4">Click to flip back</div>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={prevCard}
                    disabled={currentCardIndex === 0}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsFlipped(false);
                      setShowAnswer(false);
                    }}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                  <Button
                    variant="outline"
                    onClick={nextCard}
                    disabled={currentCardIndex === cards.length - 1}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card List */}
      <Card>
        <CardHeader>
          <CardTitle>All Cards ({cards.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {cards.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No flashcards created yet</p>
          ) : (
            <div className="space-y-3">
              {cards.map((card, index) => (
                <div
                  key={card.id}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${
                    index === currentCardIndex ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setCurrentCardIndex(index)}
                >
                  <div>
                    <div className="font-medium">{card.front}</div>
                    <div className="text-sm text-muted-foreground">{card.subject}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {card.mastered && (
                      <div className="text-green-500">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCard(card.id);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 