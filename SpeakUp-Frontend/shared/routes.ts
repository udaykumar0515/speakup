import { z } from 'zod';
import { 
  insertUserSchema, 
  insertAptitudeResultSchema, 
  insertInterviewResultSchema, 
  insertGdResultSchema, 
  insertResumeResultSchema,
  users,
  aptitudeResults,
  interviewResults,
  gdResults,
  resumeResults
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  users: {
    profile: {
      method: 'GET' as const,
      path: '/api/users/:id',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/users/:id',
      input: insertUserSchema.partial().extend({
        age: z.coerce.number().optional(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  aptitude: {
    list: {
      method: 'GET' as const,
      path: '/api/aptitude/history/:userId',
      responses: {
        200: z.array(z.custom<typeof aptitudeResults.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/aptitude',
      input: insertAptitudeResultSchema,
      responses: {
        201: z.custom<typeof aptitudeResults.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  interview: {
    list: {
      method: 'GET' as const,
      path: '/api/interview/history/:userId',
      responses: {
        200: z.array(z.custom<typeof interviewResults.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/interview',
      input: insertInterviewResultSchema,
      responses: {
        201: z.custom<typeof interviewResults.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  gd: {
    list: {
      method: 'GET' as const,
      path: '/api/gd/history/:userId',
      responses: {
        200: z.array(z.custom<typeof gdResults.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/gd',
      input: insertGdResultSchema,
      responses: {
        201: z.custom<typeof gdResults.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  resume: {
    list: {
      method: 'GET' as const,
      path: '/api/resume/history/:userId',
      responses: {
        200: z.array(z.custom<typeof resumeResults.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/resume',
      input: insertResumeResultSchema,
      responses: {
        201: z.custom<typeof resumeResults.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  ai: {
    chat: {
      method: 'POST' as const,
      path: '/api/ai/chat',
      input: z.object({
        message: z.string(),
        context: z.enum(['interview', 'gd']),
        history: z.array(z.object({
          role: z.enum(['user', 'bot']),
          text: z.string(),
        })).optional(),
      }),
      responses: {
        200: z.object({
          response: z.string(),
        }),
        400: errorSchemas.validation,
      },
    },
    analyze: {
      method: 'POST' as const,
      path: '/api/ai/analyze-resume',
      input: z.object({
        fileContent: z.string(), // Base64 or text
      }),
      responses: {
        200: z.object({
          atsScore: z.number(),
          suggestions: z.array(z.string()),
          parsedData: z.object({
            name: z.string(),
            email: z.string(),
            skills: z.array(z.string()),
            experience: z.string(),
            education: z.string(),
          }),
        }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
