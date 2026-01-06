# SpeakUp - Project Documentation

## Project Overview
SpeakUp is a comprehensive AI-powered placement preparation platform designed for college students. The application centralizes essential preparation tools—Aptitude Testing, Mock Interviews, Group Discussion (GD) Simulation, and Resume Analysis—into a single, cohesive user experience. 

The project follows a modern full-stack architecture with a React-based frontend and an Express/PostgreSQL backend, utilizing AI (simulated in the current frontend phase) to provide real-time feedback and evaluation.

---

## Page-by-Page Breakdown

### 1. Authentication (Login/Signup)
*   **Purpose**: Manages user access and session persistence.
*   **Functionality**: 
    *   Secure user registration and login using Firebase Authentication (currently mocked for frontend flow).
    *   Local storage persistence to keep users logged in during development.
    *   Form validation using Zod to ensure valid email and password formats.
*   **State**: Fully functional (Mocked Auth logic).

### 2. Dashboard
*   **Purpose**: The central hub for user activity and navigation.
*   **Functionality**:
    *   Quick access to all preparation modules (Aptitude, Interview, GD, Resume).
    *   Summary display of user progress and recent activities.
    *   Responsive layout with a collapsible sidebar for efficient navigation.
*   **State**: Fully functional UI with dynamic route navigation.

### 3. Aptitude Practice
*   **Purpose**: Enhances quantitative, logical, and verbal reasoning skills.
*   **Functionality**:
    *   **Topic Selection**: Users choose between Quantitative, Logical, or Verbal reasoning.
    *   **Quiz Interface**: A timed, interactive quiz experience with progress tracking.
    *   **Evaluation**: Real-time calculation of scores and accuracy.
    *   **Result Display**: Circular progress visualization of performance metrics.
*   **State**: Frontend logic and UI fully implemented. Results are saved to the history via API hooks.

### 4. Mock Interview (AI-Powered)
*   **Purpose**: Simulates a real-world technical or HR interview environment.
*   **Functionality**:
    *   **Chat Interface**: Real-time message exchange between a user and an "AI Interviewer".
    *   **Voice Integration**: Toggleable microphone support for hands-free answering (simulated).
    *   **AI Feedback**: Post-session analysis scoring the user on Communication, Confidence, and Relevance.
    *   **STAR Method Guidance**: AI provides specific constructive feedback on structuring answers.
*   **State**: Chat UI and feedback loop fully structured to receive backend AI responses.

### 5. Group Discussion (GD) Simulator
*   **Purpose**: Prepares students for group discussions by simulating a multi-participant environment.
*   **Functionality**:
    *   **Multi-Participant Chat**: Simultaneous interactions between the user and 3 AI bots (Sarah, Mike, Priya), each with unique personas (Analytical, Aggressive, Balanced).
    *   **Moderator Flow**: Guided discussion with an AI moderator introducing topics and timing the session.
    *   **Persona Logic**: Bots react randomly to provide a dynamic and unpredictable discussion environment.
    *   **Scoring**: Post-session performance evaluation based on participation and argument quality.
*   **State**: Multi-persona simulation logic fully implemented on the frontend.

### 6. Resume Analyzer (ATS)
*   **Purpose**: Optimizes student resumes for Applicant Tracking Systems (ATS).
*   **Functionality**:
    *   **File Upload**: Drag-and-drop support for PDF resumes.
    *   **ATS Scoring**: Instant scoring based on resume keywords and structure.
    *   **Data Extraction**: Automatic parsing of Name, Email, Skills, Experience, and Education.
    *   **Improvement Suggestions**: Actionable bullet points to improve the resume's effectiveness.
*   **State**: Upload UI and result parsing section fully implemented.

### 7. Profile & History
*   **Purpose**: User management and historical performance tracking.
*   **Functionality**:
    *   **Personal Info**: Editable fields for Name, Age, Occupation, and Gender.
    *   **Avatar Selection**: Customizable profile pictures using integrated Dicebear avatar sets.
    *   **History Tabs**: Centralized access to all past Aptitude, Interview, and GD results.
    *   **Persistence**: All updates are synced with the user's session and database profile.
*   **State**: Fully functional with local persistence and API hooks.

---

## Technical Architecture Summary
*   **Frontend**: React + TypeScript + Vite + Tailwind CSS (Shadcn UI).
*   **Routing**: Wouter (Client-side) with `ProtectedRoute` wrappers.
*   **Data Fetching**: TanStack React Query (v5) for caching and optimistic updates.
*   **Validation**: Zod (Shared schemas between frontend and backend).
*   **Database**: PostgreSQL (Managed via Drizzle ORM).
