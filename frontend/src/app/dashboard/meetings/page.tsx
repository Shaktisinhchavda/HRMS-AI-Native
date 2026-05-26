"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Video, Loader2, Upload, Users, Clock, FileText,
  CheckCircle2, XCircle, Bot, ListChecks, ChevronDown,
  ChevronUp, Trash2, ArrowLeft, AlertCircle, Sparkles
} from "lucide-react";

interface MeetingListItem {
  id: number;
  title: string;
  date: string;
  attendee_count: number;
  summary: string;
  duration_minutes: number;
}

interface MeetingDetail {
  id: number;
  title: string;
  date: string;
  attendees: string[];
  matched_employees: string[];
  absent_employees: string[];
  summary: string;
  action_items: string[];
  duration_minutes: number;
  created_at: string;
}

function MeetingCard({ meeting, onClick }: { meeting: MeetingListItem; onClick: () => void }) {
  return (
    <Card className="glass-card card-hover cursor-pointer group" onClick={onClick}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold group-hover:text-primary transition-colors truncate">
              {meeting.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(meeting.date).toLocaleDateString("en-US", {
                year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
              })}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              {meeting.attendee_count}
            </div>
            {meeting.duration_minutes > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                {meeting.duration_minutes}m
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3 line-clamp-2 leading-relaxed">
          {meeting.summary}
        </p>
      </CardContent>
    </Card>
  );
}

function MeetingDetailView({
  meeting,
  onBack,
  onDelete,
}: {
  meeting: MeetingDetail;
  onBack: () => void;
  onDelete: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this meeting record?")) return;
    setIsDeleting(true);
    onDelete();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{meeting.title}</h2>
          <p className="text-xs text-muted-foreground">
            {new Date(meeting.date).toLocaleDateString("en-US", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
              hour: "2-digit", minute: "2-digit"
            })}
            {meeting.duration_minutes > 0 && ` · ${meeting.duration_minutes} minutes`}
          </p>
        </div>
        <Button
          variant="destructive"
          size="sm"
          className="gap-2"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          Delete
        </Button>
      </div>

      {/* Summary */}
      <Card className="glass-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bot className="w-4 h-4 text-primary" />
            AI Meeting Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed border-l-2 border-primary/30 pl-4 text-foreground/90">
            {meeting.summary}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendees (Present) */}
        <Card className="glass-card shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Present ({meeting.attendees.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
              {meeting.attendees.map((name, i) => {
                const isMatched = meeting.matched_employees.some(
                  (emp) => emp.toLowerCase().includes(name.toLowerCase().split(" ")[0])
                );
                return (
                  <div key={i} className="flex items-center gap-3">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                        {name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{name}</span>
                    {isMatched && (
                      <Badge variant="outline" className="text-[9px] ml-auto text-emerald-600 border-emerald-500/30">
                        Matched
                      </Badge>
                    )}
                  </div>
                );
              })}
              {meeting.attendees.length === 0 && (
                <p className="text-xs text-muted-foreground">No attendees detected</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Absent */}
        <Card className="glass-card shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <XCircle className="w-4 h-4 text-amber-500" />
              Absent ({meeting.absent_employees.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
              {meeting.absent_employees.slice(0, 20).map((name, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-bold">
                      {name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">{name}</span>
                </div>
              ))}
              {meeting.absent_employees.length > 20 && (
                <p className="text-xs text-muted-foreground italic">
                  +{meeting.absent_employees.length - 20} more
                </p>
              )}
              {meeting.absent_employees.length === 0 && (
                <p className="text-xs text-muted-foreground">Everyone was present!</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Items */}
      {meeting.action_items.length > 0 && (
        <Card className="glass-card shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-primary" />
              Action Items ({meeting.action_items.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {meeting.action_items.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                  </div>
                  <span className="text-foreground/90 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function MeetingsPage() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === "admin" || user?.role === "hr_manager";

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const data = await api.get<MeetingListItem[]>("/api/meetings/");
      setMeetings(data);
    } catch (err) {
      console.error("Failed to fetch meetings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewMeeting = async (id: number) => {
    try {
      const data = await api.get<MeetingDetail>(`/api/meetings/${id}`);
      setSelectedMeeting(data);
    } catch (err) {
      console.error("Failed to fetch meeting:", err);
    }
  };

  const handleParseTranscript = async () => {
    if (!transcript.trim()) return;
    setIsParsing(true);
    setError(null);

    try {
      const result = await api.post<MeetingDetail>("/api/meetings/parse", {
        transcript: transcript.trim(),
        title: meetingTitle.trim() || null,
      });
      setSelectedMeeting(result);
      setShowUpload(false);
      setTranscript("");
      setMeetingTitle("");
      fetchMeetings();
    } catch (err: any) {
      console.error("Parse error:", err);
      const message = err?.detail || err?.message || (typeof err === 'string' ? err : "Failed to parse transcript. Make sure Ollama is running and try again.");
      setError(message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDeleteMeeting = async () => {
    if (!selectedMeeting) return;
    try {
      await api.delete(`/api/meetings/${selectedMeeting.id}`);
      setSelectedMeeting(null);
      fetchMeetings();
    } catch (err) {
      console.error("Failed to delete meeting:", err);
    }
  };

  if (selectedMeeting) {
    return (
      <div className="space-y-6 animate-fade-in pb-8">
        <MeetingDetailView
          meeting={selectedMeeting}
          onBack={() => setSelectedMeeting(null)}
          onDelete={handleDeleteMeeting}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            Meetings
            <Badge variant="secondary" className="bg-primary/10 text-primary">AI Summary</Badge>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Upload meeting transcripts to auto-track attendance and generate summaries.
          </p>
        </div>
        {isAdmin && (
          <Button className="gap-2" onClick={() => setShowUpload(!showUpload)}>
            {showUpload ? <ChevronUp className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
            {showUpload ? "Cancel" : "Upload Transcript"}
          </Button>
        )}
      </div>

      {/* Upload Section */}
      {showUpload && (
        <Card className="glass-card shadow-sm border-primary/20 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Parse Meeting Transcript
            </CardTitle>
            <CardDescription>
              Paste your Google Meet or any meeting transcript below. The AI will extract attendees, generate a summary, and identify action items.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Meeting title (optional — AI will generate one if left blank)"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              className="bg-background/50"
            />
            <Textarea
              placeholder="Paste the full meeting transcript here...

Example format:
John: Good morning everyone, let's start the standup.
Sarah: I finished the API integration yesterday.
Mike: I'm working on the dashboard redesign..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="min-h-[200px] text-sm font-mono resize-none bg-background/50"
            />

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setShowUpload(false); setTranscript(""); setMeetingTitle(""); }}>
                Cancel
              </Button>
              <Button
                onClick={handleParseTranscript}
                disabled={!transcript.trim() || isParsing}
                className="gap-2"
              >
                {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                {isParsing ? "AI is analyzing..." : "Analyze Transcript"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Meetings List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="glass-card h-[120px] animate-pulse bg-muted/20" />
          ))}
        </div>
      ) : meetings.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center border rounded-xl border-dashed bg-card/50">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Video className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-medium">No meetings recorded yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mb-4">
            Upload a meeting transcript to automatically track attendance, generate an AI summary, and create action items.
          </p>
          {isAdmin && (
            <Button variant="outline" onClick={() => setShowUpload(true)}>
              Upload Transcript
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {meetings.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              onClick={() => handleViewMeeting(meeting.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
