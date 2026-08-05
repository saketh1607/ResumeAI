"""Deterministic ATS scoring — varies per resume + job description pair."""
import re
from typing import Any

# Broad tech skill patterns (case-insensitive)
SKILL_REGEX = re.compile(
    r"\b("
    r"python|java|javascript|typescript|react|angular|vue|node\.?js|spring(?:\s+boot)?|"
    r"fastapi|django|flask|\.net|c\+\+|c#|go|golang|rust|kotlin|swift|"
    r"sql|mysql|postgresql|postgres|mongodb|redis|elasticsearch|"
    r"aws|azure|gcp|google cloud|docker|kubernetes|k8s|openshift|jenkins|terraform|"
    r"git|github|gitlab|ci/?cd|agile|scrum|kafka|rabbitmq|"
    r"html|css|tailwind|bootstrap|rest(?:ful)?|graphql|grpc|microservices|"
    r"machine learning|deep learning|nlp|tensorflow|pytorch|pandas|numpy|"
    r"langchain|spark|hadoop|tableau|power bi|jira|confluence|"
    r"android|ios|flutter|selenium|junit|mockito|hibernate|maven|gradle"
    r")\b",
    re.IGNORECASE,
)

EDUCATION_TERMS = re.compile(
    r"\b(b\.?tech|m\.?tech|b\.?e\.?|m\.?e\.?|bachelor|master|ph\.?d|"
    r"b\.?sc|m\.?sc|mba|bca|mca|diploma|degree|university|college)\b",
    re.IGNORECASE,
)

EXPERIENCE_YEARS = re.compile(r"(\d{1,2})\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:experience|exp)", re.IGNORECASE)

SENIORITY_JD = re.compile(
    r"\b(intern|junior|entry[\s-]?level|mid[\s-]?level|senior|lead|principal|staff|architect|manager)\b",
    re.IGNORECASE,
)

STOPWORDS = frozenset(
    "the a an and or for with from this that will your our their have has been being "
    "are was were is am be do does did not no yes all any can may might must shall should "
    "would could about into over under between through during before after above below "
    "job role team work experience skills requirements responsibilities description".split()
)


def _extract_skills(text: str) -> set[str]:
    found = {m.group(1).lower().replace(" ", "") for m in SKILL_REGEX.finditer(text)}
    # Normalize spring boot
    normalized = set()
    for s in found:
        if s.startswith("spring"):
            normalized.add("spring boot" if "boot" in text.lower() else "spring")
        else:
            normalized.add(s)
    return normalized


def _extract_keywords(text: str, min_len: int = 4) -> set[str]:
    words = re.findall(r"[a-z][a-z0-9+#.]{2,}", text.lower())
    return {w for w in words if w not in STOPWORDS and len(w) >= min_len}


def _pct(matched: int, total: int, default: float = 50.0) -> float:
    if total <= 0:
        return default
    return round(min(100.0, max(0.0, (matched / total) * 100)), 1)


def _formatting_score(resume_text: str, parsed: dict | None) -> float:
    score = 40.0
    lower = resume_text.lower()
    if re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", resume_text):
        score += 10
    if re.search(r"\+?[\d\s().-]{10,}", resume_text):
        score += 5
    for section in ("experience", "education", "skills", "project"):
        if section in lower:
            score += 10
    if parsed:
        if parsed.get("skills"):
            score += 5
        if parsed.get("experience"):
            score += 5
        if parsed.get("education"):
            score += 5
    bullets = resume_text.count("•") + resume_text.count("- ") + resume_text.count("* ")
    if bullets >= 5:
        score += 10
    length = len(resume_text)
    if 800 <= length <= 12000:
        score += 10
    elif length < 400:
        score -= 15
    return round(min(100.0, score), 1)


def _experience_score(resume_text: str, jd_text: str) -> float:
    resume_years = [int(m.group(1)) for m in EXPERIENCE_YEARS.finditer(resume_text)]
    resume_max = max(resume_years) if resume_years else None

    jd_years = [int(m.group(1)) for m in EXPERIENCE_YEARS.finditer(jd_text)]
    jd_required = max(jd_years) if jd_years else None

    if jd_required is not None and resume_max is not None:
        if resume_max >= jd_required:
            return min(100.0, 70.0 + (resume_max - jd_required) * 5)
        return max(25.0, 70.0 - (jd_required - resume_max) * 12)

    if resume_max is not None:
        return min(95.0, 55.0 + resume_max * 8)

    exp_section = "experience" in resume_text.lower() or "work history" in resume_text.lower()
    return 72.0 if exp_section else 45.0


def _education_score(resume_text: str, jd_text: str) -> float:
    resume_edu = set(EDUCATION_TERMS.findall(resume_text.lower()))
    if not jd_text.strip():
        return 75.0 if resume_edu else 50.0
    jd_edu = set(EDUCATION_TERMS.findall(jd_text.lower()))
    if not jd_edu:
        return 80.0 if resume_edu else 55.0
    overlap = resume_edu & jd_edu
    return _pct(len(overlap), len(jd_edu), default=60.0 if resume_edu else 35.0)


def _project_relevance(resume_text: str, jd_skills: set[str]) -> float:
    if not jd_skills:
        return 65.0
    lower = resume_text.lower()
    proj_start = -1
    for marker in ("projects", "portfolio", "personal projects"):
        idx = lower.find(marker)
        if idx >= 0:
            proj_start = idx
            break
    proj_text = resume_text[proj_start : proj_start + 2500] if proj_start >= 0 else resume_text[-2000:]
    proj_skills = _extract_skills(proj_text)
    if not proj_skills:
        return 40.0
    matched = proj_skills & jd_skills
    return _pct(len(matched), len(jd_skills), default=50.0)


def compute_ats_metrics(
    resume_text: str,
    jd_text: str = "",
    parsed: dict | None = None,
) -> dict[str, Any]:
    """Compute ATS metrics from resume/JD content (unique per pair)."""
    resume_skills = _extract_skills(resume_text)
    if parsed and isinstance(parsed.get("skills"), list):
        for s in parsed["skills"]:
            if isinstance(s, str):
                resume_skills.add(s.lower().strip())

    jd_skills = _extract_skills(jd_text) if jd_text.strip() else set()
    resume_kw = _extract_keywords(resume_text)
    jd_kw = _extract_keywords(jd_text) if jd_text.strip() else set()

    if jd_skills:
        matched_skills = resume_skills & jd_skills
        missing_skills = sorted(jd_skills - resume_skills)
        skills_match = _pct(len(matched_skills), len(jd_skills))
    else:
        missing_skills = []
        skills_match = min(100.0, 35.0 + len(resume_skills) * 4)

    if jd_kw:
        # Weight JD terms that appear as important (longer / skill-like)
        important_jd = {w for w in jd_kw if len(w) >= 5 or w in resume_skills}
        if not important_jd:
            important_jd = jd_kw
        kw_overlap = len(resume_kw & important_jd)
        keywords_match = _pct(kw_overlap, len(important_jd))
    else:
        keywords_match = min(100.0, 40.0 + len(resume_kw) * 0.5)

    experience_match = _experience_score(resume_text, jd_text)
    education_match = _education_score(resume_text, jd_text)
    formatting_score = _formatting_score(resume_text, parsed)
    project_relevance = _project_relevance(resume_text, jd_skills if jd_skills else resume_skills)

    # Weighted overall — emphasizes JD fit when JD is provided
    if jd_text.strip():
        ats_score = round(
            skills_match * 0.30
            + keywords_match * 0.25
            + experience_match * 0.15
            + education_match * 0.10
            + formatting_score * 0.10
            + project_relevance * 0.10,
            1,
        )
    else:
        ats_score = round(
            skills_match * 0.25
            + keywords_match * 0.20
            + experience_match * 0.20
            + education_match * 0.10
            + formatting_score * 0.15
            + project_relevance * 0.10,
            1,
        )

    strengths = []
    weaknesses = []
    if skills_match >= 70:
        strengths.append(f"Strong skill overlap ({len(resume_skills & jd_skills)}/{len(jd_skills) or 'N/A'} JD skills)")
    elif jd_skills:
        weaknesses.append(f"Only {len(resume_skills & jd_skills)} of {len(jd_skills)} required skills found")

    if keywords_match >= 65:
        strengths.append("Good keyword alignment with job description")
    elif jd_text.strip():
        weaknesses.append("Resume keywords don't closely match the JD")

    if formatting_score >= 75:
        strengths.append("Well-structured resume format for ATS parsing")
    else:
        weaknesses.append("Improve sections, contact info, or formatting for ATS")

    if missing_skills:
        weaknesses.append(f"Missing {len(missing_skills)} skills required in the JD")

    recommendations = []
    if missing_skills:
        recommendations.append(
            f"Add these JD keywords to your skills section: {', '.join(missing_skills[:8])}"
        )
    if keywords_match < 60 and jd_text.strip():
        recommendations.append("Mirror exact phrases from the job description in your experience bullets")
    if formatting_score < 70:
        recommendations.append("Use clear section headers: Skills, Experience, Education, Projects")
    if not recommendations:
        recommendations.append("Tailor your summary line to match the role title in the JD")

    return {
        "ats_score": ats_score,
        "skills_match": skills_match,
        "keywords_match": keywords_match,
        "experience_match": experience_match,
        "education_match": education_match,
        "formatting_score": formatting_score,
        "project_relevance": project_relevance,
        "strengths": strengths[:6] or ["Resume contains relevant technical content"],
        "weaknesses": weaknesses[:6] or ["Consider adding more JD-specific terms"],
        "missing_skills": missing_skills[:20],
        "recommendations": recommendations[:8],
    }
