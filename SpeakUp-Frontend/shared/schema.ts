import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  age: integer("age"),
  gender: text("gender"),
  occupation: text("occupation"),
  avatarUrl: text("avatar_url"),
  firebaseUid: text("firebase_uid"), 
  createdAt: timestamp("created_at").defaultNow(),
});

export const aptitudeResults = pgTable("aptitude_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  topic: text("topic").notNull(), // Quantitative, Logical, Verbal
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  accuracy: integer("accuracy"),
  timeTaken: integer("time_taken"), // in seconds
  createdAt: timestamp("created_at").defaultNow(),
});

export const interviewResults = pgTable("interview_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  communicationScore: integer("communication_score"),
  confidenceScore: integer("confidence_score"),
  relevanceScore: integer("relevance_score"),
  feedback: text("feedback"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gdResults = pgTable("gd_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  topic: text("topic").notNull(),
  duration: integer("duration"), // seconds
  score: integer("score"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const resumeResults = pgTable("resume_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  atsScore: integer("ats_score"),
  suggestions: jsonb("suggestions"), // Array of strings
  fileName: text("file_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertAptitudeResultSchema = createInsertSchema(aptitudeResults).omit({ id: true, createdAt: true });
export const insertInterviewResultSchema = createInsertSchema(interviewResults).omit({ id: true, createdAt: true });
export const insertGdResultSchema = createInsertSchema(gdResults).omit({ id: true, createdAt: true });
export const insertResumeResultSchema = createInsertSchema(resumeResults).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type AptitudeResult = typeof aptitudeResults.$inferSelect;
export type InsertAptitudeResult = z.infer<typeof insertAptitudeResultSchema>;
export type InterviewResult = typeof interviewResults.$inferSelect;
export type InsertInterviewResult = z.infer<typeof insertInterviewResultSchema>;
export type GdResult = typeof gdResults.$inferSelect;
export type InsertGdResult = z.infer<typeof insertGdResultSchema>;
export type ResumeResult = typeof resumeResults.$inferSelect;
export type InsertResumeResult = z.infer<typeof insertResumeResultSchema>;
