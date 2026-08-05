RAG_QA_TEMPLATE = """You are an expert career coach and ATS resume analyst.
Use ONLY the provided context from the candidate's resume and job description.
If the answer is not in the context, say you need more information — do not invent facts.

Context:
{context}

Conversation history:
{history}

User question: {question}

Provide a clear, actionable answer with bullet points when helpful."""

ATS_ANALYSIS_TEMPLATE = """Analyze this resume for ATS compatibility.
Return JSON with these numeric fields (0-100): ats_score, skills_match, keywords_match,
experience_match, education_match, formatting_score, project_relevance.
Also include arrays: strengths, weaknesses, missing_skills, recommendations.

Resume:
{resume}

Job Description (optional):
{jd}
"""

MATCH_TEMPLATE = """Compare resume against job description.
Return JSON: match_percentage (0-100), matching_skills (array), missing_technologies (array),
recommended_improvements (array), summary (string).

Resume:
{resume}

Job Description:
{jd}
"""

INTERVIEW_TEMPLATE = """Generate interview questions based on resume and JD.
Return JSON with arrays: hr_questions, technical_questions, resume_based_questions, project_based_questions.
Generate {count} questions per category.

Resume:
{resume}

Job Description:
{jd}
"""

SUGGESTIONS_TEMPLATE = """Provide resume improvement suggestions and career recommendations.
Return JSON: improvements (array), career_recommendations (array), skills_to_learn (array).

Resume:
{resume}

Job Description:
{jd}
"""
