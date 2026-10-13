import uuid
import shutil
import tempfile
from pathlib import Path
from typing import List, Optional, Dict
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.config import settings
from app.models.schemas import (
    MaterialMetadata,
    DocumentChunk,
    TutorAskRequest,
    TutorAskResponse,
    Quiz,
    QuizGenerateRequest,
    QuizSubmitRequest,
    QuizSubmitResponse,
    QuestionResult,
    AdaptiveProgressResponse,
    YouTubeImportRequest,
    HealthResponse,
)
from app.services.material_service import material_service
from app.services.gemini_service import gemini_service
from app.services.adaptive_service import adaptive_service
from app.retrieval.engine import retrieval_engine

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="LearnLens AI: Source-Grounded Multimodal Tutor and Adaptive Learning Engine",
)

# CORS middleware for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for active generated quizzes
active_quizzes: Dict[str, Quiz] = {}

class ApiKeyUpdate(BaseModel):
    api_key: str

@app.get("/api/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="healthy",
        project=settings.PROJECT_NAME,
        version=settings.VERSION,
        gemini_configured=gemini_service.is_configured(),
        model_name=gemini_service.model_name,
        indexed_materials=len(material_service.list_materials()),
        indexed_chunks=len(material_service.chunks),
    )

@app.post("/api/config/api-key")
def configure_api_key(payload: ApiKeyUpdate):
    key = payload.api_key.strip()
    if not key:
        raise HTTPException(status_code=400, detail="API key cannot be empty")
    gemini_service.update_api_key(key)
    return {
        "status": "success",
        "gemini_configured": gemini_service.is_configured(),
        "model_name": gemini_service.model_name,
    }

@app.get("/api/materials", response_model=List[MaterialMetadata])
def get_materials():
    return material_service.list_materials()

@app.post("/api/materials/seed-samples")
def seed_samples():
    material_service.seed_sample_materials()
    return {
        "status": "success",
        "materials": material_service.list_materials(),
        "total_chunks": len(material_service.chunks),
    }

@app.get("/api/materials/{material_id}")
def get_material_detail(material_id: str):
    material = material_service.get_material(material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    chunks = material_service.get_material_chunks(material_id)
    return {
        "metadata": material,
        "chunks": chunks[:20],  # Return first 20 chunks for preview
        "total_chunks": len(chunks),
    }

@app.post("/api/materials/upload", response_model=MaterialMetadata)
async def upload_material(file: UploadFile = File(...)):
    filename = file.filename or "uploaded_document"
    ext = Path(filename).suffix.lower()
    
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: '{ext}'. Allowed formats: {', '.join(settings.ALLOWED_EXTENSIONS)}",
        )

    # Save to a temporary file first
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = Path(tmp.name)

    try:
        material = material_service.add_uploaded_file(tmp_path, filename)
        return material
    except Exception as e:
        if tmp_path.exists():
            tmp_path.unlink()
        raise HTTPException(status_code=500, detail=f"Failed to process and index document: {str(e)}")

@app.post("/api/materials/youtube", response_model=MaterialMetadata)
def import_youtube_material(payload: YouTubeImportRequest):
    try:
        material = material_service.import_youtube(payload.url, payload.title)
        return material
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to import YouTube transcript: {str(e)}")

@app.delete("/api/materials/{material_id}")
def delete_material(material_id: str):
    success = material_service.delete_material(material_id)
    if not success:
        raise HTTPException(status_code=404, detail="Material not found")
    return {"status": "deleted", "material_id": material_id}

@app.post("/api/tutor/ask", response_model=TutorAskResponse)
def ask_tutor(payload: TutorAskRequest):
    query = payload.question.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    # Step 1 & 2: Retrieve relevant chunks with score threshold
    scored_chunks = retrieval_engine.search(
        query=query,
        top_k=settings.TOP_K_RETRIEVAL,
        material_ids=payload.material_ids,
        min_threshold=settings.SIMILARITY_THRESHOLD,
    )

    # Step 3 & 4: Pass context to Gemini and generate grounded answer
    answer, citations, sufficient_evidence, used_model = gemini_service.answer_question(
        question=query,
        scored_chunks=scored_chunks,
    )

    # Record Q&A in adaptive history
    adaptive_service.record_qna(query, answer, citations)

    return TutorAskResponse(
        answer=answer,
        citations=citations,
        sufficient_evidence=sufficient_evidence,
        retrieved_chunks_count=len(scored_chunks),
        used_model=used_model,
    )

@app.post("/api/quiz/generate", response_model=Quiz)
def generate_quiz(payload: QuizGenerateRequest):
    # Retrieve chunks for the quiz
    if payload.topic:
        scored = retrieval_engine.search(payload.topic, top_k=15, material_ids=payload.material_ids, min_threshold=0.01)
        chunks = [s[0] for s in scored]
    elif payload.material_ids:
        chunks = []
        for mid in payload.material_ids:
            chunks.extend(material_service.get_material_chunks(mid))
    else:
        chunks = material_service.chunks

    if not chunks:
        raise HTTPException(
            status_code=400,
            detail="No study materials available to generate a quiz. Please upload materials first.",
        )

    questions = gemini_service.generate_quiz_questions(
        chunks=chunks,
        topic=payload.topic,
        difficulty=payload.difficulty,
        num_questions=payload.num_questions,
    )

    if not questions:
        raise HTTPException(status_code=500, detail="Could not generate questions from available materials.")

    quiz_id = str(uuid.uuid4())
    import datetime
    quiz = Quiz(
        quiz_id=quiz_id,
        created_at=datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
        difficulty=payload.difficulty,
        topic=payload.topic,
        material_ids=payload.material_ids,
        questions=questions,
    )

    active_quizzes[quiz_id] = quiz
    return quiz

@app.post("/api/quiz/submit", response_model=QuizSubmitResponse)
def submit_quiz(payload: QuizSubmitRequest):
    quiz = active_quizzes.get(payload.quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz session expired or not found")

    results: List[QuestionResult] = []
    for idx, q in enumerate(quiz.questions):
        chosen_opt = payload.answers[idx] if idx < len(payload.answers) else -1
        is_corr = (chosen_opt == q.correct_answer_index)

        results.append(
            QuestionResult(
                question_id=q.question_id,
                question=q.question,
                options=q.options,
                selected_option=chosen_opt,
                correct_option=q.correct_answer_index,
                is_correct=is_corr,
                explanation=q.explanation,
                source_reference=q.source_reference,
                topic=q.topic,
            )
        )

    response = adaptive_service.process_quiz_submission(
        quiz_id=payload.quiz_id,
        results=results,
        difficulty=quiz.difficulty,
    )
    return response

@app.get("/api/progress", response_model=AdaptiveProgressResponse)
def get_progress():
    return adaptive_service.get_progress_data()

@app.post("/api/progress/reset")
def reset_progress():
    adaptive_service.reset_progress()
    return {"status": "progress_reset"}
