from groq import Groq
from app.core.config import GROQ_API_KEY

client = Groq(api_key=GROQ_API_KEY)


def generate_response(prompt: str, model: str = "llama-3.3-70b-versatile") -> str:
    """Send a prompt to Groq and return the response text."""
    try:
        res = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=model,
            temperature=0.7,
        )
        content = res.choices[0].message.content
        return content if content is not None else "Error calling AI: Received empty response from model."
    except Exception as e:
        return f"Error calling AI: {str(e)}"


def classify_topics(text: str) -> str:
    """Extract 5–8 key study topics from document text."""
    prompt = (
        "You are a curriculum assistant. From the following text, extract exactly 6 distinct, "
        "concise study topics (2–6 words each). Output only the topic names, one per line, "
        "with no numbering, bullets, or extra commentary.\n\n"
        f"Text:\n{text[:3000]}"
    )
    return generate_response(prompt)


def generate_quiz(topic: str, difficulty: str = "easy") -> str:
    """Generate 5 MCQ questions for a topic at the given difficulty level."""

    difficulty_guide = {
        "easy": "basic recall and definitions, suitable for beginners",
        "medium": "conceptual understanding and application",
        "hard": "analysis, edge cases, and advanced application",
    }.get(difficulty, "basic recall")

    prompt = f"""
You are an expert quiz generator. Create exactly 5 multiple-choice questions on the topic: "{topic}".
Difficulty level: {difficulty} — focus on {difficulty_guide}.

Requirements:
- Each question must have exactly 4 options labeled as full answer strings (not "A", "B", etc.)
- The "answer" field must be the EXACT TEXT of the correct option (matching one of the options strings exactly)
- Questions should be clear, unambiguous, and educational
- Vary the question types (definition, example, application)

Return ONLY a valid JSON array — no explanation, no markdown, no extra text:
[
  {{
    "question": "Question text here?",
    "options": ["Option one", "Option two", "Option three", "Option four"],
    "answer": "Option one"
  }}
]
"""
    return generate_response(prompt)


def evaluate_explanation(topic: str, explanation: str, context: str = "") -> str:
    """Evaluate a user's explanation of a topic using the Feynman technique."""
    prompt = f"""
You are an expert tutor evaluating a student's explanation using the Feynman Technique.
The student is trying to explain the topic: "{topic}".

Student's Explanation:
"{explanation}"

Context from course material:
{context[:3000]}

Evaluate the explanation based on the following:
1. Is it factually correct according to the context?
2. Is it simple and easy to understand (like explaining to a 5-year-old)?
3. What critical information from the context is missing?

Provide constructive feedback. Highlight what they got right, point out any misconceptions, and gently ask a follow-up question to test the missing knowledge. Keep it encouraging and concise.
"""
    return generate_response(prompt)


def generate_mindmap(text: str) -> str:
    """Generate a Mermaid.js graph based on the document text."""
    prompt = f"""
Analyze the following text and extract the key concepts and their relationships.
Create a Mermaid.js flowchart (graph TD) that visually represents these concepts as a mind map.

Rules:
- Output ONLY valid Mermaid code starting with `graph TD`.
- Do not use markdown code blocks (e.g. ```mermaid).
- Do not include any HTML, explanations, or extra text.
- Use simple, short node names.
- Connect related concepts logically.
- Keep the graph concise but comprehensive (max 15-20 nodes).

Text:
{text[:4000]}
"""
    return generate_response(prompt)


def generate_debate_stance(topic: str, context: str = "") -> str:
    """Generate a plausible but incorrect stance on a topic to challenge the user."""
    prompt = f"""
You are acting as an AI Debater who is intentionally taking a flawed, provocative, or slightly incorrect stance on the topic: "{topic}".
Your goal is to challenge the user. Make an argument that sounds confident and plausible, but contains a fundamental misunderstanding or error based on the concepts in the provided context.

Context from course material:
{context[:3000]}

Rules:
1. Speak directly to the user in a challenging but friendly tone (e.g., "I actually don't think [topic] is that important because...").
2. Your argument MUST be noticeably flawed or incomplete according to the context provided.
3. Keep it to 2-3 short paragraphs max.
"""
    return generate_response(prompt)


def evaluate_debate_rebuttal(topic: str, user_rebuttal: str, context: str = "") -> str:
    """Evaluate if the user successfully countered the AI's flawed argument."""
    prompt = f"""
You previously took a flawed stance on the topic: "{topic}".
The user has provided a rebuttal to correct you.

User's Rebuttal:
"{user_rebuttal}"

Context from course material:
{context[:3000]}

If the user's rebuttal correctly identifies your flaw and uses facts from the context, concede defeat gracefully, praise their understanding, and declare them the winner!
If their rebuttal is weak, incorrect, or misses the point, push back slightly, explain what they missed, and let them know they haven't won the debate yet.

Output your response as if you are the AI Debater reacting to them. Format using markdown.
"""
    return generate_response(prompt)


def generate_scenario(topic: str, context: str = "") -> str:
    """Generate a real-world roleplay scenario testing the user's practical understanding of the topic."""
    prompt = f"""
You are creating an interactive, real-world educational roleplay. The student is learning about: "{topic}".
Place the student in an interesting, high-stakes real-world scenario (e.g., an ER doctor, a spaceship engineer, a political advisor, a wildlife biologist) where they MUST apply concepts from the text to succeed.

Context from course material:
{context[:3000]}

Rules:
1. Describe the scenario vividly in 2-3 short paragraphs.
2. End with a specific, urgent question or dilemma requiring them to make a decision based on the course material.
3. Keep the tone immersive and urgent! Speak directly to the student ("You are...", "Your team needs...").
"""
    return generate_response(prompt)


def evaluate_scenario_action(topic: str, user_action: str, context: str = "") -> str:
    """Evaluate if the user's action in the scenario successfully applies the course material."""
    prompt = f"""
The student is in a real-world roleplay scenario about: "{topic}".
They were presented with a dilemma.

Student's chosen action:
"{user_action}"

Context from course material:
{context[:3000]}

Evaluate their action based on the context:
1. Did they correctly apply the concepts from the material to solve the problem?
2. If yes, describe the successful outcome of their action in the narrative.
3. If no, describe the negative consequences of their action, and hint at the correct concept they missed.
4. Keep your response in-character as the narrator of the scenario.
"""
    return generate_response(prompt)


def generate_study_schedule(subject: str, topics: str, exam_date: str) -> dict:
    """Generate a comprehensive study schedule for exam preparation using LLM."""
    prompt = f"""
You are an expert study planner. Create a detailed week-by-week study schedule for a student preparing for an exam.

Subject: {subject}
Topics to cover: {topics}
Exam Date: {exam_date}

Generate a JSON schedule with the following structure:
- Divide the time between today and exam date into study weeks
- For each week, list 3-4 key topics to focus on
- Suggest study duration per day (e.g., 2-3 hours)
- Include revision days near the exam
- Format: {{"weeks": [{{"week_number": 1, "start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD", "topics": ["topic1", "topic2"], "daily_hours": 2, "activities": ["reading", "quiz", "practice"]}}, ...]}}

Return ONLY valid JSON, no explanation or markdown.
"""
    response = generate_response(prompt)
    
    # Try to parse JSON response
    import json
    import re
    try:
        # Clean response
        cleaned = re.sub(r"```(?:json)?", "", response).replace("```", "").strip()
        schedule = json.loads(cleaned)
        return schedule
    except:
        # Fallback: return simple schedule structure
        from datetime import datetime, timedelta
        today = datetime.now()
        exam = datetime.strptime(exam_date, "%Y-%m-%d")
        days_left = (exam - today).days
        
        return {
            "weeks": [
                {
                    "week_number": 1,
                    "start_date": today.strftime("%Y-%m-%d"),
                    "end_date": (today + timedelta(days=7)).strftime("%Y-%m-%d"),
                    "topics": topics.split(",")[:3],
                    "daily_hours": 2,
                    "activities": ["reading", "notes", "summary"]
                }
            ],
            "total_days": days_left,
            "recommendation": f"You have {days_left} days to prepare. Study 2-3 hours daily for optimal retention."
        }
def generate_flashcards(topic: str, context: str = "") -> str:
    """Generate 10–12 active recall flashcards (Q&A pairs) for a topic."""
    prompt = f"""
You are an expert at creating active-recall flashcards for students.
Create exactly 10 high-quality flashcards based on the topic: "{topic}".

Context from course material:
{context[:4000]}

Requirements:
1. Each card must have a "front" (Question/Term) and a "back" (Answer/Definition).
2. The front should be a clear, concise question or a term.
3. The back should be the specific answer or definition based on the provided context.
4. Focus on 'Atomic' concepts (one clear fact per card).
5. Mix question types: definitions, "What happens if...", and comparisons.

Return ONLY a valid JSON array of objects — no explanation, no markdown, no extra text:
[
  {{
    "front": "What is [Concept]?",
    "back": "It is [Definition from context]."
  }}
]
"""
    return generate_response(prompt)
