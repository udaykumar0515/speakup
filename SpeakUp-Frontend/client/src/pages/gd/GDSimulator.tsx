import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Clock, Send, MessageSquareText, ShieldAlert, UserCheck, Bot, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Chat = {
  speaker: string;
  text: string;
  isUser: boolean;
};

const BOTS = [
  { name: "Sarah", role: "Analytical", description: "Analytical, focuses on data and logic" },
  { name: "Mike", role: "Aggressive", description: "Aggressive, challenges opinions frequently" },
  { name: "Priya", role: "Balanced", description: "Balanced, looks for consensus and synthesis" }
];

export default function GDSimulator() {
  const [config, setConfig] = useState<{topic: string, difficulty: string} | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [timeLeft, setTimeLeft] = useState(600);
  const [chats, setChats] = useState<Chat[]>([]);
  const [input, setInput] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("gd_setup");
    if (saved) {
      const parsed = JSON.parse(saved);
      setConfig(parsed);
      setChats([
        { speaker: "Moderator", text: `Topic: "${parsed.topic}". Difficulty: ${parsed.difficulty.toUpperCase()}. You may begin the discussion.`, isUser: false }
      ]);
    }
  }, []);

  useEffect(() => {
    if (!isActive || timeLeft <= 0 || !config) return;
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    
    const botInterval = setInterval(() => {
      const bot = BOTS[Math.floor(Math.random() * BOTS.length)];
      const responses = [
        "I believe we need to consider the practical implications here.",
        "That's a point worth noting, but how does it address the main issue?",
        "If we look at the current trends, this becomes even more relevant.",
      ];
      setChats(prev => [...prev, { speaker: bot.name, text: responses[Math.floor(Math.random() * responses.length)], isUser: false }]);
    }, config.difficulty === 'competitive' ? 4000 : 7000);

    return () => {
      clearInterval(timer);
      clearInterval(botInterval);
    };
  }, [isActive, timeLeft, config]);

  const handleSend = () => {
    if (!input.trim()) return;
    setChats(prev => [...prev, { speaker: "You", text: input, isUser: true }]);
    setInput("");
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
              Group Discussion: You + 3 AI Participants
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowFeedback(true)} 
              className="flex-1 md:flex-none gap-2 border-primary/20 text-primary hover:bg-primary/5 font-semibold"
            >
              <MessageSquareText className="w-4 h-4" />
              Ask Moderator For Feedback
            </Button>
            <div className="flex items-center gap-2 bg-orange-50 text-orange-700 px-4 py-1.5 rounded-lg font-mono font-bold border border-orange-100 min-w-[80px] justify-center">
              <Clock className="w-4 h-4" />
              {formatTime(timeLeft)}
            </div>
            <Button variant="destructive" size="sm" onClick={() => setIsActive(false)}>End</Button>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
          <div className="lg:col-span-3 bg-card border rounded-2xl flex flex-col overflow-hidden shadow-sm relative">
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                {chats.map((chat, i) => (
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
                ))}
              </div>
            </ScrollArea>

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
                <p className="text-sm font-medium italic text-muted-foreground">
                  Feedback will be generated here later based on your participation and the difficulty level.
                </p>
              </div>
            )}

            <div className="p-4 border-t bg-muted/20 flex gap-2">
              <Input 
                placeholder="Make your point..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="bg-white shadow-sm"
              />
              <Button onClick={handleSend} size="icon" className="shrink-0 shadow-sm"><Send className="w-4 h-4" /></Button>
            </div>
          </div>

          <div className="hidden lg:flex flex-col gap-4">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Participant Personalities</h3>
            {BOTS.map(bot => (
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
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
