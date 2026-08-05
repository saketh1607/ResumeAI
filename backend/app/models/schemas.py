from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr, Field


# Auth
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=2)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    created_at: datetime

    class Config:
        from_attributes = True


# Resume & JD
class ResumeResponse(BaseModel):
    id: int
    filename: str
    parsed_data: dict[str, Any]
    created_at: datetime


class JobDescriptionCreate(BaseModel):
    title: str = "Job Description"
    text: str = Field(min_length=10)


class JobDescriptionResponse(BaseModel):
    id: int
    title: str
    source_type: str
    created_at: datetime


# Analysis
class AnalyzeRequest(BaseModel):
    resume_id: int
    jd_id: int | None = None


class ATSScoreResponse(BaseModel):
    ats_score: float
    skills_match: float
    keywords_match: float
    experience_match: float
    education_match: float
    formatting_score: float
    project_relevance: float
    strengths: list[str]
    weaknesses: list[str]
    missing_skills: list[str]
    recommendations: list[str]


class MatchResponse(BaseModel):
    match_percentage: float
    matching_skills: list[str]
    missing_technologies: list[str]
    recommended_improvements: list[str]
    summary: str


# Chat
class ChatQuery(BaseModel):
    resume_id: int
    jd_id: int | None = None
    question: str = Field(min_length=3)
    session_id: int | None = None


class ChatResponse(BaseModel):
    answer: str
    session_id: int
    sources: list[str] = []


# Interview
class InterviewRequest(BaseModel):
    resume_id: int
    jd_id: int | None = None
    count_per_category: int = Field(default=5, ge=1, le=15)


class InterviewQuestionsResponse(BaseModel):
    hr_questions: list[str]
    technical_questions: list[str]
    resume_based_questions: list[str]
    project_based_questions: list[str]


# Dashboard
class DashboardStats(BaseModel):
    total_resumes: int
    total_jds: int
    total_analyses: int
    latest_ats_score: float | None
    latest_match_score: float | None
    top_skills: list[str]
    missing_skills: list[str]
    recent_suggestions: list[str]
    ats_history: list[dict[str, Any]]
