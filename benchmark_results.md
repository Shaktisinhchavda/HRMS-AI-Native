# LLM Benchmark Results

1. Resume Parsing (Strict JSON Extraction)
Groq (llama-3.1-8b-instant) | ⏱️ 1.2s | ⚡ 49.25 words/sec (Fastest)
Ollama (qwen2.5:3b) | ⏱️ 4.15s | ⚡ 9.41 words/sec
Gemini (gemini-3-flash-preview) | ⏱️ 12.35s | ⚡ 4.78 words/sec
2. HR Copilot (Context-Aware RAG)
Groq (llama-3.1-8b-instant) | ⏱️ 0.93s | ⚡ 73.06 words/sec (Fastest)
Ollama (qwen2.5:3b) | ⏱️ 2.93s | ⚡ 25.94 words/sec
Gemini (gemini-3-flash-preview) | ⏱️ 8.81s | ⚡ 7.15 words/sec
3. Natural Language to SQL (Analytics)
Groq (llama-3.1-8b-instant) | ⏱️ 0.88s | ⚡ 22.85 words/sec (Fastest)
Ollama (qwen2.5:3b) | ⏱️ 1.81s | ⚡ 9.95 words/sec
Gemini (gemini-3-flash-preview) | ⏱️ 22.16s | ⚡ 0.81 words/sec (Likely hit a rate limit or high latency)
Takeaways for your HRMS App:

Groq (llama-3.1-8b-instant) completely dominated the benchmark in terms of speed. If you want instant Copilot responses and UI updates, Groq is the clear winner for production.
Local Ollama (qwen2.5:3b) holds up surprisingly well! It successfully handled all three realistic HR use cases (even the 5-page PDF) entirely offline and with solid response times.
