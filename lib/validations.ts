import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createDriverSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  phone: z.string().optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  deliveryAddress: z.string().min(5).max(500),
  assignedDriverId: z.string().uuid(),
  scheduledFor: z.string().datetime().optional(),
});

export const completeTaskSchema = z.object({
  recipientName: z.string().min(2).max(100),
  signatureBase64: z.string().min(1),
});
