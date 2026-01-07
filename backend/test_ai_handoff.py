import requests

BASE_URL = "http://127.0.0.1:8000/api/gd"

# Start session
res = requests.post(f"{BASE_URL}/start", json={
    "userId": 1,
    "topic": "AI Handoff Test",
    "difficulty": "medium",
    "duration": 600
})

session_id = res.json()['sessionId']

# Test case: "I would like to ask Sarah, is there any way..."
user_message = "I think this is a complex issue. I would like to ask Sarah, is there any way we can solve this problem?"

print(f"Testing AI handoff detection...")
print(f"User says: '{user_message}'")

res = requests.post(f"{BASE_URL}/message", json={
    "sessionId": session_id,
    "userId": 1,
    "message": user_message,
    "action": "speak"
})

data = res.json()
bots = data.get('botMessages', [])
next_speaker = data.get('nextSpeaker')

print(f"\nBots that responded: {len(bots)}")
for b in bots:
    print(f"- {b['speaker']}: {b['text'][:70]}...")
    
print(f"\nNext Speaker: {next_speaker}")

# Expected: Sarah should respond, then hand back to User
if len(bots) >= 1 and bots[0]['speaker'] == 'Sarah':
    print("\n✅ PASS: AI detected handoff to Sarah correctly!")
else:
    print(f"\n❌ FAIL: Expected Sarah to respond, got {bots[0]['speaker'] if bots else 'no one'}")
