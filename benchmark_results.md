# LLM Benchmark Results

We tested three different LLM providers (**Ollama `qwen2.5:3b`**, **Groq `llama-3.1-8b-instant`**, and **Gemini `gemini-3-flash-preview`**) against three core HRMS workflows. 

Here are the results of the benchmark run:

## 1. Resume Parsing (Strict JSON Extraction)
*Testing ability to extract unstructured resume text into formatted JSON.*

| Provider | Model | Latency (s) | Speed (words/sec) | Output Snippet |
|----------|-------|-------------|-------------------|----------------|
| **Groq** | `llama-3.1-8b-instant` | **0.74s** | **13.49** | `{"name": "Jane Smith", "email": "jane.smith@email.com", "skills": ["Python", "FastAPI", "Postgres", "AWS"]}` |
| **Gemini** | `gemini-3-flash-preview` | 2.44s | 4.10 | `{"name": "Jane Smith", "email": "jane.smith@email.com", "skills": ["Python", "FastAPI", "Postgres", "AWS"]}` |
| **Ollama** | `qwen2.5:3b` | 5.44s | 2.58 | `{ "name": "Jane Smith", "email": "jane.smith@email.com", "skills": [ "Python", "FastAPI", "Postgres", "AWS"...` |

> [!TIP]
> **Winner: Groq**. It was incredibly fast (under 1 second) and successfully generated valid JSON.

## 2. HR Copilot (Context-Aware RAG)
*Testing ability to read injected context and answer an employee question accurately.*

| Provider | Model | Latency (s) | Speed (words/sec) | Output Snippet |
|----------|-------|-------------|-------------------|----------------|
| **Groq** | `llama-3.1-8b-instant` | **0.64s** | **41.94** | `You, as Rahul Verma, can work remotely for 2 days a week... As for your leave balance, you have 12 days left.` |
| **Ollama** | `qwen2.5:3b` | 1.55s | 16.15 | `Yes, you can work remotely for up to 2 days a week as per the HR policy. You currently have 12 days of leave remaining.` |
| **Gemini** | `gemini-3-flash-preview` | 2.64s | 7.57 | `Yes, as a Software Engineer, you can work remotely for 2 days a week. You have 12 leave days left.` |

> [!TIP]
> **Winner: Groq**. Blistering fast at ~42 words per second, and successfully synthesized both the HR policy context and the User's personal context. Ollama also performed very well here.

## 3. Natural Language to SQL (Analytics)
*Testing ability to write valid SQL queries based on a given database schema.*

| Provider | Model | Latency (s) | Speed (words/sec) | Output Snippet |
|----------|-------|-------------|-------------------|----------------|
| **Ollama** | `qwen2.5:3b` | **1.64s** | **8.53** | `SELECT AVG(salary) AS avg_salary FROM employees WHERE department = 'Engineering' AND performance_score > 4.0` |
| **Gemini** | `gemini-3-flash-preview` | 2.15s | 5.58 | `SELECT AVG(salary) FROM employees WHERE department = 'Engineering' AND performance_score > 4.0;` |
| **Groq** | `llama-3.1-8b-instant` | 7.89s | 1.77 | ````sql SELECT AVG(salary) FROM employees WHERE department = 'Engineering' AND performance_score > 4.0; ```` |

> [!WARNING]
> **Winner: Ollama & Gemini**. Interestingly, Groq struggled significantly with latency on this code-generation task (nearly 8 seconds). Ollama returned the cleanest raw SQL the fastest.

---

## Conclusion
- **Groq** is clearly the best choice for text-heavy, conversational tasks (like the HR Copilot) and rapid JSON extraction, boasting sub-second latency.
- **Ollama (Qwen)** performed remarkably well for SQL generation, beating Groq in speed. 
- You may consider a **hybrid approach**: Use Groq for the HR Copilot and Resume Parsing to guarantee snappy user interfaces, and use Ollama (or a specialized code model) for the internal Natural Language SQL analytics engine!
