"""
Reports Router — Text to SQL Engine
"""
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.user import User
from app.schemas.reports import ReportQueryRequest, ReportQueryResponse
from app.services.auth import require_role
from app.services.nl_reports import generate_sql, execute_safe_query, summarize_results
from app.utils.logger import logger

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.post("/query", response_model=ReportQueryResponse)
async def process_nl_query(
    request: ReportQueryRequest,
    current_user: User = Depends(require_role("admin", "hr_manager"))
):
    """Convert natural language to SQL, execute it, and return results + summary."""
    try:
        logger.info(f"Processing NL query: '{request.question}'")
        
        # 1. Generate SQL
        sql = await generate_sql(request.question)
        logger.info(f"Generated SQL: {sql}")
        
        # 2. Execute SQL
        data = execute_safe_query(sql)
        
        # 3. Generate Insight Summary
        summary = await summarize_results(request.question, data)
        
        return ReportQueryResponse(
            sql=sql,
            columns=data["columns"],
            rows=data["rows"],
            summary=summary
        )
        
    except ValueError as ve:
        logger.warning(f"Validation/Execution error for query '{request.question}': {ve}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Error processing NL query: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to process report query.")
