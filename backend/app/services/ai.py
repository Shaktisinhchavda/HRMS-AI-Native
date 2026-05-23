"""
AI Service for parsing resumes via Ollama
"""
import io
import json
import PyPDF2
from docx import Document
import httpx

from app.config import settings
from app.utils.logger import logger

def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    """Extract text from PDF or DOCX file."""
    text = ""
    try:
        if filename.endswith(".pdf"):
            reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
            for page in reader.pages:
                text += page.extract_text() + "\n"
        elif filename.endswith(".docx"):
            doc = Document(io.BytesIO(file_bytes))
            for para in doc.paragraphs:
                text += para.text + "\n"
        else:
            # Fallback for plain text
            text = file_bytes.decode("utf-8")
    except Exception as e:
        logger.error(f"Error extracting text from {filename}: {e}")
        raise ValueError(f"Failed to extract text from {filename}")
    
    return text.strip()

async def parse_resume_with_ai(resume_text: str) -> dict:
    """Send resume text to Ollama to extract structured data."""
    prompt = f"""
    You are an expert HR assistant. Parse the following resume text and extract the candidate's details.
    You MUST respond with valid JSON ONLY. Do not include any other text, markdown formatting, or explanations.
    
    Expected JSON format:
    {{
        "name": "Full Name",
        "email": "email@example.com",
        "phone": "Phone number",
        "skills": ["Skill 1", "Skill 2"],
        "experience_years": 5,
        "match_score": 85,
        "summary": "A 2-sentence summary of the candidate's profile."
    }}
    
    If a field is not found, set it to null or an empty list. For match_score, rate the resume out of 100 based on general professional quality.
    
    Resume Text:
    {resume_text}
    """
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": settings.OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json"
                },
                timeout=60.0
            )
            response.raise_for_status()
            result = response.json()
            
            # Parse the JSON response from Ollama
            parsed_data = json.loads(result["response"])
            return parsed_data
    except Exception as e:
        logger.error(f"Error calling Ollama AI: {e}")
        raise ValueError("Failed to parse resume with AI.")
