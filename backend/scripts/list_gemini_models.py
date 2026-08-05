"""Run: python scripts/list_gemini_models.py  (from backend/ with .env loaded)"""
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

import google.generativeai as genai

key = os.getenv("GEMINI_API_KEY", "")
if not key:
    print("Set GEMINI_API_KEY in backend/.env first")
    raise SystemExit(1)

genai.configure(api_key=key)
print("Models supporting generateContent:\n")
for m in genai.list_models():
    if "generateContent" in (m.supported_generation_methods or []):
        print(f"  {m.name}")
