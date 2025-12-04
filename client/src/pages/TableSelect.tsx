import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  Database, 
  Loader2, 
  ArrowRight, 
  LogOut, 
  RefreshCw,
  Columns,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface TableInfo {
  name: string;
  schema: string;
  database: string;
  rowCount?: number;
}

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
}

interface TableSchema {
  tableName: string;
  columns: ColumnInfo[];
}

interface SnowflakeSession {
  credentials: {
    account: string;
    username: string;
    warehouse: string;
    database: string;
    schema: string;
    role?: string;
  };
  connected: boolean;
}

export default function TableSelect() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [tableSchemas, setTableSchemas] = useState<Record<string, TableSchema>>({});

  const { data: sessionData, isLoading: isLoadingSession } = useQuery<{
    connected: boolean;
    session: SnowflakeSession | null;
  }>({
    queryKey: ["/api/snowflake/session"],
  });

  const { data: tables = [], isLoading: isLoadingTables, refetch: refetchTables } = useQuery<TableInfo[]>({
    queryKey: ["/api/snowflake/tables"],
    enabled: sessionData?.connected === true,
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/snowflake/disconnect");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/snowflake/session"] });
      setLocation("/");
    },
  });

  const selectTablesMutation = useMutation({
    mutationFn: async (tableNames: string[]) => {
      const response = await apiRequest("POST", "/api/snowflake/select-tables", { tableNames });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tables Selected",
        description: `${selectedTables.length} table(s) ready for analysis`,
      });
      setLocation("/chat");
    },
    onError: (error: Error) => {
      toast({
        title: "Selection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const fetchTableSchema = async (tableName: string) => {
    if (tableSchemas[tableName]) {
      return;
    }
    try {
      const response = await fetch(`/api/snowflake/tables/${tableName}/schema`);
      const schema = await response.json();
      setTableSchemas((prev) => ({ ...prev, [tableName]: schema }));
    } catch (error) {
      console.error("Failed to fetch schema:", error);
    }
  };

  const handleToggleTable = (tableName: string) => {
    setSelectedTables((prev) =>
      prev.includes(tableName)
        ? prev.filter((t) => t !== tableName)
        : [...prev, tableName]
    );
  };

  const handleExpandTable = async (tableName: string) => {
    if (expandedTable === tableName) {
      setExpandedTable(null);
    } else {
      setExpandedTable(tableName);
      await fetchTableSchema(tableName);
    }
  };

  const handleContinue = () => {
    if (selectedTables.length === 0) {
      toast({
        title: "No Tables Selected",
        description: "Please select at least one table to continue",
        variant: "destructive",
      });
      return;
    }
    selectTablesMutation.mutate(selectedTables);
  };

  if (isLoadingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!sessionData?.connected) {
    setLocation("/");
    return null;
  }

  const session = sessionData.session;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Select Tables</h1>
            <p className="text-muted-foreground">
              Choose the tables you want to analyze with AI
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchTables()}
              disabled={isLoadingTables}
              data-testid="button-refresh"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingTables ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => disconnectMutation.mutate()}
              data-testid="button-disconnect"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Disconnect
            </Button>
          </div>
        </div>

        {session && (
          <Card className="mb-6">
            <CardContent className="flex items-center gap-4 p-4">
              <Database className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{session.credentials.database}</Badge>
                  <span className="text-muted-foreground">.</span>
                  <Badge variant="secondary">{session.credentials.schema}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Connected as {session.credentials.username} on {session.credentials.account}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Table className="h-5 w-5" />
              Available Tables
            </CardTitle>
            <CardDescription>
              {tables.length} table(s) found. Select one or more to start your analysis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTables ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : tables.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Table className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">No tables found in this schema</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try selecting a different database or schema
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {tables.map((table) => (
                    <div
                      key={table.name}
                      className={`rounded-lg border transition-colors ${
                        selectedTables.includes(table.name)
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3 p-4">
                        <Checkbox
                          checked={selectedTables.includes(table.name)}
                          onCheckedChange={() => handleToggleTable(table.name)}
                          data-testid={`checkbox-table-${table.name}`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{table.name}</span>
                            {table.rowCount !== undefined && (
                              <Badge variant="outline" className="text-xs">
                                {table.rowCount.toLocaleString()} rows
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {table.database}.{table.schema}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExpandTable(table.name)}
                          data-testid={`button-expand-${table.name}`}
                        >
                          <Columns className="mr-1 h-4 w-4" />
                          Schema
                          {expandedTable === table.name ? (
                            <ChevronUp className="ml-1 h-4 w-4" />
                          ) : (
                            <ChevronDown className="ml-1 h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {expandedTable === table.name && (
                        <div className="border-t border-border bg-muted/30 p-4">
                          {tableSchemas[table.name] ? (
                            <div className="space-y-1">
                              <p className="mb-2 text-xs font-medium text-muted-foreground">
                                Columns ({tableSchemas[table.name].columns.length})
                              </p>
                              <div className="grid gap-1">
                                {tableSchemas[table.name].columns.map((col) => (
                                  <div
                                    key={col.name}
                                    className="flex items-center gap-2 text-sm"
                                  >
                                    <span className="font-mono text-xs">{col.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {col.type}
                                    </Badge>
                                    {col.nullable && (
                                      <span className="text-xs text-muted-foreground">
                                        nullable
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm text-muted-foreground">
                                Loading schema...
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {selectedTables.length} table(s) selected
          </p>
          <Button
            onClick={handleContinue}
            disabled={selectedTables.length === 0 || selectTablesMutation.isPending}
            data-testid="button-continue"
          >
            {selectTablesMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Continue to Chat
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
