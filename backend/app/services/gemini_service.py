import os
import json
import re
import uuid
from typing import List, Tuple, Optional, Dict, Any
from app.config import settings
from app.models.schemas import DocumentChunk, Citation, QuizQuestion

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self._init_client()

    def _init_client(self):
        self.client = None
        if self.api_key and genai:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"[Gemini Client Init Warning]: {e}")
                self.client = None

    def update_api_key(self, api_key: str):
        """Allows dynamically updating or setting the API key."""
        self.api_key = api_key
        self._init_client()

    def is_configured(self) -> bool:
        return bool(self.client and self.api_key)

    def answer_question(
        self,
        question: str,
        scored_chunks: List[Tuple[DocumentChunk, float]],
    ) -> Tuple[str, List[Citation], bool, str]:
        """
        Answers student question strictly grounded in retrieved chunks.
        Returns (answer_text, citations, sufficient_evidence, used_model).
        """
        # If no chunks passed the threshold
        if not scored_chunks:
            answer = (
                "The uploaded study materials do not provide sufficient information to answer this question confidently. "
                "No matching content was found in your library for this query. "
                "Please upload relevant lecture slides, notes, or transcripts covering this topic."
            )
            return answer, [], False, "retrieval_guardrail"

        # Build citations list
        citations: List[Citation] = []
        context_blocks: List[str] = []

        for idx, (chunk, score) in enumerate(scored_chunks, 1):
            citation = Citation(
                citation_id=str(uuid.uuid4()),
                material_id=chunk.material_id,
                source_title=chunk.material_title,
                doc_type=chunk.doc_type,
                locator=chunk.locator,
                snippet=chunk.text[:280] + ("..." if len(chunk.text) > 280 else ""),
                relevance_score=round(score, 3),
            )
            citations.append(citation)

            block = (
                f"[Source {idx}]\n"
                f"Title: {chunk.material_title}\n"
                f"Type: {chunk.doc_type.upper()}\n"
                f"Location: {chunk.locator}\n"
                f"Content:\n{chunk.text}\n"
            )
            context_blocks.append(block)

        context_str = "\n---\n".join(context_blocks)

        if not self.is_configured():
            # Honest notification according to hackathon instructions
            answer = (
                "### ℹ️ Gemini API Configuration Required\n\n"
                "The retrieval pipeline successfully analyzed your study materials and identified "
                f"**{len(scored_chunks)} relevant source sections** grounded in your uploaded documents.\n\n"
                "To generate real-time generative tutoring explanations via the official Google GenAI SDK, "
                "please configure your `GEMINI_API_KEY` in the backend `.env` file.\n\n"
                "**Grounded Evidence Found in Uploaded Materials:**\n\n"
            )
            for idx, c in enumerate(citations, 1):
                answer += f"- **[{c.source_title} - {c.locator}]**: *\"{c.snippet}\"*\n"

            answer += (
                "\n*Once your GEMINI_API_KEY is supplied, Gemini will synthesize full interactive explanations "
                "with inline citations backed by these verified source excerpts.*"
            )
            return answer, citations, True, "offline_retrieval"

        # Construct prompt for Gemini
        prompt = f"""You are LearnLens AI, an expert, source-grounded academic tutor.
You MUST answer the student's question strictly and exclusively based on the following verified source excerpts extracted from their study materials.

STRICT INSTRUCTIONS:
1. Ground every factual assertion strictly in the provided Source Excerpts below.
2. DO NOT hallucinate or extrapolate outside facts. If the excerpts do not contain the answer, explicitly state:
   "The uploaded materials do not provide sufficient information to answer this question confidently."
3. Whenever presenting a point, cite the source in-text as [Source X: Document Title, Locator] (e.g. [Source 1: Neural Networks, Page 3] or [Source 2: Lecture 1, Slide 5]).
4. Maintain a clear, pedagogical, encouraging tone. Format key concepts with bullet points.

STUDENT QUESTION:
{question}

SOURCE EXCERPTS:
{context_str}
"""

        try:
            config = types.GenerateContentConfig(
                temperature=0.2,
                top_p=0.9,
            )
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config,
            )
            answer_text = response.text or ""
            
            # Check if Gemini stated insufficient information
            insufficient = "not provide sufficient information" in answer_text.lower() or "insufficient information" in answer_text.lower()

            return answer_text, citations, not insufficient, self.model_name

        except Exception as e:
            fallback_answer = (
                f"⚠️ Error communicating with Gemini API: {str(e)}\n\n"
                f"However, here are the verified source citations retrieved from your study materials for this question:\n\n"
            )
            for c in citations:
                fallback_answer += f"- **{c.source_title} ({c.locator})**: {c.snippet}\n"
            return fallback_answer, citations, False, "error_fallback"

    def generate_quiz_questions(
        self,
        chunks: List[DocumentChunk],
        topic: Optional[str] = None,
        difficulty: str = "medium",
        num_questions: int = 5,
    ) -> List[QuizQuestion]:
        """
        Dynamically generates multiple-choice questions grounded in the provided document chunks.
        """
        if not chunks:
            return []

        # Sample or prioritize chunks
        selected_chunks = chunks[:12]
        context_blocks = []
        for idx, c in enumerate(selected_chunks, 1):
            context_blocks.append(
                f"[Source {idx} | {c.material_title} | {c.locator}]\n{c.text}\n"
            )
        context_text = "\n---\n".join(context_blocks)

        target_topic = topic or "General Concepts in Uploaded Material"

        if not self.is_configured():
            # Deterministic generator when API key is pending
            return self._generate_deterministic_quiz(selected_chunks, target_topic, difficulty, num_questions)

        prompt = f"""You are LearnLens AI Quiz Generator.
Generate {num_questions} multiple-choice quiz questions based STRICTLY on the source text below.

Target Topic: {target_topic}
Difficulty: {difficulty} (easy = foundational definitions; medium = conceptual understanding and application; hard = analytical reasoning and comparison)

Format your response as a valid JSON array of objects with the following schema:
[
  {{
    "question": "Clear, grounded question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer_index": 0,
    "explanation": "Detailed explanation grounded in the text showing why the correct option is right and others are wrong.",
    "source_reference": "Document Title, Locator (e.g. Deep Learning Notes, Page 4)",
    "topic": "{target_topic}",
    "difficulty": "{difficulty}"
  }}
]

RULES:
- All questions, correct answers, and explanations MUST be directly factual according to the provided sources.
- No outside trivia.
- Exactly 4 options per question.
- 'correct_answer_index' must be an integer between 0 and 3.

SOURCE TEXT:
{context_text}
"""

        try:
            config = types.GenerateContentConfig(
                temperature=0.3,
                response_mime_type="application/json",
            )
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config,
            )
            raw_json = response.text or "[]"
            # Parse json
            data = json.loads(raw_json)
            questions: List[QuizQuestion] = []
            for item in data:
                q = QuizQuestion(
                    question_id=str(uuid.uuid4()),
                    question=item["question"],
                    options=item["options"],
                    correct_answer_index=int(item["correct_answer_index"]),
                    explanation=item["explanation"],
                    source_reference=item.get("source_reference", selected_chunks[0].locator),
                    topic=item.get("topic", target_topic),
                    difficulty=item.get("difficulty", difficulty),
                )
                questions.append(q)
            return questions[:num_questions]
        except Exception as e:
            print(f"[Gemini Quiz Generation Error]: {e}")
            return self._generate_deterministic_quiz(selected_chunks, target_topic, difficulty, num_questions)

    def _generate_deterministic_quiz(
        self,
        chunks: List[DocumentChunk],
        topic: str,
        difficulty: str,
        num_questions: int,
    ) -> List[QuizQuestion]:
        """
        Synthesizes grounded quiz questions directly from document sentences and definitions
        to ensure students can always test and practice even if API key is not yet configured.
        """
        questions: List[QuizQuestion] = []
        
        for idx, chunk in enumerate(chunks[:num_questions]):
            sentences = [s.strip() for s in re.split(r"[.\n]", chunk.text) if len(s.strip()) > 35]
            if not sentences:
                continue

            lead_sentence = sentences[0]
            words = lead_sentence.split()
            key_term = " ".join(words[:3])

            question_text = f"According to {chunk.material_title} ({chunk.locator}), what key concept is addressed in relation to '{key_term}'?"
            correct_opt = lead_sentence[:120] + ("." if not lead_sentence.endswith(".") else "")
            
            # Create grounded distractors
            other_sentences = [s[:100] for s in sentences[1:4]]
            while len(other_sentences) < 3:
                other_sentences.append(f"It is unrelated to the principles discussed in {chunk.locator}.")

            options = [correct_opt] + other_sentences[:3]
            # Shuffle or place at position
            correct_idx = idx % 4
            # Swap correct to position
            options[0], options[correct_idx] = options[correct_idx], options[0]

            questions.append(
                QuizQuestion(
                    question_id=str(uuid.uuid4()),
                    question=question_text,
                    options=options,
                    correct_answer_index=correct_idx,
                    explanation=f"Based on {chunk.material_title} ({chunk.locator}): '{lead_sentence}'. This verifies the correct principle.",
                    source_reference=f"{chunk.material_title}, {chunk.locator}",
                    topic=topic if topic != "General Concepts in Uploaded Material" else chunk.material_title,
                    difficulty=difficulty,
                )
            )

        return questions

gemini_service = GeminiService()
