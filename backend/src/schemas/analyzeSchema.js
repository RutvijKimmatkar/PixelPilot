import { z } from 'zod';

export const analyzeRequestSchema = z.object({
  url: z
    .string({ required_error: 'Website URL is required' })
    .trim()
    .min(1, 'Website URL cannot be empty')
    .url('Must be a valid URL starting with http:// or https://'),
  issueDescription: z
    .string()
    .trim()
    .min(3, 'Issue description must be at least 3 characters long')
    .max(1000, 'Issue description cannot exceed 1000 characters')
    .optional(),
  description: z.string().trim().optional(),
  mode: z.enum(['public', 'localhost']).optional().default('public'),
});

export const openUrlRequestSchema = z.object({
  url: z
    .string({ required_error: 'Website URL is required' })
    .trim()
    .min(1, 'Website URL cannot be empty')
    .url('Must be a valid URL starting with http:// or https://'),
  fullPage: z.boolean().optional(),
});

export const diagnoseVisualRequestSchema = z.object({
  screenshot: z
    .string({ required_error: 'Screenshot is required' })
    .min(10, 'Screenshot data cannot be empty'),
  query: z
    .string({ required_error: 'Please describe the issue or what to do' })
    .trim()
    .min(2, 'Query must be at least 2 characters long')
    .max(3000, 'Query cannot exceed 3000 characters'),
  url: z.string().trim().url().optional().or(z.literal('')),
});
