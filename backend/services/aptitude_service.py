import os
import json
import uuid
import random
import requests
from models import AptitudeResult
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

APTITUDE_RESULTS = []

AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_KEY = os.getenv("AZURE_OPENAI_KEY")
GPT_MINI_MODEL = os.getenv("GPT_MINI_MODEL")

def get_gpt_response(messages, model=GPT_MINI_MODEL):
    """Call Azure OpenAI GPT"""
    if not AZURE_OPENAI_ENDPOINT or not AZURE_OPENAI_KEY:
        print(f"❌ Azure credentials missing")
        return None 
    
    print(f"🔵 Calling Azure OpenAI for aptitude questions")
    url = f"{AZURE_OPENAI_ENDPOINT}/openai/v1/chat/completions"
    headers = {
        "api-key": AZURE_OPENAI_KEY,
        "Content-Type": "application/json"
    }
    body = {
        "model": model,
        "messages": messages,
        "temperature": 0.9
    }
    try:
        r = requests.post(url, headers=headers, json=body)
        print(f"🟢 Azure response status: {r.status_code}")
        if r.status_code != 200:
            print(f"❌ Azure error: {r.text}")
        return r.json()
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return None

def load_questions_from_json(topic: str):
    """Load questions from JSON file"""
    file_path = os.path.join(os.path.dirname(__file__), "..", "data", f"{topic.lower()}_questions.json")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ Error loading questions from {file_path}: {e}")
        return []

def shuffle_question_options(question):
    """Shuffle options and update correctAnswer index"""
    q_copy = question.copy()
    correct_text = q_copy['options'][q_copy['correctAnswer']]
    
    # Shuffle options
    random.shuffle(q_copy['options'])
    
    # Update correctAnswer to new index
    q_copy['correctAnswer'] = q_copy['options'].index(correct_text)
    
    return q_copy

def get_random_questions(topic: str, count: int = 20):
    """Get random questions with shuffled options"""
    all_questions = load_questions_from_json(topic)
    
    if not all_questions:
        return []
    
    # Select random questions (or all if count > available)
    num_to_select = min(count, len(all_questions))
    selected = random.sample(all_questions, num_to_select)
    
    # Shuffle options for each question
    shuffled = [shuffle_question_options(q) for q in selected]
    
    return shuffled

def get_ai_powered_questions(topic: str):
    """Generate 3 hard questions using GPT-4.0 Mini"""
    prompt = f"""Generate exactly 3 difficult {topic} aptitude test questions suitable for competitive exams.

Requirements:
- Questions should be challenging and test deep understanding
- Each question must have exactly 4 options
- Provide a detailed explanation for why the correct answer is right

Return ONLY a valid JSON array with this exact structure (no markdown, no code blocks):
[
  {{
    "question": "detailed question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "difficulty": "hard",
    "explanation": "Detailed explanation of why this answer is correct and why others are wrong"
  }}
]

Topic: {topic}"""
    
    messages = [
        {"role": "system", "content": "You are an expert aptitude test creator. Return only valid JSON, no markdown formatting."},
        {"role": "user", "content": prompt}
    ]
    
    resp = get_gpt_response(messages)
    
    if resp and 'choices' in resp:
        try:
            content = resp['choices'][0]['message']['content'].strip()
            # Remove markdown code blocks if present
            content = content.replace("```json", "").replace("```", "").strip()
            questions = json.loads(content)
            
            # Add IDs
            for i, q in enumerate(questions):
                q['id'] = i + 1
            
            return questions
        except json.JSONDecodeError as e:
            print(f"❌ JSON decode error: {e}")
            print(f"Content: {content}")
        except Exception as e:
            print(f"❌ Error parsing AI response: {e}")
    
    # Fallback if AI fails
    return get_random_questions(topic, 3)

def submit_test(userId: int, topic: str, questions: list, answers: list, timeTaken: int = 0):
    """
    Submit aptitude test answers and generate comprehensive results
    """
    from datetime import datetime
    
    # Calculate results
    correct_count = 0
    incorrect_count = 0
    unanswered_count = 0
    question_breakdown = []
    
    for idx, question in enumerate(questions):
        user_answer = answers[idx] if idx < len(answers) else None
        correct_answer = question.get("correctAnswer", 0)
        
        is_correct = user_answer == correct_answer if user_answer is not None else False
        
        if user_answer is None:
            unanswered_count += 1
            status = "unanswered"
        elif is_correct:
            correct_count += 1
            status = "correct"
        else:
            incorrect_count += 1
            status = "incorrect"
        
        question_breakdown.append({
            "questionNumber": idx + 1,
            "questionText": question.get("question", ""),
            "options": question.get("options", []),
            "correctAnswer": correct_answer,
            "userAnswer": user_answer,
            "status": status,
            "explanation": question.get("explanation", "")
        })
    
    # Calculate score
    total_questions = len(questions)
    score_percentage = round((correct_count / total_questions) * 100) if total_questions > 0 else 0
    
    # Calculate completion metrics
    questions_answered = total_questions - unanswered_count
    completion_percentage = round((questions_answered / total_questions) * 100) if total_questions > 0 else 0
    
    # Create result object
    result = AptitudeResult(
        id=str(uuid.uuid4()),
        userId=userId,
        topic=topic,
        score=score_percentage,
        totalQuestions=total_questions,
        accuracy=score_percentage,
        timeTaken=timeTaken,
        createdAt=datetime.now().isoformat()
    )
    
    # Save to storage
    APTITUDE_RESULTS.append(result)
    
    # Return comprehensive results
    return {
        "id": result.id,
        "topic": topic,
        "score": score_percentage,
        "totalQuestions": total_questions,
        "correctAnswers": correct_count,
        "incorrectAnswers": incorrect_count,
        "unansweredQuestions": unanswered_count,
        "accuracy": score_percentage,
        "timeTaken": timeTaken,
        "createdAt": result.createdAt,
        "completionMetrics": {
            "questionsAnswered": questions_answered,
            "totalQuestions": total_questions,
            "completionPercentage": completion_percentage,
            "timeTakenMinutes": round(timeTaken / 60) if timeTaken > 0 else 0,
            "isFullyCompleted": unanswered_count == 0
        },
        "questionBreakdown": question_breakdown,
        "performanceLevel": (
            "Excellent" if score_percentage >= 90 else
            "Very Good" if score_percentage >= 75 else
            "Good" if score_percentage >= 60 else
            "Average" if score_percentage >= 50 else
            "Needs Improvement"
        )
    }

def save_result(result: AptitudeResult):
    result.id = str(uuid.uuid4())
    APTITUDE_RESULTS.append(result)
    return result

def get_history(userId: int):
    return [r for r in APTITUDE_RESULTS if r.userId == userId]

