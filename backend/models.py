from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

# --- USER ---
class User(BaseModel):
    id: Optional[int] = None
    email: str
    name: str = "User"
    createdAt: datetime = Field(default_factory=datetime.now)

# --- APTITUDE ---
class AptitudeResult(BaseModel):
    id: Optional[str] = None
    userId: int
    topic: str
    score: int
    totalQuestions: int
    accuracy: int
    timeTaken: int
    createdAt: datetime = Field(default_factory=datetime.now)

# --- INTERVIEW ---
class InterviewResult(BaseModel):
    id: Optional[str] = None
    userId: int
    communicationScore: int
    confidenceScore: int
    relevanceScore: int
    feedback: str
    createdAt: datetime = Field(default_factory=datetime.now)

class InterviewSession(BaseModel):
    sessionId: str
    userId: int
    interviewType: str
    jobRole: Optional[str] = None
    questions: List[Dict] = Field(default_factory=list) 
    currentQuestionIndex: int = 0
    isComplete: bool = False
    createdAt: datetime = Field(default_factory=datetime.now)

# --- GD ---
class GdResult(BaseModel):
    id: Optional[str] = None
    userId: int
    topic: str
    duration: int
    score: int
    createdAt: datetime = Field(default_factory=datetime.now)

class GdSession(BaseModel):
    sessionId: str
    userId: int
    topic: str
    difficulty: str
    bots: List[Dict] = Field(default_factory=list)
    messages: List[Dict] = Field(default_factory=list)
    isActive: bool = True
    createdAt: datetime = Field(default_factory=datetime.now)

# --- RESUME ---
class ResumeResult(BaseModel):
    id: Optional[str] = None
    userId: int
    atsScore: int
    suggestions: List[str] = Field(default_factory=list)
    fileName: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.now)
