import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { processQuery, estimateCost, validateSQL, getAccessControl, generateRecommendedSteps } from "./gemini";
import { queryRequestSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Get all conversations
  app.get("/api/conversations", async (req, res) => {
    try {
      const conversations = await storage.getConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get a single conversation with messages
  app.get("/api/conversations/:id", async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await storage.getMessages(req.params.id);
      const workflowSteps = await storage.getWorkflowSteps(req.params.id);
      res.json({ conversation, messages, workflowSteps });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create a new conversation
  app.post("/api/conversations", async (req, res) => {
    try {
      const { title, preview } = req.body;
      const conversation = await storage.createConversation({
        title: title || "New Analysis",
        preview: preview || "Start asking questions...",
      });
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Delete a conversation
  app.delete("/api/conversations/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteConversation(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Get workflow steps for a conversation
  app.get("/api/conversations/:id/workflow", async (req, res) => {
    try {
      const steps = await storage.getWorkflowSteps(req.params.id);
      res.json(steps);
    } catch (error) {
      console.error("Error fetching workflow steps:", error);
      res.status(500).json({ error: "Failed to fetch workflow steps" });
    }
  });

  // Clear workflow steps for a conversation
  app.delete("/api/conversations/:id/workflow", async (req, res) => {
    try {
      await storage.clearWorkflowSteps(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error clearing workflow steps:", error);
      res.status(500).json({ error: "Failed to clear workflow steps" });
    }
  });

  // Process a query using Gemini AI
  app.post("/api/query", async (req, res) => {
    try {
      const validatedRequest = queryRequestSchema.parse(req.body);
      const { question, conversationId, role } = validatedRequest;

      let convoId = conversationId;
      
      // Create a new conversation if none provided
      if (!convoId) {
        const title = question.length > 50 ? question.substring(0, 47) + "..." : question;
        const conversation = await storage.createConversation({
          title,
          preview: question,
        });
        convoId = conversation.id;
      }

      // Save user message
      await storage.createMessage({
        conversationId: convoId,
        role: "user",
        content: question,
        hasResponse: false,
      });

      // Process query with Gemini AI
      const agentResponse = await processQuery(question, role);

      // Save assistant message
      await storage.createMessage({
        conversationId: convoId,
        role: "assistant",
        content: agentResponse.intent_summary,
        hasResponse: true,
      });

      // Update conversation preview
      await storage.updateConversation(convoId, {
        preview: question,
      });

      // Create workflow step if query was successful
      if (agentResponse.workflow_step_saved) {
        const existingSteps = await storage.getWorkflowSteps(convoId);
        
        // Mark previous steps as completed
        for (const step of existingSteps) {
          if (step.status === "current") {
            await storage.updateWorkflowStep(step.id, { status: "completed" });
          }
        }

        await storage.createWorkflowStep({
          conversationId: convoId,
          stepNumber: existingSteps.length + 1,
          question,
          sql: agentResponse.generated_sql,
          status: "current",
          response: agentResponse,
        });
      }

      // Get updated workflow steps
      const workflowSteps = await storage.getWorkflowSteps(convoId);

      res.json({
        conversationId: convoId,
        response: agentResponse,
        workflowSteps,
      });
    } catch (error) {
      console.error("Error processing query:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request", details: error.errors });
      }
      res.status(500).json({ error: "Failed to process query" });
    }
  });

  // Validate SQL endpoint
  app.post("/api/validate-sql", async (req, res) => {
    try {
      const { sql } = req.body;
      if (!sql) {
        return res.status(400).json({ error: "SQL is required" });
      }
      const validation = validateSQL(sql);
      res.json(validation);
    } catch (error) {
      console.error("Error validating SQL:", error);
      res.status(500).json({ error: "Failed to validate SQL" });
    }
  });

  // Estimate query cost endpoint
  app.post("/api/estimate-cost", async (req, res) => {
    try {
      const { sql } = req.body;
      if (!sql) {
        return res.status(400).json({ error: "SQL is required" });
      }
      const estimate = estimateCost(sql);
      res.json(estimate);
    } catch (error) {
      console.error("Error estimating cost:", error);
      res.status(500).json({ error: "Failed to estimate cost" });
    }
  });

  // Get access control info endpoint
  app.post("/api/access-control", async (req, res) => {
    try {
      const { role, tablesUsed, columnsUsed } = req.body;
      if (!role) {
        return res.status(400).json({ error: "Role is required" });
      }
      const accessControl = getAccessControl(
        role, 
        tablesUsed || [], 
        columnsUsed || []
      );
      res.json(accessControl);
    } catch (error) {
      console.error("Error getting access control:", error);
      res.status(500).json({ error: "Failed to get access control info" });
    }
  });

  return httpServer;
}
