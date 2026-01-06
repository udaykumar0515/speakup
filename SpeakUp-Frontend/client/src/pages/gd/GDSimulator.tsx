import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Clock, Send, MessageSquareText, ShieldAlert, UserCheck, Bot, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useStartGD, useSendGDMessage, useGDFeedback, useEndGD, useCreateGdResult } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";

type Chat = {
  speaker: string;
  text: string;
  isUser: boolean;
};

type BotProfile = {
  name: string;
  role: string;
  description: string; // "personality" in API
};

export default function GDSimulator() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // API Mutations
  const startGD = useStartGD();
  const sendMessage = useSendGDMessage();
  const getFeedback = useGDFeedback();
  const endGD = useEndGD();
  const createGdResult = useCreateGdResult();

  // State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [config, setConfig] = useState<{topic: string, difficulty: string} | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [timeLeft, setTimeLeft] = useState(600);
  const [chats, setChats] = useState<Chat[]>([]);
  const [input, setInput] = useState("");
  
  // Dynamic Bots
  const [bots, setBots] = useState<BotProfile[]>([]);
  
  // Feedback
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackContent, setFeedbackContent] = useState<string | null>(null);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);

  // Auto-scroll
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chats]);

  // Init Session
  useEffect(() => {
    const initSession = async () => {
      const saved = sessionStorage.getItem("gd_setup");
      if (saved && !sessionId) {
        const parsed = JSON.parse(saved);
        setConfig(parsed);
        
        try {
          const res = await startGD.mutateAsync({
            userId: user?.id || 1,
            topic: parsed.topic,
            difficulty: parsed.difficulty,
            duration: 600
          });
          
          setSessionId(res.sessionId);
          setBots(res.bots.map(b => ({
             name: b.name,
             role: b.role, 
             description: b.personality
          })));

          setChats([
            { speaker: "Moderator", text: res.moderatorMessage || `Topic: "${parsed.topic}". Difficulty: ${parsed.difficulty.toUpperCase()}. You may begin the discussion.`, isUser: false }
          ]);
        } catch (err: any) {
             toast({ title: "Failed to start GD", description: err.message, variant: "destructive" });
        }
      }
    };
    initSession();
  }, [user]);

  // Timer
  useEffect(() => {
    if (!isActive || timeLeft <= 0 || !sessionId) return;
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [isActive, timeLeft, sessionId]);

  const handleSend = async () => {
    if (!input.trim() || !sessionId || sendMessage.isPending) return;
    
    const userText = input;
    setChats(prev => [...prev, { speaker: "You", text: userText, isUser: true }]);
    setInput("");
    
    try {
      const res = await sendMessage.mutateAsync({
        sessionId,
        userId: user?.id || 1,
        message: userText
      });
      
      // Append bot messages
      if (res.botMessages && res.botMessages.length > 0) {
        // Add artificial delay for realism if desired, but for now direct append
        // Actually, let's stream them in or just add them.
        res.botMessages.forEach(msg => {
            setChats(prev => [...prev, { speaker: msg.speaker, text: msg.text, isUser: false }]);
        });
      }
    } catch (err: any) {
      toast({ title: "Error talking to bots", description: err.message, variant: "destructive" });
    }
  };

  const handleGetFeedback = async () => {
    if (!sessionId) return;
    setShowFeedback(true);
    setIsFeedbackLoading(true);
    setFeedbackContent(null);
    
    try {
      const res = await getFeedback.mutateAsync({
        sessionId,
        userId: user?.id || 1
      });
      setFeedbackContent(res.feedback);
    } catch (err: any) {
        setFeedbackContent("Could not retrieve feedback at this time.");
    } finally {
        setIsFeedbackLoading(false);
    }
  };

  const handleEnd = async () => {
    if (!sessionId) {
        setIsActive(false);
        return;
    }
    
    setIsActive(false);
    
    try {
        const res = await endGD.mutateAsync({
            sessionId,
            userId: user?.id || 1,
            userMessages: chats.filter(c => c.isUser).map(c => ({ text: c.text, timestamp: new Date().toISOString() }))
        });

        // Save result to history
        await createGdResult.mutateAsync({
            userId: user?.id || 1,
            topic: config?.topic || "Unknown",
            score: res.score,
            duration: 600 - timeLeft
        });
        
        toast({ title: "GD Session Ended", description: "Results saved to your profile." });
        // Redirect or show summary modal - keeping simple for now
    } catch (err: any) {
        toast({ title: "Error ending session", description: err.message, variant: "destructive" });
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col gap-6 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-card p-5 rounded-xl border shadow-sm gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="font-bold text-xl tracking-tight">{config?.topic || "Loading..."}</h2>
              <Badge variant={config?.difficulty === 'competitive' ? 'destructive' : config?.difficulty === 'moderate' ? 'default' : 'secondary'} className="uppercase text-[10px] h-5">
                {config?.difficulty || "level"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Users className="w-3 h-3" />
              Group Discussion: You + {bots.length || 3} AI Participants
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleGetFeedback} 
              className="flex-1 md:flex-none gap-2 border-primary/20 text-primary hover:bg-primary/5 font-semibold"
            >
              <MessageSquareText className="w-4 h-4" />
              Ask Moderator For Feedback
            </Button>
            <div className="flex items-center gap-2 bg-orange-50 text-orange-700 px-4 py-1.5 rounded-lg font-mono font-bold border border-orange-100 min-w-[80px] justify-center">
              <Clock className="w-4 h-4" />
              {formatTime(timeLeft)}
            </div>
            <Button variant="destructive" size="sm" onClick={handleEnd} disabled={!isActive}>End</Button>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
          <div className="lg:col-span-3 bg-card border rounded-2xl flex flex-col overflow-hidden shadow-sm relative">
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                {startGD.isPending && chats.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-muted-foreground gap-2">
                        <Loader2 className="animate-spin w-5 h-5"/> Setting up the room...
                    </div>
                ) : (
                    chats.map((chat, i) => (
                      <div key={i} className={`flex gap-3 ${chat.isUser ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          chat.isUser ? 'bg-primary text-white shadow-sm' : 'bg-muted border'
                        }`}>
                          {chat.speaker[0]}
                        </div>
                        <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                          chat.isUser 
                            ? 'bg-primary text-white rounded-tr-none' 
                            : 'bg-white text-foreground rounded-tl-none border'
                        }`}>
                          <p className={`text-[10px] font-bold mb-1 uppercase tracking-tighter opacity-70 ${chat.isUser ? 'text-white/80' : 'text-primary'}`}>
                            {chat.speaker}
                          </p>
                          <p className="text-sm leading-relaxed">{chat.text}</p>
                        </div>
                      </div>
                    ))
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>
           
            {sendMessage.isPending && (
                <div className="absolute bottom-16 left-6 text-[10px] text-muted-foreground animate-pulse p-2 bg-white/80 rounded">
                    Bots are replying...
                </div>
            )}

            {showFeedback && (
              <div className="absolute inset-x-0 bottom-[72px] mx-4 p-4 bg-white/95 backdrop-blur-sm border border-primary/20 rounded-xl shadow-xl animate-in slide-in-from-bottom-4 duration-300 z-10">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    MODERATOR FEEDBACK
                  </h4>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowFeedback(false)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                {isFeedbackLoading ? (
                    <div className="flex justify-center p-2"><Loader2 className="animate-spin w-4 h-4"/></div>
                ) : (
                    <p className="text-sm font-medium italic text-muted-foreground">
                      {feedbackContent || "No feedback available."}
                    </p>
                )}
              </div>
            )}

            <div className="p-4 border-t bg-muted/20 flex gap-2">
              <Input 
                placeholder="Make your point..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="bg-white shadow-sm"
                disabled={sendMessage.isPending || !isActive}
              />
              <Button onClick={handleSend} size="icon" className="shrink-0 shadow-sm" disabled={sendMessage.isPending || !isActive}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="hidden lg:flex flex-col gap-4">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Participant Personalities</h3>
            {bots.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Waiting for participants...</div>
            ) : (
                bots.map(bot => (
                  <Card key={bot.name} className="p-4 flex flex-col gap-2 hover-elevate cursor-default border shadow-none bg-muted/10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs border border-primary/5">
                        {bot.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-sm tracking-tight">{bot.name}</p>
                        <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">{bot.role}</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug italic">
                      "{bot.description}"
                    </p>
                  </Card>
                ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
