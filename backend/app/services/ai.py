"""
AI Service for parsing resumes via Ollama — Advanced Resume Intelligence
"""
import io
import json
import re
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

async def parse_resume_with_ai(resume_text: str, job_description: str = "") -> dict:
    """Send resume text to Ollama to extract rich, structured data."""
    
    jd_context = ""
    if job_description.strip():
        jd_context = f"""
    IMPORTANT: A Job Description has been provided. You MUST evaluate the candidate against this JD.
    The match_score should reflect how well the candidate fits THIS specific role. 
    In your strengths, highlight skills/experience that directly match the JD.
    In your weaknesses, highlight gaps or missing requirements from the JD.
    
    Job Description:
    ---
    {job_description.strip()}
    ---
    """
    
    prompt = f"""
    You are an expert HR Talent Acquisition analyst. You are performing a deep analysis of a candidate's resume.
    Parse the following resume text and extract ALL available structured data.
    You MUST respond with valid JSON ONLY. Do not include any other text, markdown formatting, or explanations.
    {jd_context}
    Expected JSON format:
    {{
        "name": "Full Name",
        "email": "email@example.com",
        "phone": "Phone number or null",
        "location": "City, Country or null",
        "linkedin": "LinkedIn URL or null",
        "portfolio": "Portfolio/GitHub URL or null",
        "current_title": "Current or most recent job title or null",
        "skills": ["Skill 1", "Skill 2"],
        "experience_years": 5,
        "education": [
            {{
                "degree": "B.Tech in Computer Science",
                "institution": "MIT",
                "year": "2020"
            }}
        ],
        "work_experience": [
            {{
                "title": "Software Engineer",
                "company": "Google",
                "duration": "2020 - Present",
                "highlights": ["Led a team of 5", "Built microservices"]
            }}
        ],
        "certifications": ["AWS Certified Solutions Architect", "PMP"],
        "languages": ["English", "Hindi"],
        "strengths": ["Strong backend experience", "Cloud architecture expertise"],
        "weaknesses": ["No frontend experience mentioned", "No management experience"],
        "match_score": 85,
        "summary": "A concise 2-3 sentence executive summary of this candidate's professional profile, key strengths, and suitability."
    }}
    
    Scoring Guidelines for match_score (0-100):
    - 90-100: Exceptional candidate. Multiple years of relevant experience, strong skills, top-tier education/certifications.
    - 70-89: Strong candidate. Good experience and skills, some gaps but overall a solid fit.
    - 50-69: Average candidate. Has some relevant skills but significant gaps in experience or education.
    - 30-49: Below average. Limited relevant skills or experience.
    - 0-29: Poor fit. Very few relevant qualifications.

    If a field is not found in the resume, set it to null, an empty list [], or 0.
    For education and work_experience, extract ALL entries you can find, not just the most recent one.
    
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
                timeout=90.0
            )
            response.raise_for_status()
            result = response.json()
            
            raw_response = result.get("response", "").strip()
            
            # Clean up potential markdown formatting
            raw_response = re.sub(r"```json\n?", "", raw_response)
            raw_response = re.sub(r"```\n?", "", raw_response)
            
            parsed_data = json.loads(raw_response)
            
            # Normalize and validate fields (handle both missing keys and None values)
            parsed_data["name"] = parsed_data.get("name") or "Unknown"
            parsed_data["email"] = parsed_data.get("email")
            parsed_data["phone"] = parsed_data.get("phone")
            parsed_data["location"] = parsed_data.get("location")
            parsed_data["linkedin"] = parsed_data.get("linkedin")
            parsed_data["portfolio"] = parsed_data.get("portfolio")
            parsed_data["current_title"] = parsed_data.get("current_title")
            parsed_data["skills"] = parsed_data.get("skills") or []
            parsed_data["experience_years"] = parsed_data.get("experience_years") or 0
            parsed_data["education"] = parsed_data.get("education") or []
            parsed_data["work_experience"] = parsed_data.get("work_experience") or []
            parsed_data["certifications"] = parsed_data.get("certifications") or []
            parsed_data["languages"] = parsed_data.get("languages") or []
            parsed_data["strengths"] = parsed_data.get("strengths") or []
            parsed_data["weaknesses"] = parsed_data.get("weaknesses") or []
            parsed_data["summary"] = parsed_data.get("summary") or "No summary could be generated."
            
            # Clamp match_score
            score = parsed_data.get("match_score", 50)
            if isinstance(score, (int, float)):
                parsed_data["match_score"] = max(0, min(100, int(score)))
            else:
                parsed_data["match_score"] = 50
                
            return parsed_data
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse AI response as JSON: {e}")
        raise ValueError("AI returned an invalid response. Please try again.")
    except Exception as e:
        logger.error(f"Error calling Ollama AI: {e}")
        raise ValueError("Failed to parse resume with AI.")

async def generate_jd_with_ai(prompt_text: str) -> str:
    """Generate a full Job Description from a short prompt."""
    prompt = f"""
    You are an expert HR Talent Acquisition Specialist. Write a professional, detailed, and engaging Job Description based on the following requirements:
    
    Requirements: {prompt_text}
    
    The Job Description should include:
    1. Job Title
    2. A brief, engaging overview of the role
    3. Key Responsibilities (bullet points)
    4. Required Qualifications & Skills (bullet points)
    5. Preferred Qualifications (optional, bullet points)
    
    Do NOT include placeholder company names like [Company Name], just write it generically or use "our company".
    Output ONLY the Job Description text. Do not include any meta-commentary like "Here is the job description you requested:".
    """
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": settings.OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                },
                timeout=60.0
            )
            response.raise_for_status()
            result = response.json()
            
            return result.get("response", "").strip()
    except Exception as e:
        logger.error(f"Error calling Ollama AI for JD generation: {e}")
        raise ValueError("Failed to generate job description with AI.")
