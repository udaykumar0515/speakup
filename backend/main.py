from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- ENVIRONMENT ----------
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
    return {"status": "SpeakUp backend running 🚀"}


# ---------- 1) CHAT — GPT-4.1 MINI ----------
@app.post("/chat-mini")
async def chat_mini(message: str = Form(...)):

    url = f"{AZURE_OPENAI_ENDPOINT}/openai/v1/chat/completions"

    headers = {
        "api-key": AZURE_OPENAI_KEY,
        "Content-Type": "application/json"
    }

    body = {
        "model": GPT_MINI_MODEL,
        "messages": [
            {"role": "user", "content": message}
        ]
    }

    r = requests.post(url, headers=headers, json=body)
    return r.json()


# ---------- 2) CHAT — GPT-4.1 FULL ----------
@app.post("/chat-full")
async def chat_full(message: str = Form(...)):

    url = f"{AZURE_OPENAI_ENDPOINT}/openai/v1/chat/completions"

    headers = {
        "api-key": AZURE_OPENAI_KEY,
        "Content-Type": "application/json"
    }

    body = {
        "model": GPT_FULL_MODEL,
        "messages": [
            {"role": "user", "content": message}
        ]
    }

    r = requests.post(url, headers=headers, json=body)
    return r.json()


# ---------- 3) SPEECH TO TEXT ----------
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

    print("STT STATUS:", resp.status_code)
    print("STT RESPONSE PREVIEW:", resp.text[:300])

    try:
        return resp.json()
    except:
        return {"status": resp.status_code, "text": resp.text}


# ---------- 4) TEXT TO SPEECH ----------
from fastapi.responses import StreamingResponse
from io import BytesIO

@app.post("/tts")
async def text_to_speech(text: str = Form(...)):

    url = f"https://{SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1"

    headers = {
        "Ocp-Apim-Subscription-Key": SPEECH_KEY,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-16khz-32kbitrate-mono-mp3"
    }

    ssml = f"""
    <speak version='1.0' xml:lang='en-US'>
        <voice xml:lang='en-US' name='en-US-JennyNeural'>
            {text}
        </voice>
    </speak>
    """

    resp = requests.post(url, headers=headers, data=ssml.encode("utf-8"))

    audio_stream = BytesIO(resp.content)

    return StreamingResponse(audio_stream, media_type="audio/mpeg")
  
# ---------- 5) DOCUMENT INTELLIGENCE ----------
from fastapi.responses import JSONResponse
import time

@app.post("/resume")
async def resume_extract(file: UploadFile = File(...)):

    submit_url = f"{DOC_ENDPOINT}/documentintelligence/documentModels/prebuilt-read:analyze?api-version=2024-02-29-preview"

    headers = {
        "Ocp-Apim-Subscription-Key": DOC_KEY,
        "Content-Type": "application/pdf"
    }

    data = await file.read()

    # ---- Step 1: Submit job
    resp = requests.post(submit_url, headers=headers, data=data)

    if resp.status_code != 202:
        return {"status": resp.status_code, "response": resp.text}

    # ---- Step 2: Get operation URL to poll
    operation_url = resp.headers["Operation-Location"]

    # ---- Step 3: Poll until done
    while True:
        result = requests.get(operation_url, headers={
            "Ocp-Apim-Subscription-Key": DOC_KEY
        })

        result_json = result.json()
        status = result_json["status"]

        if status in ["succeeded", "failed"]:
            break

        time.sleep(1)

    return result_json
