import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Shield, Eye, EyeOff, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AccessControlInfoProps {
  role: string;
  maskedColumns: string[];
  restrictedTables: string[];
  rowFilters: string[];
}

export default function AccessControlInfo({
  role,
  maskedColumns,
  restrictedTables,
  rowFilters,
}: AccessControlInfoProps) {
  return (
    <Card data-testid="access-control-info">
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
        <Shield className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Access Control Applied</span>
        <Badge variant="secondary" className="ml-auto text-xs">
          {role}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {maskedColumns.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <EyeOff className="h-3 w-3" />
              Masked Columns
            </div>
            <div className="flex flex-wrap gap-1">
              {maskedColumns.map((col) => (
                <Badge key={col} variant="outline" className="text-xs">
                  {col}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {restrictedTables.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Lock className="h-3 w-3" />
              Restricted Tables
            </div>
            <div className="flex flex-wrap gap-1">
              {restrictedTables.map((table) => (
                <Badge key={table} variant="outline" className="text-xs text-destructive">
                  {table}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {rowFilters.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Eye className="h-3 w-3" />
              Row-Level Filters
            </div>
            <div className="space-y-1">
              {rowFilters.map((filter, i) => (
                <code
                  key={i}
                  className="block rounded bg-muted px-2 py-1 font-mono text-xs"
                >
                  {filter}
                </code>
              ))}
            </div>
          </div>
        )}

        {maskedColumns.length === 0 &&
          restrictedTables.length === 0 &&
          rowFilters.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No access restrictions applied for this query.
            </p>
          )}
      </CardContent>
    </Card>
  );
}
