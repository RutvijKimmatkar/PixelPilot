import { z } from 'zod';

export const analyzeRequestSchema = z.object({
  url: z
    .string({ required_error: 'Website URL is required' })
    .trim()
    .min(1, 'Website URL cannot be empty')
    .url('Must be a valid URL starting with http:// or https://'),
  issueDescription: z
    .string({ required_error: 'Please describe the visual issue' })
    .trim()
    .min(3, 'Issue description must be at least 3 characters long')
    .max(1000, 'Issue description cannot exceed 1000 characters'),
});
