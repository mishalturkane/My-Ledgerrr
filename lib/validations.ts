// lib/validations.ts
import { z } from "zod";

// ─── Project ──────────────────────────────────────────────────────────────────

export const CreateProjectSchema = z.object({
  name: z
    .string()
    .min(2, "Project name must be at least 2 characters")
    .max(80, "Project name is too long"),
  description: z.string().max(300, "Description is too long").optional(),
  currency: z.string().default("INR"),
  participants: z
    .array(z.string().min(1, "Participant name is required").max(50))
    .min(1, "Add at least one participant")
    .max(20, "Maximum 20 participants per project"),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

// ─── Expense ──────────────────────────────────────────────────────────────────

export const ExpenseItemSchema = z.object({
  name: z.string().min(1, "Item name is required").max(100),
  price: z
    .number({ invalid_type_error: "Price must be a number" })
    .positive("Price must be positive")
    .max(1_000_000, "Price is too large"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").default(1),
});

export const CreateExpenseSchema = z.object({
  projectId: z.string().cuid("Invalid project ID"),
  payerId: z.string().cuid("Invalid payer ID"),
  date: z.string().datetime("Invalid date format"),
  note: z.string().max(200, "Note is too long").optional(),
  items: z
    .array(ExpenseItemSchema)
    .min(1, "Add at least one item"),
});

export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;

// ─── Expense Filters ──────────────────────────────────────────────────────────

export const ExpenseFilterSchema = z.object({
  projectId: z.string().cuid("Invalid project ID"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  payerId: z.string().optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type ExpenseFilterInput = z.infer<typeof ExpenseFilterSchema>;
