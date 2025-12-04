import snowflake from "snowflake-sdk";

export interface SnowflakeCredentials {
  account: string;
  username: string;
  password: string;
  warehouse: string;
  database: string;
  schema: string;
  role?: string;
}

export interface SnowflakeSession {
  credentials: Omit<SnowflakeCredentials, "password">;
  connected: boolean;
  connectedAt: Date;
}

export interface TableInfo {
  name: string;
  schema: string;
  database: string;
  rowCount?: number;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
  comment: string | null;
}

export interface TableSchema {
  tableName: string;
  database: string;
  schema: string;
  columns: ColumnInfo[];
  sampleRows?: Record<string, unknown>[];
}

const sessionStore = new Map<string, { connection: snowflake.Connection; session: SnowflakeSession }>();

export async function connectToSnowflake(
  sessionId: string,
  credentials: SnowflakeCredentials
): Promise<SnowflakeSession> {
  return new Promise((resolve, reject) => {
    const connection = snowflake.createConnection({
      account: credentials.account,
      username: credentials.username,
      password: credentials.password,
      warehouse: credentials.warehouse,
      database: credentials.database,
      schema: credentials.schema,
      role: credentials.role,
    });

    connection.connect((err, conn) => {
      if (err) {
        console.error("Failed to connect to Snowflake:", err.message);
        reject(new Error(`Connection failed: ${err.message}`));
        return;
      }

      const session: SnowflakeSession = {
        credentials: {
          account: credentials.account,
          username: credentials.username,
          warehouse: credentials.warehouse,
          database: credentials.database,
          schema: credentials.schema,
          role: credentials.role,
        },
        connected: true,
        connectedAt: new Date(),
      };

      sessionStore.set(sessionId, { connection: conn, session });
      resolve(session);
    });
  });
}

export function getSession(sessionId: string): SnowflakeSession | null {
  const entry = sessionStore.get(sessionId);
  return entry?.session || null;
}

export async function disconnectFromSnowflake(sessionId: string): Promise<void> {
  const entry = sessionStore.get(sessionId);
  if (entry) {
    return new Promise((resolve) => {
      entry.connection.destroy((err) => {
        if (err) {
          console.error("Error disconnecting from Snowflake:", err.message);
        }
        sessionStore.delete(sessionId);
        resolve();
      });
    });
  }
}

function executeQuery<T>(connection: snowflake.Connection, sql: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    connection.execute({
      sqlText: sql,
      complete: (err, stmt, rows) => {
        if (err) {
          reject(new Error(`Query failed: ${err.message}`));
          return;
        }
        resolve((rows || []) as T[]);
      },
    });
  });
}

export async function getTables(sessionId: string): Promise<TableInfo[]> {
  const entry = sessionStore.get(sessionId);
  if (!entry) {
    throw new Error("No active Snowflake session");
  }

  const { connection, session } = entry;
  const { database, schema } = session.credentials;

  const sql = `SHOW TABLES IN SCHEMA "${database}"."${schema}"`;
  const rows = await executeQuery<Record<string, unknown>>(connection, sql);

  return rows.map((row) => ({
    name: String(row.name || row.TABLE_NAME || ""),
    schema: String(row.schema_name || row.TABLE_SCHEMA || schema),
    database: String(row.database_name || row.TABLE_CATALOG || database),
    rowCount: row.rows ? Number(row.rows) : undefined,
  }));
}

export async function getTableSchema(sessionId: string, tableName: string): Promise<TableSchema> {
  const entry = sessionStore.get(sessionId);
  if (!entry) {
    throw new Error("No active Snowflake session");
  }

  const { connection, session } = entry;
  const { database, schema } = session.credentials;

  const describeSql = `DESCRIBE TABLE "${database}"."${schema}"."${tableName}"`;
  const rows = await executeQuery<Record<string, unknown>>(connection, describeSql);

  const columns: ColumnInfo[] = rows.map((row) => ({
    name: String(row.name || row.COLUMN_NAME || ""),
    type: String(row.type || row.DATA_TYPE || ""),
    nullable: String(row["null"] || row.IS_NULLABLE || "Y") === "Y",
    defaultValue: row.default !== null ? String(row.default) : null,
    comment: row.comment !== null ? String(row.comment) : null,
  }));

  let sampleRows: Record<string, unknown>[] = [];
  try {
    const sampleSql = `SELECT * FROM "${database}"."${schema}"."${tableName}" LIMIT 5`;
    sampleRows = await executeQuery<Record<string, unknown>>(connection, sampleSql);
  } catch (e) {
    console.error("Failed to fetch sample rows:", e);
  }

  return {
    tableName,
    database,
    schema,
    columns,
    sampleRows,
  };
}

export async function executeSnowflakeQuery(
  sessionId: string,
  sql: string
): Promise<{ columns: string[]; data: Record<string, unknown>[] }> {
  const entry = sessionStore.get(sessionId);
  if (!entry) {
    throw new Error("No active Snowflake session");
  }

  const { connection } = entry;
  const rows = await executeQuery<Record<string, unknown>>(connection, sql);

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  return { columns, data: rows };
}

export function buildSchemaContext(tableSchemas: TableSchema[]): string {
  if (tableSchemas.length === 0) {
    return "No tables selected. Please select a table to analyze.";
  }

  let context = "Available Snowflake Tables:\n";

  tableSchemas.forEach((table, index) => {
    context += `\n${index + 1}. ${table.database}.${table.schema}.${table.tableName}\n`;
    context += `   Columns:\n`;
    table.columns.forEach((col) => {
      context += `   - ${col.name} (${col.type}${col.nullable ? ", nullable" : ""})`;
      if (col.comment) {
        context += ` -- ${col.comment}`;
      }
      context += "\n";
    });

    if (table.sampleRows && table.sampleRows.length > 0) {
      context += `   Sample data available (${table.sampleRows.length} rows)\n`;
    }
  });

  return context;
}
