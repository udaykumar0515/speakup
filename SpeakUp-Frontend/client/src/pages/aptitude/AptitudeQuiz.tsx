import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useCreateAptitudeResult, useAptitudeQuestions } from "@/hooks/use-api";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useToast } from "@/hooks/use-toast";

interface Props {
  topic: string;
  onExit: () => void;
}

export default function AptitudeQuiz({ topic, onExit }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  
  const createResult = useCreateAptitudeResult();
  const { data: questionsData, isLoading, error } = useAptitudeQuestions(topic);
  
  const questions = questionsData?.questions || [];

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
    // Calculate Score
    const correctCount = questions.reduce((acc, q, idx) => {
      // API returns 'correctAnswer' (0-indexed or 1-indexed? Assuming 0 based on mock logic but usually APIs are 0-indexed for arrays)
      // Mock had `correct: 1` which matched options array index.
      // Let's assume API `correctAnswer` matches the index in `options`.
      return acc + (selectedAnswers[idx] === q.correctAnswer ? 1 : 0);
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
          timeTaken: 120, // TODO: Track actual time if needed
        });
      }
      setIsFinished(true);
    } catch (err: any) {
      toast({ title: "Failed to save results", description: err.message, variant: "destructive" });
      setIsFinished(true); // Show result screen anyway
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error || !questionsData) {
    return (
        <Layout>
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <p className="text-destructive font-medium">Failed to load questions.</p>
                <Button onClick={onExit}>Go Back</Button>
            </div>
        </Layout>
    );
  }

  if (isFinished) {
    const correctCount = questions.reduce((acc, q, idx) => {
      return acc + (selectedAnswers[idx] === q.correctAnswer ? 1 : 0);
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
            {currentQuestion.question}
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
