# SpeakUp - API Reference

This document lists all the API endpoints defined in the project. These routes are used to sync user performance data, manage profiles, and will be the touchpoints for backend integration.

## Base URL
All endpoints are prefixed with `/api`.

---

## 1. User Profile API
Endpoints for managing user personal information and metadata.

### **Get User Profile**
*   **Path**: `/api/users/:id`
*   **Method**: `GET`
*   **Response (200)**: 
    ```json
    {
      "id": 1,
      "email": "user@example.com",
      "name": "User Name",
      "age": 25,
      "gender": "male",
      "occupation": "student",
      "avatarUrl": "https://api.dicebear.com/...",
      "firebaseUid": "uid_string",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
    ```
*   **Errors**: `404 Not Found`

### **Update User Profile**
*   **Path**: `/api/users/:id`
*   **Method**: `PUT`
*   **Input Body**:
    ```json
    {
      "name": "Updated Name",
      "age": 26,
      "gender": "female",
      "occupation": "professional",
      "avatarUrl": "..."
    }
    ```
*   **Response (200)**: Updated User Object
*   **Errors**: `404 Not Found`, `400 Validation Error`

---

## 2. Aptitude API
Endpoints for tracking aptitude test performance.

### **List Aptitude History**
*   **Path**: `/api/aptitude/history/:userId`
*   **Method**: `GET`
*   **Response (200)**: Array of Aptitude Result objects.

### **Create Aptitude Result**
*   **Path**: `/api/aptitude`
*   **Method**: `POST`
*   **Input Body**:
    ```json
    {
      "userId": 1,
      "topic": "quantitative",
      "score": 85,
      "totalQuestions": 10,
      "accuracy": 85,
      "timeTaken": 120
    }
    ```
*   **Response (201)**: Created Result Object

---

## 3. Mock Interview API
Endpoints for tracking mock interview feedback and scores.

### **List Interview History**
*   **Path**: `/api/interview/history/:userId`
*   **Method**: `GET`
*   **Response (200)**: Array of Interview Result objects.

### **Create Interview Result**
*   **Path**: `/api/interview`
*   **Method**: `POST`
*   **Input Body**:
    ```json
    {
      "userId": 1,
      "communicationScore": 90,
      "confidenceScore": 80,
      "relevanceScore": 85,
      "feedback": "Great response structure."
    }
    ```
*   **Response (201)**: Created Result Object

---

## 4. Group Discussion (GD) API
Endpoints for tracking performance in simulated GD sessions.

### **List GD History**
*   **Path**: `/api/gd/history/:userId`
*   **Method**: `GET`
*   **Response (200)**: Array of GD Result objects.

### **Create GD Result**
*   **Path**: `/api/gd`
*   **Method**: `POST`
*   **Input Body**:
    ```json
    {
      "userId": 1,
      "topic": "AI vs Jobs",
      "duration": 600,
      "score": 88
    }
    ```
*   **Response (201)**: Created Result Object

---

## 5. Resume Analysis API
Endpoints for tracking ATS scores and parsing results.

### **List Resume History**
*   **Path**: `/api/resume/history/:userId`
*   **Method**: `GET`
*   **Response (200)**: Array of Resume Result objects.

### **Create Resume Result**
*   **Path**: `/api/resume`
*   **Method**: `POST`
*   **Input Body**:
    ```json
    {
      "userId": 1,
      "atsScore": 75,
      "suggestions": ["Add more keywords", "Simplify layout"],
      "fileName": "resume.pdf"
    }
    ```
*   **Response (201)**: Created Result Object

---

## 6. AI Interaction API
Endpoints for real-time AI responses and analysis.

### **AI Chat Response**
*   **Path**: `/api/ai/chat`
*   **Method**: `POST`
*   **Description**: Used by Mock Interview and GD modules to get AI-generated responses.
*   **Input Body**:
    ```json
    {
      "message": "User's current input message",
      "context": "interview" | "gd",
      "history": [
        { "role": "user", "text": "..." },
        { "role": "bot", "text": "..." }
      ]
    }
    ```
*   **Response (200)**: 
    ```json
    {
      "response": "The AI's generated response string"
    }
    ```

### **AI Resume Analysis**
*   **Path**: `/api/ai/analyze-resume`
*   **Method**: `POST`
*   **Description**: Processes resume content to provide ATS scores and data extraction.
*   **Input Body**:
    ```json
    {
      "fileContent": "Base64 encoded string or raw text"
    }
    ```
*   **Response (200)**: 
    ```json
    {
      "atsScore": 85,
      "suggestions": ["...", "..."],
      "parsedData": {
        "name": "...",
        "email": "...",
        "skills": ["...", "..."],
        "experience": "...",
        "education": "..."
      }
    }
    ```

---

## Shared Schema Structures

### **Aptitude Result**
| Field | Type | Description |
| :--- | :--- | :--- |
| id | serial | Primary Key |
| userId | integer | User Foreign Key |
| topic | text | quant, logical, verbal |
| score | integer | Percentage score |
| accuracy | integer | Accuracy percentage |
| timeTaken| integer | Time in seconds |

### **Interview Result**
| Field | Type | Description |
| :--- | :--- | :--- |
| communicationScore | integer | 0-100 |
| confidenceScore | integer | 0-100 |
| relevanceScore | integer | 0-100 |
| feedback | text | Detailed AI feedback |

### **Error Schema**
```json
{
  "message": "Error description",
  "field": "Optional field name for validation errors"
}
```
