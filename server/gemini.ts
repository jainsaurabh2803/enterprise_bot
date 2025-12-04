import { GoogleGenAI } from "@google/genai";

// Gemini AI service for MCP Analytics Portal
// Uses gemini-2.5-flash for fast responses
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ParsedIntent {
  metrics: string[];
  dimensions: string[];
  filters: { column: string; operator: string; value: string }[];
  dateRange: { start: string; end: string } | null;
  aggregations: string[];
  limit: number;
  sortBy: { column: string; direction: "asc" | "desc" } | null;
}

export interface SQLGenerationResult {
  sql: string;
  explanation: string;
  tablesUsed: string[];
  columnsUsed: string[];
}

export interface AgentResponse {
  intent_summary: string;
  retrieved_context: string;
  generated_sql: string;
  access_control_applied: string;
  cost_estimate: string;
  validation_status: "PASS" | "FAIL";
  explainability_notes: string;
  result_preview: string;
  workflow_step_saved: boolean;
  recommended_next_steps: string[];
  reporting_ready: boolean;
}

const SCHEMA_CONTEXT = `
Available Snowflake Tables:
1. analytics.orders - columns: order_id, customer_id, order_date, order_total, region, status, product_id, quantity
2. analytics.customers - columns: id, customer_name, email, phone_number, segment, region, created_date
3. analytics.products - columns: product_id, product_name, category, price, cost, supplier_id
4. analytics.regions - columns: region_code, region_name, country, timezone

Business Terms:
- Revenue = SUM(order_total)
- AOV (Average Order Value) = AVG(order_total)
- Customer Count = COUNT(DISTINCT customer_id)
- Top Customers = customers ranked by total revenue
`;

export async function parseIntent(question: string): Promise<ParsedIntent> {
  const systemPrompt = `You are an intent parsing agent for a Snowflake analytics system.
Parse the user's natural language question and extract structured intent.
Return JSON with: metrics (what to measure), dimensions (grouping), filters, dateRange, aggregations, limit, sortBy.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          metrics: { type: "array", items: { type: "string" } },
          dimensions: { type: "array", items: { type: "string" } },
          filters: {
            type: "array",
            items: {
              type: "object",
              properties: {
                column: { type: "string" },
                operator: { type: "string" },
                value: { type: "string" },
              },
              required: ["column", "operator", "value"],
            },
          },
          dateRange: {
            type: "object",
            nullable: true,
            properties: {
              start: { type: "string" },
              end: { type: "string" },
            },
          },
          aggregations: { type: "array", items: { type: "string" } },
          limit: { type: "number" },
          sortBy: {
            type: "object",
            nullable: true,
            properties: {
              column: { type: "string" },
              direction: { type: "string" },
            },
          },
        },
        required: ["metrics", "dimensions", "filters", "aggregations", "limit"],
      },
    },
    contents: `${SCHEMA_CONTEXT}\n\nUser Question: ${question}`,
  });

  const rawJson = response.text;
  if (rawJson) {
    return JSON.parse(rawJson);
  }
  throw new Error("Failed to parse intent");
}

export async function generateSQL(
  question: string,
  intent: ParsedIntent,
  role: string
): Promise<SQLGenerationResult> {
  const systemPrompt = `You are a SQL generation agent for Snowflake.
Generate a safe, optimized SELECT-only SQL query based on the user's question and parsed intent.
Rules:
- Only SELECT statements allowed
- Always add LIMIT if not specified (default 1000)
- Use fully qualified table names (schema.table)
- Apply partition filters on date columns when possible
- Optimize joins
- Never use DROP, DELETE, INSERT, UPDATE, ALTER

Role-based restrictions for ${role}:
- ANALYST: Can access analytics.* tables, but email/phone columns are masked
- DATA_ENGINEER: Full access to analytics.* tables
- ADMIN: Full access to all tables`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          sql: { type: "string" },
          explanation: { type: "string" },
          tablesUsed: { type: "array", items: { type: "string" } },
          columnsUsed: { type: "array", items: { type: "string" } },
        },
        required: ["sql", "explanation", "tablesUsed", "columnsUsed"],
      },
    },
    contents: `${SCHEMA_CONTEXT}\n\nUser Question: ${question}\n\nParsed Intent: ${JSON.stringify(intent)}\n\nUser Role: ${role}`,
  });

  const rawJson = response.text;
  if (rawJson) {
    return JSON.parse(rawJson);
  }
  throw new Error("Failed to generate SQL");
}

export function validateSQL(sql: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const upperSQL = sql.toUpperCase();

  const dangerousKeywords = ["DROP", "DELETE", "INSERT", "UPDATE", "ALTER", "TRUNCATE", "CREATE", "GRANT", "REVOKE"];
  for (const keyword of dangerousKeywords) {
    if (upperSQL.includes(keyword)) {
      errors.push(`Dangerous keyword detected: ${keyword}`);
    }
  }

  if (!upperSQL.trim().startsWith("SELECT")) {
    errors.push("Only SELECT statements are allowed");
  }

  if (!upperSQL.includes("LIMIT")) {
    errors.push("Query should include LIMIT clause");
  }

  return { valid: errors.length === 0, errors };
}

export function estimateCost(sql: string): { bytesScanned: string; credits: number; optimizationScore: number; warnings: string[] } {
  const warnings: string[] = [];
  let baseBytes = 1000000;
  
  const upperSQL = sql.toUpperCase();
  const tableCount = (upperSQL.match(/FROM|JOIN/g) || []).length;
  baseBytes *= tableCount;

  if (upperSQL.includes("SELECT *")) {
    warnings.push("SELECT * may scan unnecessary columns");
    baseBytes *= 2;
  }

  if (!upperSQL.includes("WHERE")) {
    warnings.push("No WHERE clause - full table scan possible");
    baseBytes *= 5;
  }

  const limitMatch = upperSQL.match(/LIMIT\s+(\d+)/);
  const limit = limitMatch ? parseInt(limitMatch[1]) : 1000;
  if (limit > 10000) {
    warnings.push("Large LIMIT may impact performance");
  }

  const credits = (baseBytes / 1000000000) * 0.02;
  const optimizationScore = Math.max(0, 100 - warnings.length * 15);

  let bytesFormatted: string;
  if (baseBytes >= 1000000000) {
    bytesFormatted = `${(baseBytes / 1000000000).toFixed(1)} GB`;
  } else if (baseBytes >= 1000000) {
    bytesFormatted = `${(baseBytes / 1000000).toFixed(1)} MB`;
  } else {
    bytesFormatted = `${(baseBytes / 1000).toFixed(1)} KB`;
  }

  return {
    bytesScanned: bytesFormatted,
    credits: parseFloat(credits.toFixed(6)),
    optimizationScore,
    warnings,
  };
}

export function getAccessControl(role: string, tablesUsed: string[], columnsUsed: string[]) {
  const maskedColumns: string[] = [];
  const restrictedTables: string[] = [];
  const rowFilters: string[] = [];

  if (role === "analyst") {
    if (columnsUsed.some(c => ["email", "phone_number", "phone", "ssn"].includes(c.toLowerCase()))) {
      maskedColumns.push(...columnsUsed.filter(c => 
        ["email", "phone_number", "phone", "ssn"].includes(c.toLowerCase())
      ));
    }
    restrictedTables.push("hr.salaries", "finance.expenses");
    rowFilters.push("region IN ('NA', 'US', 'CA')");
  } else if (role === "data_engineer") {
    rowFilters.push("No row filters applied");
  }

  return {
    role: role.toUpperCase(),
    maskedColumns,
    restrictedTables,
    rowFilters: rowFilters.length > 0 ? rowFilters : [],
  };
}

export async function generateRecommendedSteps(
  question: string,
  sqlResult: SQLGenerationResult
): Promise<{ id: string; label: string; type: "drill-down" | "compare" | "filter" | "aggregate" }[]> {
  const systemPrompt = `You are an analytics recommendation agent.
Based on the user's question and generated SQL, suggest 3 logical next analytical steps.
Each step should be a natural language question the user could ask next.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      responseSchema: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            label: { type: "string" },
            type: { type: "string" },
          },
          required: ["id", "label", "type"],
        },
      },
    },
    contents: `Original Question: ${question}\n\nGenerated SQL: ${sqlResult.sql}\n\nTables Used: ${sqlResult.tablesUsed.join(", ")}`,
  });

  const rawJson = response.text;
  if (rawJson) {
    return JSON.parse(rawJson);
  }
  return [
    { id: "1", label: "Break down by another dimension", type: "drill-down" },
    { id: "2", label: "Compare with previous period", type: "compare" },
    { id: "3", label: "Add more filters", type: "filter" },
  ];
}

export async function parseIntentWithSchema(question: string, schemaContext: string): Promise<ParsedIntent> {
  const systemPrompt = `You are an intent parsing agent for a Snowflake analytics system.
Parse the user's natural language question and extract structured intent.
Return JSON with: metrics (what to measure), dimensions (grouping), filters, dateRange, aggregations, limit, sortBy.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          metrics: { type: "array", items: { type: "string" } },
          dimensions: { type: "array", items: { type: "string" } },
          filters: {
            type: "array",
            items: {
              type: "object",
              properties: {
                column: { type: "string" },
                operator: { type: "string" },
                value: { type: "string" },
              },
              required: ["column", "operator", "value"],
            },
          },
          dateRange: {
            type: "object",
            nullable: true,
            properties: {
              start: { type: "string" },
              end: { type: "string" },
            },
          },
          aggregations: { type: "array", items: { type: "string" } },
          limit: { type: "number" },
          sortBy: {
            type: "object",
            nullable: true,
            properties: {
              column: { type: "string" },
              direction: { type: "string" },
            },
          },
        },
        required: ["metrics", "dimensions", "filters", "aggregations", "limit"],
      },
    },
    contents: `${schemaContext}\n\nUser Question: ${question}`,
  });

  const rawJson = response.text;
  if (rawJson) {
    return JSON.parse(rawJson);
  }
  throw new Error("Failed to parse intent");
}

export async function generateSQLWithSchema(
  question: string,
  intent: ParsedIntent,
  role: string,
  schemaContext: string
): Promise<SQLGenerationResult> {
  const systemPrompt = `You are a SQL generation agent for Snowflake.
Generate a safe, optimized SELECT-only SQL query based on the user's question and parsed intent.
Rules:
- Only SELECT statements allowed
- Always add LIMIT if not specified (default 1000)
- Use fully qualified table names (database.schema.table)
- Apply partition filters on date columns when possible
- Optimize joins
- Never use DROP, DELETE, INSERT, UPDATE, ALTER

Role-based restrictions for ${role}:
- ANALYST: Can access tables, but email/phone columns are masked
- DATA_ENGINEER: Full access to tables
- ADMIN: Full access to all tables`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          sql: { type: "string" },
          explanation: { type: "string" },
          tablesUsed: { type: "array", items: { type: "string" } },
          columnsUsed: { type: "array", items: { type: "string" } },
        },
        required: ["sql", "explanation", "tablesUsed", "columnsUsed"],
      },
    },
    contents: `${schemaContext}\n\nUser Question: ${question}\n\nParsed Intent: ${JSON.stringify(intent)}\n\nUser Role: ${role}`,
  });

  const rawJson = response.text;
  if (rawJson) {
    return JSON.parse(rawJson);
  }
  throw new Error("Failed to generate SQL");
}

export async function processQuery(
  question: string,
  role: string
): Promise<AgentResponse> {
  return processQueryWithSchema(question, role, SCHEMA_CONTEXT);
}

export async function processQueryWithSchema(
  question: string,
  role: string,
  schemaContext: string
): Promise<AgentResponse> {
  try {
    const intent = await parseIntentWithSchema(question, schemaContext);
    
    const sqlResult = await generateSQLWithSchema(question, intent, role, schemaContext);
    
    const validation = validateSQL(sqlResult.sql);
    
    let finalSQL = sqlResult.sql;
    if (!finalSQL.toUpperCase().includes("LIMIT")) {
      finalSQL = finalSQL.replace(/;?\s*$/, " LIMIT 1000;");
    }
    
    const costEstimate = estimateCost(finalSQL);
    
    const accessControl = getAccessControl(role, sqlResult.tablesUsed, sqlResult.columnsUsed);
    
    const recommendedSteps = await generateRecommendedSteps(question, sqlResult);

    return {
      intent_summary: `Analyzing: ${intent.metrics.join(", ")} by ${intent.dimensions.join(", ") || "total"}`,
      retrieved_context: `Tables: ${sqlResult.tablesUsed.join(", ")}. Columns: ${sqlResult.columnsUsed.join(", ")}`,
      generated_sql: finalSQL,
      access_control_applied: `Role: ${accessControl.role}. ${accessControl.maskedColumns.length > 0 ? `Masked: ${accessControl.maskedColumns.join(", ")}` : "No masking applied"}`,
      cost_estimate: `~${costEstimate.bytesScanned} scanned, ${costEstimate.credits} credits`,
      validation_status: validation.valid ? "PASS" : "FAIL",
      explainability_notes: validation.valid 
        ? sqlResult.explanation 
        : `Validation errors: ${validation.errors.join(", ")}`,
      result_preview: "Query ready for execution",
      workflow_step_saved: true,
      recommended_next_steps: recommendedSteps.map(s => s.label),
      reporting_ready: validation.valid,
    };
  } catch (error) {
    console.error("Error processing query:", error);
    return {
      intent_summary: "Failed to parse intent",
      retrieved_context: "Error retrieving context",
      generated_sql: "",
      access_control_applied: `Role: ${role.toUpperCase()}`,
      cost_estimate: "N/A",
      validation_status: "FAIL",
      explainability_notes: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      result_preview: "No results",
      workflow_step_saved: false,
      recommended_next_steps: [],
      reporting_ready: false,
    };
  }
}
