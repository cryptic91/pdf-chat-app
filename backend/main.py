import os
import shutil
import uuid
from pathlib import Path
from typing import List

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from rag import ingest_pdfs, ask_question, clear_vectorstore

app = FastAPI(title="RakibAI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Serve frontend
app.mount("/static", StaticFiles(directory="../frontend/static"), name="static")

@app.get("/")
def serve_frontend():
    return FileResponse("../frontend/index.html")


class ChatRequest(BaseModel):
    question: str
    session_id: str


class ChatResponse(BaseModel):
    answer: str
    sources: List[str]


@app.post("/upload")
async def upload_pdfs(files: List[UploadFile] = File(...)):
    session_id = str(uuid.uuid4())
    session_dir = UPLOAD_DIR / session_id
    session_dir.mkdir(parents=True, exist_ok=True)

    saved_files = []
    for file in files:
        if not file.filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail=f"{file.filename} is not a PDF.")
        file_path = session_dir / file.filename
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        saved_files.append(str(file_path))

    try:
        ingest_pdfs(saved_files, session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDFs: {str(e)}")

    return {
        "session_id": session_id,
        "files": [f.filename for f in files],
        "message": f"{len(files)} PDF(s) processed successfully."
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    try:
        result = ask_question(request.question, request.session_id)
        return ChatResponse(answer=result["answer"], sources=result["sources"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/session/{session_id}")
async def delete_session(session_id: str):
    session_dir = UPLOAD_DIR / session_id
    if session_dir.exists():
        shutil.rmtree(session_dir)
    clear_vectorstore(session_id)
    return {"message": "Session cleared."}


@app.get("/health")
def health():
    return {"status": "ok"}
