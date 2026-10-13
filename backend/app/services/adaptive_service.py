import json
import datetime
from typing import List, Dict, Any, Optional
from app.config import settings
from app.models.schemas import (
    TopicMastery,
    RecommendedAction,
    AdaptiveProgressResponse,
    QuestionResult,
    QuizSubmitResponse,
)
from app.services.material_service import material_service
from app.retrieval.engine import retrieval_engine

PROGRESS_FILE = settings.DATA_DIR / "progress.json"

class AdaptiveService:
    def __init__(self):
        self.quiz_history: List[Dict[str, Any]] = []
        self.topic_stats: Dict[str, Dict[str, Any]] = {}
        self.recent_qna: List[Dict[str, Any]] = []
        self._load_from_disk()

    def _load_from_disk(self):
        if PROGRESS_FILE.exists():
            try:
                data = json.loads(PROGRESS_FILE.read_text(encoding="utf-8"))
                self.quiz_history = data.get("quiz_history", [])
                self.topic_stats = data.get("topic_stats", {})
                self.recent_qna = data.get("recent_qna", [])
            except Exception as e:
                print(f"[Error loading progress]: {e}")

    def _save_to_disk(self):
        PROGRESS_FILE.parent.mkdir(parents=True, exist_ok=True)
        data = {
            "quiz_history": self.quiz_history,
            "topic_stats": self.topic_stats,
            "recent_qna": self.recent_qna,
        }
        PROGRESS_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")

    def record_qna(self, question: str, answer: str, citations: List[Any]):
        """Records recent tutor conversation."""
        self.recent_qna.insert(
            0,
            {
                "id": str(len(self.recent_qna) + 1),
                "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
                "question": question,
                "answer": answer[:300] + ("..." if len(answer) > 300 else ""),
                "citation_count": len(citations),
                "citations": [c.model_dump() if hasattr(c, "model_dump") else c for c in citations[:3]],
            },
        )
        self.recent_qna = self.recent_qna[:15]  # Keep 15 most recent
        self._save_to_disk()

    def calculate_topic_mastery(self, stats: Dict[str, Any]) -> float:
        """
        Transparent Mastery Score Algorithm:
        - 70% Weight: Overall accuracy on topic (correct / total * 70)
        - 20% Weight: Recency momentum (accuracy on last 3 attempts * 20)
        - 10% Weight: Difficulty bonus (proportion of medium/hard questions * 10)
        """
        total = stats.get("total", 0)
        if total == 0:
            return 0.0

        correct = stats.get("correct", 0)
        base_acc = (correct / total) * 70.0

        recent_attempts = stats.get("recent", [])
        if recent_attempts:
            recency_rate = sum(1 for r in recent_attempts if r) / len(recent_attempts)
            recency_score = recency_rate * 20.0
        else:
            recency_score = (correct / total) * 20.0

        difficulties = stats.get("difficulties", [])
        hard_count = sum(1 for d in difficulties if d == "hard")
        med_count = sum(1 for d in difficulties if d == "medium")
        diff_factor = min(10.0, ((hard_count * 1.0 + med_count * 0.5) / max(1, len(difficulties))) * 10.0)

        final_score = round(base_acc + recency_score + diff_factor, 1)
        return min(100.0, max(0.0, final_score))

    def process_quiz_submission(
        self,
        quiz_id: str,
        results: List[QuestionResult],
        difficulty: str,
    ) -> QuizSubmitResponse:
        total = len(results)
        correct_count = sum(1 for r in results if r.is_correct)
        score_pct = round((correct_count / total * 100), 1) if total > 0 else 0.0

        topic_breakdown: Dict[str, Dict[str, Any]] = {}
        mastery_updates: Dict[str, float] = {}

        for r in results:
            t = r.topic or "General"
            if t not in self.topic_stats:
                self.topic_stats[t] = {
                    "total": 0,
                    "correct": 0,
                    "recent": [],
                    "difficulties": [],
                }

            self.topic_stats[t]["total"] += 1
            if r.is_correct:
                self.topic_stats[t]["correct"] += 1
            
            # Keep last 5 recent outcomes
            recent_list = self.topic_stats[t]["recent"]
            recent_list.append(r.is_correct)
            self.topic_stats[t]["recent"] = recent_list[-5:]
            self.topic_stats[t]["difficulties"].append(difficulty)

            if t not in topic_breakdown:
                topic_breakdown[t] = {"total": 0, "correct": 0}
            topic_breakdown[t]["total"] += 1
            if r.is_correct:
                topic_breakdown[t]["correct"] += 1

        for t in topic_breakdown.keys():
            new_mastery = self.calculate_topic_mastery(self.topic_stats[t])
            mastery_updates[t] = new_mastery

        # Save to history
        self.quiz_history.insert(
            0,
            {
                "quiz_id": quiz_id,
                "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
                "total_questions": total,
                "correct_count": correct_count,
                "score_percentage": score_pct,
                "difficulty": difficulty,
                "topic_breakdown": topic_breakdown,
            },
        )
        self.quiz_history = self.quiz_history[:25]
        self._save_to_disk()

        return QuizSubmitResponse(
            quiz_id=quiz_id,
            total_questions=total,
            correct_count=correct_count,
            score_percentage=score_pct,
            question_results=results,
            topic_breakdown=topic_breakdown,
            mastery_updates=mastery_updates,
        )

    def get_progress_data(self) -> AdaptiveProgressResponse:
        materials = material_service.list_materials()
        chunks = material_service.chunks

        total_questions_attempted = sum(h["total_questions"] for h in self.quiz_history)
        total_questions_correct = sum(h["correct_count"] for h in self.quiz_history)
        overall_acc = (
            round((total_questions_correct / total_questions_attempted * 100), 1)
            if total_questions_attempted > 0
            else 0.0
        )

        topic_masteries: List[TopicMastery] = []
        weak_topics: List[str] = []

        # Find all unique topics from materials and stats
        all_topics = set(self.topic_stats.keys())
        for m in materials:
            all_topics.update(m.topics)

        for topic in sorted(all_topics):
            stats = self.topic_stats.get(topic, {"total": 0, "correct": 0, "recent": [], "difficulties": []})
            score = self.calculate_topic_mastery(stats)

            if score >= 80.0:
                status = "Mastered"
            elif score >= 50.0:
                status = "In Progress"
            else:
                status = "Needs Practice"
                if stats["total"] > 0 or len(weak_topics) < 3:
                    weak_topics.append(topic)

            # Recommend source
            search_hits = retrieval_engine.search(topic, top_k=1)
            rec_source = f"{search_hits[0][0].material_title} ({search_hits[0][0].locator})" if search_hits else None

            topic_masteries.append(
                TopicMastery(
                    topic=topic,
                    mastery_score=score,
                    questions_attempted=stats.get("total", 0),
                    questions_correct=stats.get("correct", 0),
                    status=status,
                    recommended_source=rec_source,
                )
            )

        avg_mastery = (
            round(sum(tm.mastery_score for tm in topic_masteries) / len(topic_masteries), 1)
            if topic_masteries
            else 0.0
        )

        # Recommended study actions
        recommended_actions: List[RecommendedAction] = []
        for wt in weak_topics[:3]:
            hits = retrieval_engine.search(wt, top_k=1)
            if hits:
                top_chunk = hits[0][0]
                recommended_actions.append(
                    RecommendedAction(
                        title=f"Review {wt} in {top_chunk.material_title}",
                        action_type="review_material",
                        topic=wt,
                        material_id=top_chunk.material_id,
                        material_title=top_chunk.material_title,
                        locator=top_chunk.locator,
                        reason=f"Identified as a weak topic based on quiz performance. Re-read {top_chunk.locator}.",
                    )
                )
                recommended_actions.append(
                    RecommendedAction(
                        title=f"Take Targeted Practice Quiz on {wt}",
                        action_type="practice_topic",
                        topic=wt,
                        material_id=top_chunk.material_id,
                        reason=f"Strengthen recall and raise your mastery score in {wt}.",
                    )
                )

        if not recommended_actions and materials:
            recommended_actions.append(
                RecommendedAction(
                    title=f"Test yourself on {materials[0].title}",
                    action_type="take_quiz",
                    material_id=materials[0].id,
                    material_title=materials[0].title,
                    reason="Take a quiz to establish your baseline topic mastery scores.",
                )
            )

        return AdaptiveProgressResponse(
            total_materials=len(materials),
            total_chunks=len(chunks),
            total_questions_asked=len(self.recent_qna),
            total_quizzes_taken=len(self.quiz_history),
            overall_accuracy=overall_acc,
            average_mastery=avg_mastery,
            topic_mastery=topic_masteries,
            weak_topics=weak_topics[:4],
            recommended_actions=recommended_actions,
            recent_qna=self.recent_qna,
            quiz_history=self.quiz_history,
        )

    def reset_progress(self):
        self.quiz_history = []
        self.topic_stats = {}
        self.recent_qna = []
        self._save_to_disk()

adaptive_service = AdaptiveService()
