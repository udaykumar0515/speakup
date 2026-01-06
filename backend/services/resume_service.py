import os
import time
import requests
import uuid
from models import ResumeResult

RESUME_RESULTS = []

DOC_KEY = os.getenv("DOC_KEY")
DOC_ENDPOINT = os.getenv("DOC_ENDPOINT")

def analyze_resume_content(file_data: bytes):
    if not DOC_KEY or not DOC_ENDPOINT:
        return {"error": "Azure credentials missing"}
        
    submit_url = f"{DOC_ENDPOINT}/documentintelligence/documentModels/prebuilt-read:analyze?api-version=2024-02-29-preview"
    headers = {
        "Ocp-Apim-Subscription-Key": DOC_KEY,
        "Content-Type": "application/pdf"
    }
    
    try:
        resp = requests.post(submit_url, headers=headers, data=file_data)
        if resp.status_code != 202:
            return {"error": f"Submission failed: {resp.text}"}
            
        operation_url = resp.headers["Operation-Location"]
        
        for _ in range(30):
            result = requests.get(operation_url, headers={"Ocp-Apim-Subscription-Key": DOC_KEY})
            data = result.json()
            status = data.get("status")
            
            if status == "succeeded":
                return extract_data(data)
            if status == "failed":
                return {"error": "Analysis failed"}
                
            time.sleep(1)
        return {"error": "Timeout"}
    except Exception as e:
        return {"error": str(e)}

def extract_data(azure_data):
    content = azure_data.get("analyzeResult", {}).get("content", "")
    return {
        "fullText": content,
        "atsScore": 78,
        "suggestions": ["Use clearer headings", "Quantify impact"],
        "parsedData": {
            "name": "Candidate",
            "email": "email@example.com",
            "skills": ["Python", "React"],
            "experience": "Detected Experience...",
            "education": "Detected Education..."
        }
    }

def save_result(result: ResumeResult):
    result.id = str(uuid.uuid4())
    RESUME_RESULTS.append(result)
    return result

def get_history(userId: int):
    return [r for r in RESUME_RESULTS if r.userId == userId]
