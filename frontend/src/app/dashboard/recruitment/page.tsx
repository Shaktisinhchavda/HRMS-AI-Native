"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, FileText, CheckCircle2, User, Mail, Briefcase, Bot } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Candidate {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  skills: string; // JSON string
  experience_years: number | null;
  match_score: number | null;
  ai_summary: string | null;
}

export default function RecruitmentDashboard() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const data = await api.get<Candidate[]>("/api/recruitment/candidates");
      setCandidates(data);
    } catch (error) {
      console.error("Failed to fetch candidates", error);
    } finally {
      setIsLoading(false);
    }
  };

  const parseSkills = (skillsJson: string) => {
    try {
      return JSON.parse(skillsJson) as string[];
    } catch {
      return [];
    }
  };

  const filteredCandidates = candidates.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || 
           (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            Recruitment <Badge variant="secondary" className="bg-primary/10 text-primary">AI Powered</Badge>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage and screen candidates with automated AI resume parsing.
          </p>
        </div>
        <Link href="/dashboard/recruitment/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Upload Resume
          </Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <Card className="glass-card shadow-sm border-border/50">
        <CardContent className="p-4 flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search candidates by name or email..." 
              className="pl-9 bg-background/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="text-sm text-muted-foreground ml-auto hidden sm:block">
            {filteredCandidates.length} candidates found
          </div>
        </CardContent>
      </Card>

      {/* Candidate Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="glass-card h-[280px] animate-pulse bg-muted/20" />
          ))}
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl border-dashed bg-card/50">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-medium">No candidates found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mb-4">
            Upload a resume to automatically extract skills, experience, and calculate a match score.
          </p>
          <Link href="/dashboard/recruitment/new">
            <Button variant="outline">Upload Resume</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCandidates.map((candidate) => {
            const skills = parseSkills(candidate.skills);
            const scoreColor = 
              !candidate.match_score ? "text-muted-foreground" :
              candidate.match_score >= 80 ? "text-emerald-500" :
              candidate.match_score >= 60 ? "text-amber-500" : "text-destructive";

            return (
              <Card key={candidate.id} className="glass-card card-hover overflow-hidden flex flex-col">
                <CardHeader className="pb-3 border-b bg-muted/10">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <CardTitle className="text-base font-semibold truncate" title={candidate.name}>
                        {candidate.name}
                      </CardTitle>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                        <Briefcase className="w-3.5 h-3.5" />
                        {candidate.experience_years ? `${candidate.experience_years} years exp.` : "Experience N/A"}
                      </div>
                    </div>
                    {candidate.match_score !== null && (
                      <div className="flex flex-col items-end">
                        <div className={`text-xl font-bold tracking-tight ${scoreColor}`}>
                          {candidate.match_score}%
                        </div>
                        <div className="text-[10px] text-muted-foreground uppercase font-semibold">Match</div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4 flex-1 flex flex-col text-sm space-y-4">
                  {candidate.ai_summary && (
                    <div className="bg-primary/5 rounded-md p-3 text-xs leading-relaxed text-foreground/80 border border-primary/10 relative">
                      <Bot className="w-3 h-3 absolute top-3 right-3 text-primary/40" />
                      {candidate.ai_summary}
                    </div>
                  )}

                  {(candidate.email || candidate.phone) && (
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      {candidate.email && (
                        <div className="flex items-center gap-2 truncate">
                          <Mail className="w-3.5 h-3.5 shrink-0" /> {candidate.email}
                        </div>
                      )}
                      {candidate.phone && (
                        <div className="flex items-center gap-2 truncate">
                          <User className="w-3.5 h-3.5 shrink-0" /> {candidate.phone}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-auto pt-2">
                    <div className="flex flex-wrap gap-1.5">
                      {skills.slice(0, 4).map((skill, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] bg-background">
                          {skill}
                        </Badge>
                      ))}
                      {skills.length > 4 && (
                        <Badge variant="outline" className="text-[10px] bg-muted/50">
                          +{skills.length - 4}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
