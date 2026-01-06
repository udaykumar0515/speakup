import os
import json
import requests
import uuid
from models import InterviewSession, InterviewResult
from datetime import datetime

# Global In-Memory Storage
INTERVIEW_SESSIONS = {}
INTERVIEW_RESULTS = []

AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_KEY = os.getenv("AZURE_OPENAI_KEY")
GPT_FULL_MODEL = os.getenv("GPT_FULL_MODEL")

def get_gpt_response(messages, model=GPT_FULL_MODEL):
    if not AZURE_OPENAI_ENDPOINT or not AZURE_OPENAI_KEY:
        return None 
    url = f"{AZURE_OPENAI_ENDPOINT}/openai/v1/chat/completions"
    headers = {
        "api-key": AZURE_OPENAI_KEY,
        "Content-Type": "application/json"
    }
    body = {
        "model": model,
        "messages": messages,
        "temperature": 0.7
    }
    try:
        r = requests.post(url, headers=headers, json=body)
        return r.json()
    except:
        return None

def start_new_session(userId: int, interviewType: str, jobRole: str, resumeText: str = ""):
    sessionId = str(uuid.uuid4())
    
    # Generate Questions via AI
    prompt = f"Generate 5 interview questions for a {interviewType} interview for the role of {jobRole}."
    if resumeText:
        prompt += f" Context from resume: {resumeText[:500]}..."
    prompt += " Return ONLY a JSON array of strings. Example: [\"Question 1\", \"Question 2\"]"
    
    messages = [
        {"role": "system", "content": "You are a helpful hiring manager helper. Output strictly JSON."},
        {"role": "user", "content": prompt}
    ]
    
    questions_text = []
    resp = get_gpt_response(messages)
    if resp and 'choices' in resp:
        try:
            content = resp['choices'][0]['message']['content']
            content = content.replace("```json", "").replace("```", "").strip()
            questions_text = json.loads(content)
        except:
            pass
            
    if not questions_text:
        questions_text = [
            "Tell me about yourself.",
            "What are your strengths?",
            "Describe a challenge you faced.",
            "Why do you want this job?",
            "Where do you see yourself in 5 years?"
        ]
    
    structured_questions = [{"question": q, "answer": None, "feedback": None} for q in questions_text]
    
    session = InterviewSession(
        sessionId=sessionId,
        userId=userId,
        interviewType=interviewType,
        jobRole=jobRole,
        questions=structured_questions,
        currentQuestionIndex=0
    )
    
    INTERVIEW_SESSIONS[sessionId] = session
    
    return {
        "sessionId": sessionId,
        "firstQuestion": structured_questions[0]['question'],
        "totalQuestions": len(structured_questions),
        "interviewType": interviewType,
        "jobRole": jobRole
    }

def submit_answer(sessionId: str, answer: str):
    session = INTERVIEW_SESSIONS.get(sessionId)
    if not session:
        return None
    
    idx = session.currentQuestionIndex
    if idx < len(session.questions):
        session.questions[idx]['answer'] = answer
        session.currentQuestionIndex += 1
        
        if session.currentQuestionIndex >= len(session.questions):
            session.isComplete = True
            return {
                "isComplete": True,
                "summary": generate_summary(session)
            }
        else:
            return {
                "isComplete": False,
                "nextQuestion": session.questions[session.currentQuestionIndex]['question'],
                "questionNumber": session.currentQuestionIndex + 1
            }
    return {"isComplete": True}

def generate_summary(session: InterviewSession):
    return {
        "communicationScore": 85,
        "technicalScore": 80,
        "confidenceScore": 75,
        "overallScore": 80,
        "feedback": "Good performance! Keep practicing STAR method."
    }

def get_teach_me(sessionId: str, questionNumber: int, question: str, userAnswer: str):
    messages = [
        {"role": "system", "content": "You are an interview coach."},
        {"role": "user", "content": f"Question: {question}\nUser Answer: {userAnswer}\nProvide coaching in JSON: {{ \"coaching\": \"...\", \"modelAnswer\": \"...\", \"tips\": [] }}"}
    ]
    resp = get_gpt_response(messages)
    if resp and 'choices' in resp:
        try:
            content = resp['choices'][0]['message']['content']
            content = content.replace("```json", "").replace("```", "").strip()
            return json.loads(content)
        except:
            pass
            
    return {
        "coaching": "Good attempt.",
        "modelAnswer": "I would say...",
        "tips": ["Be concise"]
    }

def save_result(result: InterviewResult):
    result.id = str(uuid.uuid4())
    INTERVIEW_RESULTS.append(result)
    return result

def get_history(userId: int):
    return [r for r in INTERVIEW_RESULTS if r.userId == userId]
