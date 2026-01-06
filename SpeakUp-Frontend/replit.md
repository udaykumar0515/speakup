# SpeakUp

## Overview

SpeakUp is a web platform designed to help college students prepare for placements through aptitude practice, mock interviews, group discussion simulation, and resume analysis. The application features a React frontend with a clean dashboard interface and an Express backend with PostgreSQL database storage.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state, React Context for auth state
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Animations**: Framer Motion for page transitions and UI animations
- **Typography**: DM Sans (body) and Outfit (display) fonts

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod schema validation
- **Build**: esbuild for server bundling, Vite for client

### Authentication
- **Current State**: Mock authentication using localStorage (placeholder implementation)
- **Future State**: Firebase Authentication (email/password) - configuration exists in `client/src/lib/firebase.ts`
- **Protected Routes**: Implemented via `ProtectedRoute` wrapper component that redirects unauthenticated users

### Data Layer
- **Schema**: Defined in `shared/schema.ts` using Drizzle ORM
- **Tables**: users, aptitude_results, interview_results, gd_results, resume_results
- **Validation**: Zod schemas generated from Drizzle schemas via drizzle-zod

### Project Structure
```
client/           # React frontend
  src/
    components/   # UI components (shadcn/ui based)
    hooks/        # Custom React hooks (auth, API, toast)
    lib/          # Utilities (firebase, queryClient)
    pages/        # Route components
server/           # Express backend
  routes.ts       # API route handlers
  storage.ts      # Database access layer
  db.ts           # Database connection
shared/           # Shared code between client/server
  schema.ts       # Drizzle database schema
  routes.ts       # API route definitions with types
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Database toolkit for type-safe queries

### Authentication (Optional)
- **Firebase**: Prepared but not actively used; requires environment variables:
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_APP_ID`

### Frontend Libraries
- **@tanstack/react-query**: Data fetching and caching
- **framer-motion**: Animations
- **recharts**: Data visualization
- **date-fns**: Date formatting
- **react-dropzone**: File uploads (for resume analyzer)

### UI Framework
- **shadcn/ui**: Component library built on Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework
- **class-variance-authority**: Component variant management