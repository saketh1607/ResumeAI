import json

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.models.schemas import ResumeResponse
from app.services.resume_service import resume_service

router = APIRouter(prefix="/resume", tags=["Resume"])


@router.post("/upload", response_model=ResumeResponse)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        resume = await resume_service.create_resume(db, current_user, file)
        parsed = resume_service.parsed_dict(resume)
        return ResumeResponse(
            id=resume.id,
            filename=resume.filename,
            parsed_data=parsed,
            created_at=resume.created_at,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/list")
async def list_resumes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select
    from app.models import Resume

    result = await db.execute(
        select(Resume).where(Resume.user_id == current_user.id).order_by(Resume.created_at.desc())
    )
    resumes = result.scalars().all()
    return [
        {
            "id": r.id,
            "filename": r.filename,
            "created_at": r.created_at,
            "parsed_data": resume_service.parsed_dict(r),
        }
        for r in resumes
    ]


@router.get("/{resume_id}")
async def get_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    resume = await resume_service.get_user_resume(db, current_user.id, resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return {
        "id": resume.id,
        "filename": resume.filename,
        "parsed_data": json.loads(resume.parsed_json or "{}"),
        "created_at": resume.created_at,
    }
