import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Briefcase, UserCheck, Terminal, Upload, X, ShieldCheck } from "lucide-react";

export default function InterviewSetup() {
  const [, setLocation] = useLocation();
  const [type, setType] = useState<string>("");
  const [jobRole, setJobRole] = useState("");
  const [useResume, setUseResume] = useState(false);
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState(true);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setResumeFile(file);
      setUseResume(true);
    }
  };

  const handleStart = () => {
    if (!type) return;
    
    // In a real app, we'd read the file content here. 
    // For now, we pass the flag and mock text if enabled.
    const state = {
      interviewType: type,
      jobRole: type === "job-role" ? jobRole : undefined,
      resumeText: useResume ? "Mock resume content from " + (resumeFile?.name || "uploaded file") : undefined,
      useResume,
      adaptiveDifficultyEnabled: adaptiveDifficulty
    };

    // Wouter doesn't have a built-in state passing like react-router, 
    // so we'll use sessionStorage for this local flow as a reliable placeholder.
    sessionStorage.setItem("interview_setup", JSON.stringify(state));
    setLocation("/interview/start");
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-8 py-8 px-4">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Mock Interview Setup</h1>
          <p className="text-muted-foreground">Configure your session for a personalized interview experience.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Resume Upload</CardTitle>
            <CardDescription>Upload resume for interview question relevance (Optional)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!resumeFile ? (
              <div 
                className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">Click to upload PDF resume</p>
                <p className="text-xs text-muted-foreground mt-1">Accepts PDF only</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".pdf" 
                  onChange={handleFileUpload} 
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <FileText className="w-5 h-5 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{resumeFile.name}</p>
                  <p className="text-[10px] text-muted-foreground">{(resumeFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => {setResumeFile(null); setUseResume(false);}}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="use-resume" 
                disabled={!resumeFile} 
                checked={useResume} 
                onCheckedChange={(checked) => setUseResume(!!checked)}
              />
              <Label htmlFor="use-resume" className={!resumeFile ? "text-muted-foreground" : ""}>
                Use resume to generate questions
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interview Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Select Interview Type</Label>
              <Select onValueChange={setType} value={type}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose interview type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hr">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4" />
                      <span>HR Interview</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="technical">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4" />
                      <span>Technical Interview</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="resume">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>Resume-Based Interview</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="job-role">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      <span>Job Role Interview</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {type === "job-role" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="role">Enter Job Role</Label>
                <Input
                  id="role"
                  placeholder="e.g., Data Analyst"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                />
              </div>
            )}

            <div className="flex items-center space-x-2 border p-3 rounded-lg bg-muted/30">
              <Checkbox 
                id="adaptive" 
                checked={adaptiveDifficulty} 
                onCheckedChange={(checked) => setAdaptiveDifficulty(!!checked)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="adaptive" className="flex items-center gap-1.5 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  Adaptive Difficulty Progression
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Questions get harder as you perform well
                </p>
              </div>
            </div>

            <Button 
              className="w-full h-11 text-base font-semibold shadow-sm" 
              onClick={handleStart} 
              disabled={!type || (type === "job-role" && !jobRole)}
            >
              Start Interview
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
