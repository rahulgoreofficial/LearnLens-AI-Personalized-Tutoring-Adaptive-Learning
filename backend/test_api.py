import urllib.request
import json
import sys

def test_api():
    base = "http://127.0.0.1:8000/api"

    # 1. Health
    res = urllib.request.urlopen(f"{base}/health")
    health = json.loads(res.read().decode("utf-8"))
    print("[1] HEALTH CHECK:", health)

    # 2. Materials
    res = urllib.request.urlopen(f"{base}/materials")
    materials = json.loads(res.read().decode("utf-8"))
    print(f"[2] MATERIALS: Loaded {len(materials)} study materials.")
    for m in materials:
        print(f"    - {m['title']} ({m['doc_type'].upper()}): {m['chunk_count']} chunks")

    # 3. Tutor Ask
    payload = json.dumps({"question": "What is the formula for scaled dot product attention and why is scaling factor used?"}).encode("utf-8")
    req = urllib.request.Request(f"{base}/tutor/ask", data=payload, headers={"Content-Type": "application/json"})
    res = urllib.request.urlopen(req)
    tutor_res = json.loads(res.read().decode("utf-8"))
    print(f"[3] TUTOR ASK: Received response with {len(tutor_res['citations'])} verifiable citations.")
    for idx, c in enumerate(tutor_res['citations'], 1):
        print(f"    - Citation {idx}: [{c['source_title']} - {c['locator']}] Relevance: {c['relevance_score']}")

    # 4. Quiz Generation
    q_payload = json.dumps({"difficulty": "medium", "num_questions": 3}).encode("utf-8")
    req = urllib.request.Request(f"{base}/quiz/generate", data=q_payload, headers={"Content-Type": "application/json"})
    res = urllib.request.urlopen(req)
    quiz = json.loads(res.read().decode("utf-8"))
    print(f"[4] QUIZ GENERATION: Generated Quiz ID {quiz['quiz_id']} with {len(quiz['questions'])} questions.")
    for idx, q in enumerate(quiz['questions'], 1):
        print(f"    - Q{idx}: {q['question']}")
        print(f"      Source: {q['source_reference']}")

    # 5. Quiz Submission
    answers = [q['correct_answer_index'] for q in quiz['questions']]
    sub_payload = json.dumps({"quiz_id": quiz['quiz_id'], "answers": answers}).encode("utf-8")
    req = urllib.request.Request(f"{base}/quiz/submit", data=sub_payload, headers={"Content-Type": "application/json"})
    res = urllib.request.urlopen(req)
    sub_res = json.loads(res.read().decode("utf-8"))
    print(f"[5] QUIZ SUBMISSION: Score {sub_res['score_percentage']}%, Correct: {sub_res['correct_count']}/{sub_res['total_questions']}")
    print(f"    Mastery updates: {sub_res['mastery_updates']}")

    # 6. Adaptive Progress
    res = urllib.request.urlopen(f"{base}/progress")
    progress = json.loads(res.read().decode("utf-8"))
    print(f"[6] ADAPTIVE PROGRESS: Total Quizzes: {progress['total_quizzes_taken']}, Overall Accuracy: {progress['overall_accuracy']}%, Avg Mastery: {progress['average_mastery']}%")
    print(f"    Monitored Topics: {len(progress['topic_mastery'])}")
    print(f"    Recommended Actions: {len(progress['recommended_actions'])}")

    print("\nALL BACKEND ENDPOINTS TESTED AND VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    test_api()
