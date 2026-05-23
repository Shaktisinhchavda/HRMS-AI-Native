"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileSearch, TrendingUp, AlertCircle, Bot, Loader2, Star, Calendar, Clock, CheckCircle2, Mail, HelpCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AdminData {
  role: "admin";
  total_employees: number;
  open_positions: number;
  predicted_attrition_rate: number;
  recent_activities: Array<{ title: string; subtitle: string }>;
  alert: string;
}

interface EmployeeData {
  role: "employee";
  performance_score: number;
  leave_balance: number;
  weekly_hours: number;
  attendance_status: string;
  recent_activities: Array<{ title: string; subtitle: string }>;
  alert: string;
}

type DashboardData = AdminData | EmployeeData;

function AdminOverview({ data }: { data: AdminData }) {
  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card card-hover stagger-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total_employees}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active directory count
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card card-hover stagger-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
            <div className="w-8 h-8 rounded-full bg-chart-1/10 flex items-center justify-center">
              <FileSearch className="w-4 h-4 text-chart-1" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.open_positions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently accepting resumes
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card card-hover stagger-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Predicted Attrition</CardTitle>
            <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.predicted_attrition_rate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-destructive font-medium">High Risk</span> flagged employees
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card card-hover stagger-4">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
            <div className="w-8 h-8 rounded-full bg-chart-3/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-chart-3" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active critical alert generated
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Recent Onboardings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recent_activities.map((activity, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass-card border-destructive/20 bg-destructive/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                Attention Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-foreground/90">
                {data.alert}
              </p>
              <Link href="/dashboard/analytics">
                <button className="text-xs font-medium text-destructive mt-4 hover:underline">
                  View Analytics Report &rarr;
                </button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function EmployeeOverview({ data }: { data: EmployeeData }) {
  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card card-hover stagger-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.performance_score} <span className="text-sm font-normal text-muted-foreground">/ 5.0</span></div>
            <p className="text-xs text-muted-foreground mt-1">
              Last review: Q1 2026
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card card-hover stagger-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Leave Balance</CardTitle>
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.leave_balance} <span className="text-sm font-normal text-muted-foreground">days</span></div>
            <p className="text-xs text-muted-foreground mt-1">
              Available PTO
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card card-hover stagger-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Working Hours</CardTitle>
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.weekly_hours}h</div>
            <p className="text-xs text-muted-foreground mt-1">
              Logged this week
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card card-hover stagger-4">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.attendance_status}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Current standing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recent_activities.map((activity, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-primary">
                <AlertCircle className="w-4 h-4" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-foreground/90">
                {data.alert}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Contact HR / Support Portal */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                HR & Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Need help with payroll, policies, or IT support? 
              </p>
              
              <div className="space-y-3">
                <div className="p-3 rounded-lg border border-border bg-muted/30 flex items-start gap-3">
                  <Mail className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">HR Support</p>
                    <a href="mailto:hr@hrms.local" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                      hr@hrms.local
                    </a>
                  </div>
                </div>
                
                <div className="p-3 rounded-lg border border-border bg-muted/30 flex items-start gap-3">
                  <Mail className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">IT Helpdesk</p>
                    <a href="mailto:it@hrms.local" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                      it@hrms.local
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 mt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-3">
                  Have a question about HR policies or the employee handbook?
                </p>
                <Link href="/dashboard/copilot" className="block w-full">
                  <Button className="w-full gap-2" variant="outline">
                    <Bot className="w-4 h-4" />
                    Ask HR Copilot
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const result = await api.get<DashboardData>("/api/dashboard/overview");
        setData(result);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {user?.full_name?.split(" ")[0]}. Here&apos;s what&apos;s happening today.
        </p>
      </div>

      {data.role === "admin" ? (
        <AdminOverview data={data as AdminData} />
      ) : (
        <EmployeeOverview data={data as EmployeeData} />
      )}
    </div>
  );
}
