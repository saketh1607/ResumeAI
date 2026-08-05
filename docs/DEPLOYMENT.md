# Deployment Guide

Deploy **frontend** and **backend** separately (recommended).

| Part | Platform | Why |
|------|----------|-----|
| Frontend | [Vercel](https://vercel.com) | Free, fast CDN, React/Vite |
| Backend | [Render](https://render.com) or [Railway](https://railway.app) | Python/FastAPI, env vars, disk |

---

## Before you deploy

1. **Gemini API key** — https://aistudio.google.com/app/apikey  
2. **GitHub repo** pushed with `backend/` as a real folder (not submodule)  
3. **Generate a secret** for JWT:
   ```powershell
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

---

## Step 1 — Deploy backend (Render)

### 1.1 Create Web Service

1. Go to https://dashboard.render.com → **New +** → **Web Service**  
2. Connect GitHub repo `AI-Resume-Analyzer-RAG`  
3. Settings:

| Setting | Value |
|---------|--------|
| **Root Directory** | `backend` (not `C:\Users\...` — letters only) |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `python start.py` |
| **Plan** | Free (or Starter if builds fail / slow) |

### 1.2 Environment variables (Render → Environment)

```env
GEMINI_API_KEY=your_real_key
SECRET_KEY=your-long-random-secret
GEMINI_MODEL=gemini-2.0-flash
APP_ENV=production
DATABASE_URL=sqlite+aiosqlite:///./resume_analyzer.db
CORS_ORIGINS=https://YOUR-APP.vercel.app;http://localhost:5173
```

Use **semicolon** between URLs if the platform rejects commas in env vars.

Replace `YOUR-APP.vercel.app` after Vercel deploy (Step 2).

### 1.3 Supabase (required for RAG)

1. Create a project at https://supabase.com  
2. Run SQL from `docs/supabase_setup.sql` in the SQL Editor  
3. Add to Render env:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (Settings → API → service_role)

Vectors are stored in Supabase; embeddings use **Gemini API** (no local torch/FAISS).

### 1.4 Disk (optional)

Render free tier **resets disk on redeploy**. PDF uploads in `uploads/` may be lost on redeploy (OK for demo).

### 1.4 Deploy & test

After deploy, open:

- `https://YOUR-BACKEND.onrender.com/health`  
- Should show: `"gemini_configured": true`

API docs: `https://YOUR-BACKEND.onrender.com/docs`

---

## Step 1 (alternative) — Backend on Railway

1. https://railway.app → **New Project** → **Deploy from GitHub**  
2. Select repo → set **Root Directory** = `backend`  
3. **Start command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`  
4. Add same env vars as Render  
5. Copy public URL (e.g. `https://xxx.up.railway.app`)

---

## Step 2 — Deploy frontend (Vercel)

### 2.1 Import project

1. https://vercel.com → **Add New** → **Project**  
2. Import `Priyanshu-Patidar/AI-Resume-Analyzer-RAG`  
3. Settings:

| Setting | Value |
|---------|--------|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### 2.2 Environment variable

| Name | Value |
|------|--------|
| `VITE_API_URL` | `https://YOUR-BACKEND.onrender.com/api` |

Use your real backend URL + `/api` (no trailing slash after `api`).

### 2.3 Deploy

Click **Deploy**. Copy your Vercel URL, e.g. `https://ai-resume-analyzer.vercel.app`.

---

## Step 3 — Connect frontend ↔ backend

1. **Render/Railway** → update `CORS_ORIGINS`:
   ```
   https://your-app.vercel.app,http://localhost:5173
   ```
2. **Redeploy backend** after changing CORS  
3. Open Vercel URL → Register → Upload resume → Test chat/ATS  

---

## Docker (VPS / local server)

From project root:

```bash
# backend/.env must exist with GEMINI_API_KEY
docker compose up --build -d
```

- Frontend: http://localhost:5173  
- Backend: http://localhost:8000  

For production, set `VITE_API_URL` at **build time** in `docker-compose.yml` to your public API URL.

---

## Checklist

- [ ] Backend `/health` returns `gemini_configured: true`  
- [ ] `CORS_ORIGINS` includes your Vercel domain  
- [ ] `VITE_API_URL` points to `https://backend-url/api`  
- [ ] No `.env` with secrets committed to GitHub  
- [ ] First ATS/chat request may be **slow** (ML models loading)  

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| CORS error in browser | Add Vercel URL to `CORS_ORIGINS`, redeploy backend |
| `Network Error` / API failed | Check `VITE_API_URL` ends with `/api` |
| Gemini errors | Set `GEMINI_API_KEY`, try `GEMINI_MODEL=gemini-2.0-flash` |
| Render OOM / build timeout | Heavy deps removed (no torch/FAISS/spacy). Ensure Supabase + Gemini env vars are set |
| 502 on Render free | Service slept — wait 30s and refresh |
| Uploads lost | Add persistent disk or use cloud storage (S3) for production |

---

## Architecture (production)

```
User → Vercel (React) → HTTPS → Render/Railway (FastAPI) → Gemini API
                                      ↓
                              FAISS + SQLite (local disk)
```
