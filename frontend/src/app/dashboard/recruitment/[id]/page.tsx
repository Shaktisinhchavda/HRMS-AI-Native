"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Loader2, Mail, User, Briefcase, Bot, 
  FileText, Award, Globe, ThumbsUp, ThumbsDown, GraduationCap,
  ChevronDown, ChevronUp, Trash2
} from "lucide-react";

interface CandidateDetail {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  skills: string[];
  experience_years: number | null;
  match_score: number | null;
  ai_summary: string | null;
  resume_text: string | null;
  created_at: string | null;
}

function ScoreRing({ score }: { score: number }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#3b82f6" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <svg className="transform -rotate-90" width="112" height="112">
        <circle cx="56" cy="56" r={radius} fill="transparent" stroke="currentColor" strokeOpacity={0.1} strokeWidth={7} />
        <circle
          cx="56" cy="56" r={radius} fill="transparent"
          stroke={color} strokeWidth={7} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold" style={{ color }}>{score}</span>
        <span className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground">Match</span>
      </div>
    </div>
  );
}

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params.id as string;
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showResume, setShowResume] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to remove ${candidate?.name}? This action cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/recruitment/candidates/${candidateId}`);
      router.push("/dashboard/recruitment");
    } catch (error) {
      console.error("Failed to delete candidate:", error);
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        const data = await api.get<CandidateDetail>(`/api/recruitment/candidates/${candidateId}`);
        setCandidate(data);
      } catch (error) {
        console.error("Failed to fetch candidate:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCandidate();
  }, [candidateId]);

  if (isLoading || !candidate) {
    return (
      <div className="h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
      </div>
    );
  }

  const scoreColor =
    !candidate.match_score ? "text-muted-foreground" :
    candidate.match_score >= 80 ? "text-emerald-500" :
    candidate.match_score >= 60 ? "text-blue-500" :
    candidate.match_score >= 40 ? "text-amber-500" : "text-destructive";

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/recruitment">
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Candidate Report</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Full AI-generated analysis
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="glass-card shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <ScoreRing score={candidate.match_score ?? 0} />
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold">{candidate.name}</h2>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Briefcase className="w-4 h-4" />
                {candidate.experience_years ? `${candidate.experience_years} years of experience` : "Experience not specified"}
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 text-sm text-muted-foreground">
                {candidate.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> {candidate.email}
                  </span>
                )}
                {candidate.phone && (
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> {candidate.phone}
                  </span>
                )}
              </div>
              {candidate.created_at && (
                <p className="text-xs text-muted-foreground mt-3">
                  Uploaded on {new Date(candidate.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* AI Summary */}
          {candidate.ai_summary && (
            <Card className="glass-card shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bot className="w-4 h-4 text-primary" />
                  AI Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed border-l-2 border-primary/30 pl-4 text-foreground/90">
                  {candidate.ai_summary}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Skills */}
          <Card className="glass-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" />
                Skills ({candidate.skills.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map((skill, i) => (
                  <Badge key={i} variant="secondary" className="bg-primary/5 text-foreground/80 font-normal">
                    {skill}
                  </Badge>
                ))}
                {candidate.skills.length === 0 && (
                  <p className="text-sm text-muted-foreground">No skills extracted</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resume Text Toggle */}
          <Card className="glass-card shadow-sm">
            <CardHeader 
              className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => setShowResume(!showResume)}
            >
              <CardTitle className="text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Raw Resume Text
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {candidate.resume_text ? `${candidate.resume_text.length} chars` : "N/A"}
                  </Badge>
                  {showResume ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </CardTitle>
            </CardHeader>
            {showResume && candidate.resume_text && (
              <CardContent className="pt-0">
                <div className="bg-muted/30 rounded-lg p-4 max-h-[400px] overflow-y-auto scrollbar-thin">
                  <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed text-foreground/80">
                    {candidate.resume_text}
                  </pre>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="glass-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Quick Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Match Score</span>
                <span className={`text-sm font-bold ${scoreColor}`}>
                  {candidate.match_score ?? "N/A"}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${candidate.match_score ?? 0}%`,
                    backgroundColor: candidate.match_score && candidate.match_score >= 80 ? "#10b981" 
                      : candidate.match_score && candidate.match_score >= 60 ? "#3b82f6" 
                      : candidate.match_score && candidate.match_score >= 40 ? "#f59e0b" : "#ef4444"
                  }}
                />
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-muted-foreground">Experience</span>
                <span className="text-sm font-medium">
                  {candidate.experience_years ?? 0} years
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Skills Count</span>
                <span className="text-sm font-medium">{candidate.skills.length}</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="glass-card shadow-sm">
            <CardContent className="p-4 space-y-3">
              <Link href="/dashboard/recruitment" className="block">
                <Button variant="outline" className="w-full gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Candidates
                </Button>
              </Link>
              <Button 
                variant="destructive" 
                className="w-full gap-2" 
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {isDeleting ? "Removing..." : "Remove Candidate"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
