import { 
  users, aptitudeResults, interviewResults, gdResults, resumeResults,
  type User, type InsertUser, type UpdateUser,
  type AptitudeResult, type InsertAptitudeResult,
  type InterviewResult, type InsertInterviewResult,
  type GdResult, type InsertGdResult,
  type ResumeResult, type InsertResumeResult
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User
  getUser(id: number): Promise<User | undefined>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  
  // Aptitude
  getAptitudeHistory(userId: number): Promise<AptitudeResult[]>;
  createAptitudeResult(result: InsertAptitudeResult): Promise<AptitudeResult>;

  // Interview
  getInterviewHistory(userId: number): Promise<InterviewResult[]>;
  createInterviewResult(result: InsertInterviewResult): Promise<InterviewResult>;

  // GD
  getGdHistory(userId: number): Promise<GdResult[]>;
  createGdResult(result: InsertGdResult): Promise<GdResult>;

  // Resume
  getResumeHistory(userId: number): Promise<ResumeResult[]>;
  createResumeResult(result: InsertResumeResult): Promise<ResumeResult>;
}

export class DatabaseStorage implements IStorage {
  // User
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Aptitude
  async getAptitudeHistory(userId: number): Promise<AptitudeResult[]> {
    return await db
      .select()
      .from(aptitudeResults)
      .where(eq(aptitudeResults.userId, userId))
      .orderBy(desc(aptitudeResults.createdAt));
  }

  async createAptitudeResult(result: InsertAptitudeResult): Promise<AptitudeResult> {
    const [newResult] = await db.insert(aptitudeResults).values(result).returning();
    return newResult;
  }

  // Interview
  async getInterviewHistory(userId: number): Promise<InterviewResult[]> {
    return await db
      .select()
      .from(interviewResults)
      .where(eq(interviewResults.userId, userId))
      .orderBy(desc(interviewResults.createdAt));
  }

  async createInterviewResult(result: InsertInterviewResult): Promise<InterviewResult> {
    const [newResult] = await db.insert(interviewResults).values(result).returning();
    return newResult;
  }

  // GD
  async getGdHistory(userId: number): Promise<GdResult[]> {
    return await db
      .select()
      .from(gdResults)
      .where(eq(gdResults.userId, userId))
      .orderBy(desc(gdResults.createdAt));
  }

  async createGdResult(result: InsertGdResult): Promise<GdResult> {
    const [newResult] = await db.insert(gdResults).values(result).returning();
    return newResult;
  }

  // Resume
  async getResumeHistory(userId: number): Promise<ResumeResult[]> {
    return await db
      .select()
      .from(resumeResults)
      .where(eq(resumeResults.userId, userId))
      .orderBy(desc(resumeResults.createdAt));
  }

  async createResumeResult(result: InsertResumeResult): Promise<ResumeResult> {
    const [newResult] = await db.insert(resumeResults).values(result).returning();
    return newResult;
  }
}

export const storage = new DatabaseStorage();
