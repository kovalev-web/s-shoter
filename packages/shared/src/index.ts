import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const screenshotUploadFieldsSchema = z.object({
  sourceUrl: z.string().url(),
  pageTitle: z.string().min(1),
  capturedAt: z.string().min(1),
  boardX: z.coerce.number().optional(),
  boardY: z.coerce.number().optional(),
});
export type ScreenshotUploadFields = z.infer<typeof screenshotUploadFieldsSchema>;

export const screenshotPositionSchema = z.object({
  boardX: z.number(),
  boardY: z.number(),
  boardScale: z.number(),
});
export type ScreenshotPosition = z.infer<typeof screenshotPositionSchema>;

export const ALLOWED_SCREENSHOT_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const MAX_SCREENSHOT_FILE_SIZE_BYTES = 10 * 1024 * 1024;
