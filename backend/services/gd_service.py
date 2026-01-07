import os
import json
import uuid
import random
import re
import requests
from models import GdSession, GdResult
from datetime import datetime
from dotenv import load_dotenv
from typing import Dict, List, Optional

# Load environment variables
load_dotenv()

GD_SESSIONS = {}
GD_RESULTS = []

AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_KEY = os.getenv("AZURE_OPENAI_KEY")
GPT_FULL_MODEL = os.getenv("GPT_FULL_MODEL")
GPT_MINI_MODEL = os.getenv("GPT_MINI_MODEL")

# ==== HELPER FUNCTIONS ====

def get_gpt_response(messages, model=GPT_FULL_MODEL, max_tokens=150):
    """Call Azure OpenAI API"""
    if not AZURE_OPENAI_ENDPOINT or not AZURE_OPENAI_KEY:
        print(f"❌ Azure credentials missing")
        return None 
    
    url = f"{AZURE_OPENAI_ENDPOINT}/openai/v1/chat/completions"
    headers = {
        "api-key": AZURE_OPENAI_KEY,
        "Content-Type": "application/json"
    }
    body = {
        "model": model,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": max_tokens
    }
    try:
        r = requests.post(url, headers=headers, json=body, timeout=15)
        if r.status_code != 200:
            print(f"❌ Azure error: {r.status_code}")
            return None
        return r.json()
    except Exception as e:
        print(f"❌ Exception calling Azure: {str(e)}")
        return None

# ==== CLASSES for Monitor-Bot Architecture ====

class GDBot:
    """Represents a Participant Bot (Alex, Sarah, Mike)"""
    def __init__(self, name: str, personality: str):
        self.name = name
        self.personality = personality
    
    def generate_response(self, topic: str, context_messages: List[Dict], system_prompt_extras: str = ""):
        """Generate a response based on conversation context"""
        
        # Format context for the LLM
        # We take the last 5 messages to keep context relevant but concise
        recent_msgs = context_messages[-5:] 
        formatted_context = "\n".join([
            f"{m.get('speaker', 'Unknown')} ({m.get('role', 'unknown')}): {m.get('content', '')}" 
            for m in recent_msgs
        ])

        system_prompt = f"""You are {self.name}, a {self.personality.lower()} participant in a group discussion about "{topic}".

Guidelines:
- Keep responses concise (2-3 sentences, max 60 words).
- Reference what the previous speaker said to show active listening.
- Stay on topic.
- Show your {self.personality.lower()} personality.
- You can end with a handoff like "I'd ask [Name] for their opinion" or just make your point.

- DO NOT mention the AI, the system, or the "monitor". Pretend to be a real human student.

- THE ONLY PARTICIPANTS are: User (the human), Alex, Sarah, and Mike. Do NOT invent other names like "Emma" or "John".
- THE ONLY PARTICIPANTS are: User (the human), Alex, Sarah, and Mike. Do NOT invent other names like "Emma" or "John".
- IF this is the FIRST message in the discussion, DO NOT reference what others said (since no one spoke yet). State your own opening opinion.
- CRITICAL: DO NOT attribute opinions to the User unless they have explicitly stated them in the "Recent discussion". If the User is silent, do NOT say "User, I appreciate your agreement". Instead, ask for their opinion.
{system_prompt_extras}"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Recent discussion:\n{formatted_context}\n\nProvide your response as {self.name}:"}
        ]
        
        resp = get_gpt_response(messages, model=GPT_MINI_MODEL, max_tokens=100)
        
        if resp and 'choices' in resp:
            return resp['choices'][0]['message']['content'].strip()
        else:
            return f"That's an interesting perspective on {topic}. I think we should explore that further."

class GDMonitor:
    """The Orchestrator (Monitor Bot)"""
    def __init__(self, session_state):
        self.session_state = session_state
        self.bots = {
            b['name'].lower(): GDBot(b['name'], b['personality']) 
            for b in self.session_state.model.bots
        }
    
    def parse_handoff(self, message: str) -> Optional[str]:
        """
        AI-POWERED handoff detection using GPT-4o-mini.
        The Monitor Bot intelligently analyzes the message to detect if someone is being addressed,
        regardless of where their name appears in the sentence.
        Returns the name of the next speaker (lowercase) or None.
        """
        # Quick regex check for common patterns first (performance optimization)
        msg_lower = message.lower()
        
        # Fast path: Check for "User," pattern FIRST (most common)
        if re.search(r'\buser\s*,', msg_lower):
            return "user"
        
        # Fast path: Check for other common patterns
        quick_patterns = [
            r'\b(alex|sarah|mike)\s*,',  # "Sarah, what do..."
            r'\b(alex|sarah|mike)\s*\?',  # "right, Sarah?"
        ]
        
        for pattern in quick_patterns:
            match = re.search(pattern, msg_lower)
            if match:
                for name in ['alex', 'sarah', 'mike']:
                    if name in match.group(0):
                        return name
        
        # AI-POWERED ANALYSIS: If no obvious pattern, ask GPT to analyze
        # This catches complex cases like "I would like to ask Sarah, is there any way..."
        analysis_prompt = f"""You are a GD Monitor Bot analyzing conversation flow.

Message: "{message}"

Participants: User, Alex, Sarah, Mike

TASK: Determine if this message is addressing or handing off to a SPECIFIC participant.
Look for ANY indication that someone is being asked a question or addressed, such as:
- Direct address: "Sarah, what do you think?"
- Indirect: "I would like to ask Sarah..."
- Questions directed at someone: "How does Mike feel about this?"
- Requests for opinion: "I want to hear from Alex on this"

Respond with ONLY ONE WORD:
- "user" if addressing the User
- "alex" if addressing Alex
- "sarah" if addressing Sarah  
- "mike" if addressing Mike
- "none" if no specific handoff detected

Response:"""

        try:
            ai_response = get_gpt_response(
                messages=[{"role": "user", "content": analysis_prompt}],
                model=GPT_MINI_MODEL,
                max_tokens=10
            )
            
            if ai_response and 'choices' in ai_response:
                detected = ai_response['choices'][0]['message']['content'].strip().lower()
                if detected in ['user', 'alex', 'sarah', 'mike']:
                    return detected
        except Exception as e:
            print(f"⚠️ AI handoff detection failed: {e}, falling back to regex")
        
        # Fallback: Extended regex patterns
        fallback_patterns = [
            r'(what|how).{0,50}(alex|sarah|mike|user)',
            r'i\'d (ask|like to hear from|turn to)\s*(alex|sarah|mike|user)',
            r'(alex|sarah|mike|user).{0,20}(your|you) (thought|opinion|view|take)',
        ]
        
        for pattern in fallback_patterns:
            match = re.search(pattern, msg_lower)
            if match:
                for name in ['alex', 'sarah', 'mike', 'user']:
                    if name in match.group(0):
                        return name
        
        return None

    def decide_next_speaker(self) -> str:
        """
        Decides who speaks next.
        Priority:
        1. Explicit Handoff (next_speaker set in state).
        2. Fair Turn Distribution (least spoken).
        """
        # 1. Handoff - CRITICAL: Must be respected if valid
        if self.session_state.next_speaker:
            candidate = self.session_state.next_speaker.lower()
            self.session_state.next_speaker = None # Reset after using
            # Validate candidate exists (could be 'user' or a bot)
            if candidate == "user" or candidate in self.bots:
                return candidate
        
        # 2. Fairness (exclude last speaker)
        last_speaker = self.session_state.last_speaker
        candidates = [name for name in self.bots.keys()]
        
        # Filter out last speaker if possible (avoid self-reply unless only 1 bot)
        if last_speaker and len(candidates) > 1:
            candidates = [c for c in candidates if c != last_speaker]
            
        # Find min turns among candidates
        min_turns = min(self.session_state.turn_counts.get(c, 0) for c in candidates)
        best_candidates = [c for c in candidates if self.session_state.turn_counts.get(c, 0) == min_turns]
        
        import random
        return random.choice(best_candidates)

# ==== SESSION STATE WRAPPER ====

class GdSessionState:
    def __init__(self, session_model: GdSession, duration: int, user_name: str):
        self.model = session_model
        self.user_name = user_name
        self.start_time = datetime.now()
        self.duration = duration
        self.phase = "prep"
        self.turn_counts = {"user": 0, "alex": 0, "sarah": 0, "mike": 0}
        self.next_speaker = None
        self.last_speaker = None
        self.pause_count = 0
        self.pause_duration = 0
        self.prep_time_used = 0

# ==== SESSION MANAGEMENT ====

def start_gd_session(userId: int, topic: str, difficulty: str, duration: int = 600):
    """Initialize a new GD session"""
    sessionId = str(uuid.uuid4())
    
    # Generic User Name
    user_name = "User"
    
    bots = [
        {"name": "Alex", "personality": "Analytical"},
        {"name": "Sarah", "personality": "Creative"},
        {"name": "Mike", "personality": "Critical"}
    ]
    
    session_model = GdSession(
        sessionId=sessionId,
        userId=userId,
        topic=topic,
        difficulty=difficulty,
        bots=bots,
        messages=[]
    )
    
    # Use wrapper for state management
    session_state = GdSessionState(session_model, duration, user_name)
    GD_SESSIONS[sessionId] = session_state
    
    return {
        "sessionId": sessionId,
        "topic": topic,
        "difficulty": difficulty,
        "duration": duration,
        "bots": bots,
        "userName": user_name,
        "moderatorMessage": f"Topic: '{topic}'. Take 60 seconds to prepare, or start immediately."
    }

def process_message(sessionId: str, userId: int, message: str, action: str = "speak"):
    """
    Orchestrates the turn loop using GDMonitor.
    """
    session_state = GD_SESSIONS.get(sessionId)
    if not session_state:
        return None
    
    # Handle pause action
    if action == "pause":
        session_state.pause_count += 1
        return {"status": "paused", "pauseCount": session_state.pause_count}
    
    # Instantiating Monitor
    monitor = GDMonitor(session_state)
    
    # CRITICAL FIX: If it was User's turn and they are acting now (speaking or silence break),
    # we must clear the expectation that "User needs to speak".
    if session_state.next_speaker == "user":
        session_state.next_speaker = None

    # Handle silence break
    if action == "silence_break":
        # Do not add a user message, just trigger a bot response
        # Force a bot that didn't speak last to intervene
        session_state.turn_counts["user"] += 0 # No turn taken
        # Logic continues below to Turn Resolution, but we need to ensure chain starts
    else:
        # 1. Record User Message
        msg_entry = {
            "role": "user", 
            "speaker": session_state.user_name,
            "content": message, 
            "timestamp": datetime.now().isoformat()
        }
        session_state.model.messages.append(msg_entry)
        session_state.turn_counts["user"] += 1
        session_state.last_speaker = "user"
    
    # 2. Parse Handoff from User (if they spoke)
    if action != "silence_break":
        handoff_target = monitor.parse_handoff(message)
        if handoff_target:
            session_state.next_speaker = handoff_target
    
    # 3. Turn Resolution Loop
    generated_messages = []
    # Allow natural bot-to-bot conversation with random chain lengths
    import random
    MAX_CHAIN_LENGTH = random.randint(1, 3)
    chain_count = 0
    
    while chain_count < MAX_CHAIN_LENGTH:
        # Ask Monitor: Who is next?
        next_speaker_name = monitor.decide_next_speaker()
        
        # If Monitor says it's User's turn, we stop the bot chain
        if next_speaker_name == "user":
            session_state.next_speaker = "user" # Ensure frontend knows
            break
            
        # Otherwise, it's a Bot
        bot = monitor.bots.get(next_speaker_name)
        if not bot:
            break # Should not happen
            
        # Prepare System Prompt Extras
        prompt_override = ""
        is_last_turn = (chain_count >= MAX_CHAIN_LENGTH - 1)
        
        # Inject Silence Prompt if this is the first bot responding to a silence break
        if action == "silence_break" and chain_count == 0:
            prompt_override += " The User has been silent. Invite them into the conversation GENTLY (e.g. 'User, what are your thoughts?'), but DO NOT assume their opinion or reference nonexistent messages."
        
        if is_last_turn:
            prompt_override += " This is the last message in this chain. Consider handing off to the User with a question (e.g., 'User, what's your take on this?'), OR make a strong concluding point that invites further discussion. Keep the conversation natural."

        # Check for Time-Based Conclusion (Global check)
        # We need to estimate time based on turns or check real time if object available
        elapsed_check = (datetime.now() - session_state.start_time).total_seconds() - session_state.pause_duration
        remaining_check = max(0, session_state.duration - int(elapsed_check))
        
        if remaining_check < 60:
            prompt_override += " TIME WARNING: The session is almost over (< 60s). You MUST start concluding your points. Ask the User to provide their final conclusion."


        # Generate Bot Content
        bot_response_text = bot.generate_response(
            topic=session_state.model.topic,
            context_messages=session_state.model.messages,
            system_prompt_extras=prompt_override
        )
        
        # Record Bot Message
        bot_msg_entry = {
            "role": "bot",
            "speaker": bot.name,
            "content": bot_response_text,
            "timestamp": datetime.now().isoformat()
        }
        session_state.model.messages.append(bot_msg_entry)
        session_state.turn_counts[bot.name.lower()] = session_state.turn_counts.get(bot.name.lower(), 0) + 1
        session_state.last_speaker = bot.name.lower()
        
        generated_messages.append({
            "speaker": bot.name,
            "text": bot_response_text,
            "timestamp": bot_msg_entry["timestamp"]
        })
        
        # CRITICAL: Check if this Bot handed off to someone else
        # This updates session_state.next_speaker, so the loop (or frontend) knows who's next.
        bot_handoff = monitor.parse_handoff(bot_response_text)
        if bot_handoff:
            session_state.next_speaker = bot_handoff
            # IMMEDIATE BREAK: If bot handed off to User, stop the chain NOW
            if bot_handoff == "user":
                break
            
        chain_count += 1
        
        # Calculate time passed to inject "Conclusion" prompts
        elapsed_now = (datetime.now() - session_state.start_time).total_seconds() - session_state.pause_duration
        remaining = max(0, session_state.duration - int(elapsed_now))
        
        # If less than 60 seconds left, force next bot (if any) or this bot to conclude
        if remaining < 60 and not is_last_turn:
             # This prompt will affect next iteration's bot if we continue
             pass 

    # 4. Finalize Response
    elapsed = (datetime.now() - session_state.start_time).total_seconds() - session_state.pause_duration
    time_remaining = max(0, session_state.duration - int(elapsed))
    in_conclusion_phase = time_remaining <= 120
    
    # Check for "Conclude" keyword in discussion phase (last 2 mins)
    should_end_session = False
    if in_conclusion_phase:
        # Check user message
        if re.search(r"i\s+(?:would like to\s+)?conclude", message.lower()):
            should_end_session = True
        # Check bot messages
        for m in generated_messages:
             if re.search(r"i\s+(?:would like to\s+)?conclude", m['text'].lower()):
                 should_end_session = True

    return {
        "botMessages": generated_messages,
        "nextSpeaker": session_state.next_speaker or "any",
        "timeRemaining": int(time_remaining),
        "canConclude": in_conclusion_phase,
        "shouldEndSession": should_end_session,
        "turnCounts": session_state.turn_counts
    }

def generate_comprehensive_score(sessionId: str, userId: int):
    """Generate 6-metric scoring for GD performance"""
    session_state = GD_SESSIONS.get(sessionId)
    if not session_state:
        return None
    
    # Extract user messages
    user_messages = [m for m in session_state.model.messages if m.get("role") == "user"]
    user_text = " | ".join([m.get("content", "") for m in user_messages])
    
    # All messages for context
    all_discussion = "\n".join([
        f"{m.get('speaker', 'Unknown')}: {m.get('content', '')}"
        for m in session_state.model.messages
    ])
    
    pause_penalty = session_state.pause_count * 2
    
    scoring_prompt = f"""
    Evaluate the following group discussion participant based on their performance.
    
    Topic: "{session_state.model.topic}"
    Difficulty: {session_state.model.difficulty}
    
    User Statistics:
    - Turns taken: {session_state.turn_counts.get('user', 0)}
    - Pauses detected: {session_state.pause_count} (Penalty: -{pause_penalty} points)
    
    Transcript of Discussion:
    {all_discussion}
    
    CRITICAL SCORING INSTRUCTIONS:
    1. Focus PURELY on communication skills, confidence, leadership, and articulation.
    2. DO NOT penalize for factual inaccuracies. The user can "lie" or make up facts as long as they sound confident and convincing.
    3. Evaluate HOW they speak, not just WHAT they speak.
    4. Deduct points heavily for the {session_state.pause_count} pauses recorded.
    
    Provide a JSON response with the following structure:
    {{
        "verbalAbility": (0-100),
        "confidence": (0-100),
        "interactivity": (0-100),
        "argumentQuality": (0-100),
        "topicRelevance": (0-100),
        "leadership": (0-100),
        "overallScore": (0-100),
        "feedback": "2-3 sentences summary focusing on delivery and impact.",
        "strengths": ["point 1", "point 2"],
        "improvements": ["point 1", "point 2"]
    }}
    """

    messages = [
        {"role": "system", "content": "You are a professional group discussion evaluator. Return only valid JSON."},
        {"role": "user", "content": scoring_prompt}
    ]
    
    resp = get_gpt_response(messages, max_tokens=400)
    
    if resp and 'choices' in resp:
        try:
            content = resp['choices'][0]['message']['content']
            content = content.replace("```json", "").replace("```", "").strip()
            scores = json.loads(content)
            
            # Apply pause penalty
            if session_state.pause_count > 0:
                penalty = session_state.pause_count * 2
                scores["overallScore"] = max(0, scores.get("overallScore", 0) - penalty)
                scores["pausePenalty"] = penalty
                scores["pauseCount"] = session_state.pause_count
            
            return scores
        except Exception as e:
            print(f"Error parsing scores: {e}")
    
    # Fallback scoring
    participation_rate = min(100, int((session_state.turn_counts.get("user", 0) / max(1, len(session_state.model.messages))) * 200))
    base_score = max(0, 75 - (session_state.pause_count * 2))
    
    return {
        "verbalAbility": 75,
        "confidence": 70,
        "interactivity": participation_rate,
        "argumentQuality": 75,
        "topicRelevance": 80,
        "leadership": 65,
        "overallScore": base_score,
        "feedback": "Good effort. Continue practicing active listening and building on others' points.",
        "strengths": ["Participation", "On-topic contributions"],
        "improvements": ["Develop arguments further",  "Acknowledge others more"],
        "pauseCount": session_state.pause_count,
        "pausePenalty": session_state.pause_count * 2 if session_state.pause_count > 0 else 0
    }

# Keep existing functions for compatibility
def generate_gd_feedback(sessionId: str, userId: int):
    """Legacy function - redirects to comprehensive scoring"""
    scores = generate_comprehensive_score(sessionId, userId)
    if scores:
        return {
            "feedback": scores.get("feedback", ""),
            "participationScore": scores.get("interactivity", 75),
            "communicationQuality": scores.get("verbalAbility", 75)
        }
    return {
        "feedback": "Keep practicing!",
        "participationScore": 70,
        "communicationQuality": 75
    }

def generate_gd_end_summary(sessionId: str, userId: int, userMessages: list):
    """Generate final summary using comprehensive scoring"""
    return generate_comprehensive_score(sessionId, userId)

def save_result(result: GdResult):
    result.id = str(uuid.uuid4())
    GD_RESULTS.append(result)
    return result

def get_history(userId: int):
    return [r for r in GD_RESULTS if r.userId == userId]
