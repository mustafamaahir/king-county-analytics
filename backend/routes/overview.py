"""
routes/overview.py
GET /api/overview
Serves pre-computed results from cache + Groq interpretation.
"""

from fastapi import APIRouter, HTTPException
from utils.cache import get_result, is_ready
from services.groq_service import get_interpretation, PROMPTS

router = APIRouter()


@router.get("/api/overview")
def get_overview():
    if not is_ready("overview"):
        raise HTTPException(
            status_code=503,
            detail="Pipeline still warming up. Please retry in a few seconds."
        )
    data = get_result("overview")
    ai_text = get_interpretation(data["groq_context"], PROMPTS["overview"])
    return {**data, "ai_interpretation": ai_text}
