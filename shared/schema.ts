import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  preview: text("preview").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  hasResponse: boolean("has_response").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export const workflowSteps = pgTable("workflow_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(),
  stepNumber: integer("step_number").notNull(),
  question: text("question").notNull(),
  sql: text("sql").notNull(),
  status: text("status").notNull(), // 'completed', 'current', 'pending'
  response: jsonb("response"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWorkflowStepSchema = createInsertSchema(workflowSteps).omit({
  id: true,
  createdAt: true,
});

export type InsertWorkflowStep = z.infer<typeof insertWorkflowStepSchema>;
export type WorkflowStep = typeof workflowSteps.$inferSelect;

export const queryRequestSchema = z.object({
  question: z.string().min(1, "Question is required"),
  conversationId: z.string().optional(),
  role: z.enum(["analyst", "data_engineer", "admin"]).default("analyst"),
});

export type QueryRequest = z.infer<typeof queryRequestSchema>;

export const agentResponseSchema = z.object({
  intent_summary: z.string(),
  retrieved_context: z.string(),
  generated_sql: z.string(),
  access_control_applied: z.string(),
  cost_estimate: z.string(),
  validation_status: z.enum(["PASS", "FAIL"]),
  explainability_notes: z.string(),
  result_preview: z.string(),
  workflow_step_saved: z.boolean(),
  recommended_next_steps: z.array(z.string()),
  reporting_ready: z.boolean(),
});

export type AgentResponse = z.infer<typeof agentResponseSchema>;
