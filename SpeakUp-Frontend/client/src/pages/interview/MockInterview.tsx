import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mic, Send, Bot, User, BadgeInfo, CheckCircle2, HelpCircle, ShieldCheck, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useStartInterview, useSubmitInterviewAnswer, useInterviewTeachMe, useCreateInterviewResult } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";

type Message = {
  role: 'bot' | 'user';
  text: string;
};

type InterviewState = {
  interviewType: string;
  jobRole?: string;
  resumeText?: string;
  useResume: boolean;
  adaptiveDifficultyEnabled: boolean;
};

type InterviewSummary = {
  communicationScore: number;
  technicalScore: number;
  confidenceScore: number;
  overallScore: number;
  feedback: string;
};

export default function MockInterview() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // API Mutations
  const startInterview = useStartInterview();
  const submitAnswer = useSubmitInterviewAnswer();
  const teachMe = useInterviewTeachMe();

  // State
  const [config, setConfig] = useState<InterviewState | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [questionNumber, setQuestionNumber] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [summary, setSummary] = useState<InterviewSummary | null>(null);
  
  // Teach Me State
  const [showTeachMe, setShowTeachMe] = useState(false);
  const [teachMeContent, setTeachMeContent] = useState<{coaching: string, modelAnswer: string, tips: string[]} | null>(null);
  const [teachMeLoading, setTeachMeLoading] = useState(false);
  
  // Auto-scroll
  const tempScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tempScrollRef.current) {
      tempScrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Initialize Session
  useEffect(() => {
    const initSession = async () => {
      const saved = sessionStorage.getItem("interview_setup");
      if (saved && !sessionId) {
        const parsed = JSON.parse(saved) as InterviewState;
        setConfig(parsed);

        try {
          const res = await startInterview.mutateAsync({
            userId: user?.id || 1, // Fallback for safety, though user should be logged in
            interviewType: parsed.interviewType,
            jobRole: parsed.jobRole,
            useResume: parsed.useResume,
            resumeText: parsed.resumeText,
            adaptiveDifficultyEnabled: parsed.adaptiveDifficultyEnabled
          });

          setSessionId(res.sessionId);
          setMessages([{ role: 'bot', text: res.firstQuestion }]);
          setQuestionNumber(1);
        } catch (err: any) {
          toast({ title: "Error starting interview", description: err.message, variant: "destructive" });
        }
      }
    };

    initSession();
  }, [user]); // Run once when user is available

  const createInterviewResult = useCreateInterviewResult(); // Add Hook

  const handleSend = async () => {
    if (!input.trim() || submitAnswer.isPending || !sessionId) return;
    
    const userMsg = input;
    // Optimistic update
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput("");

    try {
      const res = await submitAnswer.mutateAsync({
        sessionId,
        userId: user?.id || 1,
        answer: userMsg,
        questionNumber
      });

      if (res.isComplete && res.summary) {
        setSummary(res.summary);
        
        // Save Result to History
        await createInterviewResult.mutateAsync({
            userId: user?.id || 1,
            communicationScore: res.summary.communicationScore,
            confidenceScore: res.summary.confidenceScore,
            relevanceScore: res.summary.technicalScore, // Mapping technical to relevance
            feedback: res.summary.feedback
        });

        setIsFinished(true);
      } else if (res.nextQuestion) {
        setMessages(prev => [...prev, { role: 'bot', text: res.nextQuestion! }]);
        setQuestionNumber(res.questionNumber || questionNumber + 1);
      }
    } catch (err: any) {
      toast({ title: "Failed to send answer", description: err.message, variant: "destructive" });
    }
  };

  const handleTeachMe = async (questionText: string, userAnswer: string) => {
    if (!sessionId) return;
    setShowTeachMe(true);
    setTeachMeLoading(true);
    setTeachMeContent(null);

    try {
      const res = await teachMe.mutateAsync({
        sessionId,
        questionNumber, // Note: This might need logic to track which question was clicked if we support "Teach Me" for past questions. For now, assuming current context.
        question: questionText,
        userAnswer
      });
      setTeachMeContent(res);
    } catch (err: any) {
      toast({ title: "Could not get coaching", description: err.message, variant: "destructive" });
      setShowTeachMe(false);
    } finally {
      setTeachMeLoading(false);
    }
  };

  if (isFinished && summary) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Interview Summary</h1>
            <p className="text-muted-foreground">Review your performance and areas for improvement.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Communication', score: summary.communicationScore, color: 'text-blue-600' },
              { label: 'Technical', score: summary.technicalScore, color: 'text-emerald-600' },
              { label: 'Confidence', score: summary.confidenceScore, color: 'text-purple-600' },
              { label: 'Overall', score: summary.overallScore, color: 'text-primary' },
            ].map((metric) => (
              <Card key={metric.label} className="border-none shadow-sm bg-white">
                <CardContent className="pt-6 text-center">
                  <div className={`text-3xl font-bold mb-1 ${metric.color}`}>
                    {metric.score}%
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{metric.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Overall Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{summary.feedback}</p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-xl font-bold px-1">Per-Question Review</h2>
            {/* Note: In a real app we'd fetch the full history here. For now using local messages state */}
            {messages.filter(m => m.role === 'bot').map((msg, i) => {
              const userMsg = messages.find((m, idx) => m.role === 'user' && idx > messages.indexOf(msg));
              return (
                <Card key={i} className="overflow-hidden">
                  <div className="p-4 bg-muted/30 border-b flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Question {i + 1}</span>
                  </div>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-muted-foreground">QUESTION</p>
                      <p className="text-sm font-medium">{msg.text}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-muted-foreground">YOUR ANSWER</p>
                      <p className="text-sm italic">"{userMsg?.text || "No answer recorded"}"</p>
                    </div>
                    <div className="pt-2 flex justify-end">
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => handleTeachMe(msg.text, userMsg?.text || "")}>
                        <HelpCircle className="w-4 h-4" />
                        Teach Me
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-center pt-4">
            <Button onClick={() => window.location.href = "/interview"} size="lg" className="px-8 font-bold">Start New Session</Button>
          </div>

          {/* Teach Me Dialog Reuse */}
          <Dialog open={showTeachMe} onOpenChange={setShowTeachMe}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>AI Coaching</DialogTitle>
                <DialogDescription>Specific feedback on this response.</DialogDescription>
              </DialogHeader>
              {teachMeLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>
              ) : teachMeContent ? (
                <div className="space-y-4 py-2">
                  <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                    <p className="font-bold mb-1">Coach's Insight:</p>
                    {teachMeContent.coaching}
                  </div>
                  <div>
                    <p className="text-sm font-bold mb-2">Model Answer:</p>
                    <p className="text-sm bg-muted p-3 rounded border italic">{teachMeContent.modelAnswer}</p>
                  </div>
                  {teachMeContent.tips.length > 0 && (
                    <div>
                      <p className="text-sm font-bold mb-2">Tips:</p>
                      <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
                        {teachMeContent.tips.map((tip, idx) => <li key={idx}>{tip}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}
            </DialogContent>
          </Dialog>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col px-4">
        <div className="flex justify-between items-end mb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Mock Interview</h1>
            {config && (
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="capitalize">
                  {config.interviewType.replace("-", " ")} {config.jobRole && `- ${config.jobRole}`}
                </Badge>
                {config.useResume && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1 text-[10px]">
                    <CheckCircle2 className="w-3 h-3" />
                    Resume-aware
                  </Badge>
                )}
                {config.adaptiveDifficultyEnabled && (
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 gap-1 text-[10px]">
                    <ShieldCheck className="w-3 h-3" />
                    Adaptive
                  </Badge>
                )}
              </div>
            )}
          </div>
          <Button variant="destructive" size="sm" onClick={() => setIsFinished(true)}>End Interview</Button>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden shadow-lg border-border/50">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {startInterview.isPending ? (
                <div className="flex items-center justify-center h-full text-muted-foreground gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating interview questions...
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'bot' && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : 'bg-muted text-foreground rounded-tl-none border'
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-muted border flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))
              )}
              {submitAnswer.isPending && (
                <div className="flex gap-2 items-center text-muted-foreground text-[10px] pl-12 font-medium">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  AI is analyzing your response...
                </div>
              )}
              <div ref={tempScrollRef} />
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t bg-muted/30">
            <div className="flex gap-2">
              <Input 
                placeholder="Type your answer..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="bg-white shadow-sm"
                disabled={submitAnswer.isPending || startInterview.isPending}
              />
              <Button onClick={handleSend} disabled={!input.trim() || submitAnswer.isPending || startInterview.isPending} size="icon">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Inline Teach Me Dialog for active session */}
      <Dialog open={showTeachMe} onOpenChange={setShowTeachMe}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI Coaching</DialogTitle>
            <DialogDescription>Getting feedback...</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center p-8">
             <Loader2 className="animate-spin w-8 h-8 text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
