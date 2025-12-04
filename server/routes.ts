import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { processQueryWithSchema } from "./gemini";
import { 
  connectToSnowflake, 
  disconnectFromSnowflake, 
  getSession, 
  getTables, 
  getTableSchema,
  executeSnowflakeQuery,
  buildSchemaContext,
  type SnowflakeCredentials,
  type TableSchema
} from "./snowflake";
import { queryRequestSchema } from "@shared/schema";
import { z } from "zod";

declare module "express-session" {
  interface SessionData {
    snowflakeSessionId?: string;
  }
}

const snowflakeCredentialsSchema = z.object({
  account: z.string().min(1, "Account is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  warehouse: z.string().min(1, "Warehouse is required"),
  database: z.string().min(1, "Database is required"),
  schema: z.string().min(1, "Schema is required"),
  role: z.string().optional(),
});

const tableSchemaCache = new Map<string, TableSchema[]>();

function getSessionId(req: Request): string {
  return req.session?.id || req.sessionID || "default";
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/snowflake/connect", async (req, res) => {
    try {
      const credentials = snowflakeCredentialsSchema.parse(req.body);
      const sessionId = getSessionId(req);
      
      const session = await connectToSnowflake(sessionId, credentials);
      res.json({ success: true, session });
    } catch (error) {
      console.error("Snowflake connection error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid credentials", details: error.errors });
      }
      res.status(401).json({ 
        error: error instanceof Error ? error.message : "Failed to connect to Snowflake" 
      });
    }
  });

  app.post("/api/snowflake/disconnect", async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      await disconnectFromSnowflake(sessionId);
      tableSchemaCache.delete(sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Snowflake disconnect error:", error);
      res.status(500).json({ error: "Failed to disconnect" });
    }
  });

  app.get("/api/snowflake/session", async (req, res) => {
    const sessionId = getSessionId(req);
    const session = getSession(sessionId);
    const selectedSchemas = tableSchemaCache.get(sessionId) || [];
    const selectedTables = selectedSchemas.map(s => s.tableName);
    res.json({ 
      connected: !!session, 
      session,
      selectedTables,
      hasSelectedTables: selectedTables.length > 0
    });
  });

  app.get("/api/snowflake/tables", async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      const tables = await getTables(sessionId);
      res.json(tables);
    } catch (error) {
      console.error("Error fetching tables:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to fetch tables" 
      });
    }
  });

  app.get("/api/snowflake/tables/:tableName/schema", async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      const { tableName } = req.params;
      const schema = await getTableSchema(sessionId, tableName);
      res.json(schema);
    } catch (error) {
      console.error("Error fetching table schema:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to fetch table schema" 
      });
    }
  });

  const selectTablesSchema = z.object({
    tableNames: z.array(z.string().min(1)).min(1, "At least one table must be selected"),
  });

  app.post("/api/snowflake/select-tables", async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      const validated = selectTablesSchema.parse(req.body);
      const { tableNames } = validated;

      const session = getSession(sessionId);
      if (!session) {
        return res.status(401).json({ error: "No active Snowflake session" });
      }

      const schemas: TableSchema[] = [];
      for (const tableName of tableNames) {
        const schema = await getTableSchema(sessionId, tableName);
        schemas.push(schema);
      }

      tableSchemaCache.set(sessionId, schemas);
      
      res.json({ 
        success: true, 
        selectedTables: tableNames,
        schemaContext: buildSchemaContext(schemas)
      });
    } catch (error) {
      console.error("Error selecting tables:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid table selection", details: error.errors });
      }
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to select tables" 
      });
    }
  });

  app.post("/api/snowflake/execute", async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      const { sql } = req.body;
      
      if (!sql) {
        return res.status(400).json({ error: "SQL query is required" });
      }

      const result = await executeSnowflakeQuery(sessionId, sql);
      res.json(result);
    } catch (error) {
      console.error("Error executing query:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to execute query" 
      });
    }
  });
  
  app.get("/api/conversations", async (req, res) => {
    try {
      const conversations = await storage.getConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

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

  app.get("/api/conversations/:id/workflow", async (req, res) => {
    try {
      const steps = await storage.getWorkflowSteps(req.params.id);
      res.json(steps);
    } catch (error) {
      console.error("Error fetching workflow steps:", error);
      res.status(500).json({ error: "Failed to fetch workflow steps" });
    }
  });

  app.delete("/api/conversations/:id/workflow", async (req, res) => {
    try {
      await storage.clearWorkflowSteps(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error clearing workflow steps:", error);
      res.status(500).json({ error: "Failed to clear workflow steps" });
    }
  });

  app.post("/api/query", async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      const validatedRequest = queryRequestSchema.parse(req.body);
      const { question, conversationId, role } = validatedRequest;

      const tableSchemas = tableSchemaCache.get(sessionId) || [];
      
      if (tableSchemas.length === 0) {
        return res.status(400).json({ 
          error: "No tables selected. Please select at least one table to analyze." 
        });
      }
      
      const schemaContext = buildSchemaContext(tableSchemas);

      let convoId = conversationId;
      
      if (!convoId) {
        const title = question.length > 50 ? question.substring(0, 47) + "..." : question;
        const conversation = await storage.createConversation({
          title,
          preview: question,
        });
        convoId = conversation.id;
      }

      await storage.createMessage({
        conversationId: convoId,
        role: "user",
        content: question,
        hasResponse: false,
      });

      const agentResponse = await processQueryWithSchema(question, role, schemaContext);

      await storage.createMessage({
        conversationId: convoId,
        role: "assistant",
        content: agentResponse.intent_summary,
        hasResponse: true,
      });

      await storage.updateConversation(convoId, {
        preview: question,
      });

      if (agentResponse.workflow_step_saved) {
        const existingSteps = await storage.getWorkflowSteps(convoId);
        
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

      const workflowSteps = await storage.getWorkflowSteps(convoId);

      let queryResults = null;
      const session = getSession(sessionId);
      if (session && agentResponse.validation_status === "PASS" && agentResponse.generated_sql) {
        try {
          queryResults = await executeSnowflakeQuery(sessionId, agentResponse.generated_sql);
        } catch (execError) {
          console.error("Error executing query on Snowflake:", execError);
        }
      }

      res.json({
        conversationId: convoId,
        response: agentResponse,
        workflowSteps,
        queryResults,
      });
    } catch (error) {
      console.error("Error processing query:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request", details: error.errors });
      }
      res.status(500).json({ error: "Failed to process query" });
    }
  });

  return httpServer;
}
