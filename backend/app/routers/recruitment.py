"""
Recruitment Router — File Upload, AI Parsing, Candidate Management
"""
import json
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.candidate import Candidate
from app.schemas.candidate import CandidateCreate, CandidateResponse, AIParsedResult
from app.services.auth import require_role
from app.services.ai import extract_text_from_file, parse_resume_with_ai
from app.utils.logger import logger

router = APIRouter(prefix="/api/recruitment", tags=["recruitment"])

@router.post("/parse", response_model=AIParsedResult)
async def parse_resume(
    file: UploadFile = File(...),
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
        parsed_data = await parse_resume_with_ai(raw_text)
        
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
