import os
import time
import requests
import uuid
import json
from models import ResumeResult
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

RESUME_RESULTS = []

# Azure credentials
DOC_KEY = os.getenv("DOC_KEY")
DOC_ENDPOINT = os.getenv("DOC_ENDPOINT")
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_KEY = os.getenv("AZURE_OPENAI_KEY")
GPT_FULL_MODEL = os.getenv("GPT_FULL_MODEL")

def analyze_resume_content(file_data: bytes):
    """
    Two-step AI-powered resume analysis:
    1. Doc AI → Extract text from PDF
    2. GPT-4 Full → Comprehensive analysis (parsing, scoring, suggestions)
    """
    if not DOC_KEY or not DOC_ENDPOINT:
        return {"error": "Azure Document Intelligence credentials missing"}
    
    if not AZURE_OPENAI_ENDPOINT or not AZURE_OPENAI_KEY:
        return {"error": "Azure OpenAI credentials missing"}
        
    # STEP 1: Extract text from PDF using Azure Document Intelligence
    print("📄 Step 1: Extracting text from PDF using Doc AI...")
    extracted_text = extract_text_from_pdf(file_data)
    
    if "error" in extracted_text:
        return extracted_text
    
    full_text = extracted_text["fullText"]
    print(f"✅ Extracted {len(full_text)} characters from PDF")
    
    # STEP 2: Send extracted text to GPT-4 Full for comprehensive analysis
    print("🧠 Step 2: Analyzing with GPT-4 Full (parsing + scoring + suggestions)...")
    analysis = analyze_with_gpt4_full(full_text)
    
    if "error" in analysis:
        return analysis
    
    print("✅ Analysis complete!")
    return analysis

def extract_text_from_pdf(file_data: bytes):
    """
    Use Azure Document Intelligence to extract raw text from PDF
    """
    submit_url = f"{DOC_ENDPOINT}/documentintelligence/documentModels/prebuilt-read:analyze?api-version=2024-02-29-preview"
    headers = {
        "Ocp-Apim-Subscription-Key": DOC_KEY,
        "Content-Type": "application/pdf"
    }
    
    try:
        resp = requests.post(submit_url, headers=headers, data=file_data, timeout=30)
        if resp.status_code != 202:
            return {"error": f"Document submission failed: {resp.text}"}
            
        operation_url = resp.headers["Operation-Location"]
        
        # Poll for completion (max 30 seconds)
        for _ in range(30):
            result = requests.get(operation_url, headers={"Ocp-Apim-Subscription-Key": DOC_KEY}, timeout=10)
            data = result.json()
            status = data.get("status")
            
            if status == "succeeded":
                content = data.get("analyzeResult", {}).get("content", "")
                return {"fullText": content}
            if status == "failed":
                return {"error": "Document analysis failed"}
                
            time.sleep(1)
        return {"error": "Document analysis timeout"}
    except Exception as e:
        return {"error": f"Document extraction error: {str(e)}"}

def analyze_with_gpt4_full(resume_text: str):
    """
    Send extracted text to GPT-4 Full for complete analysis:
    - Parse all sections (skills, experience, education, etc.)
    - Calculate ATS score (0-100)
    - Generate improvement suggestions
    """
    analysis_prompt = f"""You are an expert ATS (Applicant Tracking System) and professional HR recruiter analyzing a resume.

RESUME TEXT:
{resume_text}

TASK: Provide a comprehensive analysis of this resume. Respond in VALID JSON format with these exact keys:

{{
  "fullText": "{resume_text[:500]}...",
  "parsedData": {{
    "name": "Full name of candidate",
    "email": "Email address or 'Not found'",
    "phone": "Phone number or 'Not found'",
    "skills": ["list", "of", "all", "technical", "and", "soft", "skills"],
    "experience": "Brief summary of work experience (2-3 sentences highlighting key roles and achievements)",
    "education": "Education details (degrees, institutions, years)",
    "certifications": ["list", "of", "certifications"] or [],
    "summary": "Professional summary/objective if present, otherwise generate a compelling 2-3 line summary based on their background"
  }},
  "atsScore": <number between 0-100>,
  "suggestions": ["list", "of", "5-8", "actionable", "improvement", "suggestions"]
}}

SCORING CRITERIA (0-100):
- Contact info completeness (15 pts)
- Number and relevance of skills (20 pts)
- Experience detail and quantification (25 pts)
- Education clarity (15 pts)
- Use of action verbs and keywords (15 pts)
- Quantifiable achievements (numbers, percentages) (10 pts)

SUGGESTION GUIDELINES:
- Be specific and actionable
- Focus on ATS optimization
- Include formatting, keyword, and content improvements
- Prioritize high-impact changes
- Use emojis for better readability (✅, 💡, 📊, etc.)

Respond ONLY with valid JSON, no markdown formatting."""

    try:
        url = f"{AZURE_OPENAI_ENDPOINT}/openai/v1/chat/completions"
        headers = {
            "api-key": AZURE_OPENAI_KEY,
            "Content-Type": "application/json"
        }
        body = {
            "model": GPT_FULL_MODEL,
            "messages": [
                {"role": "system", "content": "You are an expert ATS analyzer and HR professional. Always respond with valid JSON only."},
                {"role": "user", "content": analysis_prompt}
            ],
            "temperature": 0.4,
            "max_tokens": 2000
        }
        
        r = requests.post(url, headers=headers, json=body, timeout=60)
        if r.status_code != 200:
            return {"error": f"GPT-4 API error: {r.text}"}
        
        response_text = r.json()["choices"][0]["message"]["content"].strip()
        
        # Clean markdown if present
        if response_text.startswith("```json"):
            response_text = response_text.replace("```json", "").replace("```", "").strip()
        elif response_text.startswith("```"):
            response_text = response_text.replace("```", "").strip()
        
        parsed = json.loads(response_text)
        
        # Ensure fullText is the complete extracted text, not truncated
        parsed["fullText"] = resume_text
        
        return parsed
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON Parse Error: {str(e)}")
        print(f"Response was: {response_text[:500]}...")
        return {"error": f"Failed to parse GPT-4 response as JSON: {str(e)}"}
    except Exception as e:
        return {"error": f"GPT-4 analysis error: {str(e)}"}

def save_result(result: ResumeResult):
    result.id = str(uuid.uuid4())
    RESUME_RESULTS.append(result)
    return result

def get_history(userId: int):
    return [r for r in RESUME_RESULTS if r.userId == userId]
