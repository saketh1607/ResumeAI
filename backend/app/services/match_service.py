import json

from app.models.schemas import MatchResponse
from app.rag.chains import rag_chain_service


class MatchService:
    def compare(self, resume_text: str, jd_text: str) -> MatchResponse:
        result = rag_chain_service.analyze_match(resume_text, jd_text)
        match_pct = float(result.get("match_percentage", 0))
        match_pct = min(100, max(0, match_pct))

        return MatchResponse(
            match_percentage=round(match_pct, 1),
            matching_skills=result.get("matching_skills", [])[:30],
            missing_technologies=result.get("missing_technologies", [])[:30],
            recommended_improvements=result.get("recommended_improvements", [])[:15],
            summary=result.get("summary", "Analysis complete."),
        )

    def to_json(self, response: MatchResponse) -> str:
        return json.dumps(response.model_dump())


match_service = MatchService()
