from pydantic import BaseModel

class AuthRequest(BaseModel):
    email: str
    password: str
    name: str = ""

class QuizRequest(BaseModel):
    topic: str
    difficulty: str = "easy"

class TutorRequest(BaseModel):
    question: str

class TopicRequest(BaseModel):
    topic: str

class FeynmanRequest(BaseModel):
    topic: str
    explanation: str

class DebateStartRequest(BaseModel):
    topic: str

class DebateRebuttalRequest(BaseModel):
    topic: str
    rebuttal: str

class ScenarioStartRequest(BaseModel):
    topic: str

class ScenarioActionRequest(BaseModel):
    topic: str
    action: str

class FlashcardRequest(BaseModel):
    topic: str
