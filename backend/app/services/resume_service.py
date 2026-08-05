import json
import uuid
from pathlib import Path

import aiofiles
from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models import JobDescription, Resume
from app.models.user import User
from app.rag.vectorstore import vectorstore_manager
from app.services.parser_service import resume_parser

settings = get_settings()


class ResumeService:
    async def save_upload(self, file: UploadFile, user_id: int) -> tuple[str, str]:
        ext = Path(file.filename or "resume.pdf").suffix.lower()
        if ext != ".pdf":
            raise ValueError("Only PDF files are supported")

        user_dir = settings.upload_path / str(user_id)
        user_dir.mkdir(parents=True, exist_ok=True)
        safe_name = f"{uuid.uuid4().hex}{ext}"
        file_path = user_dir / safe_name

        async with aiofiles.open(file_path, "wb") as out:
            content = await file.read()
            await out.write(content)

        return str(file_path), file.filename or safe_name

    async def create_resume(
        self, db: AsyncSession, user: User, file: UploadFile
    ) -> Resume:
        file_path, filename = await self.save_upload(file, user.id)
        raw_text = resume_parser.extract_text_from_pdf(file_path)
        if not raw_text:
            raise ValueError("Could not extract text from PDF")

        parsed = resume_parser.parse_resume(raw_text)

        resume = Resume(
            user_id=user.id,
            filename=filename,
            file_path=file_path,
            raw_text=raw_text,
            parsed_json=resume_parser.to_json(parsed),
            vector_index_path=None,
        )
        db.add(resume)
        await db.flush()
        await db.refresh(resume)

        if settings.supabase_configured:
            try:
                resume.vector_index_path = vectorstore_manager.index_document(
                    raw_text,
                    user_id=user.id,
                    doc_type="resume",
                    doc_id=resume.id,
                )
            except Exception as exc:
                from loguru import logger

                logger.warning(f"Supabase indexing skipped for resume: {exc}")

        return resume

    async def get_user_resume(self, db: AsyncSession, user_id: int, resume_id: int) -> Resume | None:
        result = await db.execute(
            select(Resume).where(Resume.id == resume_id, Resume.user_id == user_id)
        )
        return result.scalar_one_or_none()

    def parsed_dict(self, resume: Resume) -> dict:
        try:
            return json.loads(resume.parsed_json or "{}")
        except json.JSONDecodeError:
            return {}


class JobDescriptionService:
    async def _index_jd(self, user: User, jd: JobDescription, text: str) -> None:
        if not settings.supabase_configured:
            return
        try:
            jd.vector_index_path = vectorstore_manager.index_document(
                text,
                user_id=user.id,
                doc_type="jd",
                doc_id=jd.id,
            )
        except Exception as exc:
            from loguru import logger

            logger.warning(f"Supabase indexing skipped for JD: {exc}")

    async def create_from_text(
        self, db: AsyncSession, user: User, title: str, text: str
    ) -> JobDescription:
        jd = JobDescription(
            user_id=user.id,
            title=title,
            source_type="text",
            raw_text=text,
            vector_index_path=None,
        )
        db.add(jd)
        await db.flush()
        await db.refresh(jd)
        await self._index_jd(user, jd, text)
        return jd

    async def create_from_pdf(
        self, db: AsyncSession, user: User, file: UploadFile, title: str
    ) -> JobDescription:
        user_dir = settings.upload_path / str(user.id) / "jd"
        user_dir.mkdir(parents=True, exist_ok=True)
        ext = Path(file.filename or "jd.pdf").suffix.lower()
        safe_name = f"{uuid.uuid4().hex}{ext}"
        file_path = user_dir / safe_name

        async with aiofiles.open(file_path, "wb") as out:
            await out.write(await file.read())

        text = resume_parser.extract_text_from_pdf(file_path)
        if not text:
            raise ValueError("Could not extract text from JD PDF")

        jd = JobDescription(
            user_id=user.id,
            title=title or (file.filename or "Job Description"),
            source_type="pdf",
            filename=file.filename,
            file_path=str(file_path),
            raw_text=text,
            vector_index_path=None,
        )
        db.add(jd)
        await db.flush()
        await db.refresh(jd)
        await self._index_jd(user, jd, text)
        return jd

    async def get_user_jd(self, db: AsyncSession, user_id: int, jd_id: int) -> JobDescription | None:
        result = await db.execute(
            select(JobDescription).where(
                JobDescription.id == jd_id, JobDescription.user_id == user_id
            )
        )
        return result.scalar_one_or_none()


resume_service = ResumeService()
jd_service = JobDescriptionService()
