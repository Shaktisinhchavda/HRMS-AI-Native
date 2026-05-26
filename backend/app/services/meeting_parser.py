"""
Meeting Transcript AI Parser — Extracts attendees, summary, and action items
"""
import json
import re
import httpx
from sqlalchemy import text

from app.config import settings
from app.database import engine
from app.utils.logger import logger


async def parse_meeting_transcript(transcript: str) -> dict:
    """Use AI to parse a meeting transcript and extract structured data."""
    prompt = f"""
    You are an expert meeting analyst. Analyze the following meeting transcript.
    You MUST respond with valid JSON ONLY. Do not include any other text, markdown, or explanations.

    Extract the following:
    {{
        "title": "A short descriptive title for this meeting (max 10 words)",
        "attendees": ["Person 1", "Person 2"],
        "summary": "A comprehensive 3-5 sentence summary covering all key topics discussed, decisions made, and outcomes. This summary will be read by employees who missed the meeting, so make it thorough and actionable.",
        "action_items": ["Action item 1 assigned to Person X", "Action item 2 assigned to Person Y"],
        "duration_minutes": 30
    }}

    RULES:
    1. For attendees, extract ALL unique speaker names from the transcript. Look for patterns like "Name:", "[Name]", "Name said", etc.
    2. Clean up names - capitalize properly, remove timestamps or prefixes.
    3. For the summary, be comprehensive. Cover ALL topics discussed, not just the first one.
    4. For action_items, include who is responsible if mentioned.
    5. For duration_minutes, estimate based on transcript length if not explicitly stated. Use 0 if you cannot estimate.
    6. If the transcript is very short or unclear, still do your best to extract whatever you can.

    Meeting Transcript:
    ---
    {transcript[:8000]}
    ---
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
            raw_response = re.sub(r"```json\n?", "", raw_response)
            raw_response = re.sub(r"```\n?", "", raw_response)

            parsed = json.loads(raw_response)

            parsed.setdefault("title", "Untitled Meeting")
            parsed.setdefault("attendees", [])
            parsed.setdefault("summary", "No summary could be generated.")
            parsed.setdefault("action_items", [])
            parsed.setdefault("duration_minutes", 0)

            return parsed

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse AI meeting response: {e}")
        raise ValueError("AI returned invalid response for meeting transcript.")
    except Exception as e:
        logger.error(f"Error parsing meeting transcript: {e}")
        raise ValueError("Failed to parse meeting transcript with AI.")


def match_attendees_to_employees(attendee_names: list[str]) -> dict:
    """
    Cross-reference extracted attendee names with the employees table.
    Returns matched employee IDs and names of absent employees.
    """
    with engine.connect() as conn:
        all_employees = conn.execute(
            text("SELECT id, full_name, email FROM employees")
        ).fetchall()

    matched_ids = []
    matched_names = []
    all_emp_names = []

    for emp in all_employees:
        emp_id = emp[0]
        emp_name = emp[1]
        all_emp_names.append(emp_name)

        # Fuzzy match: check if any attendee name partially matches employee name
        for attendee in attendee_names:
            attendee_lower = attendee.lower().strip()
            emp_name_lower = emp_name.lower().strip()

            # Match if attendee name is contained in employee name or vice versa
            if (attendee_lower in emp_name_lower or
                emp_name_lower in attendee_lower or
                # Match first name
                attendee_lower.split()[0] == emp_name_lower.split()[0] if attendee_lower.split() and emp_name_lower.split() else False):
                if emp_id not in matched_ids:
                    matched_ids.append(emp_id)
                    matched_names.append(emp_name)
                break

    # Find absent employees (in DB but not in meeting)
    absent = [name for name in all_emp_names if name not in matched_names]

    return {
        "matched_ids": matched_ids,
        "matched_names": matched_names,
        "absent_names": absent
    }
