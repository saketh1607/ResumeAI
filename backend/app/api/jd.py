from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import JobDescription, User
from app.models.schemas import JobDescriptionCreate, JobDescriptionResponse
from app.services.resume_service import jd_service

router = APIRouter(prefix="/jd", tags=["Job Description"])


@router.post("/upload")
async def upload_jd(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    title: str = Form("Job Description"),
    text: str | None = Form(None),
    file: UploadFile | None = File(None),
):
    try:
        if file and file.filename:
            jd = await jd_service.create_from_pdf(db, current_user, file, title)
        elif text and len(text.strip()) >= 10:
            jd = await jd_service.create_from_text(db, current_user, title, text.strip())
        else:
            raise HTTPException(
                status_code=400,
                detail="Provide job description text or upload a PDF",
            )
        return JobDescriptionResponse(
            id=jd.id, title=jd.title, source_type=jd.source_type, created_at=jd.created_at
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/text", response_model=JobDescriptionResponse)
async def create_jd_text(
    data: JobDescriptionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    jd = await jd_service.create_from_text(db, current_user, data.title, data.text)
    return JobDescriptionResponse(
        id=jd.id, title=jd.title, source_type=jd.source_type, created_at=jd.created_at
    )


@router.get("/list")
async def list_jds(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(JobDescription)
        .where(JobDescription.user_id == current_user.id)
        .order_by(JobDescription.created_at.desc())
    )
    return [
        {
            "id": j.id,
            "title": j.title,
            "source_type": j.source_type,
            "created_at": j.created_at,
        }
        for j in result.scalars().all()
    ]
