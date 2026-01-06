# SpeakUp - Frontend API Wiring Map

This document serves as a direct wiring guide to connect the React frontend to the Express backend.

---

## 1. Authentication (Login / Signup)
*   **File Path**: `client/src/hooks/use-auth.tsx`
*   **Component**: `AuthProvider`
*   **Action Functions**: `login`, `signup`
*   **Request JSON**: 
    ```json
    { "email": "user@example.com", "password": "password123", "name": "Optional Name" }
    ```
*   **Response JSON**: 
    ```json
    { "id": 1, "email": "user@example.com", "name": "User", "firebaseUid": "..." }
    ```
*   **Current State**: **MOCKED** (Simulates delay, saves to localStorage).

---

## 2. Dashboard Stats
*   **File Path**: `client/src/pages/Dashboard.tsx`
*   **Component**: `Dashboard`
*   **Action Functions**: `useAptitudeHistory`, `useInterviewHistory`, `useGdHistory` (Fetched on mount)
*   **Request JSON**: `GET /api/aptitude/history/:userId` (No body)
*   **Response JSON**: Array of result objects (e.g., `[{ "score": 85, "topic": "logical" }]`)
*   **Current State**: **API READY** (Calls `use-api.ts` hooks, but depends on backend implementation).

---

## 3. Aptitude Quiz
*   **File Path**: `client/src/pages/aptitude/AptitudeQuiz.tsx`
*   **Component**: `AptitudeQuiz`
*   **Action Functions**: `finishQuiz` (Calls `createResult.mutateAsync`)
*   **Request JSON**: 
    ```json
    { "userId": 1, "topic": "quant", "score": 80, "totalQuestions": 10, "accuracy": 80, "timeTaken": 120 }
    ```
*   **Response JSON**: `{ "id": 101, "status": "saved" }`
*   **Current State**: **API READY** (UI logic complete, calls `useCreateAptitudeResult` hook).

---

## 4. Mock Interview
*   **File Path**: `client/src/pages/interview/MockInterview.tsx`
*   **Component**: `MockInterview`
*   **Action Functions**: 
    1.  `handleSend`: Sends message to AI.
    2.  `handleEndInterview`: Saves final results.
*   **Request JSON (Chat)**: `{ "message": "...", "context": "interview" }`
*   **Request JSON (Save)**: `{ "userId": 1, "communicationScore": 85, "confidenceScore": 70, "feedback": "..." }`
*   **Response JSON (Chat)**: `{ "response": "AI interviewer text" }`
*   **Current State**: **MIXED** (Chat logic is mocked with `setTimeout`; result saving calls `useCreateInterviewResult` API hook).

---

## 5. GD Simulator
*   **File Path**: `client/src/pages/gd/GDSimulator.tsx`
*   **Component**: `GDSimulator`
*   **Action Functions**: 
    1.  `handleSend`: Sends message to GD group.
    2.  `handleEnd`: Saves final results.
*   **Request JSON (Chat)**: `{ "message": "...", "context": "gd" }`
*   **Request JSON (Save)**: `{ "userId": 1, "topic": "...", "score": 82, "duration": 600 }`
*   **Response JSON (Chat)**: `{ "response": "AI bot response" }`
*   **Current State**: **MIXED** (Bot interjections are local random logic; result saving calls `useCreateGdResult` API hook).

---

## 6. Resume Analyzer
*   **File Path**: `client/src/pages/resume/ResumeAnalyzer.tsx`
*   **Component**: `ResumeAnalyzer`
*   **Action Functions**: `handleAnalyze` (Calls `createResult.mutateAsync`)
*   **Request JSON (Analyze)**: `{ "fileContent": "Base64..." }`
*   **Request JSON (Save)**: `{ "userId": 1, "atsScore": 75, "suggestions": [...], "fileName": "..." }`
*   **Response JSON**: `{ "atsScore": 78, "suggestions": [...], "parsedData": { ... } }`
*   **Current State**: **MIXED** (Analysis is mocked with `setTimeout`; result saving calls `useCreateResumeResult` API hook).

---

## 7. Profile
*   **File Path**: `client/src/pages/Profile.tsx`
*   **Component**: `Profile`
*   **Action Functions**: `handleSave` (Calls `updateProfile` from `use-auth.tsx`)
*   **Request JSON**: 
    ```json
    { "name": "...", "age": 25, "occupation": "...", "gender": "...", "avatarUrl": "..." }
    ```
*   **Response JSON**: Updated User object.
*   **Current State**: **API READY** (UI form connected to `updateProfile` hook, which currently mocks the final database update).
