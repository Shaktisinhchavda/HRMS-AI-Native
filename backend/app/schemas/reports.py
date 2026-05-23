"""
Reporting Pydantic Schemas
"""
from typing import List, Any
from pydantic import BaseModel

class ReportQueryRequest(BaseModel):
    question: str

class ReportQueryResponse(BaseModel):
    sql: str
    columns: List[str]
    rows: List[List[Any]]
    summary: str
