from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import HTMLResponse
import shutil, os, re, uuid

from app.api.models import (
    AuthRequest, QuizRequest, TutorRequest, TopicRequest, 
    FeynmanRequest, DebateStartRequest, DebateRebuttalRequest,
    ScenarioStartRequest, ScenarioActionRequest, FlashcardRequest
)
from app.core.ai_engine import (
    generate_response, classify_topics, generate_quiz,
    evaluate_explanation, generate_mindmap, generate_debate_stance,
    evaluate_debate_rebuttal, generate_scenario, evaluate_scenario_action,
    generate_flashcards
)
from app.utils.pdf_processor import extract_text_from_pdf
from app.utils.helpers import extract_json_array
from app.core.config import supabase

router = APIRouter()

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

stored_topics: list[str] = []
stored_text: str = ""

def get_stored_text() -> str:
    global stored_text
    if stored_text:
        return stored_text
    try:
        files = os.listdir(UPLOAD_FOLDER)
        pdfs = [f for f in files if f.endswith('.pdf')]
        if pdfs:
            pdfs.sort(key=lambda x: os.path.getmtime(os.path.join(UPLOAD_FOLDER, x)), reverse=True)
            text = extract_text_from_pdf(os.path.join(UPLOAD_FOLDER, pdfs[0]))
            if text:
                stored_text = text
                return stored_text
    except Exception:
        pass
    return ""

@router.get("/health")
def health():
    return {"status": "ok"}

@router.post("/register")
async def register(data: AuthRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured on server")
    try:
        res = supabase.auth.sign_up({
            "email": data.email,
            "password": data.password,
            "options": {"data": {"full_name": data.name}}
        })
        return {"message": "Registration successful", "user": res.user.id if res.user else None}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
async def login(data: AuthRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured on server")
    try:
        res = supabase.auth.sign_in_with_password({
            "email": data.email,
            "password": data.password
        })
        user_name = res.user.user_metadata.get("full_name") if res.user and res.user.user_metadata else ""
        return {"message": "Login successful", "session": res.session.access_token if res.session else None, "name": user_name}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/upload-pdf/")
async def upload_pdf(file: UploadFile = File(...)):
    try:
        if not file.filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are supported.")

        unique_name = f"{uuid.uuid4()}_{file.filename}"
        path = os.path.join(UPLOAD_FOLDER, unique_name)

        with open(path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        text = extract_text_from_pdf(path)

        if not text or not text.strip():
            raise HTTPException(status_code=422, detail="Could not extract text from PDF.")

        global stored_text, stored_topics
        stored_text = text

        topics_raw = classify_topics(text)
        topics = []
        for line in topics_raw.split("\n"):
            line = re.sub(r"^\s*[\d\-\*\.]+\s*", "", line).strip()
            if line and len(line) > 2:
                topics.append(line)

        stored_topics = topics[:8]

        if supabase:
            try:
                supabase.table("documents").insert({
                    "filename": file.filename,
                    "content": text,
                    "topics": stored_topics
                }).execute()
            except Exception as db_err:
                print("DB Warning (documents):", db_err)

        return {"detected_topics": stored_topics}

    except Exception as e:
        print("UPLOAD ERROR:", str(e))
        raise HTTPException(status_code=500, detail="Upload failed on server.")

@router.post("/quiz/")
async def quiz(data: QuizRequest):
    try:
        raw = generate_quiz(data.topic, data.difficulty)
        questions = extract_json_array(raw)
        valid = [q for q in questions if isinstance(q, dict) and "question" in q and "options" in q and "answer" in q]

        if not valid:
            raise HTTPException(status_code=500, detail="Invalid quiz format.")

        if supabase:
            try:
                supabase.table("quizzes").insert({
                    "topic": data.topic,
                    "difficulty": data.difficulty,
                    "quiz_data": valid
                }).execute()
            except Exception as db_err:
                print("DB Warning (quizzes):", db_err)

        return {"quiz": valid}
    except Exception as e:
        print("QUIZ ERROR:", str(e))
        raise HTTPException(status_code=500, detail="Quiz generation failed.")

@router.post("/ai-tutor/")
async def ai_tutor(data: TutorRequest):
    try:
        context_text = get_stored_text()
        context = f"\n\nContext:\n{context_text[:2000]}" if context_text else ""
        prompt = f"You are a friendly tutor. Explain clearly with examples.\n\n{context}\n\nQuestion: {data.question}"
        answer = generate_response(prompt)
        return {"answer": answer}
    except Exception as e:
        print("TUTOR ERROR:", str(e))
        raise HTTPException(status_code=500, detail="Tutor failed.")

@router.post("/explain-topic/")
async def explain_topic(data: TopicRequest):
    try:
        context_text = get_stored_text()
        context = f"\n\nContext:\n{context_text[:2000]}" if context_text else ""
        prompt = f"Explain {data.topic} simply with bullets, example, and summary.\n{context}"
        explanation = generate_response(prompt)
        return {"explanation": explanation}
    except Exception as e:
        print("EXPLAIN ERROR:", str(e))
        raise HTTPException(status_code=500, detail="Explanation failed.")

@router.post("/feynman-evaluate/")
async def feynman_evaluate(data: FeynmanRequest):
    try:
        context_text = get_stored_text()
        feedback = evaluate_explanation(data.topic, data.explanation, context_text or "")
        return {"feedback": feedback}
    except Exception as e:
        print("FEYNMAN ERROR:", str(e))
        raise HTTPException(status_code=500, detail="Feynman evaluation failed.")

@router.post("/generate-mindmap/")
async def generate_mindmap_endpoint():
    try:
        context_text = get_stored_text()
        if not context_text:
            raise HTTPException(status_code=400, detail="No document uploaded yet.")
        mindmap_raw = generate_mindmap(context_text)
        mindmap_cleaned = mindmap_raw.replace("```mermaid", "").replace("```", "").strip()
        return {"mindmap": mindmap_cleaned}
    except HTTPException:
        raise
    except Exception as e:
        print("MINDMAP ERROR:", str(e))
        raise HTTPException(status_code=500, detail="Mind map generation failed.")

@router.post("/debate-start/")
async def debate_start(data: DebateStartRequest):
    try:
        context_text = get_stored_text()
        stance = generate_debate_stance(data.topic, context_text or "")
        return {"stance": stance}
    except Exception as e:
        print("DEBATE START ERROR:", str(e))
        raise HTTPException(status_code=500, detail="Debate start failed.")

@router.post("/debate-rebuttal/")
async def debate_rebuttal(data: DebateRebuttalRequest):
    try:
        context_text = get_stored_text()
        feedback = evaluate_debate_rebuttal(data.topic, data.rebuttal, context_text or "")
        return {"feedback": feedback}
    except Exception as e:
        print("DEBATE REBUTTAL ERROR:", str(e))
        raise HTTPException(status_code=500, detail="Debate rebuttal failed.")

@router.post("/scenario-start/")
async def scenario_start(data: ScenarioStartRequest):
    try:
        context_text = get_stored_text()
        scenario = generate_scenario(data.topic, context_text or "")
        return {"scenario": scenario}
    except Exception as e:
        print("SCENARIO START ERROR:", str(e))
        raise HTTPException(status_code=500, detail="Scenario start failed.")

@router.post("/scenario-action/")
async def scenario_action(data: ScenarioActionRequest):
    try:
        context_text = get_stored_text()
        feedback = evaluate_scenario_action(data.topic, data.action, context_text or "")
        return {"feedback": feedback}
    except Exception as e:
        print("SCENARIO ACTION ERROR:", str(e))
        raise HTTPException(status_code=500, detail="Scenario action failed.")

@router.post("/flashcards/")
async def flashcards(data: FlashcardRequest):
    try:
        context_text = get_stored_text()
        raw = generate_flashcards(data.topic, context_text or "")
        cards = extract_json_array(raw)
        valid = [c for c in cards if isinstance(c, dict) and "front" in c and "back" in c]
        if not valid:
            raise HTTPException(status_code=500, detail="Invalid flashcard format.")
        return {"flashcards": valid}
    except Exception as e:
        print("FLASHCARDS ERROR:", str(e))
        raise HTTPException(status_code=500, detail="Flashcards generation failed.")
