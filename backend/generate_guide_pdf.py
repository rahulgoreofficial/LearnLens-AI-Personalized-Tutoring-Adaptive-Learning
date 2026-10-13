import os
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    HRFlowable,
)
from reportlab.pdfgen import canvas

PDF_OUTPUT_PATH = Path(__file__).resolve().parent.parent / "LearnLens_AI_Detailed_Guide.pdf"

class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas for running headers and 'Page X of Y' footers."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, total_pages):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#475569"))

        # Running Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(50, 755, "LearnLens AI — Personalized Tutoring & Adaptive Learning")
            self.drawRightString(612 - 50, 755, "Track D: Comprehensive Project Guide")
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.6)
            self.line(50, 748, 612 - 50, 748)

        # Running Footer
        self.setFont("Helvetica", 8)
        page_str = f"Page {self._pageNumber} of {total_pages}"
        self.drawRightString(612 - 50, 32, page_str)
        self.drawString(50, 32, "Multimodal AI Hackathon 2026 | Google Antigravity & Gemini")
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.6)
        self.line(50, 42, 612 - 50, 42)

        self.restoreState()

def create_code_box(code_text, style):
    escaped = code_text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\n", "<br/>").replace(" ", "&nbsp;")
    t = Table([[Paragraph(escaped, style)]], colWidths=[512])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
        ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#CBD5E1")),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t

def build_pdf():
    doc = SimpleDocTemplate(
        str(PDF_OUTPUT_PATH),
        pagesize=letter,
        leftMargin=50,
        rightMargin=50,
        topMargin=46,
        bottomMargin=46,
    )

    styles = getSampleStyleSheet()

    primary_color = colors.HexColor("#0F172A")    # Slate 900
    brand_color = colors.HexColor("#4338CA")      # Indigo 700
    accent_emerald = colors.HexColor("#047857")   # Emerald 700

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=26,
        textColor=brand_color,
        spaceAfter=2,
    )

    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#334155"),
        spaceAfter=8,
    )

    meta_style = ParagraphStyle(
        "Meta_Custom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#64748B"),
        spaceAfter=6,
    )

    h1_style = ParagraphStyle(
        "Heading1_Custom",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=brand_color,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True,
    )

    h2_style = ParagraphStyle(
        "Heading2_Custom",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=13,
        textColor=primary_color,
        spaceBefore=6,
        spaceAfter=3,
        keepWithNext=True,
    )

    body_style = ParagraphStyle(
        "Body_Custom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=primary_color,
        spaceAfter=4,
    )

    bullet_style = ParagraphStyle(
        "Bullet_Custom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=primary_color,
        leftIndent=12,
        spaceAfter=3,
    )

    code_style = ParagraphStyle(
        "Code_Custom",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=7.8,
        leading=10.5,
        textColor=colors.HexColor("#0F172A"),
    )

    callout_style = ParagraphStyle(
        "Callout_Custom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#1E1B4B"),
    )

    story = []

    # ==========================
    # PAGE 1: TITLE & PROJECT OVERVIEW
    # ==========================
    story.append(Paragraph("LearnLens AI", title_style))
    story.append(Paragraph("Personalized Tutoring & Adaptive Learning — Comprehensive Operational Guide", subtitle_style))
    story.append(Paragraph("<b>Hackathon Track:</b> Track D (Personalized Tutoring & Adaptive Learning) | <b>Multimodal AI Hackathon 2026</b>", meta_style))
    story.append(Paragraph("<b>GitHub Repository:</b> https://github.com/rahulgoreofficial/LearnLens-AI-Personalized-Tutoring-Adaptive-Learning", meta_style))
    story.append(HRFlowable(width="100%", thickness=1.2, color=brand_color, spaceAfter=8))

    # Executive Summary Card
    exec_text = (
        "<b>Executive Summary:</b> LearnLens AI is a functional, full-stack educational AI companion that "
        "unifies disparate study assets (PDF textbooks, PowerPoint slides, video subtitles, and YouTube lectures) "
        "into a source-cited multimodal knowledge base. It delivers: <b>(1) Verifiable Provenance Citations</b> identifying "
        "exact PDF pages, PowerPoint slides, or video timestamps; <b>(2) Grounded AI Tutoring</b> with anti-hallucination guardrails; "
        "<b>(3) Dynamic Assessment Generation</b> across 3 difficulty tiers; and <b>(4) Transparent Adaptive Mastery Tracking</b>."
    )
    c_table = Table([[Paragraph(exec_text, callout_style)]], colWidths=[512])
    c_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#EEF2FF")),
        ("BOX", (0, 0), (-1, -1), 1, brand_color),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(c_table)
    story.append(Spacer(1, 6))

    story.append(Paragraph("1. Problem Statement & Platform Vision", h1_style))
    story.append(Paragraph(
        "Students are overwhelmed by fragmented learning media: textbook PDFs, lecture slide decks (.pptx), "
        "recorded lectures (.srt subtitles), and online YouTube videos. Generic conversational LLMs frequently invent "
        "facts, generate generic quizzes detached from assigned course materials, and lack actionable guidance on which "
        "exact slide or book page to revisit.",
        body_style
    ))
    story.append(Paragraph(
        "<b>The LearnLens Solution:</b> An end-to-end retrieval-augmented system that ingests multimodal documents, "
        "preserves physical provenance tags on every text chunk, feeds verified excerpts to Gemini (via the official "
        "<code>google-genai</code> SDK), and generates verifiable citations so students can expand and inspect the exact source text.",
        body_style
    ))

    story.append(Paragraph("2. System Architecture & Tech Stack", h1_style))
    
    arch_data = [
        [Paragraph("<b>Component Layer</b>", body_style), Paragraph("<b>Technologies & Architecture Description</b>", body_style)],
        [Paragraph("<b>Frontend UI</b>", body_style), Paragraph("React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons. Features responsive Dark Theme, Interactive Citation Cards, Chunk Inspector, and Mastery Gauges.", body_style)],
        [Paragraph("<b>Backend API</b>", body_style), Paragraph("Python 3.14 / 3.11, FastAPI, Uvicorn, Pydantic v2. Clean REST architecture with CORS & validation.", body_style)],
        [Paragraph("<b>Multimodal Parsers</b>", body_style), Paragraph("<b>PyMuPDF</b> (extracts text with 1-based page numbers), <b>python-pptx</b> (extracts slides, tables & speaker notes), <b>webvtt-py / SRT regex</b> (timestamps), and <b>youtube-transcript-api</b>.", body_style)],
        [Paragraph("<b>Retrieval Engine</b>", body_style), Paragraph("TF-IDF Vectorizer with n-grams (1,2), sublinear term frequency scaling, keyword boosting, and cosine similarity ranking. Purely deterministic and zero external vector DB dependencies.", body_style)],
        [Paragraph("<b>AI Model & SDK</b>", body_style), Paragraph("Google Gemini 2.5 Flash via official <code>google-genai</code> Python SDK. Strictly grounded prompting.", body_style)],
    ]
    arch_table = Table(arch_data, colWidths=[120, 392])
    arch_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(arch_table)

    # ==========================
    # PAGE 2: CORE FEATURES BREAKDOWN
    # ==========================
    story.append(PageBreak())
    story.append(Paragraph("3. Detailed Feature Breakdown", h1_style))

    features_list = [
        ("Feature 1: Multimodal Study Material Library", 
         "Allows students to drag-and-drop PDF textbooks, PowerPoint slide decks, subtitle transcripts (.srt/.vtt), and markdown notes. Also includes a direct YouTube transcript importer that takes any video URL and captures timestamped transcript blocks. The built-in <b>Chunk Inspector Modal</b> lets students inspect exactly how each page or slide was parsed into searchable chunks."),
        ("Feature 2: Source-Grounded AI Tutor",
         "When a student asks a question, the retrieval engine searches all indexed chunks. If similarity meets relevance thresholds, the top chunks are formatted into a structured prompt for Gemini. The tutor returns answers citing sources in-text (e.g. <code>[Transformer Slides, Slide 3]</code>) paired with interactive <b>Citation Cards</b>. Clicking any card expands the verified excerpt. If no relevant chunks exist, strict guardrails instruct the tutor to state that the library lacks sufficient context."),
        ("Feature 3: Personalized Dynamic Quizzes",
         "Synthesizes grounded Multiple Choice Questions (MCQs) dynamically from the student's study materials across Easy, Medium, and Hard tiers. The interactive quiz player features real-time answer checking, full answer explanations, and citations to the supporting document page or slide."),
        ("Feature 4: Adaptive Mastery Engine",
         "Empirically monitors student recall per topic. Calculates topic mastery using a transparent 70/20/10 formula: <b>70% Base Accuracy</b>, <b>20% Recency Momentum</b> (past 3 attempts), and <b>10% Difficulty Factor</b> (bonuses for hard questions). Identifies weak topics (&lt; 60% mastery) and provides one-click targeted practice."),
        ("Feature 5: Central Study Dashboard",
         "Real-time mission control displaying materials count, chunks indexed, questions asked, quiz accuracy %, average mastery %, weak topic alerts, and an adaptive study queue recommending specific pages and slides to review."),
    ]

    for title, desc in features_list:
        story.append(Paragraph(f"• <b>{title}:</b> {desc}", body_style))
        story.append(Spacer(1, 2))

    story.append(Spacer(1, 4))
    story.append(Paragraph("4. The Transparent Topic Mastery Scoring Algorithm", h1_style))
    
    formula_html = (
        "<b>Mastery(Topic) = min(100, max(0, Base_Accuracy * 0.70 + Recency_Momentum * 0.20 + Difficulty_Bonus * 0.10))</b><br/><br/>"
        "&bull; <b>70% Base Accuracy:</b> Evaluates raw performance as <i>(Correct Answers / Total Attempted) * 70</i>.<br/>"
        "&bull; <b>20% Recency Momentum:</b> Measures active learning progress by weighting the student's 3 most recent attempts.<br/>"
        "&bull; <b>10% Difficulty Factor:</b> Rewards successful retention on analytical Medium (0.5x) and Hard (1.0x) questions.<br/>"
        "&bull; <b>Classification Bands:</b> <b>Mastered</b> (&ge; 80%), <b>In Progress</b> (50% &ndash; 79%), and <b>Needs Practice</b> (&lt; 50%)."
    )
    f_table = Table([[Paragraph(formula_html, callout_style)]], colWidths=[512])
    f_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
        ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#CBD5E1")),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(f_table)

    # ==========================
    # PAGE 3: STEP-BY-STEP STARTUP GUIDE
    # ==========================
    story.append(PageBreak())
    story.append(Paragraph("5. Step-by-Step Guide: How to Start the Program", h1_style))
    story.append(Paragraph(
        "Follow these exact commands to install, configure, and launch the complete working application:",
        body_style
    ))

    story.append(Paragraph("Step 5.1: Clone the Repository", h2_style))
    story.append(create_code_box(
        "git clone https://github.com/rahulgoreofficial/LearnLens-AI-Personalized-Tutoring-Adaptive-Learning.git\n"
        "cd LearnLens-AI-Personalized-Tutoring-Adaptive-Learning",
        code_style
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("Step 5.2: Install Backend & Frontend Dependencies", h2_style))
    story.append(create_code_box(
        "# 1. Install Backend Dependencies (FastAPI, PyMuPDF, python-pptx, google-genai, scikit-learn)\n"
        "pip install -r requirements.txt\n\n"
        "# 2. Install Frontend Dependencies (React, TypeScript, Vite, Tailwind CSS v4, Lucide)\n"
        "cd frontend\n"
        "npm install\n"
        "cd ..",
        code_style
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("Step 5.3: Environment Variable Configuration", h2_style))
    story.append(Paragraph(
        "Create a <code>.env</code> file in the project root or backend directory by copying <code>.env.example</code>:",
        body_style
    ))
    story.append(create_code_box(
        "copy .env.example .env\n\n"
        "# Content of .env:\n"
        "GEMINI_API_KEY=your_gemini_api_key_here\n"
        "GEMINI_MODEL=gemini-2.5-flash",
        code_style
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("Step 5.4: Launch the Backend & Frontend Servers", h2_style))
    story.append(Paragraph("Run the backend API and frontend dev server in two separate terminals:", body_style))
    story.append(create_code_box(
        "--- TERMINAL 1 (FastAPI Backend Server) ---\n"
        "python backend/run.py\n"
        "# Output: Uvicorn running on http://127.0.0.1:8000 (Swagger docs at http://127.0.0.1:8000/docs)\n\n"
        "--- TERMINAL 2 (Vite + React Frontend Server) ---\n"
        "cd frontend\n"
        "npm run dev\n"
        "# Output: VITE ready in 329 ms. Local: http://localhost:5173/",
        code_style
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("Step 5.5: Automated Verification Suite", h2_style))
    story.append(Paragraph(
        "Execute <code>backend/test_api.py</code> to test all 6 core endpoints end-to-end:",
        body_style
    ))
    story.append(create_code_box(
        "python backend/test_api.py\n\n"
        "# Verifies:\n"
        "# [1] Health check & model status  [2] Multimodal material & chunk ingestion\n"
        "# [3] Grounded retrieval & citations [4] Dynamic quiz question synthesis\n"
        "# [5] Quiz grading & telemetry     [6] Adaptive mastery progress calculation",
        code_style
    ))

    # ==========================
    # PAGE 4: DEMO WALKTHROUGH & COMPLIANCE
    # ==========================
    story.append(PageBreak())
    story.append(Paragraph("6. Interactive Demonstration Walkthrough (For Hackathon Judges)", h1_style))
    story.append(Paragraph(
        "Follow this 5-stage demonstration script to present all features of LearnLens AI in under 3 minutes:",
        body_style
    ))

    demo_stages = [
        ("Stage 1: Instant Multimodal Seeding",
         "Open <code>http://localhost:5173/</code>. Click the <b>'Load Demo Materials'</b> button in the top navigation. In under 1 second, 4 multimodal course assets are indexed: a multi-page PDF textbook, PowerPoint slide deck, an SRT lecture subtitle file, and Markdown notes."),
        ("Stage 2: Inspecting Document Provenance",
         "Navigate to <b>'Study Library'</b>. Observe the material cards displaying total pages, slides, and timestamps. Click <b>'Inspect Chunks'</b> on <i>'Transformer Architecture Slides'</i> to demonstrate that each slide was segmented into a discrete chunk with its exact locator ('Slide 1' to 'Slide 4')."),
        ("Stage 3: Grounded Tutoring & Verifiable Citations",
         "Navigate to <b>'AI Tutor'</b>. Click the quick prompt: <i>'What is the formula for scaled dot-product attention and why is the scaling factor used?'</i>. When the tutor answers, point out the citation badge (<code>Transformer Architecture Slides - Slide 3</code>). Click the card to expand and reveal the verified source excerpt."),
        ("Stage 4: Adaptive Quiz & Grounded Explanations",
         "Navigate to <b>'Quizzes'</b>. Click <b>'Generate Adaptive Quiz'</b>. Select an option and click <b>'Check Answer'</b>. Point out the instant green/red indicator, the pedagogical explanation, and the verified source citation link. Finish the quiz to see the mastery gains."),
        ("Stage 5: Adaptive Mastery Telemetry",
         "Navigate to <b>'Adaptive Mastery'</b>. Review the color-coded mastery cards. Click <b>'How Mastery is Calculated'</b> to review the transparent 70/20/10 formula. Click <b>'Practice'</b> next to a weak topic to immediately launch a targeted quiz."),
    ]

    for stage_title, stage_desc in demo_stages:
        story.append(Paragraph(f"&bull; <b>{stage_title}:</b> {stage_desc}", body_style))
        story.append(Spacer(1, 3))

    story.append(Spacer(1, 6))
    story.append(Paragraph("7. AI-Assisted Development Disclosure & Compliance", h1_style))
    story.append(Paragraph(
        "In compliance with the Multimodal AI Hackathon 2026 rules, we disclose that <b>Google Antigravity</b> "
        "and the <b>Gemini Coding Model</b> were utilized during AI-assisted development for:",
        body_style
    ))
    story.append(Paragraph("&bull; <b>Architecture & Schemas:</b> Designing Pydantic models for DocumentChunk, Citation, and Quiz.", bullet_style))
    story.append(Paragraph("&bull; <b>Multimodal Parsing:</b> Format dispatch logic for PyMuPDF, python-pptx, and transcript parsers.", bullet_style))
    story.append(Paragraph("&bull; <b>Grounded Prompt Engineering:</b> System instructions enforcing strict verifiable provenance citations.", bullet_style))
    story.append(Paragraph("&bull; <b>Heuristic Telemetry:</b> Mathematical formulation of the transparent 70/20/10 mastery algorithm.", bullet_style))

    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1, color=brand_color, spaceAfter=8))
    story.append(Paragraph(
        "<b>Repository & Code:</b> https://github.com/rahulgoreofficial/LearnLens-AI-Personalized-Tutoring-Adaptive-Learning",
        meta_style
    ))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated PDF: {PDF_OUTPUT_PATH}")

if __name__ == "__main__":
    build_pdf()
