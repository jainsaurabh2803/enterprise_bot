import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Loader2, Lock, Server, User, Warehouse, FolderOpen, Shield } from "lucide-react";

interface SnowflakeCredentials {
  account: string;
  username: string;
  password: string;
  warehouse: string;
  database: string;
  schema: string;
  role?: string;
}

export default function SnowflakeConnect() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [credentials, setCredentials] = useState<SnowflakeCredentials>({
    account: "",
    username: "",
    password: "",
    warehouse: "",
    database: "",
    schema: "",
    role: "",
  });

  const connectMutation = useMutation({
    mutationFn: async (creds: SnowflakeCredentials) => {
      const response = await apiRequest("POST", "/api/snowflake/connect", creds);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Connected",
        description: "Successfully connected to Snowflake",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/snowflake/session"] });
      setLocation("/tables");
    },
    onError: (error: Error) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to Snowflake",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    connectMutation.mutate(credentials);
  };

  const handleChange = (field: keyof SnowflakeCredentials) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCredentials((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Database className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">Connect to Snowflake</CardTitle>
          <CardDescription>
            Enter your Snowflake credentials to start analyzing your data with AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account" className="flex items-center gap-2">
                <Server className="h-4 w-4 text-muted-foreground" />
                Account Identifier
              </Label>
              <Input
                id="account"
                placeholder="your-account.region.cloud"
                value={credentials.account}
                onChange={handleChange("account")}
                required
                data-testid="input-account"
              />
              <p className="text-xs text-muted-foreground">
                e.g., xy12345.us-east-1.aws or your-org-account
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Username
                </Label>
                <Input
                  id="username"
                  placeholder="your_username"
                  value={credentials.username}
                  onChange={handleChange("username")}
                  required
                  data-testid="input-username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={credentials.password}
                  onChange={handleChange("password")}
                  required
                  data-testid="input-password"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="warehouse" className="flex items-center gap-2">
                <Warehouse className="h-4 w-4 text-muted-foreground" />
                Warehouse
              </Label>
              <Input
                id="warehouse"
                placeholder="COMPUTE_WH"
                value={credentials.warehouse}
                onChange={handleChange("warehouse")}
                required
                data-testid="input-warehouse"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="database" className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  Database
                </Label>
                <Input
                  id="database"
                  placeholder="MY_DATABASE"
                  value={credentials.database}
                  onChange={handleChange("database")}
                  required
                  data-testid="input-database"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="schema" className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                  Schema
                </Label>
                <Input
                  id="schema"
                  placeholder="PUBLIC"
                  value={credentials.schema}
                  onChange={handleChange("schema")}
                  required
                  data-testid="input-schema"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                Role (Optional)
              </Label>
              <Input
                id="role"
                placeholder="ACCOUNTADMIN"
                value={credentials.role}
                onChange={handleChange("role")}
                data-testid="input-role"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={connectMutation.isPending}
              data-testid="button-connect"
            >
              {connectMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Connect to Snowflake
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 rounded-lg bg-muted/50 p-4">
            <h4 className="mb-2 text-sm font-medium">Security Note</h4>
            <p className="text-xs text-muted-foreground">
              Your credentials are used only for this session and are not stored permanently.
              The connection is established directly with your Snowflake account.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
