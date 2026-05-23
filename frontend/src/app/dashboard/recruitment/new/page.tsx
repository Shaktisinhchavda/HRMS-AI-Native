"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, FileText, CheckCircle2, Loader2, Bot, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ParsedResult {
  name: string;
  email: string | null;
  phone: string | null;
  skills: string[];
  experience_years: number | null;
  match_score: number | null;
  ai_summary: string | null;
  raw_text: string;
}

export default function UploadResumePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setParsedData(null);
    }
  };

  const handleUploadAndParse = async () => {
    if (!file) return;
    
    setIsParsing(true);
    setError(null);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const data = await api.postForm<ParsedResult>("/api/recruitment/parse", formData);
      setParsedData(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during AI parsing.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleSaveCandidate = async () => {
    if (!parsedData) return;
    setIsSaving(true);
    
    try {
      await api.post("/api/recruitment/candidates", parsedData);
      router.push("/dashboard/recruitment");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save candidate to database.");
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/recruitment">
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Upload Resume</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Let the AI automatically extract and score the candidate's profile.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Zone */}
        <Card className="glass-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Select File</CardTitle>
            <CardDescription>Upload a PDF or DOCX file (Max 5MB)</CardDescription>
          </CardHeader>
          <CardContent>
            {!file ? (
              <label className="border-2 border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer min-h-[250px]">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <UploadCloud className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-base font-semibold mb-1">Click to upload</h3>
                <p className="text-xs text-muted-foreground text-center mb-6">
                  Supports .pdf, .docx, and .txt files
                </p>
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".pdf,.docx,.txt" 
                  onChange={handleFileChange}
                />
                <Button variant="outline" className="pointer-events-none">Select File</Button>
              </label>
            ) : (
              <div className="border border-border rounded-xl p-6 flex flex-col items-center justify-center min-h-[250px] bg-muted/20">
                <FileText className="w-12 h-12 text-primary mb-4" />
                <h3 className="font-medium text-center truncate max-w-[200px] mb-2">{file.name}</h3>
                <p className="text-xs text-muted-foreground mb-6">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" onClick={() => { setFile(null); setParsedData(null); }}>
                    Remove
                  </Button>
                  <Button size="sm" onClick={handleUploadAndParse} disabled={isParsing} className="gap-2">
                    {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                    {isParsing ? "AI is parsing..." : "Extract with AI"}
                  </Button>
                </div>
              </div>
            )}
            
            {error && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Results Preview */}
        <Card className={`glass-card shadow-sm transition-all duration-500 ${parsedData ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4 pointer-events-none'}`}>
          <CardHeader className="bg-primary/5 border-b pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              AI Extracted Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isParsing ? (
              <div className="p-12 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground animate-pulse">Reading document & analyzing skills...</p>
              </div>
            ) : parsedData ? (
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold">{parsedData.name}</h2>
                    <p className="text-sm text-muted-foreground">{parsedData.email} | {parsedData.phone}</p>
                  </div>
                  {parsedData.match_score !== null && (
                    <div className="text-center bg-primary/10 rounded-lg p-2 min-w-[70px]">
                      <div className="text-2xl font-bold text-primary">{parsedData.match_score}%</div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-primary/70">Match</div>
                    </div>
                  )}
                </div>

                {parsedData.ai_summary && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">AI Assessment</h4>
                    <p className="text-sm leading-relaxed border-l-2 border-primary/30 pl-3 italic text-foreground/90">
                      "{parsedData.ai_summary}"
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Skills ({parsedData.skills.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {parsedData.skills.map((skill, i) => (
                      <Badge key={i} variant="secondary" className="bg-muted/50 font-normal">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setParsedData(null)}>Discard</Button>
                  <Button onClick={handleSaveCandidate} disabled={isSaving} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Approve & Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Bot className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload a resume on the left to see the AI's analysis here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
