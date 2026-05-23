"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, User, Loader2, Sparkles, BookOpen, CheckCircle2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
}

export default function HRCopilotPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "ai",
      content: "Hello! I am your HR Copilot. I can answer questions about company policies, benefits, remote work, and more based on the HR handbook. How can I help you today?",
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await api.post<{ response: string }>("/api/copilot/chat", {
        message: userMessage.content,
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: result.response,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: "Sorry, I encountered an error while retrieving the policy information. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    "What is the remote work policy?",
    "How many days of paid leave do I get?",
    "Is there a home office stipend?",
    "When do performance reviews happen?",
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-fade-in">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          HR Copilot <Badge variant="secondary" className="bg-primary/10 text-primary">RAG Powered</Badge>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Ask questions based on the official company HR Handbook.
        </p>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Chat Area */}
        <Card className="flex-1 flex flex-col glass-card border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="py-3 px-4 border-b bg-muted/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">HR Assistant</CardTitle>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                  Ollama + ChromaDB
                </p>
              </div>
            </div>
          </CardHeader>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
              >
                <Avatar className="w-8 h-8 shrink-0 mt-0.5 border shadow-sm">
                  {msg.role === "ai" ? (
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  ) : (
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <div 
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-tr-sm" 
                      : "bg-muted/50 border border-border/50 rounded-tl-sm text-foreground/90"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 max-w-[85%]">
                <Avatar className="w-8 h-8 shrink-0 mt-0.5 border shadow-sm">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="px-5 py-3.5 rounded-2xl bg-muted/50 border border-border/50 rounded-tl-sm flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/80 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <CardFooter className="p-3 bg-muted/10 border-t shrink-0">
            <form onSubmit={handleSend} className="flex w-full gap-2 items-end relative">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about leave, remote work, benefits..."
                className="flex-1 bg-background h-11 pr-12 rounded-xl focus-visible:ring-primary/30"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!input.trim() || isLoading}
                className="absolute right-1 top-1 h-9 w-9 rounded-lg"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>

        {/* Sidebar Info */}
        <div className="w-64 hidden lg:flex flex-col gap-4">
          <Card className="glass-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                Knowledge Base
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                The Copilot searches through the official company handbook to generate verified answers.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium px-2 py-1.5 rounded-md bg-muted/50 border border-border/50">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Leave Policies
                </div>
                <div className="flex items-center gap-2 text-xs font-medium px-2 py-1.5 rounded-md bg-muted/50 border border-border/50">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Remote Work
                </div>
                <div className="flex items-center gap-2 text-xs font-medium px-2 py-1.5 rounded-md bg-muted/50 border border-border/50">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Benefits & Perks
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-sm flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Try asking:</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {suggestions.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(sug)}
                    className="text-left text-xs p-2.5 rounded-md bg-muted/30 hover:bg-muted transition-colors border border-transparent hover:border-border/50"
                  >
                    "{sug}"
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
