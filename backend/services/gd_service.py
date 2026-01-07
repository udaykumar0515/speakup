import os
import json
import uuid
import random
import requests
from models import GdSession, GdResult
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

GD_SESSIONS = {}
GD_RESULTS = []

AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_KEY = os.getenv("AZURE_OPENAI_KEY")
GPT_FULL_MODEL = os.getenv("GPT_FULL_MODEL")
GPT_MINI_MODEL = os.getenv("GPT_MINI_MODEL")

def get_gpt_response(messages, model=GPT_FULL_MODEL):
    if not AZURE_OPENAI_ENDPOINT or not AZURE_OPENAI_KEY:
        print(f"❌ Azure credentials missing: endpoint={AZURE_OPENAI_ENDPOINT is not None}, key={AZURE_OPENAI_KEY is not None}")
        return None 
    
    print(f"🔵 Calling Azure OpenAI with model: {model}")
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
        print(f"🟢 Azure response status: {r.status_code}")
        if r.status_code != 200:
            print(f"❌ Azure error response: {r.text}")
        response_json = r.json()
        print(f"✅ Azure response received: {len(str(response_json))} chars")
        return response_json
    except Exception as e:
        print(f"❌ Exception calling Azure: {str(e)}")
        return None

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
    
    # Bot Responses - Use GPT-4.0 Mini for intelligent responses
    bot_responses = []
    responding_bots = random.sample(session.bots, k=random.randint(1, 2))
    
    # Build conversation context
    recent_messages = session.messages[-5:]  # Last 5 messages for context
    conversation_context = "\n".join([
        f"{m.get('speaker', 'User')}: {m.get('content', '')}" 
        for m in recent_messages
    ])
    
    for bot in responding_bots:
        # Generate AI response with bot's personality
        system_prompt = f"""You are {bot['name']}, a {bot['personality'].lower()} participant in a group discussion about "{session.topic}". 
Your role is to contribute meaningfully to the discussion in a {bot['personality'].lower()} manner.
- Keep responses concise (1-2 sentences, max 50 words)
- Stay on topic
- Engage with what others have said
- Show your {bot['personality'].lower()} personality in your response"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Recent discussion:\n{conversation_context}\n\nProvide a brief response as {bot['name']}:"}
        ]
        
        # Call GPT-4.0 Mini
        gpt_response = get_gpt_response(messages, model=GPT_MINI_MODEL)
        
        if gpt_response and 'choices' in gpt_response:
            bot_reply = gpt_response['choices'][0]['message']['content'].strip()
        else:
            # Fallback if API fails
            bot_reply = f"As {bot['name']}, I have a point about {session.topic}."
        
        bot_msg = {
            "speaker": bot['name'],
            "text": bot_reply,
            "timestamp": datetime.now().isoformat()
        }
        bot_responses.append(bot_msg)
        session.messages.append({"role": "bot", "speaker": bot['name'], "content": bot_reply})
    
    return {"botMessages": bot_responses}

def generate_gd_feedback(sessionId: str, userId: int):
    """Generate real-time feedback using GPT"""
    session = GD_SESSIONS.get(sessionId)
    if not session:
        return None
    
    # Get user messages
    user_messages = [m for m in session.messages if m.get("role") == "user"]
    user_text = " ".join([m.get("content", "") for m in user_messages[-3:]])  # Last 3 messages
    
    prompt = f"""Based on the following recent contributions in a group discussion about '{session.topic}':
    
User contributions: {user_text}

Provide brief feedback in JSON format:
{{
  "feedback": "...",
  "participationScore": 0-100,
  "communicationQuality": 0-100
}}"""
    
    messages = [
        {"role": "system", "content": "You are a group discussion evaluator. Provide concise feedback."},
        {"role": "user", "content": prompt}
    ]
    
    resp = get_gpt_response(messages)
    if resp and 'choices' in resp:
        try:
            content = resp['choices'][0]['message']['content']
            content = content.replace("```json", "").replace("```", "").strip()
            return json.loads(content)
        except:
            pass
    
    # Fallback response
    return {
        "feedback": "Good contributions. Keep engaging with the topic.",
        "participationScore": 75,
        "communicationQuality": 80
    }

def generate_gd_end_summary(sessionId: str, userId: int, userMessages: list):
    """Generate final GD summary using GPT"""
    session = GD_SESSIONS.get(sessionId)
    if not session:
        return None
    
    user_msg_count = len([m for m in session.messages if m.get("role") == "user"])
    total_msg_count = len(session.messages)
    
    all_user_text = " | ".join([m.get("text", "") for m in userMessages])
    
    prompt = f"""Analyze this group discussion performance for the topic '{session.topic}':

User messages: {all_user_text}
Total user contributions: {user_msg_count}
Total discussion messages: {total_msg_count}

Provide a summary in JSON format:
{{
  "score": 0-100,
  "participationRate": 0-100,
  "communicationScore": 0-100,
  "initiativeScore": 0-100,
  "feedback": "...",
  "strengths": ["...", "..."],
  "improvements": ["...", "..."]
}}"""
    
    messages = [
        {"role": "system", "content": "You are a professional group discussion evaluator."},
        {"role": "user", "content": prompt}
    ]
    
    resp = get_gpt_response(messages)
    if resp and 'choices' in resp:
        try:
            content = resp['choices'][0]['message']['content']
            content = content.replace("```json", "").replace("```", "").strip()
            return json.loads(content)
        except:
            pass
    
    # Fallback response
    participation_rate = min(100, int((user_msg_count / max(1, total_msg_count)) * 200))
    return {
        "score": 85,
        "participationRate": participation_rate,
        "communicationScore": 80,
        "initiativeScore": 75,
        "feedback": "Good overall performance. Continue practicing clear communication.",
        "strengths": ["Engagement", "Clarity"],
        "improvements": ["Listen more", "Build on others' points"]
    }

def save_result(result: GdResult):
    result.id = str(uuid.uuid4())
    GD_RESULTS.append(result)
    return result

def get_history(userId: int):
    return [r for r in GD_RESULTS if r.userId == userId]
