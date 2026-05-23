"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    setTimeout(() => {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    }, 500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings & Feedback</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your preferences and help us improve the system.
        </p>
      </div>

      <Card className="glass-card shadow-sm border-primary/10">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            System Feedback
          </CardTitle>
          <CardDescription>
            Have a suggestion or found a bug? Let our IT team know.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="font-medium text-lg">Feedback Sent!</p>
                <p className="text-sm text-muted-foreground">Thank you for helping us improve.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Input placeholder="e.g., Feature Request: Dark Mode" required className="bg-background" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Details</label>
                <Textarea 
                  placeholder="Describe your feedback here..." 
                  className="min-h-[120px] bg-background resize-none" 
                  required 
                />
              </div>
              <Button type="submit" className="w-full sm:w-auto flex items-center gap-2">
                <Send className="w-4 h-4" />
                Submit Feedback
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
