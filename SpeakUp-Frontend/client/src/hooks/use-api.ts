import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { 
  type InsertAptitudeResult, 
  type InsertInterviewResult, 
  type InsertGdResult, 
  type InsertResumeResult 
} from "@shared/schema";

// Helper for API calls with basic error handling and toast
async function apiCall<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    credentials: "include",
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Unknown error occurred" }));
    throw new Error(errorData.message || res.statusText);
  }
  
  if (res.status === 204) return {} as T;
  return await res.json();
}

// --- Aptitude Hooks ---

export function useAptitudeHistory(userId: number) {
  return useQuery({
    queryKey: [api.aptitude.list.path, userId],
    queryFn: () => apiCall<any[]>(buildUrl(api.aptitude.list.path, { userId })),
    enabled: !!userId,
  });
}

export function useCreateAptitudeResult() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: InsertAptitudeResult) => 
      apiCall<any>(api.aptitude.create.path, {
        method: api.aptitude.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.aptitude.list.path, data.userId] });
      toast({ title: "Result Saved", description: "Your performance has been recorded." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to Save", description: error.message, variant: "destructive" });
    }
  });
}

// --- Interview Hooks ---

export function useInterviewHistory(userId: number) {
  return useQuery({
    queryKey: [api.interview.list.path, userId],
    queryFn: () => apiCall<any[]>(buildUrl(api.interview.list.path, { userId })),
    enabled: !!userId,
  });
}

export function useCreateInterviewResult() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: InsertInterviewResult) => 
      apiCall<any>(api.interview.create.path, {
        method: api.interview.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.interview.list.path, data.userId] });
      toast({ title: "Interview Saved", description: "Feedback is now available in your profile." });
    },
    onError: (error: Error) => {
      toast({ title: "Save Failed", description: error.message, variant: "destructive" });
    }
  });
}

// --- Group Discussion Hooks ---

export function useGdHistory(userId: number) {
  return useQuery({
    queryKey: [api.gd.list.path, userId],
    queryFn: () => apiCall<any[]>(buildUrl(api.gd.list.path, { userId })),
    enabled: !!userId,
  });
}

export function useCreateGdResult() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: InsertGdResult) => 
      apiCall<any>(api.gd.create.path, {
        method: api.gd.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.gd.list.path, data.userId] });
      toast({ title: "Session Recorded", description: "GD session results have been saved." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to Save", description: error.message, variant: "destructive" });
    }
  });
}

// --- Resume Hooks ---

export function useResumeHistory(userId: number) {
  return useQuery({
    queryKey: [api.resume.list.path, userId],
    queryFn: () => apiCall<any[]>(buildUrl(api.resume.list.path, { userId })),
    enabled: !!userId,
  });
}

export function useCreateResumeResult() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: InsertResumeResult) => 
      apiCall<any>(api.resume.create.path, {
        method: api.resume.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.resume.list.path, data.userId] });
      toast({ title: "Analysis Saved", description: "Resume feedback recorded." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to Save", description: error.message, variant: "destructive" });
    }
  });
}
