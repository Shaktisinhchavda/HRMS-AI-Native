"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Send, BarChart3, Database, Sparkles, Loader2, Code2, AlertCircle } from "lucide-react";

interface ReportResponse {
  sql: string;
  columns: string[];
  rows: any[][];
  summary: string;
}

export default function NaturalLanguageReportsPage() {
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReportResponse | null>(null);
  const [showSql, setShowSql] = useState(false);

  const exampleQueries = [
    { label: "Attendance", query: "Show the total hours worked per employee this month" },
    { label: "Payroll", query: "Which employees received the highest overtime pay?" },
    { label: "Skills", query: "Show Python skill distribution across departments" },
    { label: "Attrition", query: "Which department has the highest exit risk?" },
    { label: "Hiring", query: "Show average salary by department" },
  ];

  const handleQuery = async (queryText: string) => {
    if (!queryText.trim()) return;
    
    setQuestion(queryText);
    setIsLoading(true);
    setError(null);
    setResult(null);
    setShowSql(false);

    try {
      const data = await api.post<ReportResponse>("/api/reports/query", {
        question: queryText.trim(),
      });
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.detail || "Failed to generate report. Please try a different phrasing.");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleQuery(question);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          Natural Language Reports
          <Badge variant="secondary" className="bg-primary/10 text-primary">Text-to-SQL</Badge>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Ask questions in plain English to generate dynamic database queries and insights.
        </p>
      </div>

      <Card className="glass-card shadow-sm border-primary/20">
        <CardContent className="p-6">
          <form onSubmit={onSubmit} className="flex gap-3 relative">
            <div className="relative flex-1">
              <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/50" />
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., Which department has the highest exit risk?"
                className="pl-12 h-14 text-base rounded-xl bg-background/50 border-border/60 focus-visible:ring-primary/30"
                disabled={isLoading}
              />
            </div>
            <Button 
              type="submit" 
              className="h-14 px-8 rounded-xl font-medium"
              disabled={!question.trim() || isLoading}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
              Generate Report
            </Button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground mr-2 font-medium uppercase tracking-wider">Example Queries:</span>
            {exampleQueries.map((ex, i) => (
              <Badge 
                key={i} 
                variant="outline" 
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors py-1.5 px-3"
                onClick={() => handleQuery(ex.query)}
              >
                {ex.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Main Results Table */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-card shadow-sm overflow-hidden flex flex-col">
              <CardHeader className="border-b bg-muted/10 py-4 flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="w-4 h-4 text-primary" />
                  Query Results
                </CardTitle>
                <Badge variant="secondary" className="font-normal">
                  {result.rows.length} rows returned
                </Badge>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-x-auto">
                {result.rows.length > 0 ? (
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        {result.columns.map((col, i) => (
                          <TableHead key={i} className="font-semibold text-xs uppercase tracking-wider whitespace-nowrap">
                            {col.replace(/_/g, " ")}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.rows.map((row, i) => (
                        <TableRow key={i} className="hover:bg-muted/20">
                          {row.map((cell, j) => (
                            <TableCell key={j} className="whitespace-nowrap">
                              {cell === null ? <span className="text-muted-foreground italic">null</span> : String(cell)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                    <Database className="w-8 h-8 mb-3 opacity-20" />
                    <p>The query executed successfully but returned 0 rows.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Insights & SQL */}
          <div className="space-y-6">
            <Card className="glass-card shadow-sm border-emerald-500/20 bg-emerald-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-emerald-700">
                  <BarChart3 className="w-4 h-4" />
                  AI Insight Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-emerald-900/80">
                  {result.summary}
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card shadow-sm">
              <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setShowSql(!showSql)}>
                <CardTitle className="text-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-primary" />
                    Generated SQL
                  </div>
                  <span className="text-xs text-muted-foreground font-normal">{showSql ? 'Hide' : 'Show'}</span>
                </CardTitle>
              </CardHeader>
              {showSql && (
                <CardContent className="pt-0">
                  <div className="bg-zinc-950 rounded-lg p-4 overflow-x-auto relative group">
                    <pre className="text-xs text-emerald-400 font-mono leading-relaxed">
                      <code>{result.sql}</code>
                    </pre>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
