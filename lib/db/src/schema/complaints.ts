import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const complaintsTable = pgTable("complaints", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  categoryUser: text("category_user", {
    enum: ["maintenance", "hygiene", "food", "internet", "security", "noise", "other"],
  }).notNull(),
  categoryAi: text("category_ai"),
  priority: text("priority", { enum: ["low", "medium", "high", "critical"] }),
  sentiment: text("sentiment", { enum: ["positive", "neutral", "negative"] }),
  status: text("status", { enum: ["pending", "in_progress", "resolved"] }).notNull().default("pending"),
  imageUrl: text("image_url"),
  location: text("location").notNull(),
  feedback: text("feedback"),
  feedbackRating: integer("feedback_rating"),
  userId: integer("user_id").notNull(),
  assignedTo: integer("assigned_to"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertComplaintSchema = createInsertSchema(complaintsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  categoryAi: true,
  priority: true,
  sentiment: true,
  status: true,
  assignedTo: true,
  feedback: true,
  feedbackRating: true,
});
export type InsertComplaint = z.infer<typeof insertComplaintSchema>;
export type Complaint = typeof complaintsTable.$inferSelect;
