# LearnLens AI — Personalized Tutoring & Adaptive Learning

**Multimodal AI Hackathon 2026 — Track D: Personalized Tutoring & Adaptive Learning**

> 📄 **Official PDF Guide:** [Download / View the Detailed Step-by-Step PDF Guide](./LearnLens_AI_Detailed_Guide.pdf) containing architectural breakdown, complete setup commands, formula derivation, and a 5-stage demonstration script for judges.

LearnLens AI is an end-to-end multimodal study companion that unifies lecture videos, textbooks, slide decks, and transcripts into a source-cited knowledge base. It uses retrieval-grounded AI to run adaptive assessments, transparent mastery tracking, and interactive personalized tutoring with verifiable provenance.

---

## 🎯 Problem Statement
Students and self-directed learners frequently juggle disconnected study materials: PDF textbooks, PowerPoint slide decks, YouTube video lectures, and subtitle transcripts. Existing generic LLM tutors often suffer from:
1. **Hallucination & Lack of Verification:** Stating assertions without identifying where in the student's actual course materials the fact originated.
2. **Disconnected Assessment:** Quizzes that ask generic trivia rather than directly testing what was covered in class slides or assigned readings.
3. **Opaque "Mastery":** Claims of adaptive learning without clear or actionable insight into which topics are weak and exactly where in the source materials the student should review.

LearnLens AI solves this by enforcing **verifiable source provenance** for every assertion, dynamically generating quizzes from course materials, and providing a transparent mastery algorithm with targeted study actions.

---

## ✨ Core Features

### 1. Study Material Library (Multimodal Ingestion)
- **PDF Textbooks & Notes:** Parsed via **PyMuPDF**, extracting clean text while preserving exact 1-indexed page numbers.
- **PowerPoint Slide Decks (.pptx):** Parsed via **python-pptx**, extracting titles, body text, tables, and speaker notes with exact slide numbers.
- **Lecture Subtitles (.srt, .vtt):** Parsed with exact start/end timestamp ranges (`01:23 - 01:50`).
- **YouTube Lecture Importer:** Ingests video transcripts using `youtube-transcript-api`, mapping segments directly to video timestamps.
- **Interactive Chunk Inspector:** Allows users to preview how documents were tokenized into source-grounded chunks.

### 2. Source-Grounded AI Tutor
- **Retrieval Pipeline:** TF-IDF with n-grams, sublinear scaling, and keyword-boosting retrieves the most relevant chunks.
- **Verifiable Citations:** Every answer attaches expandable citation cards specifying document title, format, exact locator (Page X, Slide Y, Timestamp), and verified excerpt.
- **Hallucination Guardrail:** If retrieved evidence does not support an answer, the system explicitly refuses to guess and informs the student that the uploaded materials lack sufficient context.
- **Gemini GenAI SDK:** Powered by the official `google-genai` Python SDK (`gemini-2.5-flash`).

### 3. Personalized Quizzes
- **Dynamic Question Synthesis:** Generates grounded multiple-choice questions (MCQs) across Easy, Medium, and Hard difficulty levels.
- **Instant Grounded Feedback:** Highlights correct answers, provides detailed explanations, and cites the exact source page or slide.
- **Granular Scopes:** Generate quizzes across all library files or focus on a specific slide deck, textbook chapter, or concept.

### 4. Adaptive Learning & Topic Mastery
- **Transparent Scoring Algorithm:** Avoids black-box models by computing mastery via a multi-factor formula:
  $$\text{Mastery}(T) = \min\left(100, \left( \frac{\text{Correct}}{\text{Total}} \times 70 + \text{Recent Weight} \times 20 + \text{Difficulty Factor} \times 10 \right)\right)$$
  - **70% Base Accuracy:** Overall recall accuracy on the topic.
  - **20% Recency Momentum:** Performance across the student's 3 most recent attempts.
  - **10% Difficulty Factor:** Scaling bonus for correctly answering Medium and Hard analytical questions.
- **Status Classification:** Mastered ($\ge 80\%$), In Progress ($50-79\%$), and Needs Practice ($< 50\%$).
- **Targeted Practice:** Highlights weak topics with one-click actions that generate practice quizzes strictly targeting those deficiencies.

### 5. Study Dashboard
- High-level metrics: Total materials, Indexed chunks, Tutor inquiries, Quiz accuracy %, and Average mastery %.
- Priority alert banner for weak topics.
- Recommended next study actions with exact document section links.
- Recent Q&A history and quiz performance logs.

---

## 🏗️ System Architecture

```
                                  ┌───────────────────────────────┐
                                  │      React + TypeScript       │
                                  │   (Vite + Tailwind CSS v4)    │
                                  └───────────────┬───────────────┘
                                                  │ HTTP / JSON
                                                  ▼
                                  ┌───────────────────────────────┐
                                  │        FastAPI Backend        │
                                  │           (Python)            │
                                  └───────┬───────────────┬───────┘
                                          │               │
                  ┌───────────────────────┴──────┐        │
                  ▼                              ▼        ▼
       ┌─────────────────────┐       ┌───────────────────────┐
       │ Provenance Parsers  │       │   Retrieval Engine    │
       │ - PyMuPDF (PDF)     │       │   - TF-IDF Vectorizer │
       │ - python-pptx (PPTX)│       │   - Cosine Similarity │
       │ - Subtitles (.srt)  │       │   - Keyword Boosting  │
       │ - YouTube Captions  │       └───────────┬───────────┘
       └─────────────────────┘                   │ Grounded Context
                                                 ▼
                                     ┌───────────────────────┐
                                     │  Official google-genai│
                                     │    (Gemini 2.5 Flash) │
                                     └───────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons |
| **Backend** | Python 3.14 / 3.11+, FastAPI, Uvicorn, Pydantic v2 |
| **Multimodal Parsers** | PyMuPDF (`pymupdf`), `python-pptx`, `youtube-transcript-api`, `webvtt-py` |
| **Retrieval & ML** | Scikit-learn (`TfidfVectorizer`), NumPy |
| **AI Model & SDK** | Google Gemini (`gemini-2.5-flash`) via the official `google-genai` SDK |

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/learnlens-ai.git
cd learnlens-ai
```

### 2. Backend Setup
```bash
# Navigate to project root or backend
cd "c:\Hackathon\Multimodal AI Hackathon"

# Install Python dependencies
pip install -r requirements.txt

# Configure environment variables
copy .env.example .env
# Edit .env and insert your GEMINI_API_KEY
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

---

## 🏃 Running the Application

### Start the Backend Server (Port 8000)
```bash
python backend/run.py
```
*Backend will be running at:* `http://127.0.0.1:8000`  
*Swagger API Docs available at:* `http://127.0.0.1:8000/docs`

### Start the Frontend Dev Server (Port 5173)
```bash
cd frontend
npm run dev
```
*Frontend will be running at:* `http://localhost:5173`

---

## 🔑 Environment Variables

Create a `.env` file in the project root or `backend/` directory:

```env
# Google Gemini API Key (Get free key from https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=your_gemini_api_key_here

# Gemini Model Selection
GEMINI_MODEL=gemini-2.5-flash
```

> **Security Note:** The `GEMINI_API_KEY` is loaded strictly on the backend. It is never exposed in client bundles and is excluded from Git via `.gitignore`. You can also enter or test your API key live directly through the UI modal.

---

## 🧪 Testing the Application

### Automated End-to-End API Test
Run the automated test suite verifying all 6 core endpoints:
```bash
python backend/test_api.py
```
Expected output:
- `[1] HEALTH CHECK`: Status healthy, indexed documents count verified.
- `[2] MATERIALS`: Ingestion and chunk extraction verified.
- `[3] TUTOR ASK`: Question retrieval and verifiable provenance citations checked.
- `[4] QUIZ GENERATION`: Dynamic question synthesis verified.
- `[5] QUIZ SUBMISSION`: Instant grading and mastery updates verified.
- `[6] ADAPTIVE PROGRESS`: Telemetry, weak topics, and recommended actions verified.

### Interactive UI Walkthrough
1. **Load Demo Materials:** Click "Load Demo Materials" in the top bar to instantly load 4 multimodal documents (Deep Learning PDF, Transformers PPTX, Optimization SRT, and Evaluation Notes).
2. **Inspect Chunks:** In "Study Library", click "Inspect Chunks" on any file to view exact page/slide numbers.
3. **Ask the Tutor:** In "AI Tutor", click a quick prompt like *"What is the formula for scaled dot-product attention and why is the scaling factor used?"* and expand the citation card to inspect the exact slide excerpt.
4. **Take an Adaptive Quiz:** In "Quizzes", click "Generate Adaptive Quiz", select options, view instant grounded explanations, and review your updated mastery score.
5. **View Mastery Telemetry:** In "Adaptive Mastery", click "How Mastery is Calculated" to review the transparent 70/20/10 formula.

---

## ⚠️ Known Limitations
1. **YouTube Subtitles:** Videos without public auto-generated or manual English captions cannot be imported; an informative error is returned.
2. **Offline Mode:** If `GEMINI_API_KEY` is not provided, the application runs in offline retrieval mode: search, chunk inspection, verifiable citations, deterministic quiz generation, and adaptive mastery continue to function, while clearly prompting for a Gemini key to activate live generative synthesis.
3. **Scanned Image PDFs:** PDFs containing purely scanned bitmap images without embedded text streams require OCR (such as Tesseract) to extract text.

---

## 🤖 AI-Assisted Development Disclosure
As required by the Multimodal AI Hackathon 2026 rules:
- **Development Tool:** Google Antigravity & Gemini Coding Model.
- **AI-Assisted Components:**
  - Architecture and schema design for provenance-preserving chunking.
  - Multi-format parser dispatch logic for PyMuPDF, python-pptx, and transcript formats.
  - Grounded prompt engineering and official `google-genai` SDK integration.
  - Transparent heuristic mastery formula design and React component styling.

---

## 📦 Publishing to GitHub

```bash
# 1. Initialize git repository
git init

# 2. Stage files (ignoring secrets and build artifacts via .gitignore)
git add .

# 3. Create initial commit
git commit -m "feat: initial commit for LearnLens AI Hackathon Track D"

# 4. Link remote and push
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/learnlens-ai.git
git push -u origin main
```
