import json
from typing import Any

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Analysis, JobDescription, Resume
from app.models.schemas import DashboardStats


class DashboardService:
    async def get_stats(self, db: AsyncSession, user_id: int) -> DashboardStats:
        resume_count = await db.scalar(
            select(func.count()).select_from(Resume).where(Resume.user_id == user_id)
        )
        jd_count = await db.scalar(
            select(func.count()).select_from(JobDescription).where(JobDescription.user_id == user_id)
        )
        analysis_count = await db.scalar(
            select(func.count()).select_from(Analysis).where(Analysis.user_id == user_id)
        )

        analyses = await db.execute(
            select(Analysis)
            .where(Analysis.user_id == user_id)
            .order_by(desc(Analysis.created_at))
            .limit(20)
        )
        analysis_rows = analyses.scalars().all()

        latest_ats = None
        latest_match = None
        ats_history: list[dict[str, Any]] = []
        missing_skills: list[str] = []
        recent_suggestions: list[str] = []
        top_skills: list[str] = []

        for row in analysis_rows:
            try:
                data = json.loads(row.result_json)
            except json.JSONDecodeError:
                continue

            if row.analysis_type == "ats" and latest_ats is None:
                latest_ats = data.get("ats_score")
            if row.analysis_type == "match" and latest_match is None:
                latest_match = data.get("match_percentage")

            if row.analysis_type == "ats":
                ats_history.append(
                    {
                        "date": row.created_at.isoformat(),
                        "score": data.get("ats_score", 0),
                    }
                )
                missing_skills.extend(data.get("missing_skills", [])[:5])
                recent_suggestions.extend(data.get("recommendations", [])[:3])

        resumes = await db.execute(
            select(Resume).where(Resume.user_id == user_id).order_by(desc(Resume.created_at)).limit(3)
        )
        for resume in resumes.scalars():
            try:
                parsed = json.loads(resume.parsed_json)
                top_skills.extend(parsed.get("skills", [])[:10])
            except json.JSONDecodeError:
                pass

        return DashboardStats(
            total_resumes=resume_count or 0,
            total_jds=jd_count or 0,
            total_analyses=analysis_count or 0,
            latest_ats_score=latest_ats,
            latest_match_score=latest_match,
            top_skills=list(dict.fromkeys(top_skills))[:15],
            missing_skills=list(dict.fromkeys(missing_skills))[:15],
            recent_suggestions=list(dict.fromkeys(recent_suggestions))[:10],
            ats_history=ats_history[:10],
        )


dashboard_service = DashboardService()
