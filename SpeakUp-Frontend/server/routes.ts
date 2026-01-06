import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

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

  return httpServer;
}
