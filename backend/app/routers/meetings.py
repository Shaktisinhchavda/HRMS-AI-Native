"""
Meetings Router — Transcript Upload, AI Parsing, Attendance Tracking
"""
import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.meeting import Meeting
from app.services.auth import get_current_user, require_role
from app.services.meeting_parser import parse_meeting_transcript, match_attendees_to_employees
from app.utils.logger import logger

router = APIRouter(prefix="/api/meetings", tags=["meetings"])


class TranscriptInput(BaseModel):
    transcript: str
    title: Optional[str] = None


class MeetingResponse(BaseModel):
    id: int
    title: str
    date: str
    attendees: List[str]
    matched_employees: List[str]
    absent_employees: List[str]
    summary: str
    action_items: List[str]
    duration_minutes: int
    created_at: str


class MeetingListItem(BaseModel):
    id: int
    title: str
    date: str
    attendee_count: int
    summary: str
    duration_minutes: int


@router.post("/parse", response_model=MeetingResponse)
async def parse_and_save_meeting(
    data: TranscriptInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "hr_manager"))
):
    """Parse a meeting transcript with AI and save the results."""
    if not data.transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript cannot be empty.")

    try:
        logger.info(f"Parsing meeting transcript (length: {len(data.transcript)})")
        parsed = await parse_meeting_transcript(data.transcript)

        # Cross-reference with employees
        match_result = match_attendees_to_employees(parsed.get("attendees", []))

        title = data.title or parsed.get("title", "Untitled Meeting")

        meeting = Meeting(
            title=title,
            date=datetime.utcnow(),
            attendees=json.dumps(parsed.get("attendees", [])),
            matched_employees=json.dumps(match_result["matched_names"]),
            absent_employees=json.dumps(match_result["absent_names"]),
            transcript=data.transcript,
            summary=parsed.get("summary", ""),
            action_items=json.dumps(parsed.get("action_items", [])),
            duration_minutes=parsed.get("duration_minutes", 0),
        )
        db.add(meeting)
        db.commit()
        db.refresh(meeting)

        logger.info(f"Meeting saved: '{title}' with {len(parsed.get('attendees', []))} attendees")

        return MeetingResponse(
            id=meeting.id,
            title=meeting.title,
            date=meeting.date.isoformat(),
            attendees=parsed.get("attendees", []),
            matched_employees=match_result["matched_names"],
            absent_employees=match_result["absent_names"],
            summary=parsed.get("summary", ""),
            action_items=parsed.get("action_items", []),
            duration_minutes=parsed.get("duration_minutes", 0),
            created_at=meeting.created_at.isoformat(),
        )

    except ValueError as ve:
        logger.warning(f"Meeting parse error: {ve}")
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        logger.error(f"Error parsing meeting: {e}")
        raise HTTPException(status_code=500, detail="Failed to process meeting transcript.")


@router.get("/", response_model=List[MeetingListItem])
async def list_meetings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all meetings ordered by date descending."""
    meetings = db.query(Meeting).order_by(Meeting.date.desc()).all()

    result = []
    for m in meetings:
        attendees = []
        try:
            attendees = json.loads(m.attendees) if m.attendees else []
        except json.JSONDecodeError:
            pass

        result.append(MeetingListItem(
            id=m.id,
            title=m.title,
            date=m.date.isoformat() if m.date else "",
            attendee_count=len(attendees),
            summary=m.summary or "",
            duration_minutes=m.duration_minutes or 0,
        ))

    return result


@router.get("/{meeting_id}", response_model=MeetingResponse)
async def get_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single meeting with full details."""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found.")

    def safe_json(val):
        try:
            return json.loads(val) if val else []
        except json.JSONDecodeError:
            return []

    return MeetingResponse(
        id=meeting.id,
        title=meeting.title,
        date=meeting.date.isoformat() if meeting.date else "",
        attendees=safe_json(meeting.attendees),
        matched_employees=safe_json(meeting.matched_employees),
        absent_employees=safe_json(meeting.absent_employees),
        summary=meeting.summary or "",
        action_items=safe_json(meeting.action_items),
        duration_minutes=meeting.duration_minutes or 0,
        created_at=meeting.created_at.isoformat() if meeting.created_at else "",
    )


@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "hr_manager"))
):
    """Delete a meeting record."""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found.")

    db.delete(meeting)
    db.commit()
    logger.info(f"Meeting deleted: ID {meeting_id}")
