import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mic, Send, Bot, User, BadgeInfo, CheckCircle2, HelpCircle, ShieldCheck } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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

export default function MockInterview() {
  const [config, setConfig] = useState<InterviewState | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showTeachMe, setShowTeachMe] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("interview_setup");
    if (saved) {
      const parsed = JSON.parse(saved) as InterviewState;
      setConfig(parsed);
      setMessages([
        { 
          role: 'bot', 
          text: `Welcome to your ${parsed.interviewType.replace("-", " ")} interview${parsed.jobRole ? ` for the ${parsed.jobRole} role` : ""}. I've prepared 10 questions for you. Let's start with: Tell me about your background.` 
        }
      ] as Message[]);
    }
  }, []);

  const handleSend = () => {
    if (!input.trim() || isProcessing) return;
    
    const userMsg = input;
    const updatedMessages: Message[] = [...messages, { role: 'user', text: userMsg } as Message];
    setMessages(updatedMessages);
    setInput("");
    setIsProcessing(true);

    // After 10 questions (5 user answers for this simple mock), end the interview
    const userAnswersCount = updatedMessages.filter(m => m.role === 'user').length;
    
    setTimeout(() => {
      if (userAnswersCount >= 10) {
        setIsFinished(true);
      } else {
        const botResponse = `Question ${userAnswersCount + 1}: How would you handle a high-pressure situation in this role?`;
        setMessages(prev => [...prev, { role: 'bot', text: botResponse } as Message]);
      }
      setIsProcessing(false);
    }, 1000);
  };

  if (isFinished) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Interview Summary</h1>
            <p className="text-muted-foreground">Review your performance and areas for improvement.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Communication', score: 85, color: 'text-blue-600' },
              { label: 'Technical', score: 78, color: 'text-emerald-600' },
              { label: 'Confidence', score: 92, color: 'text-purple-600' },
              { label: 'Overall', score: 84, color: 'text-primary' },
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
              <p className="text-sm leading-relaxed">
                Your performance across the 10 questions was strong. You demonstrated clear technical knowledge and good communication skills. To improve further, focus on structuring your behavioral answers using the STAR method and providing more specific metrics for your achievements.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-xl font-bold px-1">Per-Question Review</h2>
            {messages.filter(m => m.role === 'bot').map((msg, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="p-4 bg-muted/30 border-b flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Question {i + 1}</span>
                  <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">Excellent Response</Badge>
                </div>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-muted-foreground">QUESTION</p>
                    <p className="text-sm font-medium">{msg.text}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-muted-foreground">YOUR ANSWER</p>
                    <p className="text-sm italic">"{messages.find((m, idx) => m.role === 'user' && idx > messages.indexOf(msg))?.text || "No answer recorded"}"</p>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowTeachMe(true)}>
                      <HelpCircle className="w-4 h-4" />
                      Teach Me
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center pt-4">
            <Button onClick={() => window.location.href = "/interview"} size="lg" className="px-8 font-bold">Start New Session</Button>
          </div>

          <Dialog open={showTeachMe} onOpenChange={setShowTeachMe}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>AI Coaching</DialogTitle>
                <DialogDescription>
                  This will later generate coaching explanation and model answers based on your specific response.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 flex justify-center">
                <Button onClick={() => setShowTeachMe(false)}>Got it</Button>
              </div>
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
              {messages.map((msg, idx) => (
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
              ))}
              {isProcessing && (
                <div className="flex gap-2 items-center text-muted-foreground text-[10px] pl-12 font-medium">
                  AI is thinking...
                </div>
              )}
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
              />
              <Button onClick={handleSend} disabled={!input.trim() || isProcessing} size="icon">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
