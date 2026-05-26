import os
import time
import asyncio
import httpx
import sqlite3
from dotenv import load_dotenv
import json
import io
import PyPDF2

# Load environment variables if present
load_dotenv()

def extract_pdf_text(filepath):
    text = ""
    try:
        with open(filepath, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return "Dummy resume text due to error"

def get_database_data():
    conn = sqlite3.connect("hrms.db")
    
    # 1. Get an employee for RAG
    emp = conn.execute("SELECT full_name, department, designation FROM employees LIMIT 1").fetchone()
    if emp:
        emp_context = f"Name: {emp[0]}\nRole: {emp[2]}\nDepartment: {emp[1]}\nLeave Balance: 12 days"
    else:
        emp_context = "Name: John Doe\nRole: Software Engineer\nDepartment: Engineering\nLeave Balance: 12 days"
        
    # 2. Get table schema for NL to SQL
    schema_rows = conn.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name IN ('employees', 'meetings')").fetchall()
    schema = "\n".join([row[0] for row in schema_rows])
    
    conn.close()
    return emp_context, schema

async def call_ollama(prompt):
    model = os.getenv("OLLAMA_MODEL", "qwen2.5:1.5b")
    start = time.time()
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(
                "http://localhost:11434/api/generate", 
                json={"model": model, "prompt": prompt, "stream": False}, 
                timeout=90
            )
            res.raise_for_status()
            data = res.json()
            return data.get('response', ''), time.time() - start, model
    except Exception as e:
        return None, 0, str(e)

async def call_groq(prompt, api_key):
    model = "llama-3.1-8b-instant"
    start = time.time()
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={"model": model, "messages": [{"role": "user", "content": prompt}]},
                timeout=60
            )
            res.raise_for_status()
            data = res.json()
            return data['choices'][0]['message']['content'], time.time() - start, model
    except Exception as e:
        return None, 0, str(e)

async def call_gemini(prompt, api_key):
    model = "gemini-3-flash-preview"
    start = time.time()
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}",
                headers={"Content-Type": "application/json"},
                json={"contents": [{"parts": [{"text": prompt}]}]},
                timeout=60
            )
            res.raise_for_status()
            data = res.json()
            return data['candidates'][0]['content']['parts'][0]['text'], time.time() - start, model
    except Exception as e:
        return None, 0, str(e)

async def run_scenario(scenario, providers):
    print(f"\n{'-'*80}")
    print(f"🎬 SCENARIO: {scenario['name']}")
    print(f"{'-'*80}")
    
    tasks = []
    if "ollama" in providers:
        tasks.append(call_ollama(scenario['prompt']))
    if "groq" in providers:
        tasks.append(call_groq(scenario['prompt'], providers["groq"]))
    if "gemini" in providers:
        tasks.append(call_gemini(scenario['prompt'], providers["gemini"]))
        
    results = await asyncio.gather(*tasks)
    
    provider_names = [p for p in ["Ollama", "Groq", "Gemini"] if p.lower() in providers]
    
    for i, (response, latency, model_or_error) in enumerate(results):
        provider = provider_names[i]
        if response is None:
            print(f"❌ {provider} Failed: {model_or_error}")
        else:
            word_count = len(response.split())
            speed = round(word_count / latency, 2)
            print(f"✅ {provider} ({model_or_error}) | ⏱️ {round(latency, 2)}s | ⚡ {speed} words/sec")
            preview = response.replace(chr(10), ' ').strip()
            if len(preview) > 300:
                preview = preview[:300] + "..."
            print(f"   Output:\n{preview}")
            print()

async def main():
    print("="*80)
    print("🚀 HRMS Realistic LLM Provider Benchmark")
    print("="*80)
    print("Fetching real data from database and files...\n")
    
    # Read real data
    resume_path = os.path.join("data", "Shaktisinh_Chavda_Resume.pdf")
    resume_text = extract_pdf_text(resume_path)
    
    try:
        with open(os.path.join("data", "hr_policy.md"), "r") as f:
            hr_policy = f.read()
    except Exception:
        hr_policy = "Remote work is permitted 2 days a week for Engineering staff."
        
    emp_context, sql_schema = get_database_data()
    
    # Construct Scenarios
    scenarios = [
        {
            "name": "1. Resume Parsing (Strict JSON Extraction)",
            "prompt": f"""You are an expert HR AI resume parser. Extract the following information into a strict JSON object with keys: 
"name", "email", "skills" (array of strings), and "experience_years" (integer).
Do not output any markdown or text other than the JSON.

Resume Text:
---
{resume_text[:4000]}
---"""
        },
        {
            "name": "2. HR Copilot (Context-Aware RAG)",
            "prompt": f"""You are an HR Copilot. Answer the question based ONLY on the context below. If the answer is not in the context, say "I cannot find the answer."

[User Context]
{emp_context}

[HR Policy Context]
{hr_policy[:4000]}

Question: Can I work remotely, and what is my current leave balance?"""
        },
        {
            "name": "3. Natural Language to SQL (Analytics)",
            "prompt": f"""You are an AI Data Analyst for an HRMS. Write a valid SQLite query to answer the user's question based on the exact schema below.
Only output the raw SQL query, no markdown blocks or explanations.

Schema:
{sql_schema}

Question: What is the average salary of employees per department, and how many employees are currently on a Performance Improvement Plan (PIP)?"""
        }
    ]
    
    groq_key = os.getenv("GROQ_API_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY")

    providers = {"ollama": True}
    if groq_key: providers["groq"] = groq_key
    if gemini_key: providers["gemini"] = gemini_key

    print(f"Active Providers: {', '.join([k.capitalize() for k in providers.keys()])}\n")

    for scenario in scenarios:
        await run_scenario(scenario, providers)
        
    print("\n" + "="*80)
    print("🏁 BENCHMARK COMPLETE")
    print("="*80)

if __name__ == "__main__":
    asyncio.run(main())
