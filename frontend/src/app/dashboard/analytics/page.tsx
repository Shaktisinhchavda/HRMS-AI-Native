"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ShieldAlert, TrendingDown, Target, BrainCircuit, Users, Bot, Send, Loader2, Sparkles, UserX } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AttritionData {
  overall: { low: number; medium: number; high: number };
  departments: Array<{ name: string; low: number; medium: number; high: number }>;
  high_risk_employees: Array<{ employee_id: string; full_name: string; department: string; designation: string }>;
}

interface SkillData {
  overall: Array<{ name: string; count: number }>;
  by_department: Record<string, Array<{ name: string; count: number }>>;
}

interface AnomalyData {
  employee_id: string;
  full_name: string;
  department: string;
  reasons: string[];
}

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
}

export default function AnalyticsDashboard() {
  const [attritionData, setAttritionData] = useState<AttritionData | null>(null);
  const [skillData, setSkillData] = useState<SkillData | null>(null);
  const [anomalyData, setAnomalyData] = useState<AnomalyData[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "ai",
      content: "I am your Analytics Copilot. I can run deep-dive queries on our workforce data. For example: 'What is the average salary of high-risk engineers?'",
    }
  ]);
  const [input, setInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [attrition, skills, anomalies] = await Promise.all([
          api.get<AttritionData>("/api/analytics/attrition"),
          api.get<SkillData>("/api/analytics/skills"),
          api.get<AnomalyData[]>("/api/analytics/anomalies"),
        ]);
        setAttritionData(attrition);
        setSkillData(skills);
        setAnomalyData(anomalies);
      } catch (error) {
        console.error("Failed to load analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isChatLoading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isChatLoading) return;

    const userMsg = { id: Date.now().toString(), role: "user" as const, content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsChatLoading(true);

    try {
      const response = await api.post<{ summary: string }>("/api/reports/query", { question: userMsg.content });
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "ai", content: response.summary }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "ai", content: "Sorry, I couldn't process that query. " + (error.detail || "") }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  if (isLoading || !attritionData || !skillData || !anomalyData) {
    return (
      <div className="h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
      </div>
    );
  }

  const pieData = [
    { name: "Low Risk", value: attritionData.overall.low || 0, color: "#10b981" },
    { name: "Medium Risk", value: attritionData.overall.medium || 0, color: "#f59e0b" },
    { name: "High Risk", value: attritionData.overall.high || 0, color: "#ef4444" },
  ];

  return (
    <div className="flex flex-col xl:flex-row gap-6 animate-fade-in pb-8 h-[calc(100vh-8rem)]">
      
      {/* Main Dashboard Area */}
      <div className="flex-1 space-y-6 overflow-y-auto pr-2 scrollbar-thin">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            Analytics & Insights
            <Badge variant="secondary" className="bg-primary/10 text-primary">Predictive</Badge>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            AI-driven attrition prediction and organizational skill gap analysis.
          </p>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card border-l-4 border-l-destructive shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">High Risk Employees</p>
                <h3 className="text-2xl font-bold text-foreground mt-0.5">{attritionData.overall.high}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-l-4 border-l-primary shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <BrainCircuit className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Most Common Skill</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">
                  {skillData.overall.length > 0 ? skillData.overall[0].name : "N/A"}
                </h3>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-l-4 border-l-emerald-500 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Retention Rate (Est)</p>
                <h3 className="text-2xl font-bold text-foreground mt-0.5">
                  {Math.round(((attritionData.overall.low + attritionData.overall.medium) / 
                    (attritionData.overall.low + attritionData.overall.medium + attritionData.overall.high)) * 100) || 0}%
                </h3>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attrition Risk Chart */}
          <Card className="glass-card shadow-sm flex flex-col">
            <CardHeader className="pb-2 flex flex-row justify-between items-start">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-primary" />
                  Company Attrition Risk
                </CardTitle>
                <CardDescription>Overall distribution of exit probability</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs h-7" 
                onClick={() => document.getElementById('retention-alerts')?.scrollIntoView({behavior: 'smooth'})}
              >
                View Details
              </Button>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center min-h-[250px]">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.8)' }} 
                    itemStyle={{ color: '#fff' }} 
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

            {/* Skill Distribution Bar Chart */}
          <Card className="glass-card shadow-sm flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-primary" />
                Top Skills Distribution
              </CardTitle>
              <CardDescription>Most prevalent skills across all departments</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center min-h-[250px] pt-4">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={skillData.overall.slice(0, 5)} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'currentColor', fontSize: 12 }} width={80} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.8)' }} 
                  />
                  <Bar dataKey="count" fill="currentColor" className="fill-primary" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Department Attrition Stacked Bar Chart */}
        <Card className="glass-card shadow-sm mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Departmental Risk Breakdown
            </CardTitle>
            <CardDescription>Interactive comparison of attrition risk levels by department</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={attritionData.departments}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.8)' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Bar dataKey="high" stackId="a" fill="#ef4444" name="High Risk" radius={[0, 0, 4, 4]} barSize={40} />
                  <Bar dataKey="medium" stackId="a" fill="#f59e0b" name="Medium Risk" barSize={40} />
                  <Bar dataKey="low" stackId="a" fill="#10b981" name="Low Risk" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Card id="retention-alerts" className="glass-card shadow-sm border-destructive/20 scroll-mt-6">
            <CardHeader className="pb-3 border-b bg-destructive/5">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-destructive">
                <UserX className="w-4 h-4" />
                Critical Retention Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {attritionData.high_risk_employees.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {attritionData.high_risk_employees.map((emp) => (
                    <div key={emp.employee_id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-destructive/20">
                          <AvatarFallback className="bg-destructive/10 text-destructive text-xs font-bold">
                            {emp.full_name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{emp.full_name}</p>
                          <p className="text-xs text-muted-foreground">{emp.designation} &middot; {emp.department}</p>
                        </div>
                      </div>
                      <Badge variant="destructive" className="bg-destructive/10 text-destructive hover:bg-destructive/20">
                        Flight Risk
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p>No high-risk employees identified.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendance Anomalies List */}
          <Card className="glass-card shadow-sm border-amber-500/20">
            <CardHeader className="pb-3 border-b bg-amber-500/5">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-amber-600 dark:text-amber-500">
                <ShieldAlert className="w-4 h-4" />
                Attendance Anomalies
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {anomalyData.length > 0 ? (
                <div className="divide-y divide-border/50 max-h-[300px] overflow-y-auto scrollbar-thin">
                  {anomalyData.map((emp) => (
                    <div key={emp.employee_id} className="p-4 flex flex-col gap-2 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-amber-500/20">
                            <AvatarFallback className="bg-amber-500/10 text-amber-600 dark:text-amber-500 text-xs font-bold">
                              {emp.full_name.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{emp.full_name}</p>
                            <p className="text-xs text-muted-foreground">{emp.department}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1 pl-12">
                        {emp.reasons.map((reason, idx) => (
                          <Badge key={idx} variant="outline" className="bg-amber-500/5 text-amber-600 border-amber-500/20 text-[10px]">
                            {reason}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p>No attendance anomalies detected.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Embedded Chatbot Sidebar */}
      <Card className="w-full xl:w-[400px] shrink-0 glass-card flex flex-col border-primary/20 shadow-lg h-[600px] xl:h-full">
        <CardHeader className="py-4 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-sm">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">Analytics Copilot</CardTitle>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Data-Driven Insights</p>
            </div>
          </div>
        </CardHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin" ref={scrollRef}>
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 max-w-[90%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}>
              <Avatar className="w-7 h-7 shrink-0 mt-0.5 shadow-sm border border-border/50">
                {msg.role === "ai" ? (
                  <AvatarFallback className="bg-primary/10 text-primary"><Bot className="w-3.5 h-3.5" /></AvatarFallback>
                ) : (
                  <AvatarFallback className="bg-secondary text-secondary-foreground"><Users className="w-3.5 h-3.5" /></AvatarFallback>
                )}
              </Avatar>
              <div className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                  msg.role === "user" 
                    ? "bg-primary text-primary-foreground rounded-tr-sm" 
                    : "bg-background border border-border/60 rounded-tl-sm text-foreground/90"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isChatLoading && (
            <div className="flex gap-3 max-w-[90%]">
              <Avatar className="w-7 h-7 shrink-0 mt-0.5 shadow-sm border border-border/50">
                <AvatarFallback className="bg-primary/10 text-primary"><Bot className="w-3.5 h-3.5" /></AvatarFallback>
              </Avatar>
              <div className="px-4 py-3 rounded-2xl bg-background border border-border/60 rounded-tl-sm flex items-center gap-1.5 shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-primary/80 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
        </div>

        <div className="p-3 bg-muted/20 border-t mt-auto">
          <form onSubmit={handleSendMessage} className="flex gap-2 relative">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about retention or skills..."
              className="flex-1 bg-background h-10 rounded-xl text-sm pr-10 focus-visible:ring-primary/30"
              disabled={isChatLoading}
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!input.trim() || isChatLoading}
              className="absolute right-1 top-1 h-8 w-8 rounded-lg"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
