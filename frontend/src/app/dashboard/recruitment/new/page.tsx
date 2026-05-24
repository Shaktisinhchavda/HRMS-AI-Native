"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  UploadCloud, FileText, CheckCircle2, Loader2, Bot, ArrowLeft, 
  Briefcase, GraduationCap, Award, Globe, MapPin, Link2, 
  ExternalLink, ThumbsUp, ThumbsDown,
  Sparkles
} from "lucide-react";
import Link from "next/link";

interface EducationEntry {
  degree: string | null;
  institution: string | null;
  year: string | null;
}

interface WorkExperienceEntry {
  title: string | null;
  company: string | null;
  duration: string | null;
  highlights: string[];
}

interface ParsedResult {
  name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedin: string | null;
  portfolio: string | null;
  current_title: string | null;
  skills: string[];
  experience_years: number | null;
  match_score: number | null;
  summary: string | null;
  education: EducationEntry[];
  work_experience: WorkExperienceEntry[];
  certifications: string[];
  languages: string[];
  strengths: string[];
  weaknesses: string[];
  raw_text: string;
}

function ScoreRing({ score }: { score: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#3b82f6" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg className="transform -rotate-90" width="96" height="96">
        <circle cx="48" cy="48" r={radius} fill="transparent" stroke="currentColor" strokeOpacity={0.1} strokeWidth={6} />
        <circle
          cx="48" cy="48" r={radius} fill="transparent"
          stroke={color} strokeWidth={6} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold" style={{ color }}>{score}</span>
        <span className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground">Score</span>
      </div>
    </div>
  );
}

export default function UploadResumePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [showJD, setShowJD] = useState(false);
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
    if (jobDescription.trim()) {
      formData.append("job_description", jobDescription.trim());
    }

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
      await api.post("/api/recruitment/candidates", {
        ...parsedData,
        ai_summary: parsedData.summary,
        resume_text: parsedData.raw_text,
      });
      router.push("/dashboard/recruitment");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save candidate to database.");
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/recruitment">
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Resume Analyzer</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Deep analysis of candidate profiles powered by AI
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="glass-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Upload Resume</CardTitle>
              <CardDescription>PDF, DOCX, or TXT (Max 5MB)</CardDescription>
            </CardHeader>
            <CardContent>
              {!file ? (
                <label className="border-2 border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer min-h-[180px]">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <UploadCloud className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold mb-1">Click to upload</h3>
                  <p className="text-xs text-muted-foreground text-center">
                    .pdf, .docx, .txt
                  </p>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".pdf,.docx,.txt" 
                    onChange={handleFileChange}
                  />
                </label>
              ) : (
                <div className="border border-border rounded-xl p-5 flex flex-col items-center justify-center min-h-[180px] bg-muted/20">
                  <FileText className="w-10 h-10 text-primary mb-3" />
                  <h3 className="font-medium text-center truncate max-w-[200px] text-sm mb-1">{file.name}</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setFile(null); setParsedData(null); }}>
                      Remove
                    </Button>
                    <Button size="sm" onClick={handleUploadAndParse} disabled={isParsing} className="gap-2">
                      {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {isParsing ? "Analyzing..." : "Analyze"}
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

          {/* Job Description (Optional) */}
          <Card className="glass-card shadow-sm">
            <CardHeader 
              className="cursor-pointer hover:bg-muted/30 transition-colors py-3"
              onClick={() => setShowJD(!showJD)}
            >
              <CardTitle className="text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" />
                  Match Against Job Description
                </div>
                <Badge variant="outline" className="text-[10px]">Optional</Badge>
              </CardTitle>
            </CardHeader>
            {showJD && (
              <CardContent className="pt-0">
                <Textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here to get a role-specific match score and analysis..."
                  className="min-h-[120px] text-sm resize-none"
                />
                {jobDescription.trim() && (
                  <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    JD will be used for scoring
                  </p>
                )}
              </CardContent>
            )}
          </Card>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-3">
          <Card className={`glass-card shadow-sm transition-all duration-500 ${parsedData ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            <CardHeader className="bg-primary/5 border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                AI Analysis Report
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isParsing ? (
                <div className="p-16 flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <Sparkles className="w-4 h-4 text-primary absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Deep Resume Analysis in Progress</p>
                    <p className="text-xs text-muted-foreground mt-1 animate-pulse">
                      Extracting education, work history, skills &amp; more...
                    </p>
                  </div>
                </div>
              ) : parsedData ? (
                <div className="divide-y divide-border/50">
                  {/* Header with Score */}
                  <div className="p-6 flex items-start gap-5">
                    <ScoreRing score={parsedData.match_score ?? 0} />
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-bold">{parsedData.name}</h2>
                      {parsedData.current_title && (
                        <p className="text-sm text-primary font-medium">{parsedData.current_title}</p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                        {parsedData.email && <span>{parsedData.email}</span>}
                        {parsedData.phone && <span>{parsedData.phone}</span>}
                        {parsedData.location && (
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{parsedData.location}</span>
                        )}
                      </div>
                      <div className="flex gap-2 mt-2">
                        {parsedData.linkedin && (
                          <a href={parsedData.linkedin} target="_blank" rel="noopener noreferrer">
                            <Badge variant="outline" className="text-[10px] gap-1 cursor-pointer hover:bg-primary/10">
                              <Link2 className="w-3 h-3" /> LinkedIn
                            </Badge>
                          </a>
                        )}
                        {parsedData.portfolio && (
                          <a href={parsedData.portfolio} target="_blank" rel="noopener noreferrer">
                            <Badge variant="outline" className="text-[10px] gap-1 cursor-pointer hover:bg-primary/10">
                              <ExternalLink className="w-3 h-3" /> Portfolio
                            </Badge>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AI Summary */}
                  {parsedData.summary && (
                    <div className="p-6">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Executive Summary</h4>
                      <p className="text-sm leading-relaxed border-l-2 border-primary/30 pl-3 text-foreground/90">
                        {parsedData.summary}
                      </p>
                    </div>
                  )}

                  {/* Skills */}
                  <div className="p-6">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      Skills ({parsedData.skills.length})
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {parsedData.skills.map((skill, i) => (
                        <Badge key={i} variant="secondary" className="bg-primary/5 text-foreground/80 font-normal text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Work Experience */}
                  {parsedData.work_experience.length > 0 && (
                    <div className="p-6">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5" />
                        Work Experience ({parsedData.experience_years ?? 0} yrs)
                      </h4>
                      <div className="space-y-4">
                        {parsedData.work_experience.map((exp, i) => (
                          <div key={i} className="relative pl-5 before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:rounded-full before:bg-primary/50">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-semibold">{exp.title}</p>
                                <p className="text-xs text-muted-foreground">{exp.company}</p>
                              </div>
                              {exp.duration && (
                                <Badge variant="outline" className="text-[10px] shrink-0 ml-2">{exp.duration}</Badge>
                              )}
                            </div>
                            {exp.highlights.length > 0 && (
                              <ul className="mt-1.5 space-y-0.5">
                                {exp.highlights.map((h, j) => (
                                  <li key={j} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                    <span className="text-primary mt-0.5">•</span> {h}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {parsedData.education.length > 0 && (
                    <div className="p-6">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <GraduationCap className="w-3.5 h-3.5" />
                        Education
                      </h4>
                      <div className="space-y-3">
                        {parsedData.education.map((edu, i) => (
                          <div key={i} className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium">{edu.degree}</p>
                              <p className="text-xs text-muted-foreground">{edu.institution}</p>
                            </div>
                            {edu.year && <Badge variant="outline" className="text-[10px] shrink-0">{edu.year}</Badge>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications & Languages */}
                  {(parsedData.certifications.length > 0 || parsedData.languages.length > 0) && (
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {parsedData.certifications.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                            <Award className="w-3.5 h-3.5" /> Certifications
                          </h4>
                          <ul className="space-y-1">
                            {parsedData.certifications.map((cert, i) => (
                              <li key={i} className="text-xs text-foreground/80 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> {cert}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {parsedData.languages.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                            <Globe className="w-3.5 h-3.5" /> Languages
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {parsedData.languages.map((lang, i) => (
                              <Badge key={i} variant="outline" className="text-[10px] font-normal">{lang}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Strengths & Weaknesses */}
                  {(parsedData.strengths.length > 0 || parsedData.weaknesses.length > 0) && (
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {parsedData.strengths.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2 flex items-center gap-2">
                            <ThumbsUp className="w-3.5 h-3.5" /> Strengths
                          </h4>
                          <ul className="space-y-1.5">
                            {parsedData.strengths.map((s, i) => (
                              <li key={i} className="text-xs text-foreground/80 flex items-start gap-1.5">
                                <span className="text-emerald-500 mt-0.5 shrink-0">+</span> {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {parsedData.weaknesses.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2 flex items-center gap-2">
                            <ThumbsDown className="w-3.5 h-3.5" /> Areas of Concern
                          </h4>
                          <ul className="space-y-1.5">
                            {parsedData.weaknesses.map((w, i) => (
                              <li key={i} className="text-xs text-foreground/80 flex items-start gap-1.5">
                                <span className="text-amber-500 mt-0.5 shrink-0">−</span> {w}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="p-6 flex justify-end gap-3 bg-muted/10">
                    <Button variant="outline" onClick={() => setParsedData(null)}>Discard</Button>
                    <Button onClick={handleSaveCandidate} disabled={isSaving} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Approve &amp; Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-16 flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Bot className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Upload a resume to see the AI&apos;s deep analysis here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
