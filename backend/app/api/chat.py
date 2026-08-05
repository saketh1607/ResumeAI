import asyncio

from fastapi import APIRouter, Depends, HTTPException
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import ChatMessage, ChatSession, User
from app.models.schemas import ChatQuery, ChatResponse
from app.rag.chains import rag_chain_service
from app.services.resume_service import jd_service, resume_service

router = APIRouter(prefix="/chat", tags=["RAG Chat"])


@router.post("/query", response_model=ChatResponse)
async def chat_query(
    data: ChatQuery,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    resume = await resume_service.get_user_resume(db, current_user.id, data.resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    collection_keys = [resume.vector_index_path] if resume.vector_index_path else []
    jd = None
    if data.jd_id:
        jd = await jd_service.get_user_jd(db, current_user.id, data.jd_id)
        if jd and jd.vector_index_path:
            collection_keys.append(jd.vector_index_path)

    if data.session_id:
        from sqlalchemy import select

        result = await db.execute(
            select(ChatSession).where(
                ChatSession.id == data.session_id,
                ChatSession.user_id == current_user.id,
            )
        )
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Chat session not found")
        session_id = data.session_id
    else:
        session = ChatSession(
            user_id=current_user.id,
            resume_id=resume.id,
            jd_id=jd.id if jd else None,
        )
        db.add(session)
        await db.flush()
        await db.refresh(session)
        session_id = session.id

    jd_text = jd.raw_text if jd else ""
    try:
        answer, sources = await asyncio.to_thread(
            rag_chain_service.chat,
            data.question,
            collection_keys,
            session_id,
            resume.raw_text or "",
            jd_text,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception(f"Chat failed: {exc}")
        raise HTTPException(
            status_code=500,
            detail=f"AI chat failed: {exc}. Check GEMINI_API_KEY in backend/.env and restart the server.",
        ) from exc

    db.add(ChatMessage(session_id=session_id, role="user", content=data.question))
    db.add(ChatMessage(session_id=session_id, role="assistant", content=answer))

    return ChatResponse(answer=answer, session_id=session_id, sources=sources[:5])
