# StudyMate 📚🤖

StudyMate is an AI-powered study companion designed to make learning smarter, faster, and more interactive. Simply upload any PDF, and the application uses advanced language models to generate tailored quizzes, personalized explanations, and track your weak areas over time.

## 🚀 Features

StudyMate goes beyond traditional learning by incorporating highly interactive, scientifically proven learning methods:

### 🎓 **Feynman Technique Simulator (Teach the AI)**
Instead of the AI lecturing you, **you teach the AI**. 
- Enter a topic and explain it in your own words.
- The AI adopts the persona of a beginner student and evaluates your explanation against the context of your uploaded course material.
- It highlights what you got right, points out any misconceptions, and asks targeted questions to test gaps in your knowledge. 

### 🧠 **Interactive Concept Mind Maps**
For visual learners, reading endless text can be tiring.
- With one click, StudyMate extracts the core concepts from your document and automatically generates a beautiful, interactive **visual flowchart** natively in your browser using Mermaid.js.
- Perfect for understanding how different concepts connect.

### 🔊 **Text-to-Speech Accessibility**
- Read along with auditory learning! Sleek **🔊 Read** buttons are integrated throughout the application.
- Listen to topic explanations, AI tutor answers, and quiz questions out loud to improve retention.

### 📝 **AI Quiz Generation & Dashboard**
- Intelligent extraction of 5-8 distinct study topics from your document.
- Multiple-choice quizzes dynamically generated at varying difficulties (Easy, Medium, Hard).
- A detailed **Dashboard** tracking your average scores, areas of weakness, and generating a personalized revision plan.

## ⚙️ How to Run Locally

### 1. Backend Setup (FastAPI & AI/Database layer)
```bash
cd backend
pip install -r requirements.txt
```
Copy `.env.example` to `.env` and fill in your keys:
- **Groq API Key**: For AI quiz and explanation generation.
- **Supabase URL & Key**: For storing processed documents and quizzes. 

Start the Python backend server:
```bash
uvicorn app.server:app --reload
```
*The API will be available at `http://localhost:8000`.*

### 2. Frontend Setup (Vanilla HTML/JS)
```bash
cd frontend
# No installation needed! Just launch a local server:
npx serve .
# Or open index.html directly.
```
*Make sure you configure `const API = "http://localhost:8000"` inside `index.html` to connect locally, or point it to your deployed Render URL.*

## 🚀 Deployment
This project is configured as a decoupled monorepo, ideal for free-tier deployments:
- **Frontend**: Deploy the `frontend/` folder directly to **Vercel** (with `vercel.json` included for clean URLs!).
- **Backend**: Deploy the `backend/` folder to **Render**, establishing `uvicorn app.server:app --host 0.0.0.0 --port $PORT` as the Start Command.

## 🛠️ Built With
- **Frontend**: Vanilla HTML5, CSS3, JavaScript, Mermaid.js
- **Backend**: Python, FastAPI
- **AI Processing**: Groq LLM API (`llama-3.3-70b-versatile`)
- **Database & Auth**: Supabase PostgreSQL + Auth JS SDK

## 👥 Co-Authors
- Automated workflow tests and integrations are co-authored with GitHub Actions Bot.