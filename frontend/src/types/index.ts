export type DocType = 'pdf' | 'pptx' | 'text' | 'transcript' | 'youtube';

export interface MaterialMetadata {
  id: string;
  title: string;
  filename: string;
  doc_type: DocType;
  file_size: number;
  upload_date: string;
  total_pages_or_slides?: number | null;
  total_duration?: string | null;
  chunk_count: number;
  topics: string[];
}

export interface DocumentChunk {
  chunk_id: string;
  material_id: string;
  material_title: string;
  doc_type: string;
  locator: string;
  page_number?: number | null;
  slide_number?: number | null;
  timestamp?: string | null;
  text: string;
  char_count: number;
}

export interface Citation {
  citation_id: string;
  material_id: string;
  source_title: string;
  doc_type: string;
  locator: string;
  snippet: string;
  relevance_score: number;
}

export interface TutorAskRequest {
  question: string;
  material_ids?: string[] | null;
  session_id?: string;
}

export interface TutorAskResponse {
  answer: string;
  citations: Citation[];
  sufficient_evidence: boolean;
  retrieved_chunks_count: number;
  used_model: string;
}

export interface QuizQuestion {
  question_id: string;
  question: string;
  options: string[];
  correct_answer_index: number;
  explanation: string;
  source_reference: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Quiz {
  quiz_id: string;
  created_at: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic?: string | null;
  material_ids?: string[] | null;
  questions: QuizQuestion[];
}

export interface QuestionResult {
  question_id: string;
  question: string;
  options: string[];
  selected_option: number;
  correct_option: number;
  is_correct: boolean;
  explanation: string;
  source_reference: string;
  topic: string;
}

export interface QuizSubmitResponse {
  quiz_id: string;
  total_questions: number;
  correct_count: number;
  score_percentage: number;
  question_results: QuestionResult[];
  topic_breakdown: Record<string, { total: number; correct: number }>;
  mastery_updates: Record<string, number>;
}

export interface TopicMastery {
  topic: string;
  mastery_score: number;
  questions_attempted: number;
  questions_correct: number;
  status: 'Mastered' | 'In Progress' | 'Needs Practice';
  recommended_source?: string | null;
}

export interface RecommendedAction {
  title: string;
  action_type: 'practice_topic' | 'review_material' | 'take_quiz';
  topic?: string | null;
  material_id?: string | null;
  material_title?: string | null;
  locator?: string | null;
  reason: string;
}

export interface AdaptiveProgressResponse {
  total_materials: number;
  total_chunks: number;
  total_questions_asked: number;
  total_quizzes_taken: number;
  overall_accuracy: number;
  average_mastery: number;
  topic_mastery: TopicMastery[];
  weak_topics: string[];
  recommended_actions: RecommendedAction[];
  recent_qna: Array<{
    id: string;
    timestamp: string;
    question: string;
    answer: string;
    citation_count: number;
    citations: Citation[];
  }>;
  quiz_history: Array<{
    quiz_id: string;
    timestamp: string;
    total_questions: number;
    correct_count: number;
    score_percentage: number;
    difficulty: string;
    topic_breakdown: Record<string, { total: number; correct: number }>;
  }>;
}

export interface HealthResponse {
  status: string;
  project: string;
  version: string;
  gemini_configured: boolean;
  model_name: string;
  indexed_materials: number;
  indexed_chunks: number;
}
