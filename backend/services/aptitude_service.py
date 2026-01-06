from models import AptitudeResult
import uuid

APTITUDE_RESULTS = []

QUESTIONS = {
    "quantitative": [
        {"id": 1, "question": "What comes next: 2, 4, 8, 16...?", "options": ["24", "32", "64", "20"], "correctAnswer": 1},
        {"id": 2, "question": "If 2x + 5 = 15, what is x?", "options": ["2", "5", "10", "4"], "correctAnswer": 1},
    ],
    "logical": [
        {"id": 3, "question": "Find the odd one out: Circle, Square, Triangle, Sphere", "options": ["Circle", "Square", "Triangle", "Sphere"], "correctAnswer": 3},
    ],
    "verbal": [
        {"id": 4, "question": "Synonym of 'Happy'?", "options": ["Sad", "Joyful", "Angry", "Fearful"], "correctAnswer": 1},
    ]
}

def get_questions(topic: str):
    return QUESTIONS.get(topic.lower(), [])

def save_result(result: AptitudeResult):
    result.id = str(uuid.uuid4())
    APTITUDE_RESULTS.append(result)
    return result

def get_history(userId: int):
    return [r for r in APTITUDE_RESULTS if r.userId == userId]
