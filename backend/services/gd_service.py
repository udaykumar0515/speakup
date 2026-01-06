import os
import json
import uuid
import random
from models import GdSession, GdResult
from datetime import datetime

GD_SESSIONS = {}
GD_RESULTS = []

def start_gd_session(userId: int, topic: str, difficulty: str):
    sessionId = str(uuid.uuid4())
    bots = [
        {"name": "Alex", "personality": "Analytical", "role": "Participant"},
        {"name": "Sarah", "personality": "Creative", "role": "Participant"},
        {"name": "Mike", "personality": "Critical", "role": "Participant"}
    ]
    
    session = GdSession(
        sessionId=sessionId,
        userId=userId,
        topic=topic,
        difficulty=difficulty,
        bots=bots,
        messages=[]
    )
    GD_SESSIONS[sessionId] = session
    
    return {
        "sessionId": sessionId,
        "topic": topic,
        "difficulty": difficulty,
        "bots": bots,
        "moderatorMessage": f"Topic: '{topic}'. You may begin."
    }

def process_message(sessionId: str, userId: int, message: str):
    session = GD_SESSIONS.get(sessionId)
    if not session:
        return None
        
    # User Message
    msg_entry = {"role": "user", "content": message, "timestamp": datetime.now().isoformat()}
    session.messages.append(msg_entry)
    
    # Bot Responses
    bot_responses = []
    responding_bots = random.sample(session.bots, k=random.randint(1, 2))
    
    for bot in responding_bots:
        bot_reply = f"As {bot['name']}, I have a point about {session.topic}."
        bot_msg = {
            "speaker": bot['name'],
            "text": bot_reply,
            "timestamp": datetime.now().isoformat()
        }
        bot_responses.append(bot_msg)
        session.messages.append({"role": "bot", "speaker": bot['name'], "content": bot_reply})
    
    return {"botMessages": bot_responses}

def save_result(result: GdResult):
    result.id = str(uuid.uuid4())
    GD_RESULTS.append(result)
    return result

def get_history(userId: int):
    return [r for r in GD_RESULTS if r.userId == userId]
