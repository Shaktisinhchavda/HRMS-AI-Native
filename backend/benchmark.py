import os
import time
import asyncio
import httpx
from dotenv import load_dotenv
import json

# Load environment variables if present
load_dotenv()

# The HRMS-specific test scenarios
SCENARIOS = [
    {
        "name": "1. Resume Parsing (JSON Extraction)",
        "prompt": """You are an AI resume parser. Extract the following information into a strict JSON object with keys: "name", "email", "skills" (array of strings). Do not output any markdown or text other than the JSON.
Resume Text: 'Jane Smith | Senior Backend Engineer | jane.smith@email.com | 8 years of experience. Expert in Python, FastAPI, Postgres, and AWS.'"""
    },
    {
        "name": "2. HR Copilot (Context-Aware RAG)",
        "prompt": """You are an HR Copilot. Answer the question based ONLY on the context below. If the answer is not in the context, say "I cannot find the answer."
[User Context]
Name: Rahul Verma
Role: Software Engineer
Leave Balance: 12 days

[HR Policy Context]
Remote work is permitted for 2 days a week for Engineering staff.

Question: Can I work remotely, and how many leave days do I have left?"""
    },
    {
        "name": "3. Natural Language to SQL (Analytics)",
        "prompt": """You are an AI Data Analyst. Write a valid SQLite query to answer the user's question based on the schema.
Schema: Table 'employees' (id, full_name, department, salary, performance_score)
Question: What is the average salary of employees in the Engineering department who have a performance score greater than 4.0?
Only output the raw SQL query, no explanations."""
    }
]

async def call_ollama(prompt):
    model = os.getenv("OLLAMA_MODEL", "qwen2.5:1.5b")
    start = time.time()
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(
                "http://localhost:11434/api/generate", 
                json={"model": model, "prompt": prompt, "stream": False}, 
                timeout=30
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
                timeout=30
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
                timeout=30
            )
            res.raise_for_status()
            data = res.json()
            return data['candidates'][0]['content']['parts'][0]['text'], time.time() - start, model
    except Exception as e:
        return None, 0, str(e)

async def run_scenario(scenario, providers):
    print(f"\n{'-'*60}")
    print(f"🎬 SCENARIO: {scenario['name']}")
    print(f"{'-'*60}")
    
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
            print(f"   Output: {response.replace(chr(10), ' ').strip()[:150]}...")
            print()

async def main():
    print("="*60)
    print("🚀 HRMS-Specific LLM Provider Benchmark")
    print("="*60)
    print("This tool tests how well each LLM performs on our exact HR app use-cases:")
    print("1. Resume Parsing (Strict JSON Extraction)\n2. HR Copilot (RAG Accuracy)\n3. NL to SQL (Analytics)\n")
    
    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        groq_key = input("Enter GROQ_API_KEY (or press Enter to skip): ").strip()
        
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        gemini_key = input("Enter GEMINI_API_KEY (or press Enter to skip): ").strip()

    providers = {"ollama": True}
    if groq_key: providers["groq"] = groq_key
    if gemini_key: providers["gemini"] = gemini_key

    for scenario in SCENARIOS:
        await run_scenario(scenario, providers)
        
    print("\n" + "="*60)
    print("🏁 BENCHMARK COMPLETE")
    print("="*60)
    print("Use these metrics to decide which model is best suited for the HRMS!")

if __name__ == "__main__":
    asyncio.run(main())
