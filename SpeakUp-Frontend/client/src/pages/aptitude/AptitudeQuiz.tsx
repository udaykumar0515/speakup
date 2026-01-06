import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useCreateAptitudeResult } from "@/hooks/use-api";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const MOCK_QUESTIONS: Record<string, any[]> = {
  quantitative: [
    { id: 1, q: "If x + y = 10 and x - y = 4, what is the value of x?", options: ["6", "7", "8", "5"], correct: 1 },
    { id: 2, q: "What is 20% of 150?", options: ["25", "30", "35", "40"], correct: 1 },
    { id: 3, q: "A train moves at 60 km/h. How far does it go in 2.5 hours?", options: ["120 km", "150 km", "160 km", "100 km"], correct: 1 },
  ],
  logical: [
    { id: 1, q: "Look at this series: 2, 4, 8, 16, ... What number comes next?", options: ["24", "30", "32", "36"], correct: 2 },
    { id: 2, q: "SCD, TEF, UGH, ____, WKL", options: ["CMN", "UJI", "VIJ", "IJT"], correct: 2 },
    { id: 3, q: "Cup is to Coffee as Bowl is to ____?", options: ["Dish", "Soup", "Spoon", "Food"], correct: 1 },
  ],
  verbal: [
    { id: 1, q: "Select the synonym of: BRIEF", options: ["Long", "Short", "Small", "Detailed"], correct: 1 },
    { id: 2, q: "Find the correctly spelled word.", options: ["Occurence", "Occurrence", "Occurrance", "Occurance"], correct: 1 },
    { id: 3, q: "He ____ to the market yesterday.", options: ["go", "goes", "went", "gone"], correct: 2 },
  ],
};

interface Props {
  topic: string;
  onExit: () => void;
}

export default function AptitudeQuiz({ topic, onExit }: Props) {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  
  const createResult = useCreateAptitudeResult();
  const questions = MOCK_QUESTIONS[topic] || [];

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentIndex] = optionIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    const correctCount = questions.reduce((acc, q, idx) => {
      return acc + (selectedAnswers[idx] === q.correct ? 1 : 0);
    }, 0);

    const score = Math.round((correctCount / questions.length) * 100);

    try {
      // Save to backend
      if (user) {
        await createResult.mutateAsync({
          userId: user.id,
          topic,
          score,
          totalQuestions: questions.length,
          accuracy: score,
          timeTaken: 120, // Mock time
        });
      }
      setIsFinished(true);
    } catch (error) {
      // Error handled by hook or global interceptor usually, 
      // but we'll ensure state transitions correctly
      setIsFinished(true);
    }
  };

  if (isFinished) {
    const correctCount = questions.reduce((acc, q, idx) => {
      return acc + (selectedAnswers[idx] === q.correct ? 1 : 0);
    }, 0);
    const score = Math.round((correctCount / questions.length) * 100);

    return (
      <Layout>
        <div className="max-w-xl mx-auto bg-card border rounded-2xl p-8 text-center space-y-6">
          <h2 className="text-2xl font-bold">Quiz Complete!</h2>
          
          <div className="w-48 h-48 mx-auto">
            <CircularProgressbar 
              value={score} 
              text={`${score}%`} 
              styles={buildStyles({
                pathColor: score > 70 ? '#22c55e' : '#3b82f6',
                textColor: '#1e293b',
                trailColor: '#f1f5f9',
              })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-muted p-4 rounded-xl">
              <p className="text-xs text-muted-foreground uppercase font-bold">Total Questions</p>
              <p className="text-2xl font-bold">{questions.length}</p>
            </div>
            <div className="bg-muted p-4 rounded-xl">
              <p className="text-xs text-muted-foreground uppercase font-bold">Correct Answers</p>
              <p className="text-2xl font-bold text-green-600">{correctCount}</p>
            </div>
          </div>

          <div className="pt-4">
            <Button onClick={onExit} size="lg" className="w-full">Back to Topics</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold capitalize">{topic} Quiz</h2>
          <span className="text-sm font-medium bg-muted px-3 py-1 rounded-full">
            Question {currentIndex + 1} / {questions.length}
          </span>
        </div>

        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        <div className="bg-card border rounded-2xl p-8 shadow-sm">
          <h3 className="text-xl font-medium mb-8 leading-relaxed">
            {currentQuestion.q}
          </h3>

          <div className="space-y-3">
            {currentQuestion.options.map((option: string, idx: number) => {
              const isSelected = selectedAnswers[currentIndex] === idx;
              return (
                <div
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center justify-between ${
                    isSelected 
                      ? "border-primary bg-primary/5 shadow-md" 
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <span className={`font-medium ${isSelected ? "text-primary" : "text-foreground"}`}>
                    {option}
                  </span>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-primary" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between items-center pt-4">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
          >
            Previous
          </Button>
          <Button 
            onClick={handleNext} 
            disabled={selectedAnswers[currentIndex] === undefined}
          >
            {currentIndex === questions.length - 1 ? (
              createResult.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Finish Quiz"
            ) : "Next Question"}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
