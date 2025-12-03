import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface ResultsTableProps {
  columns: string[];
  data: Record<string, string | number | null>[];
  maxRows?: number;
}

export default function ResultsTable({ columns, data, maxRows = 10 }: ResultsTableProps) {
  const displayData = data.slice(0, maxRows);
  const hasMore = data.length > maxRows;

  return (
    <div className="rounded-md border border-border" data-testid="results-table">
      <ScrollArea className="w-full">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map((col) => (
                <TableHead
                  key={col}
                  className="whitespace-nowrap font-medium text-foreground"
                >
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayData.map((row, i) => (
              <TableRow key={i} className="hover-elevate" data-testid={`row-result-${i}`}>
                {columns.map((col) => (
                  <TableCell key={col} className="whitespace-nowrap font-mono text-sm">
                    {row[col] === null ? (
                      <span className="text-muted-foreground italic">NULL</span>
                    ) : (
                      String(row[col])
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      {hasMore && (
        <div className="border-t border-border bg-muted/30 px-4 py-2 text-center text-xs text-muted-foreground">
          Showing {maxRows} of {data.length} rows
        </div>
      )}
    </div>
  );
}
