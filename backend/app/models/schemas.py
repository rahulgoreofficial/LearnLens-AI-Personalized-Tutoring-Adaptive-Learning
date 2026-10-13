from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class MaterialMetadata(BaseModel):
    id: str
    title: str
    filename: str
    doc_type: str  # "pdf", "pptx", "text", "transcript", "youtube"
    file_size: int = 0
    upload_date: str
    total_pages_or_slides: Optional[int] = None
    total_duration: Optional[str] = None
    chunk_count: int = 0
    topics: List[str] = []

class DocumentChunk(BaseModel):
    chunk_id: str
    material_id: str
    material_title: str
    doc_type: str
    locator: str  # e.g. "Page 3", "Slide 5", "01:23 - 01:50"
    page_number: Optional[int] = None
    slide_number: Optional[int] = None
    timestamp: Optional[str] = None
    text: str
    char_count: int

class Citation(BaseModel):
    citation_id: str
    material_id: str
    source_title: str
    doc_type: str
    locator: str
    snippet: str
    relevance_score: float

class TutorAskRequest(BaseModel):
    question: str
    material_ids: Optional[List[str]] = None
    session_id: Optional[str] = "default"

class TutorAskResponse(BaseModel):
    answer: str
    citations: List[Citation] = []
    sufficient_evidence: bool = True
    retrieved_chunks_count: int = 0
    used_model: str = "gemini"

class QuizQuestion(BaseModel):
    question_id: str
    question: str
    options: List[str]
    correct_answer_index: int
    explanation: str
    source_reference: str
    topic: str
    difficulty: str

class Quiz(BaseModel):
    quiz_id: str
    created_at: str
    difficulty: str
    topic: Optional[str] = None
    material_ids: Optional[List[str]] = None
    questions: List[QuizQuestion]

class QuizGenerateRequest(BaseModel):
    material_ids: Optional[List[str]] = None
    topic: Optional[str] = None
    difficulty: str = "medium"  # "easy", "medium", "hard"
    num_questions: int = 5

class QuestionResult(BaseModel):
    question_id: str
    question: str
    options: List[str]
    selected_option: int
    correct_option: int
    is_correct: bool
    explanation: str
    source_reference: str
    topic: str

class QuizSubmitRequest(BaseModel):
    quiz_id: str
    answers: List[int]

class QuizSubmitResponse(BaseModel):
    quiz_id: str
    total_questions: int
    correct_count: int
    score_percentage: float
    question_results: List[QuestionResult]
    topic_breakdown: Dict[str, Dict[str, Any]]
    mastery_updates: Dict[str, float]

class TopicMastery(BaseModel):
    topic: str
    mastery_score: float  # 0 to 100
    questions_attempted: int
    questions_correct: int
    status: str  # "Mastered", "In Progress", "Needs Practice"
    recommended_source: Optional[str] = None

class RecommendedAction(BaseModel):
    title: str
    action_type: str  # "practice_topic", "review_material", "take_quiz"
    topic: Optional[str] = None
    material_id: Optional[str] = None
    material_title: Optional[str] = None
    locator: Optional[str] = None
    reason: str

class AdaptiveProgressResponse(BaseModel):
    total_materials: int
    total_chunks: int
    total_questions_asked: int
    total_quizzes_taken: int
    overall_accuracy: float
    average_mastery: float
    topic_mastery: List[TopicMastery]
    weak_topics: List[str]
    recommended_actions: List[RecommendedAction]
    recent_qna: List[Dict[str, Any]]
    quiz_history: List[Dict[str, Any]]

class YouTubeImportRequest(BaseModel):
    url: str
    title: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    project: str
    version: str
    gemini_configured: bool
    model_name: str
    indexed_materials: int
    indexed_chunks: int
