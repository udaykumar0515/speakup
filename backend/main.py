import os
import requests
from typing import List, Optional
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
    aptitude_service, dashboard_service
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
    interviewType: str
    jobRole: Optional[str] = "General"
    resumeText: Optional[str] = ""

class AnswerInterviewReq(BaseModel):
    sessionId: str
    userId: int
    answer: str
    questionNumber: int

class TeachMeReq(BaseModel):
    sessionId: str
    questionNumber: int
    userAnswer: str
    question: str

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

class GdMessageReq(BaseModel):
    sessionId: str
    userId: int
    message: str

class GdFeedbackReq(BaseModel):
    sessionId: str
    userId: int

class GdEndReq(BaseModel):
    sessionId: str
    userId: int
    userMessages: List[dict]

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

# ---------- ROUTERS ----------
interview_router = APIRouter(prefix="/interview", tags=["Interview"])
gd_router = APIRouter(prefix="/gd", tags=["Gd"])
aptitude_router = APIRouter(prefix="/aptitude", tags=["Aptitude"])
resume_router = APIRouter(prefix="/resume", tags=["Resume"])
dashboard_router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
ai_router = APIRouter(prefix="/ai", tags=["AI"])

# --- INTERVIEW ---
@interview_router.post("/start")
def start_interview(req: StartInterviewReq):
    return interview_service.start_new_session(req.userId, req.interviewType, req.jobRole, req.resumeText)

@interview_router.post("/answer")
def answer_interview(req: AnswerInterviewReq):
    return interview_service.submit_answer(req.sessionId, req.answer)

@interview_router.post("/teach-me")
def teach_me(req: TeachMeReq):
    return interview_service.get_teach_me(req.sessionId, req.questionNumber, req.question, req.userAnswer)

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
    return gd_service.start_gd_session(req.userId, req.topic, req.difficulty)

@gd_router.post("/message")
def gd_message(req: GdMessageReq):
    return gd_service.process_message(req.sessionId, req.userId, req.message)

@gd_router.post("/feedback")
def gd_feedback(req: GdFeedbackReq):
    return {"feedback": "Good points, try to speak more clearly.", "participationScore": 75, "communicationQuality": 80}

@gd_router.post("/end")
def gd_end(req: GdEndReq):
    return {
        "score": 85,
        "participationRate": 50,
        "communicationScore": 80,
        "initiativeScore": 70,
        "feedback": "Well done.",
        "strengths": ["Logic", "Confidence"],
        "improvements": ["Listening"]
    }

@gd_router.post("")
def save_gd(req: SaveGdReq):
    res = GdResult(**req.model_dump())
    return gd_service.save_result(res)

@gd_router.get("/history/{userId}")
def get_gd_history(userId: int):
    return gd_service.get_history(userId)

# --- APTITUDE ---
@aptitude_router.get("/questions/{topic}")
def get_aptitude_questions(topic: str):
    return {"topic": topic, "questions": aptitude_service.get_questions(topic)}

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
    return resume_service.analyze_resume_content(content)

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

@app.post("/chat-mini")
async def chat_mini(message: str = Form(...)):
    url = f"{AZURE_OPENAI_ENDPOINT}/openai/v1/chat/completions"
    headers = {"api-key": AZURE_OPENAI_KEY, "Content-Type": "application/json"}
    body = {"model": GPT_MINI_MODEL, "messages": [{"role": "user", "content": message}]}
    r = requests.post(url, headers=headers, json=body)
    return r.json()

@app.post("/chat-full")
async def chat_full(message: str = Form(...)):
    url = f"{AZURE_OPENAI_ENDPOINT}/openai/v1/chat/completions"
    headers = {"api-key": AZURE_OPENAI_KEY, "Content-Type": "application/json"}
    body = {"model": GPT_FULL_MODEL, "messages": [{"role": "user", "content": message}]}
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
async def text_to_speech(text: str = Form(...)):
    url = f"https://{SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1"
    headers = {
        "Ocp-Apim-Subscription-Key": SPEECH_KEY,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-16khz-32kbitrate-mono-mp3"
    }
    ssml = f"<speak version='1.0' xml:lang='en-US'><voice xml:lang='en-US' name='en-US-JennyNeural'>{text}</voice></speak>"
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
