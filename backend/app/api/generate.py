from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.models.schemas import InterviewQuestionsResponse, InterviewRequest
from app.rag.chains import rag_chain_service
from app.services.resume_service import jd_service, resume_service

router = APIRouter(prefix="/generate", tags=["Generation"])


@router.post("/interview-questions", response_model=InterviewQuestionsResponse)
async def interview_questions(
    data: InterviewRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    resume = await resume_service.get_user_resume(db, current_user.id, data.resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    jd_text = ""
    if data.jd_id:
        jd = await jd_service.get_user_jd(db, current_user.id, data.jd_id)
        if jd:
            jd_text = jd.raw_text

    result = rag_chain_service.generate_interview_questions(
        resume.raw_text, jd_text, data.count_per_category
    )

    return InterviewQuestionsResponse(
        hr_questions=result.get("hr_questions", [])[: data.count_per_category],
        technical_questions=result.get("technical_questions", [])[: data.count_per_category],
        resume_based_questions=result.get("resume_based_questions", [])[: data.count_per_category],
        project_based_questions=result.get("project_based_questions", [])[: data.count_per_category],
    )
