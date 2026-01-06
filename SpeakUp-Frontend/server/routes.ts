import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { randomUUID } from "crypto";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // User Profile
  app.get(api.users.profile.path, async (req, res) => {
    const user = await storage.getUser(Number(req.params.id));
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  });

  app.put(api.users.update.path, async (req, res) => {
    try {
      const input = api.users.update.input.parse(req.body);
      const user = await storage.updateUser(Number(req.params.id), input);
      res.json(user);
    } catch (err) {
       if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Aptitude
  app.get(api.aptitude.list.path, async (req, res) => {
    const results = await storage.getAptitudeHistory(Number(req.params.userId));
    res.json(results);
  });

  app.get(api.aptitude.questions.path, async (req, res) => {
    const { topic } = req.params;
    // Mock Questions
    const questions = [
      {
        id: 1,
        question: `What comes next in the sequence: 2, 4, 8, 16, ...?`,
        options: ["24", "32", "64", "20"],
        correctAnswer: 1, // Index 1 -> "32"
        difficulty: "Easy"
      },
      {
        id: 2,
        question: `If 2x + 5 = 15, what is x?`,
        options: ["2", "5", "10", "4"],
        correctAnswer: 1, // Index 1 -> "5"
        difficulty: "Easy"
      },
      {
        id: 3,
        question: "Train A covers 60km in 1 hour. Train B covers 90km in 1 hour. Ratio of speeds?",
        options: ["2:3", "3:2", "1:2", "1:1"],
        correctAnswer: 0,
        difficulty: "Medium"
      },
      {
        id: 4,
        question: "Find the odd one out: Circle, Square, Triangle, Sphere",
        options: ["Circle", "Square", "Triangle", "Sphere"],
        correctAnswer: 3,
        difficulty: "Medium"
      },
      {
        id: 5,
        question: "If A is brother of B, B is sister of C, and C is father of D, how is D related to A?",
        options: ["Brother", "Sister", "Nephew/Niece", "Uncle"],
        correctAnswer: 2,
        difficulty: "Hard"
      }
    ];
    res.json({ topic, questions });
  });

  app.post(api.aptitude.create.path, async (req, res) => {
    try {
      const input = api.aptitude.create.input.parse(req.body);
      const result = await storage.createAptitudeResult(input);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Interview
  app.get(api.interview.list.path, async (req, res) => {
    const results = await storage.getInterviewHistory(Number(req.params.userId));
    res.json(results);
  });

  app.post(api.interview.start.path, async (req, res) => {
    const sessionId = randomUUID();
    res.json({
        sessionId,
        firstQuestion: "Tell me about yourself and your background.",
        totalQuestions: 5,
        interviewType: req.body.interviewType,
    });
  });

  app.post(api.interview.answer.path, async (req, res) => {
    const { questionNumber } = req.body;
    if (questionNumber >= 5) {
        // End interview
        res.json({
            isComplete: true,
            summary: {
                communicationScore: 85,
                technicalScore: 80,
                confidenceScore: 75,
                overallScore: 80,
                feedback: "Good performance overall. Try to be more concise in technical explanations."
            }
        });
    } else {
        const nextQ = [
            "What are your greatest strengths?",
            "Describe a challenging project you worked on.",
            "Where do you see yourself in 5 years?",
            "Do you have any questions for us?"
        ][questionNumber % 4];
        
        res.json({
            isComplete: false,
            nextQuestion: nextQ,
            questionNumber: questionNumber + 1
        });
    }
  });

  app.post(api.interview.teachMe.path, async (req, res) => {
    res.json({
        coaching: "When answering this, focus on the STAR method (Situation, Task, Action, Result).",
        modelAnswer: "A great answer would highlight specific contributions...",
        tips: ["Be specific", "Quantify results", "Show enthusiasm"]
    });
  });

  app.post(api.interview.create.path, async (req, res) => {
    try {
      const input = api.interview.create.input.parse(req.body);
      const result = await storage.createInterviewResult(input);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // GD
  app.get(api.gd.list.path, async (req, res) => {
    const results = await storage.getGdHistory(Number(req.params.userId));
    res.json(results);
  });

  app.post(api.gd.start.path, async (req, res) => {
      res.json({
          sessionId: randomUUID(),
          topic: req.body.topic,
          difficulty: req.body.difficulty,
          bots: [
              { name: "Alex", personality: "Analytical", role: "Participant" },
              { name: "Sarah", personality: "Creative", role: "Participant" },
              { name: "Mike", personality: "Critical", role: "Participant" }
          ],
          moderatorMessage: "Welcome to the group discussion. You may begin."
      });
  });

  app.post(api.gd.message.path, async (req, res) => {
      // Simulate bot responses
      res.json({
          botMessages: [
              { speaker: "Alex", text: "That's an interesting point. I think...", timestamp: new Date().toISOString() },
              { speaker: "Sarah", text: "I agree, but we should also consider...", timestamp: new Date().toISOString() }
          ]
      });
  });

  app.post(api.gd.feedback.path, async (req, res) => {
      res.json({
          feedback: "You are making good points, but try to involve others more.",
          participationScore: 70,
          communicationQuality: 80
      });
  });

  app.post(api.gd.end.path, async (req, res) => {
      res.json({
          score: 85,
          participationRate: 75,
          communicationScore: 80,
          initiativeScore: 70,
          feedback: "Overall a strong performance.",
          strengths: ["Clear articulation", "Good listening"],
          improvements: ["Take more initiative"]
      });
  });

  app.post(api.gd.create.path, async (req, res) => {
    try {
      const input = api.gd.create.input.parse(req.body);
      const result = await storage.createGdResult(input);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Resume
  app.get(api.resume.list.path, async (req, res) => {
    const results = await storage.getResumeHistory(Number(req.params.userId));
    res.json(results);
  });

  // Upload Logic
  app.post(api.resume.upload.path, async (req, res) => {
      // Mock Analysis
      res.json({
          atsScore: 78,
          suggestions: [
             "Use more action verbs (e.g., Led, Developed).",
             "Add numerical metrics.",
             "Consistent date formatting."
          ],
          parsedData: {
             name: "User Name",
             email: "user@example.com",
             skills: ["React", "TypeScript", "Node.js"],
             experience: "3+ years Frontend Dev",
             education: "B.Tech CS"
          },
          fullText: "Mock extracted text..."
      });
  });

  app.post(api.resume.create.path, async (req, res) => {
    try {
      const input = api.resume.create.input.parse(req.body);
      const result = await storage.createResumeResult(input);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Dashboard Stats
  app.get(api.dashboard.stats.path, async (req, res) => {
      const userId = Number(req.params.userId);
      const aptitude = await storage.getAptitudeHistory(userId);
      const interview = await storage.getInterviewHistory(userId);
      const gd = await storage.getGdHistory(userId);
      const resume = await storage.getResumeHistory(userId);

      const recentActivity = [
          ...aptitude.map(r => ({ type: 'aptitude', date: r.createdAt?.toISOString() || "", description: `Aptitude: ${r.topic}`, score: r.score })),
          ...interview.map(r => {
             const score = Math.round(((r.communicationScore || 0) + (r.confidenceScore || 0) + (r.relevanceScore || 0)) / 3);
             return { type: 'interview', date: r.createdAt?.toISOString() || "", description: 'Mock Interview', score };
          }),
          ...gd.map(r => ({ type: 'gd', date: r.createdAt?.toISOString() || "", description: `GD: ${r.topic}`, score: r.score || undefined })),
          ...resume.map(r => ({ type: 'resume', date: r.createdAt?.toISOString() || "", description: `Resume Analysis: ${r.fileName}`, score: r.atsScore || undefined }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

      res.json({
          user: { name: "User", email: "user@example.com" }, // mock user info if needed or fetch
          stats: {
              totalInterviews: interview.length,
              totalGdSessions: gd.length,
              totalAptitudeTests: aptitude.length,
              totalResumesAnalyzed: resume.length,
              averageInterviewScore: Math.round(interview.reduce((acc, curr) => {
                  const overall = ((curr.communicationScore || 0) + (curr.confidenceScore || 0) + (curr.relevanceScore || 0)) / 3;
                  return acc + overall;
              }, 0) / (interview.length || 1)),
              averageGdScore: Math.round(gd.reduce((acc, curr) => acc + (curr.score || 0), 0) / (gd.length || 1)),
              averageAptitudeScore: Math.round(aptitude.reduce((acc, curr) => acc + (curr.score || 0), 0) / (aptitude.length || 1)),
          },
          recentActivity
      });
  });

  return httpServer;
}
