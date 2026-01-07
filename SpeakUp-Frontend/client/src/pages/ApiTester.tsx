import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Play, CheckCircle, XCircle, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Endpoint = {
  name: string;
  method: "GET" | "POST";
  path: string;
  description: string;
  defaultBody?: object;
};

const ENDPOINT_GROUPS: { [key: string]: Endpoint[] } = {
  "Interview": [
    { 
      name: "Start Interview", 
      method: "POST", 
      path: "/api/interview/start", 
      description: "Initialize a new interview session",
      defaultBody: { userId: 1, interviewType: "Technical", jobRole: "Frontend Developer", resumeText: "" }
    },
    { 
      name: "Answer Question", 
      method: "POST", 
      path: "/api/interview/answer", 
      description: "Submit answer for current question",
      defaultBody: { sessionId: "UUID_HERE", userId: 1, answer: "My answer", questionNumber: 0 }
    },
    { 
      name: "Teach Me", 
      method: "POST", 
      path: "/api/interview/teach-me", 
      description: "Get coaching for a question",
      defaultBody: { sessionId: "UUID_HERE", questionNumber: 0, question: "Q?", userAnswer: "A" }
    },
    { 
      name: "Get History", 
      method: "GET", 
      path: "/api/interview/history/1", 
      description: "Get interview history for user 1"
    }
  ],
  "GD": [
    { 
      name: "Start GD", 
      method: "POST", 
      path: "/api/gd/start", 
      description: "Start Group Discussion",
      defaultBody: { userId: 1, topic: "Remote Work", difficulty: "Medium" }
    },
    { 
      name: "Send Message", 
      method: "POST", 
      path: "/api/gd/message", 
      description: "Send message to GD",
      defaultBody: { sessionId: "UUID_HERE", userId: 1, message: "Hello bots" }
    }
  ],
  "Aptitude": [
    { name: "Get Questions (Quant)", method: "GET", path: "/api/aptitude/questions/quantitative", description: "Get quantitative questions" },
    { name: "Get Questions (Logical)", method: "GET", path: "/api/aptitude/questions/logical", description: "Get logical questions" },
  ],
  "Resume": [
    { name: "Get History", method: "GET", path: "/api/resume/history/1", description: "Get resume analysis history" },
    // Upload is complex to test here due to File object, handled in separate component mostly
  ],
  "Dashboard": [
    { name: "Get Stats", method: "GET", path: "/api/dashboard/stats/1", description: "Get user dashboard statistics" }
  ],
  "AI Services": [
    { name: "Chat Mini", method: "POST", path: "/chat-mini", description: "Azure OpenAI GPT-Mini", defaultBody: { message: "Hello AI" } },
    { name: "Chat Full", method: "POST", path: "/chat-full", description: "Azure OpenAI GPT-Full", defaultBody: { message: "Hello AI" } }
  ]
};

export default function ApiTester() {
  const { toast } = useToast();
  const [selectedGroup, setSelectedGroup] = useState("Interview");
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint>(ENDPOINT_GROUPS["Interview"][0]);
  const [requestBody, setRequestBody] = useState<string>(JSON.stringify(ENDPOINT_GROUPS["Interview"][0].defaultBody || {}, null, 2));
  const [response, setResponse] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGroupChange = (group: string) => {
    setSelectedGroup(group);
    const firstep = ENDPOINT_GROUPS[group][0];
    setSelectedEndpoint(firstep);
    setRequestBody(JSON.stringify(firstep.defaultBody || {}, null, 2));
    setResponse(null);
    setStatus(null);
  };

  const handleEndpointChange = (epName: string) => {
    const ep = ENDPOINT_GROUPS[selectedGroup].find(e => e.name === epName);
    if (ep) {
      setSelectedEndpoint(ep);
      setRequestBody(JSON.stringify(ep.defaultBody || {}, null, 2));
      setResponse(null);
      setStatus(null);
    }
  };

  const executeRequest = async () => {
    setIsLoading(true);
    setResponse(null);
    setStatus(null);

    try {
      let bodyData = undefined;
      if (selectedEndpoint.method === "POST" && requestBody) {
        try {
          bodyData = JSON.parse(requestBody);
        } catch (e) {
          toast({ title: "Invalid JSON", description: "Please check your request body format.", variant: "destructive" });
          setIsLoading(false);
          return;
        }
      }

      const startTime = performance.now();
      const res = await apiRequest(selectedEndpoint.method, selectedEndpoint.path, bodyData);
      const endTime = performance.now();

      const data = await res.json();
      
      setResponse(JSON.stringify(data, null, 2));
      setStatus(`${res.status} OK (${(endTime - startTime).toFixed(0)}ms)`);
      toast({ title: "Request Successful", description: `Received 200 OK` });

    } catch (error: any) {
      console.error(error);
      const statusMatch = error.message?.match(/(\d+):/);
      const statusCode = statusMatch ? statusMatch[1] : "Error";
      setStatus(`${statusCode} Failed`);
      setResponse(error.message || String(error));
      toast({ title: "Request Failed", description: String(error), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const copyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(response);
      toast({ title: "Copied", description: "Response copied to clipboard" });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">API Endpoint Tester</h1>
        <p className="text-muted-foreground">Test backend connectivity and endpoint responses directly.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Controls */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Module Group</label>
              <Select value={selectedGroup} onValueChange={handleGroupChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(ENDPOINT_GROUPS).map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Endpoint</label>
              <Select value={selectedEndpoint.name} onValueChange={handleEndpointChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ENDPOINT_GROUPS[selectedGroup].map(e => (
                    <SelectItem key={e.name} value={e.name}>{e.method} {e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg text-xs font-mono break-all border">
              <span className={`font-bold mr-2 ${selectedEndpoint.method === "GET" ? "text-blue-500" : "text-green-500"}`}>
                {selectedEndpoint.method}
              </span>
              {selectedEndpoint.path}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Request Body (JSON)</label>
              <Textarea 
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                className="font-mono text-xs min-h-[200px] resize-y"
                disabled={selectedEndpoint.method === "GET"}
              />
            </div>

            <Button onClick={executeRequest} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              Send Request
            </Button>
          </CardContent>
        </Card>

        {/* Right: Response */}
        <Card className="lg:col-span-2 flex flex-col h-[600px]">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-lg">Response</CardTitle>
            <div className="flex items-center gap-3">
              {status && (
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${status.includes("200") ? "bg-green-500/10 text-green-600 border-green-200" : "bg-red-500/10 text-red-600 border-red-200"}`}>
                  {status.includes("200") ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {status}
                </div>
              )}
              {response && (
                <Button variant="ghost" size="sm" onClick={copyResponse}>
                  <Copy className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 p-0">
            <ScrollArea className="h-full w-full">
               <div className="p-6">
                {response ? (
                  <pre className="text-xs font-mono whitespace-pre-wrap text-foreground/80 leading-relaxed">
                    {response}
                  </pre>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    No response data yet.
                  </div>
                )}
               </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
