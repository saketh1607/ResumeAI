import json
from typing import Any

from loguru import logger

from app.models.schemas import ATSScoreResponse
from app.rag.prompts import ATS_ANALYSIS_TEMPLATE
from app.services.ats_engine import compute_ats_metrics
from app.services.gemini_service import gemini_service


class ATSService:
    def compute_score(
        self, resume_text: str, jd_text: str = "", parsed: dict | None = None
    ) -> ATSScoreResponse:
        # Primary: deterministic scores from resume + JD content (unique per pair)
        result = compute_ats_metrics(resume_text, jd_text, parsed)

        # Optional: enrich narrative fields with Gemini (numbers stay from engine)
        if jd_text.strip() and gemini_service:
            try:
                from app.config import get_settings

                if get_settings().gemini_api_key:
                    insights = self._gemini_insights(resume_text, jd_text)
                    if insights.get("strengths"):
                        result["strengths"] = insights["strengths"][:10]
                    if insights.get("weaknesses"):
                        result["weaknesses"] = insights["weaknesses"][:10]
                    if insights.get("recommendations"):
                        result["recommendations"] = insights["recommendations"][:10]
                    if insights.get("missing_skills"):
                        existing = set(s.lower() for s in result["missing_skills"])
                        for s in insights["missing_skills"]:
                            if isinstance(s, str) and s.lower() not in existing:
                                result["missing_skills"].append(s)
                        result["missing_skills"] = result["missing_skills"][:20]
            except Exception as exc:
                logger.warning(f"Gemini ATS insights skipped: {exc}")

        def _float(key: str) -> float:
            return float(min(100, max(0, result.get(key, 0))))

        return ATSScoreResponse(
            ats_score=_float("ats_score"),
            skills_match=_float("skills_match"),
            keywords_match=_float("keywords_match"),
            experience_match=_float("experience_match"),
            education_match=_float("education_match"),
            formatting_score=_float("formatting_score"),
            project_relevance=_float("project_relevance"),
            strengths=result.get("strengths", [])[:10],
            weaknesses=result.get("weaknesses", [])[:10],
            missing_skills=result.get("missing_skills", [])[:20],
            recommendations=result.get("recommendations", [])[:10],
        )

    def _gemini_insights(self, resume_text: str, jd_text: str) -> dict[str, Any]:
        prompt = (
            ATS_ANALYSIS_TEMPLATE.format(resume=resume_text[:6000], jd=jd_text[:4000])
            + "\n\nReturn JSON with ONLY these keys (no scores): "
            "strengths, weaknesses, missing_skills, recommendations. Be specific to this resume and JD."
        )
        return gemini_service.generate_json(prompt)

    def to_json(self, response: ATSScoreResponse) -> str:
        return json.dumps(response.model_dump())


ats_service = ATSService()
