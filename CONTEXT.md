# HRMS AI-Native Project Context

## Project Overview
An AI-native Human Resource Management System built from scratch.

## Tech Stack
- **Frontend**: Next.js 15, React, TypeScript, TailwindCSS v4, shadcn/ui
- **Backend**: Python, FastAPI, SQLAlchemy, SQLite
- **AI Provider**: Ollama (Local)

## Implementation Phases
1. **Foundation** (Current) - Project scaffolding, auth, dashboard shell
2. **Resume Screening** - AI parsing and candidate ranking
3. **HR Copilot** - Chat interface for HR queries
4. **Natural Language Reports** - Text-to-SQL / conversational reporting
5. **Attrition & Skill Gap** - Predictive analytics
6. **Anomaly Detection** - System monitoring and LLM benchmarks

---

## Session Logs

### [2026-05-23] Employees Directory Module
- **What was built**:
  - Implemented the missing `Employees` module linked in the sidebar.
  - Added backend `GET /api/employees` to serve employee data.
  - Built a searchable Data Table on the frontend to browse all employees.
- **Files changed**:
  - Backend: `schemas/employee.py`, `routers/employees.py`, `main.py`
  - Frontend: `app/dashboard/employees/page.tsx`

### [2026-05-23] Phase 6: Attendance Anomaly Detection
- **What was built**:
  - Implemented attendance anomaly detection in `app/services/analytics.py` based on excessive absenteeism, chronic lateness, and overworking.
  - Exposed via `/api/analytics/anomalies`.
  - Added a dedicated "Attendance Anomalies" UI panel to the Analytics Dashboard.
- **Files changed**:
  - Backend: `services/analytics.py`, `routers/analytics.py`
  - Frontend: `app/dashboard/analytics/page.tsx`

### [2026-05-23] Phase 5: Attrition Prediction & Skill Gap Analysis
- **What was built**:
  - Backend analytics endpoints (`/api/analytics/attrition`, `/api/analytics/skills`) to aggregate database information.
  - Installed `recharts` for frontend data visualization.
  - Built `/dashboard/analytics` dashboard page with KPIs, a Pie chart for company-wide attrition risk, and a Bar chart for skill distribution.
  - Embedded the Text-to-SQL AI as a specialized "Analytics Copilot" sidebar within the dashboard.
- **Files changed**:
  - Backend: `services/analytics.py`, `routers/analytics.py`, `main.py`
  - Frontend: `package.json`, `app/dashboard/analytics/page.tsx`
- **What works**: Dashboard loads rich visualizations and the embedded copilot answers analytical questions correctly.
- **What is broken**: None currently known.
- **Next steps**:
  - Phase 6: Anomaly Detection (System monitoring and LLM benchmarks)

### [2026-05-23] Phase 4: Natural Language Reports
- **What was built**:
  - Employee, Attendance, and Payroll data models.
  - Test data seeded (20 employees, 30 days attendance, 3 months payroll).
  - Text-to-SQL engine in `nl_reports.py` using Ollama to translate English questions into SQLite queries.
  - Safe query execution (blocks anything that isn't a SELECT statement).
  - AI insight generation to summarize SQL query results.
  - Frontend dashboard at `/dashboard/reports` with interactive example chips, a data table, and an insights card.
- **Files changed**:
  - Backend: `models/employee.py`, `models/attendance.py`, `models/payroll.py`, `seed_reports.py`, `services/nl_reports.py`, `routers/reports.py`, `main.py`
  - Frontend: `app/dashboard/reports/page.tsx`
- **What works**: Asking natural language questions and getting table results + AI summaries.
- **What is broken**: None currently known.
- **Next steps**:
  - Phase 5: Attrition Prediction & Skill Gap Analysis

### [2026-05-23] Phase 3: HR Copilot (RAG)
- **What was built**:
  - Sample `hr_policy.md` created as a knowledge base.
  - `chromadb` integrated for local document chunking and vector retrieval.
  - `rag.py` service created to ingest the policy and query Ollama (`qwen2.5:3b`) with retrieved context.
  - `/api/copilot/chat` endpoint added.
  - Frontend Copilot Dashboard (`/dashboard/copilot`) built with a clean, animated chat UI.
- **Files changed**:
  - Backend: `main.py`, `services/rag.py`, `routers/copilot.py`, `schemas/copilot.py`, `data/hr_policy.md`, `requirements.txt`
  - Frontend: `app/dashboard/copilot/page.tsx`
- **What works**: Context-aware RAG querying over HR policies via chat interface.
- **What is broken**: None currently known.
- **Next steps**:
  - Phase 4: Natural Language Reports (Text-to-SQL)

### [2026-05-23] Phase 2: Resume Screening
- **What was built**: 
  - FastAPI backend with SQLite, SQLAlchemy, and JWT authentication
  - Seed script to generate admin, HR manager, and employee users
  - Next.js frontend with TailwindCSS v4 and shadcn/ui
  - Enterprise blue styling theme with glassmorphism effects
  - Login page with API integration
  - Dashboard layout shell (sidebar, topbar, auth guard)
  - Dashboard overview page with animated KPI cards
- **Files changed**: Created full scaffolding in `/backend` and `/frontend` directories.
- **What works**: Backend API, DB seeding, JWT Auth, Frontend Login, Dashboard Routing
- **What is broken**: None currently known.
- **Next steps**: 
  - Integrate Ollama for Phase 2 (Resume Screening)
  - Build candidate tracking models in backend
  - Build recruitment dashboard in frontend
