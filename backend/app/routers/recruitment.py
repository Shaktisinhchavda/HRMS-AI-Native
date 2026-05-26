"""
Recruitment Router — File Upload, AI Parsing, Candidate Management
"""
import json
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.models.candidate import Candidate
from app.schemas.candidate import CandidateCreate, CandidateResponse, AIParsedResult
from app.services.auth import require_role
from app.services.ai import extract_text_from_file, parse_resume_with_ai, generate_jd_with_ai
from app.utils.logger import logger

router = APIRouter(prefix="/api/recruitment", tags=["recruitment"])

class JDGenerateRequest(BaseModel):
    prompt: str

@router.post("/generate-jd")
async def generate_jd(
    data: JDGenerateRequest,
    current_user: User = Depends(require_role("admin", "hr_manager"))
):
    """Generate a Job Description using AI."""
    if not data.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")
    
    try:
        jd = await generate_jd_with_ai(data.prompt)
        return {"job_description": jd}
    except Exception as e:
        logger.error(f"Error generating JD: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate job description.")

@router.post("/parse", response_model=AIParsedResult)
async def parse_resume(
    file: UploadFile = File(...),
    job_description: str = Form(""),
    current_user: User = Depends(require_role("admin", "hr_manager"))
):
    """Upload a resume (PDF/DOCX) and get AI parsed data back."""
    if not file.filename.endswith((".pdf", ".docx", ".txt")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Only PDF, DOCX, and TXT are supported."
        )
        
    try:
        contents = await file.read()
        logger.info(f"Extracting text from {file.filename}")
        raw_text = extract_text_from_file(contents, file.filename)
        
        if not raw_text:
            raise ValueError("Could not extract any text from the file.")
            
        logger.info(f"Parsing extracted text with AI (length: {len(raw_text)})")
        parsed_data = await parse_resume_with_ai(raw_text, job_description)
        
        # Merge raw text into result
        parsed_data["raw_text"] = raw_text
        
        return AIParsedResult(**parsed_data)
        
    except ValueError as ve:
        logger.warning(f"Validation error during parsing: {ve}")
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(ve))
    except Exception as e:
        logger.error(f"Error parsing resume: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to process resume")

@router.post("/candidates", response_model=CandidateResponse, status_code=status.HTTP_201_CREATED)
async def create_candidate(
    candidate_data: CandidateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "hr_manager"))
):
    """Save an approved AI-parsed candidate to the database."""
    new_candidate = Candidate(
        name=candidate_data.name,
        email=candidate_data.email,
        phone=candidate_data.phone,
        skills=json.dumps(candidate_data.skills),
        experience_years=candidate_data.experience_years,
        match_score=candidate_data.match_score,
        ai_summary=candidate_data.ai_summary,
        resume_text=candidate_data.resume_text
    )
    db.add(new_candidate)
    db.commit()
    db.refresh(new_candidate)
    
    logger.info(f"New candidate saved: {new_candidate.name} (Score: {new_candidate.match_score})")
    return new_candidate

@router.get("/candidates", response_model=list[CandidateResponse])
async def list_candidates(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "hr_manager"))
):
    """List all candidates ordered by match score."""
    candidates = db.query(Candidate).order_by(Candidate.match_score.desc()).all()
    return candidates

@router.get("/candidates/{candidate_id}")
async def get_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "hr_manager"))
):
    """Get a single candidate with full resume text."""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    skills = []
    try:
        skills = json.loads(candidate.skills) if candidate.skills else []
    except json.JSONDecodeError:
        skills = []
    
    return {
        "id": candidate.id,
        "name": candidate.name,
        "email": candidate.email,
        "phone": candidate.phone,
        "skills": skills,
        "experience_years": candidate.experience_years,
        "match_score": candidate.match_score,
        "ai_summary": candidate.ai_summary,
        "resume_text": candidate.resume_text,
        "created_at": candidate.created_at.isoformat() if candidate.created_at else None,
    }

@router.delete("/candidates/{candidate_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "hr_manager"))
):
    """Delete a candidate from the database."""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    db.delete(candidate)
    db.commit()
    logger.info(f"Candidate deleted: {candidate.name} (ID: {candidate.id})")
