import os
import requests
from typing import List, Optional, Dict
from datetime import datetime
from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# Use models (Pydantic)
from models import (
    InterviewResult, GdResult, AptitudeResult, ResumeResult
)
from services import (
    interview_service, gd_service, resume_service, 
    aptitude_service, dashboard_service, auth_service
)

load_dotenv()

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- REQUEST MODELS ----------
class StartInterviewReq(BaseModel):
    userId: int
    interviewType: str  # technical, hr, behavioral
    difficulty: str  # junior, mid, senior
    mode: str  # practice, graded
    resumeData: Optional[dict] = None  # Output from Resume Analyzer

class MessageInterviewReq(BaseModel):
    sessionId: str
    userId: int
    message: str
    action: str  # greet, answer

class EndInterviewReq(BaseModel):
    sessionId: str
    userId: int

class TeachMeReq(BaseModel):
    questionId: str
    questionText: str
    userAnswer: Optional[str] = ""

class SaveInterviewReq(BaseModel):
    userId: int
    communicationScore: int
    confidenceScore: int
    relevanceScore: int
    feedback: str

class StartGdReq(BaseModel):
    userId: int
    topic: str
    difficulty: str
    duration: int = 600  # Default 10 minutes

class GdMessageReq(BaseModel):
    sessionId: str
    userId: int
    message: str
    action: Optional[str] = "speak"  # speak | pause | conclude

class GdBotMessage(BaseModel):
    speaker: str
    text: str
    timestamp: datetime

class GdMessageResp(BaseModel):
    botMessages: List[GdBotMessage] = []
    nextSpeaker: str
    timeRemaining: int
    canConclude: bool
    turnCounts: Dict[str, int]
    status: Optional[str] = None
    pauseCount: Optional[int] = 0

class GdEndReq(BaseModel):
    sessionId: str
    userId: int
    userMessages: List[dict]

class GdFeedbackReq(BaseModel):
    sessionId: str
    userId: int

class SaveGdReq(BaseModel):
    userId: int
    topic: str
    duration: int
    score: int

class SaveAptitudeReq(BaseModel):
    userId: int
    topic: str
    score: int
    totalQuestions: int
    accuracy: int
    timeTaken: int

class SaveResumeReq(BaseModel):
    userId: int
    atsScore: int
    suggestions: List[str]
    fileName: str

class AiChatReq(BaseModel):
    message: str
    context: str
    history: Optional[List[dict]] = None

class LoginReq(BaseModel):
    email: str
    password: Optional[str] = "mock"

class SignupReq(BaseModel):
    email: str
    name: str
    password: Optional[str] = "mock"

class UpdateUserReq(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    occupation: Optional[str] = None
    avatarUrl: Optional[str] = None

# ---------- ROUTERS ----------
auth_router = APIRouter(prefix="/auth", tags=["Auth"])
user_router = APIRouter(prefix="/users", tags=["Users"])
interview_router = APIRouter(prefix="/interview", tags=["Interview"])
gd_router = APIRouter(prefix="/gd", tags=["Gd"])
aptitude_router = APIRouter(prefix="/aptitude", tags=["Aptitude"])
resume_router = APIRouter(prefix="/resume", tags=["Resume"])
dashboard_router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
ai_router = APIRouter(prefix="/ai", tags=["AI"])

# --- AUTH ---
@auth_router.post("/login")
def login(req: LoginReq):
    user = auth_service.login(req.email, req.password)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@auth_router.post("/signup")
def signup(req: SignupReq):
    user = auth_service.signup(req.email, req.name, req.password)
    if not user:
        raise HTTPException(status_code=400, detail="Email already exists")
    return user

# --- USERS ---
@user_router.get("/{id}")
def get_user(id: int):
    user = auth_service.get_user(id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@user_router.put("/{id}")
def update_user(id: int, req: UpdateUserReq):
    user = auth_service.update_user(id, req.model_dump(exclude_unset=True))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# --- INTERVIEW ---
@interview_router.post("/start")
def start_interview(req: StartInterviewReq):
    result = interview_service.start_new_session(
        req.userId, 
        req.interviewType, 
        req.difficulty, 
        req.mode, 
        req.resumeData
    )
    if not result:
        raise HTTPException(status_code=500, detail="Failed to start interview session")
    return result

@interview_router.post("/message")
def interview_message(req: MessageInterviewReq):
    if req.action == "greet":
        result = interview_service.process_greeting(req.sessionId, req.message)
    elif req.action == "answer":
        result = interview_service.process_answer(req.sessionId, req.message)
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    if result is None or "error" in result:
        raise HTTPException(status_code=404, detail=result.get("error", "Session not found"))
    return result

@interview_router.post("/end")
def end_interview(req: EndInterviewReq):
    result = interview_service.end_interview(req.sessionId, req.userId)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result

@interview_router.post("/teach-me")
def teach_me(req: TeachMeReq):
    result = interview_service.get_teach_me(req.questionId, req.questionText, req.userAnswer)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to generate explanation")
    return result

@interview_router.post("")
def save_interview(req: SaveInterviewReq):
    # Use model_dump() if Pydantic v2, or dict()
    res = InterviewResult(**req.model_dump())
    return interview_service.save_result(res)

@interview_router.get("/history/{userId}")
def get_interview_history(userId: int):
    return interview_service.get_history(userId)

# --- GD ---
@gd_router.post("/start")
def start_gd(req: StartGdReq):
    result = gd_service.start_gd_session(req.userId, req.topic, req.difficulty, req.duration)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to start GD session")
    return result

@gd_router.post("/message")
def gd_message(req: GdMessageReq):
    result = gd_service.process_message(req.sessionId, req.userId, req.message, req.action)
    if result is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return result

@gd_router.post("/feedback")
def gd_feedback(req: GdFeedbackReq):
    result = gd_service.generate_gd_feedback(req.sessionId, req.userId)
    if result is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return result

@gd_router.post("/end")
def gd_end(req: GdEndReq):
    result = gd_service.generate_gd_end_summary(req.sessionId, req.userId, req.userMessages)
    if result is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return result

@gd_router.post("")
def save_gd(req: SaveGdReq):
    res = GdResult(**req.model_dump())
    return gd_service.save_result(res)

@gd_router.get("/history/{userId}")
def get_gd_history(userId: int):
    return gd_service.get_history(userId)

# --- APTITUDE ---
@aptitude_router.get("/questions/{topic}")
def get_aptitude_questions(topic: str, count: int = 20, ai_powered: bool = False):
    """
    Get aptitude questions
    - Regular mode: returns 'count' random questions (15-30) with shuffled options
    - AI mode: generates 3 hard questions via GPT-4.0 Mini
    """
    if ai_powered:
        questions = aptitude_service.get_ai_powered_questions(topic)
    else:
        questions = aptitude_service.get_random_questions(topic, count)
    
    return {"topic": topic, "questions": questions}

@aptitude_router.post("")
def save_aptitude(req: SaveAptitudeReq):
    res = AptitudeResult(**req.model_dump())
    return aptitude_service.save_result(res)

@aptitude_router.get("/history/{userId}")
def get_aptitude_history(userId: int):
    return aptitude_service.get_history(userId)

# --- RESUME ---
@resume_router.post("/upload")
async def upload_resume(userId: int = Form(...), file: UploadFile = File(...)):
    content = await file.read()
    result = resume_service.analyze_resume_content(content)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result

@resume_router.post("")
def save_resume(req: SaveResumeReq):
    res = ResumeResult(**req.model_dump())
    return resume_service.save_result(res)

@resume_router.get("/history/{userId}")
def get_resume_history(userId: int):
    return resume_service.get_history(userId)

# --- DASHBOARD ---
@dashboard_router.get("/stats/{userId}")
def get_dashboard_stats(userId: int):
    return dashboard_service.get_user_stats(userId)

# --- AI ---
@ai_router.post("/chat")
def ai_chat(req: AiChatReq):
    return {"response": f"AI Response to: {req.message}"}

# REGISTER ROUTERS
app.include_router(auth_router, prefix="/api")
app.include_router(user_router, prefix="/api")
app.include_router(interview_router, prefix="/api")
app.include_router(gd_router, prefix="/api")
app.include_router(aptitude_router, prefix="/api")
app.include_router(resume_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(ai_router, prefix="/api")


# ---------- EXISTING AZURE INTEGRATIONS (PRESERVED) ----------
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_KEY = os.getenv("AZURE_OPENAI_KEY")
GPT_MINI_MODEL = os.getenv("GPT_MINI_MODEL")
GPT_FULL_MODEL = os.getenv("GPT_FULL_MODEL")
SPEECH_KEY = os.getenv("SPEECH_KEY")
SPEECH_REGION = os.getenv("SPEECH_REGION")
DOC_KEY = os.getenv("DOC_KEY")
DOC_ENDPOINT = os.getenv("DOC_ENDPOINT")

@app.get("/")
def root():
    return {"status": "SpeakUp Python Backend Running 🚀 (Stateless Mode)"}

class SimpleChatReq(BaseModel):
    message: str

class TtsReq(BaseModel):
    text: str

@app.post("/chat-mini")
async def chat_mini(req: SimpleChatReq):
    url = f"{AZURE_OPENAI_ENDPOINT}/openai/v1/chat/completions"
    headers = {"api-key": AZURE_OPENAI_KEY, "Content-Type": "application/json"}
    body = {"model": GPT_MINI_MODEL, "messages": [{"role": "user", "content": req.message}]}
    r = requests.post(url, headers=headers, json=body)
    return r.json()

@app.post("/chat-full")
async def chat_full(req: SimpleChatReq):
    url = f"{AZURE_OPENAI_ENDPOINT}/openai/v1/chat/completions"
    headers = {"api-key": AZURE_OPENAI_KEY, "Content-Type": "application/json"}
    body = {"model": GPT_FULL_MODEL, "messages": [{"role": "user", "content": req.message}]}
    r = requests.post(url, headers=headers, json=body)
    return r.json()

@app.post("/stt")
async def speech_to_text(audio: UploadFile = File(...)):
    url = f"https://{SPEECH_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US"
    headers = {
        "Ocp-Apim-Subscription-Key": SPEECH_KEY,
        "Content-Type": "audio/wav",
        "Accept": "application/json"
    }
    audio_bytes = await audio.read()
    resp = requests.post(url, headers=headers, data=audio_bytes)
    try:
        return resp.json()
    except:
        return {"status": resp.status_code, "text": resp.text}

from io import BytesIO

@app.post("/tts")
async def text_to_speech(req: TtsReq):
    url = f"https://{SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1"
    headers = {
        "Ocp-Apim-Subscription-Key": SPEECH_KEY,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-16khz-32kbitrate-mono-mp3"
    }
    ssml = f"<speak version='1.0' xml:lang='en-US'><voice xml:lang='en-US' name='en-US-JennyNeural'>{req.text}</voice></speak>"
    resp = requests.post(url, headers=headers, data=ssml.encode("utf-8"))
    return StreamingResponse(BytesIO(resp.content), media_type="audio/mpeg")

@app.post("/resume")
async def resume_extract(file: UploadFile = File(...)):
    submit_url = f"{DOC_ENDPOINT}/documentintelligence/documentModels/prebuilt-read:analyze?api-version=2024-02-29-preview"
    headers = {"Ocp-Apim-Subscription-Key": DOC_KEY, "Content-Type": "application/pdf"}
    data = await file.read()
    resp = requests.post(submit_url, headers=headers, data=data)
    if resp.status_code != 202:
        return {"status": resp.status_code, "response": resp.text}
    operation_url = resp.headers["Operation-Location"]
    import time
    while True:
        result = requests.get(operation_url, headers={"Ocp-Apim-Subscription-Key": DOC_KEY})
        result_json = result.json()
        status = result_json["status"]
        if status in ["succeeded", "failed"]:
            break
        time.sleep(1)
    return result_json
