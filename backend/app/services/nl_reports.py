"""
Natural Language Reporting Service (Text-to-SQL)
"""
import re
import json
import httpx
from sqlalchemy import text
from app.database import engine
from app.config import settings
from app.utils.logger import logger

SCHEMA_DESCRIPTION = """
You are an expert Data Analyst and Text-to-SQL engine for an SQLite database. Generate a valid SQLite query based on the following schema.
ONLY return the SQL query string. Do NOT include markdown formatting (like ```sql), do NOT include explanations. Use standard SQLite syntax.

CRITICAL SQLITE RULES:
1. SQLite DOES NOT have MONTH() or YEAR() functions. You MUST use strftime('%m', date_column) or strftime('%Y', date_column) instead.
2. The `skills` column is a single comma-separated TEXT column. SQLite cannot easily UNNEST or split strings. Use `LIKE '%SkillName%'` to search for skills. Do NOT hallucinate a `skill` column.
3. For comparisons, cast string dates if necessary, though SQLite usually handles them. 

Schema:

Table: employees
- id (INTEGER, primary key)
- employee_id (VARCHAR)
- full_name (VARCHAR)
- email (VARCHAR)
- department (VARCHAR)
- designation (VARCHAR)
- skills (TEXT - comma separated string e.g., 'Python, React, SQL')
- salary (FLOAT)
- hire_date (DATE)
- exit_risk (VARCHAR - 'low', 'medium', 'high')
- status (VARCHAR - 'active', 'inactive')

Table: attendance
- id (INTEGER, primary key)
- employee_id (INTEGER, foreign key to employees.id)
- date (DATE)
- status (VARCHAR - 'present', 'absent', 'late', 'half_day', 'wfh')
- hours_worked (FLOAT)

Table: payroll
- id (INTEGER, primary key)
- employee_id (INTEGER, foreign key to employees.id)
- month (INTEGER - 1 to 12)
- year (INTEGER)
- basic_salary (FLOAT)
- overtime_pay (FLOAT)
- deductions (FLOAT)
- net_pay (FLOAT)

Examples:
Question: Show average attendance this month
SQL: SELECT AVG(hours_worked) FROM attendance WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now');

Question: Which employees received the highest overtime pay?
SQL: SELECT e.full_name, SUM(p.overtime_pay) as total_overtime FROM employees e JOIN payroll p ON e.id = p.employee_id GROUP BY e.id ORDER BY total_overtime DESC LIMIT 5;

Question: Show Python skill distribution across teams
SQL: SELECT department, COUNT(*) as python_devs FROM employees WHERE skills LIKE '%Python%' GROUP BY department;

Question: Which department has highest exit risk?
SQL: SELECT department, COUNT(*) as high_risk_count FROM employees WHERE exit_risk = 'high' GROUP BY department ORDER BY high_risk_count DESC LIMIT 1;
"""

from datetime import datetime

async def generate_sql(question: str) -> str:
    """Generate SQL from a natural language question using Ollama."""
    current_date = datetime.now().strftime('%Y-%m-%d')
    prompt = f"{SCHEMA_DESCRIPTION}\n\nImportant Note: The current date is {current_date}. If asked about 'this month', 'this year', or 'recently', use this current date or SQLite's date('now') functions instead of hardcoding old years like 2023.\n\nQuestion: {question}\nSQL Query:"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": settings.OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False
                },
                timeout=30.0
            )
            response.raise_for_status()
            result = response.json()
            sql = result.get("response", "").strip()
            
            # Clean up potential markdown formatting if the model disobeys
            sql = re.sub(r"```sql\n?", "", sql)
            sql = re.sub(r"```\n?", "", sql)
            
            return sql.strip()
    except Exception as e:
        logger.error(f"Error generating SQL: {e}")
        raise ValueError("Failed to generate SQL query from question.")

def execute_safe_query(sql: str) -> dict:
    """Execute the SQL query safely and return results."""
    # Basic SQL injection / safety check
    upper_sql = sql.upper()
    dangerous_keywords = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "REPLACE", "TRUNCATE"]
    if any(keyword in upper_sql for keyword in dangerous_keywords):
        raise ValueError("Only read-only SELECT queries are allowed.")
        
    if not upper_sql.startswith("SELECT"):
        raise ValueError("Only SELECT queries are allowed.")
        
    try:
        with engine.connect() as conn:
            result = conn.execute(text(sql))
            columns = list(result.keys())
            rows = [list(row) for row in result.fetchall()]
            return {"columns": columns, "rows": rows}
    except Exception as e:
        logger.error(f"Error executing SQL '{sql}': {e}")
        raise ValueError(f"SQL execution failed: {str(e)}")

async def summarize_results(question: str, data: dict) -> str:
    """Generate a natural language summary of the query results."""
    if not data["rows"]:
        return "No results found for your query."
        
    # Limit data passed to context to avoid huge payloads
    preview_rows = data["rows"][:10]
    
    prompt = f"""
    Question: {question}
    Data (columns: {data['columns']}):
    {preview_rows}
    
    Provide a concise, 1-2 sentence human-readable summary answering the question based on this data.
    """
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": settings.OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False
                },
                timeout=30.0
            )
            response.raise_for_status()
            result = response.json()
            return result.get("response", "").strip()
    except Exception as e:
        logger.error(f"Error summarizing results: {e}")
        return "Here are the results of your query."
