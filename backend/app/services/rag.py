"""
RAG Service for HR Copilot using ChromaDB and Ollama
"""
import os
import chromadb
from chromadb.config import Settings
import httpx
from langchain_text_splitters import MarkdownTextSplitter

from app.config import settings
from app.utils.logger import logger

# Initialize ChromaDB in memory (or persistent directory)
chroma_client = chromadb.PersistentClient(path="./chroma_db")

# Create or get the HR Policy collection
try:
    collection = chroma_client.get_or_create_collection(name="hr_policy")
except Exception as e:
    logger.error(f"Error creating ChromaDB collection: {e}")
    collection = None


def ingest_hr_policy():
    """Load the sample hr_policy.md, chunk it, and store in ChromaDB."""
    policy_path = os.path.join("data", "hr_policy.md")
    if not os.path.exists(policy_path):
        logger.warning(f"HR Policy document not found at {policy_path}. Skipping ingestion.")
        return

    # Check if already ingested (basic check)
    if collection and collection.count() > 0:
        logger.info("HR Policy already ingested in ChromaDB. Skipping.")
        return

    try:
        with open(policy_path, "r", encoding="utf-8") as f:
            text = f.read()

        # Chunk the markdown text
        splitter = MarkdownTextSplitter(chunk_size=500, chunk_overlap=50)
        chunks = splitter.split_text(text)

        # Prepare for ChromaDB (Chroma handles embedding via its default sentence-transformers model)
        documents = []
        ids = []
        metadatas = []

        for i, chunk in enumerate(chunks):
            documents.append(chunk)
            ids.append(f"chunk_{i}")
            metadatas.append({"source": "hr_policy.md", "chunk_index": i})

        if collection:
            collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )
            logger.info(f"Successfully ingested {len(chunks)} chunks into ChromaDB.")

    except Exception as e:
        logger.error(f"Error ingesting HR policy: {e}")


async def query_copilot(question: str, user_info: dict = None) -> str:
    """Query the RAG system to answer an HR question."""
    if not collection or collection.count() == 0:
        return "I'm sorry, my HR knowledge base is currently empty or unavailable."

    # Retrieve relevant chunks
    try:
        results = collection.query(
            query_texts=[question],
            n_results=3
        )
        
        retrieved_docs = results["documents"][0] if results["documents"] else []
        context = "\n\n".join(retrieved_docs)
    except Exception as e:
        logger.error(f"Error querying ChromaDB: {e}")
        context = ""

    # Build User Context string
    user_context = ""
    if user_info:
        user_context = f"""
[User Context - Information about the employee asking the question]
Name: {user_info.get("full_name")}
Role: {user_info.get("role")}
Department: {user_info.get("department")}
Title: {user_info.get("designation")}
Leave Balance: {user_info.get("leave_balance")} days
Working Hours: {user_info.get("working_hours")} hours/week
Overworked Hours: {user_info.get("overworked_hours")} hours
Salary: ${user_info.get("salary")}
Performance Score: {user_info.get("performance_score")} / 5.0
"""

    # Generate response with Ollama
    prompt = f"""
    You are a helpful HR Copilot assistant for employees. 
    Use the provided [User Context] to answer personal questions (e.g. "what is my name?", "what department am I in?").
    Use the provided [HR Policy Context] to answer general company questions.
    If neither context contains the answer, politely say "I cannot find the answer to this in the current HR policy."
    Keep your answer concise and professional.
    
    {user_context}
    
    [HR Policy Context]
    {context}
    
    Question: {question}
    
    Answer:
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
            return result.get("response", "No response generated.")
    except Exception as e:
        logger.error(f"Error calling Ollama AI in Copilot: {e}")
        return "I'm sorry, I am currently unable to process your request."
