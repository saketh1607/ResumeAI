import time
import uuid

from loguru import logger
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = str(uuid.uuid4())[:8]
        start = time.perf_counter()
        logger.info(f"[{request_id}] {request.method} {request.url.path}")
        try:
            response = await call_next(request)
            elapsed = (time.perf_counter() - start) * 1000
            logger.info(f"[{request_id}] {response.status_code} ({elapsed:.1f}ms)")
            response.headers["X-Request-ID"] = request_id
            return response
        except Exception as exc:
            elapsed = (time.perf_counter() - start) * 1000
            logger.exception(f"[{request_id}] Error ({elapsed:.1f}ms): {exc}")
            raise
