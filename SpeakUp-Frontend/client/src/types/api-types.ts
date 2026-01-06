export interface StartInterviewRequest {
  userId: number;
  interviewType: string;
  jobRole?: string;
  useResume: boolean;
  resumeText?: string;
  adaptiveDifficultyEnabled: boolean;
}

export interface StartInterviewResponse {
  sessionId: string;
  firstQuestion: string;
  totalQuestions: number;
  interviewType: string;
  jobRole?: string;
}

export interface AnswerRequest {
  sessionId: string;
  userId: number;
  answer: string;
  questionNumber: number;
}

export interface AnswerResponse {
  nextQuestion?: string;
  questionNumber?: number;
  isComplete: boolean;
  summary?: {
    communicationScore: number;
    technicalScore: number;
    confidenceScore: number;
    overallScore: number;
    feedback: string;
  };
}

export interface TeachMeRequest {
  sessionId: string;
  questionNumber: number;
  userAnswer: string;
  question: string;
}

export interface TeachMeResponse {
  coaching: string;
  modelAnswer: string;
  tips: string[];
}

export interface StartGDRequest {
  userId: number;
  topic: string;
  difficulty: string;
  duration: number;
}

export interface StartGDResponse {
  sessionId: string;
  topic: string;
  difficulty: string;
  bots: {
    name: string;
    personality: string;
    role: string;
  }[];
  moderatorMessage: string;
}

export interface GDMessageRequest {
  sessionId: string;
  userId: number;
  message: string;
}

export interface GDMessageResponse {
  botMessages: {
    speaker: string;
    text: string;
    timestamp: string;
  }[];
}

export interface GDFeedbackRequest {
  sessionId: string;
  userId: number;
}

export interface GDFeedbackResponse {
  feedback: string;
  participationScore: number;
  communicationQuality: number;
}

export interface GDEndRequest {
  sessionId: string;
  userId: number;
  userMessages: {
    text: string;
    timestamp: string;
  }[];
}

export interface GDEndResponse {
  score: number;
  participationRate: number;
  communicationScore: number;
  initiativeScore: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export interface AptitudeQuestionsResponse {
  topic: string;
  questions: {
    id: number;
    question: string; // "q" in mock
    options: string[];
    correctAnswer: number; // "correct" in mock
    difficulty: string;
  }[];
}

export interface ResumeUploadResponse {
  atsScore: number;
  suggestions: string[];
  parsedData: {
    name: string;
    email: string;
    skills: string[];
    experience: string;
    education: string;
  };
  fullText: string;
}

export interface DashboardStatsResponse {
  user: {
    name: string;
    email: string;
  };
  stats: {
    totalInterviews: number;
    totalGdSessions: number;
    totalAptitudeTests: number;
    totalResumesAnalyzed: number;
    averageInterviewScore: number;
    averageGdScore: number;
    averageAptitudeScore: number;
  };
  recentActivity: {
    type: string;
    date: string;
    description: string;
    score?: number;
  }[];
}
