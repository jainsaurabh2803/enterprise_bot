import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

interface SQLCodeBlockProps {
  sql: string;
  title?: string;
}

export default function SQLCodeBlock({ sql, title = "Generated SQL" }: SQLCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = sql.split("\n");

  return (
    <div className="rounded-md border border-border bg-muted/30" data-testid="sql-code-block">
      <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-2">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className="gap-1.5 text-xs"
          data-testid="button-copy-sql"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </Button>
      </div>
      <div className="overflow-x-auto p-4">
        <pre className="font-mono text-sm">
          <code className="text-foreground">
            {lines.map((line, i) => (
              <div key={i} className="flex">
                <span className="mr-4 select-none text-muted-foreground opacity-50">
                  {String(i + 1).padStart(2, " ")}
                </span>
                <span>{highlightSQL(line)}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}

function highlightSQL(line: string) {
  const keywords = /\b(SELECT|FROM|WHERE|AND|OR|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP BY|ORDER BY|LIMIT|AS|COUNT|SUM|AVG|MAX|MIN|DISTINCT|IN|NOT|NULL|IS|LIKE|BETWEEN|HAVING|UNION|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TABLE|INDEX|VIEW|CASE|WHEN|THEN|ELSE|END)\b/gi;
  
  const parts = line.split(keywords);
  
  return parts.map((part, i) => {
    if (keywords.test(part)) {
      return (
        <span key={i} className="font-semibold text-primary">
          {part}
        </span>
      );
    }
    if (part.startsWith("'") || part.startsWith('"')) {
      return (
        <span key={i} className="text-emerald-600 dark:text-emerald-400">
          {part}
        </span>
      );
    }
    return part;
  });
}
