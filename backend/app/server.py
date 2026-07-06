from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles
import shutil, os, json, re, uuid
from pydantic import BaseModel
from app.config import supabase

from app.ai_engine import (
    generate_response,
    classify_topics,
    generate_quiz,
    evaluate_explanation,
    generate_mindmap,
    generate_debate_stance,
    evaluate_debate_rebuttal,
    generate_scenario,
    evaluate_scenario_action,
    generate_study_schedule
)
from app.pdf_processor import extract_text_from_pdf
from app.config import supabase
from datetime import datetime, timedelta

app = FastAPI(title="StudyMate API", version="2.1")

app.mount("/static", StaticFiles(directory="../frontend", html=True), name="static")
# ✅ CORS (IMPORTANT FOR MOBILE + RENDER)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

stored_topics: list[str] = []
stored_text: str = ""


# ───────── HEALTH CHECK ─────────
@app.get("/health")
def health():
    return {"status": "ok"}


# ───────── HELPERS ─────────
def extract_json_array(raw: str) -> list:
    if not raw:
        return []

    try:
        parsed = json.loads(raw.strip())
        if isinstance(parsed, list):
            return parsed
    except:
        pass

    cleaned = re.sub(r"```(?:json)?", "", raw).replace("```", "").strip()

    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, list):
            return parsed
    except:
        pass

    match = re.search(r"\[.*\]", cleaned, re.DOTALL)
    if match:
        try:
            parsed = json.loads(match.group())
            if isinstance(parsed, list):
                return parsed
        except:
            pass

    return []


# ───────── ROUTES ─────────

@app.get("/", response_class=HTMLResponse)
async def home():
    index_path = "../frontend/index.html"
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            return f.read()
    return HTMLResponse("<h2>StudyMate API is running.</h2>")


def get_stored_text() -> str:
    global stored_text
    if stored_text:
        return stored_text
    # Fallback to recover from the latest uploaded file in the uploads directory
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


# ───────── AUTHENTICATION (SUPABASE VIA RENDER API) ─────────
class AuthRequest(BaseModel):
    email: str
    password: str
    name: str = ""

@app.post("/register")
async def register(data: AuthRequest):
    try:
        print("REGISTER REQUEST:", data)

        res = supabase.auth.sign_up({
            "email": data.email,
            "password": data.password,
            "options": {"data": {"full_name": data.name}}
        })

        print("REGISTER RESPONSE:", res)

        return {"message": "Registration successful"}

    except Exception as e:
        print("REGISTER ERROR:", repr(e))
        print("ERROR TYPE:", type(e))
        import traceback
        traceback.print_exc()

        raise HTTPException(status_code=400, detail=str(e))

@app.post("/login")
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
@app.get("/test-reset")
async def test_reset():
    try:
        res = supabase.auth.reset_password_for_email(
            "vasanthakumar.saravanan.01@gmail.com"
        )
        return {"success": True}
    except Exception as e:
        return {"error": str(e)}

@app.get("/check-client")
async def check_client():
    return {
        "type": str(type(supabase))
    }
@app.get("/check-config")
async def check_config():
    return {
        "url": SUPABASE_URL,
        "key_start": SUPABASE_KEY[:20]
    }
class ForgotPasswordRequest(BaseModel):
    email: str
@app.get("/check-methods")
async def check_methods():
    return {
        "methods": dir(supabase.auth)
    }
@app.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):

    print("EMAIL RECEIVED:", repr(data.email))

    try:
        res = supabase.auth.reset_password_for_email(
            data.email.strip()
        )

        return {
            "success": True
        }

    except Exception as e:
        print("ERROR:", repr(e))
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
# 🔥 FIXED UPLOAD (IMPORTANT)
@app.post("/upload-pdf/")
async def upload_pdf(file: UploadFile = File(...)):
    try:
        if not file.filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are supported.")

        # ✅ Unique filename (prevents overwrite issues)
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

        # Save to Supabase DB if configured
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


# ───────── QUIZ ─────────
class QuizRequest(BaseModel):
    topic: str
    difficulty: str = "easy"


@app.post("/quiz/")
async def quiz(data: QuizRequest):
    try:
        raw = generate_quiz(data.topic, data.difficulty)
        questions = extract_json_array(raw)

        valid = []
        for q in questions:
            if isinstance(q, dict) and "question" in q and "options" in q and "answer" in q:
                if isinstance(q["options"], list) and len(q["options"]) >= 2:
                    valid.append(q)

        if not valid:
            raise HTTPException(status_code=500, detail="Invalid quiz format.")

        # Save to Supabase DB if configured
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


# ───────── AI TUTOR ─────────
class TutorRequest(BaseModel):
    question: str


@app.post("/ai-tutor/")
async def ai_tutor(data: TutorRequest):
    try:
        if not data.question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty.")

        context_text = get_stored_text()
        context = f"\n\nContext:\n{context_text[:2000]}" if context_text else ""

        prompt = (
            f"You are a friendly tutor. Explain clearly with examples.\n\n"
            f"{context}\n\nQuestion: {data.question}"
        )

        answer = generate_response(prompt)

        return {"answer": answer}

    except Exception as e:
        print("TUTOR ERROR:", str(e))
        raise HTTPException(status_code=500, detail="Tutor failed.")


# ───────── EXPLAIN TOPIC ─────────
class TopicRequest(BaseModel):
    topic: str


@app.post("/explain-topic/")
async def explain_topic(data: TopicRequest):
    try:
        context_text = get_stored_text()
        context = f"\n\nContext:\n{context_text[:2000]}" if context_text else ""

        prompt = (
            f"Explain {data.topic} simply with bullets, example, and summary.\n"
            f"{context}"
        )

        explanation = generate_response(prompt)

        return {"explanation": explanation}

    except Exception as e:
        print("EXPLAIN ERROR:", str(e))
        raise HTTPException(status_code=500, detail="Explanation failed.")

# ───────── FEYNMAN TECHNIQUE ─────────
class FeynmanRequest(BaseModel):
    topic: str
    explanation: str

@app.post("/feynman-evaluate/")
async def feynman_evaluate(data: FeynmanRequest):
    try:
        if not data.topic.strip() or not data.explanation.strip():
            raise HTTPException(status_code=400, detail="Topic and explanation cannot be empty.")

        context_text = get_stored_text()
        context = context_text if context_text else ""
        feedback = evaluate_explanation(data.topic, data.explanation, context)

        return {"feedback": feedback}

    except Exception as e:
        print("FEYNMAN ERROR:", str(e))
        raise HTTPException(status_code=500, detail="Feynman evaluation failed.")

# ───────── MIND MAP ─────────
@app.post("/generate-mindmap/")
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
        raise HTTPException(status_code=500, detail=f"Mind map generation failed: {str(e)} -- Type: {type(e).__name__}")


# ───────── DEBATE AI ─────────
class DebateStartRequest(BaseModel):
    topic: str

@app.post("/debate-start/")
async def debate_start(data: DebateStartRequest):
    try:
        if not data.topic.strip():
            raise HTTPException(status_code=400, detail="Topic cannot be empty.")

        context_text = get_stored_text()
        context = context_text if context_text else ""
        stance = generate_debate_stance(data.topic, context)

        return {"stance": stance}

    except Exception as e:
        print("DEBATE START ERROR:", str(e))
        raise HTTPException(status_code=500, detail="Debate start failed.")

class DebateRebuttalRequest(BaseModel):
    topic: str
    rebuttal: str

@app.post("/debate-rebuttal/")
async def debate_rebuttal(data: DebateRebuttalRequest):
    try:
        if not data.topic.strip() or not data.rebuttal.strip():
            raise HTTPException(status_code=400, detail="Topic and rebuttal cannot be empty.")

        context_text = get_stored_text()
        context = context_text if context_text else ""
        feedback = evaluate_debate_rebuttal(data.topic, data.rebuttal, context)

        return {"feedback": feedback}

    except Exception as e:
        print("DEBATE REBUTTAL ERROR:", str(e))
        raise HTTPException(status_code=500, detail="Debate rebuttal failed.")

# ───────── SCENARIO SIMULATOR ─────────
class ScenarioStartRequest(BaseModel):
    topic: str

@app.post("/scenario-start/")
async def scenario_start(data: ScenarioStartRequest):
    try:
        if not data.topic.strip():
            raise HTTPException(status_code=400, detail="Topic cannot be empty.")

        context_text = get_stored_text()
        context = context_text if context_text else ""
        scenario = generate_scenario(data.topic, context)

        return {"scenario": scenario}

    except Exception as e:
        print("SCENARIO START ERROR:", str(e))
        raise HTTPException(status_code=500, detail="Scenario start failed.")

class ScenarioActionRequest(BaseModel):
    topic: str
    action: str

@app.post("/scenario-action/")
async def scenario_action(data: ScenarioActionRequest):
    try:
        if not data.topic.strip() or not data.action.strip():
            raise HTTPException(status_code=400, detail="Topic and action cannot be empty.")

        context_text = get_stored_text()
        context = context_text if context_text else ""
        feedback = evaluate_scenario_action(data.topic, data.action, context)

        return {"feedback": feedback}

    except Exception as e:
        print("SCENARIO ACTION ERROR:", str(e))
        raise HTTPException(status_code=500, detail="Scenario action failed.")


# ───────── EXAM PLANNER ─────────
class PlannerRequest(BaseModel):
    exam_name: str
    subject: str
    exam_date: str  # Format: YYYY-MM-DD
    pdf_topics: list[str] = []


@app.post("/planner/create/")
async def create_planner(data: PlannerRequest):
    """Create an exam planner with auto-generated study schedule."""
    try:
        if not data.exam_name or not data.subject or not data.exam_date:
            raise HTTPException(status_code=400, detail="exam_name, subject, and exam_date are required.")
        
        # Parse exam date
        try:
            exam_date_obj = datetime.strptime(data.exam_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="exam_date must be in YYYY-MM-DD format.")
        
        # Generate study schedule using LLM
        topics_str = ", ".join(data.pdf_topics) if data.pdf_topics else data.subject
        schedule = generate_study_schedule(
            subject=data.subject,
            topics=topics_str,
            exam_date=data.exam_date
        )
        
        planner_id = str(uuid.uuid4())
        created_at = datetime.utcnow().isoformat()
        
        # Save to Supabase if configured
        if supabase:
            try:
                supabase.table("exam_planners").insert({
                    "id": planner_id,
                    "exam_name": data.exam_name,
                    "subject": data.subject,
                    "exam_date": data.exam_date,
                    "schedule": schedule,
                    "created_at": created_at
                }).execute()
            except Exception as db_err:
                print("DB Warning (exam_planners):", db_err)
        
        return {
            "planner_id": planner_id,
            "exam_name": data.exam_name,
            "subject": data.subject,
            "exam_date": data.exam_date,
            "schedule": schedule
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print("PLANNER CREATE ERROR:", str(e))
        raise HTTPException(status_code=500, detail="Planner creation failed.")


class PlannerGetRequest(BaseModel):
    planner_id: str


@app.post("/planner/get/")
async def get_planner(data: PlannerGetRequest):
    """Retrieve planner by ID."""
    try:
        if supabase:
            result = supabase.table("exam_planners").select("*").eq("id", data.planner_id).execute()
            if result.data:
                return result.data[0]
            raise HTTPException(status_code=404, detail="Planner not found.")
        raise HTTPException(status_code=500, detail="Database not configured.")
    except HTTPException:
        raise
    except Exception as e:
        print("PLANNER GET ERROR:", str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve planner.")


class SessionUpdateRequest(BaseModel):
    planner_id: str
    session_date: str  # YYYY-MM-DD
    topic: str
    completed: bool


@app.post("/planner/session-update/")
async def update_session(data: SessionUpdateRequest):
    """Mark a study session as completed."""
    try:
        if supabase:
            result = supabase.table("study_sessions").select("*").eq("planner_id", data.planner_id).eq("session_date", data.session_date).eq("topic", data.topic).execute()
            
            if result.data:
                # Update existing session
                supabase.table("study_sessions").update({
                    "completed": data.completed,
                    "completed_at": datetime.utcnow().isoformat() if data.completed else None
                }).eq("planner_id", data.planner_id).eq("session_date", data.session_date).eq("topic", data.topic).execute()
            else:
                # Create new session record
                supabase.table("study_sessions").insert({
                    "id": str(uuid.uuid4()),
                    "planner_id": data.planner_id,
                    "session_date": data.session_date,
                    "topic": data.topic,
                    "completed": data.completed,
                    "completed_at": datetime.utcnow().isoformat() if data.completed else None
                }).execute()
        
        return {"message": "Session updated successfully", "completed": data.completed}
    
    except Exception as e:
        print("SESSION UPDATE ERROR:", str(e))
        raise HTTPException(status_code=500, detail="Failed to update session.")


# ───────── EMAIL NOTIFICATIONS ─────────
class EmailNotificationRequest(BaseModel):
    email: str
    subject: str
    topic: str
    date: str
    exam_name: str


import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def send_email_notification(recipient_email: str, subject: str, topic: str, date: str, exam_name: str):
    """Send email notification when user completes a study task."""
    try:
        # Get Gmail credentials from environment
        sender_email = os.getenv("GMAIL_EMAIL")
        sender_password = os.getenv("GMAIL_PASSWORD")
        
        if not sender_email or not sender_password:
            print("Gmail credentials not configured. Skipping email notification.")
            return {"message": "Email credentials not configured", "status": "skipped"}
        
        # Create email content
        email_body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 8px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #22c55e; margin: 0;">✅ Task Completed!</h1>
              </div>
              
              <div style="background: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                <p style="margin: 0 0 10px 0;">Great job completing your study task!</p>
                
                <div style="background: #f0f9ff; padding: 15px; border-left: 4px solid #38bdf8; margin: 15px 0;">
                  <p style="margin: 5px 0;"><strong>📚 Topic:</strong> {topic}</p>
                  <p style="margin: 5px 0;"><strong>📅 Date:</strong> {date}</p>
                  <p style="margin: 5px 0;"><strong>🎓 Exam:</strong> {exam_name}</p>
                </div>
                
                <p style="margin: 15px 0; color: #666;">
                  Keep up the great work! Consistent study is the key to success. You're on your way to acing your exam! 🚀
                </p>
              </div>
              
              <div style="text-align: center; color: #999; font-size: 12px;">
                <p>StudyMate AI - Your Personal Study Assistant</p>
              </div>
            </div>
          </body>
        </html>
        """
        
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = sender_email
        message["To"] = recipient_email
        
        # Add HTML part
        part = MIMEText(email_body, "html")
        message.attach(part)
        
        # Send email
        server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, recipient_email, message.as_string())
        server.quit()
        
        print(f"Email sent to {recipient_email}")
        return {"message": "Email sent successfully", "status": "sent"}
        
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return {"message": f"Error sending email: {str(e)}", "status": "failed"}


@app.post("/planner/send-notification/")
async def send_notification(data: EmailNotificationRequest):
    """Send email notification for completed study task."""
    try:
        if not data.email:
            raise HTTPException(status_code=400, detail="Email is required")
        
        result = send_email_notification(
            recipient_email=data.email,
            subject=data.subject,
            topic=data.topic,
            date=data.date,
            exam_name=data.exam_name
        )
        
        return result
        
    except Exception as e:
        print("NOTIFICATION ERROR:", str(e))
        raise HTTPException(status_code=500, detail="Failed to send notification.")
    from weasyprint import HTML

@app.post("/planner/download/")
async def download_pdf(data: PlannerRequest):
    html_content = generate_html(data)  # your function

    pdf = HTML(string=html_content).write_pdf()

    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=planner.pdf"
        }
    )