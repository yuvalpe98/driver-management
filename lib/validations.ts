import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const createDriverSchema = z.object({
  name: z.string().min(2).max(100),
  username: z.string().min(2).max(50).regex(/^[a-zA-Z0-9]+$/, "שם משתמש יכול להכיל אותיות ומספרים בלבד"),
  password: z.string().min(8).max(72),
  phone: z.string().optional(),
});

export const createTaskItemSchema = z.object({
  name: z.string().min(1).max(100),
  quantity: z.number().int().positive(),
});

export const createTaskSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  deliveryAddress: z.string().min(5).max(500),
  assignedDriverId: z.string().uuid(),
  scheduledFor: z.string().datetime().optional(),
  taskType: z.enum(["DELIVERY", "MAINTENANCE"]).optional().default("DELIVERY"),
  priority: z.enum(["URGENT", "NORMAL", "LOW"]).optional().default("NORMAL"),
  items: z.array(createTaskItemSchema).optional(),
});

export const completeTaskSchema = z.object({
  recipientName: z.string().min(2).max(100),
  signatureBase64: z.string().min(1).max(500_000),
  equipmentUpdates: z
    .array(
      z.object({
        id: z.string().uuid(),
        status: z.enum(["GOOD", "NEEDS_REPAIR", "MISSING"]),
      })
    )
    .optional(),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(["IN_PROGRESS", "CANCELLED"]),
});

export const createCatalogItemSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.enum(["INVENTORY", "EQUIPMENT"]),
  unit: z.string().max(20).optional(),
});

export const updateCatalogItemSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  unit: z.string().max(20).optional().nullable(),
});

export const createInventoryItemSchema = z.object({
  catalogItemId: z.string().uuid(),
  quantity: z.number().int().min(0),
  driverId: z.string().uuid().optional(), // manager must supply; driver uses their own id
});

export const updateInventoryItemSchema = z.object({
  quantity: z.number().int().min(0).optional(),
});

export const updateDriverSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  username: z.string().min(2).max(50).regex(/^[a-zA-Z0-9]+$/, "שם משתמש יכול להכיל אותיות ומספרים בלבד").optional(),
  phone: z.string().optional(),
  password: z.string().min(8).max(72).optional(),
  isActive: z.boolean().optional(),
});

export const createEquipmentSchema = z.object({
  catalogItemId: z.string().uuid(),
  driverId: z.string().uuid().optional(), // manager can supply a specific driver
});

export const updateEquipmentSchema = z.object({
  status: z.enum(["GOOD", "NEEDS_REPAIR", "MISSING"]),
  notes: z.string().max(500).optional(),
});
