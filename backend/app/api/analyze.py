import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Analysis, User
from app.models.schemas import AnalyzeRequest, ATSScoreResponse, MatchResponse
from app.rag.chains import rag_chain_service
from app.services.ats_service import ats_service
from app.services.match_service import match_service
from app.services.resume_service import jd_service, resume_service

router = APIRouter(prefix="/analyze", tags=["Analysis"])


async def _get_resume_jd(db, user_id, resume_id, jd_id):
    resume = await resume_service.get_user_resume(db, user_id, resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    jd = None
    if jd_id:
        jd = await jd_service.get_user_jd(db, user_id, jd_id)
        if not jd:
            raise HTTPException(status_code=404, detail="Job description not found")
    return resume, jd


@router.post("/ats-score", response_model=ATSScoreResponse)
async def ats_score(
    data: AnalyzeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    resume, jd = await _get_resume_jd(db, current_user.id, data.resume_id, data.jd_id)
    parsed = resume_service.parsed_dict(resume)
    jd_text = jd.raw_text if jd else ""
    result = ats_service.compute_score(resume.raw_text, jd_text, parsed)

    analysis = Analysis(
        user_id=current_user.id,
        resume_id=resume.id,
        jd_id=jd.id if jd else None,
        analysis_type="ats",
        result_json=ats_service.to_json(result),
    )
    db.add(analysis)
    return result


@router.post("/match", response_model=MatchResponse)
async def match_resume(
    data: AnalyzeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not data.jd_id:
        raise HTTPException(status_code=400, detail="Job description ID is required for matching")
    resume, jd = await _get_resume_jd(db, current_user.id, data.resume_id, data.jd_id)
    result = match_service.compare(resume.raw_text, jd.raw_text)

    analysis = Analysis(
        user_id=current_user.id,
        resume_id=resume.id,
        jd_id=jd.id,
        analysis_type="match",
        result_json=match_service.to_json(result),
    )
    db.add(analysis)
    return result


@router.post("/suggestions")
async def get_suggestions(
    data: AnalyzeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    resume, jd = await _get_resume_jd(db, current_user.id, data.resume_id, data.jd_id)
    jd_text = jd.raw_text if jd else ""
    suggestions = rag_chain_service.get_suggestions(resume.raw_text, jd_text)
    return suggestions
