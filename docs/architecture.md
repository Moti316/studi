# הצעת ארכיטקטורה - לבניית מערכת דומה ל-StudiesGo

> מסמך זה מציע ארכיטקטורה ראשונית למערכת דומה ל-StudiesGo. הוא יתעדכן אחרי
> שמוטי יענה על שאלות ה-Intake של workspace-template ו-50 השאלות המופיעות שם.

## עקרון-על

המערכת היא **AI-first**, כלומר LLM ו-RAG אינם תוספת אלא ה-core של מסלול-המוצר.
הצוואר המרכזי הוא ה-pipeline: **PDF → text → chunks → vectors → questions → quiz UI**.
כל שאר המערכת (גיימיפיקציה, settings, billing) היא תשתית קלאסית שמשרתת את ה-pipeline.

## תרשים-על

```
[משתמש] ── HTTPS ──> [Frontend (web)]
                          │
                          ▼
                    [API Gateway (Edge)]
                          │
              ┌───────────┼──────────────┐
              ▼           ▼              ▼
        [Auth API]   [Course API]   [Quiz API]
                          │              │
                          ▼              ▼
                  ┌───────────────┐  ┌─────────┐
                  │ Job Queue     │  │ Postgres│
                  │ (course-build)│  │ (state) │
                  └───────┬───────┘  └─────────┘
                          ▼
                  [Worker Pool] ───────┐
                  ┌───────────────────┐│
                  │ 5-stage pipeline: ││
                  │ 1 Parse PDF       ││──> [Object Storage]
                  │ 2 Chunk           ││    (raw + processed)
                  │ 3 Embed + Index   ││──> [Vector DB]
                  │ 4 Gen lessons     ││──> [LLM API: Claude]
                  │ 5 Gen questions   ││──> [LLM API: Claude]
                  └───────────────────┘│
                          │            │
                          ▼            │
                    [Postgres] <───────┘
                    (courses, questions)
                          │
                          ▼
                  [Quiz UI] ◄── [TTS API] (קולות עברית)
```

## בחירות-טכנולוגיה מומלצות (לדיון)

### Frontend
**המלצה: Next.js 15 + App Router** — SSR/RSC ל-SEO ב-landing, ניתוב ברור,
שילוב API routes לפעולות-לקוח. PWA דרך `next-pwa`. RTL עברית native.

**Alternative**: React + Vite אם רוצים יותר control ופחות magic.

**UI**: shadcn/ui + Tailwind. RTL ע"י `dir="rtl"` ב-html.

**State**: React Query לקריאות-API + Zustand ל-UI state.

### Backend
**המלצה: Node + Hono / Express** או **Python + FastAPI**.

**Hono ב-Node** אם הצוות JS — מהיר, type-safe, רץ ב-edge runtime.

**FastAPI ב-Python** עדיף לפיצ'רי-AI: tooling טוב יותר ל-document parsing
(LangChain, LlamaIndex, Unstructured), שילוב טבעי עם vector DBs.

**שכבת AI יכולה להיות נפרדת**: gateway ב-Node, workers ב-Python.

### Database
**עיקרי: PostgreSQL** ל-relational state (users, courses, lessons, questions,
answers, credits transactions, sessions).

**Vector DB**: 3 אופציות:
- **pgvector** (extension של Postgres) — הכי פשוט, מספיק ל-MVP, מאחד DB
- **Qdrant** — high-performance, hybrid search, open-source
- **Pinecone** — מנוהל, scale, אבל יקר

**המלצה ל-MVP**: pgvector. שדרוג אם נדרש.

**Object Storage**: S3 / Cloudflare R2 / Supabase Storage לקבצי-מקור גולמיים.

### Background Jobs
**Bull / BullMQ + Redis** ב-Node או **Celery + Redis** ב-Python.

הצורך: pipeline אסינכרוני 5-שלבי שצריך:
- progress tracking (מצב ה-5%)
- retries (אם LLM נכשל)
- timeout
- חסם concurrent jobs לפי משתמש (אחד-בכל-פעם)
- estimated time remaining

### LLM
**Claude (Anthropic)** עם prompt caching - חוסך עלויות בעיבוד 50MB מסמכים.

**שימושים**:
- **Sonnet 4.6** ליצירת תוכן (לימודים, שאלות)
- **Haiku 4.5** ל-classification (זיהוי-נושא, ביטחון)
- **Opus 4.8** לבדיקת-איכות (review של שאלות שנוצרו)

ה-`/scaffold-workspace` של workspace-template יכלול סוכן `ai-engineer` שיגדיר
את החוזים האלה במדויק.

### Document Processing
- **PDF**: PyMuPDF (PyPDF2 גם אופציה) או Unstructured.io
- **Word**: python-docx
- **PowerPoint**: python-pptx
- **Excel**: openpyxl / pandas
- **תמונות**: Tesseract OCR או Claude Vision (יקר יותר אבל איכותי)

### TTS
- **ElevenLabs** — איכות מובילה, עברית טובה, voice cloning. יקר יחסית
- **Microsoft Azure Speech** — עברית סבירה, מחיר טוב
- **Google Cloud TTS** — תמיכת עברית מוגבלת
- **OpenAI TTS** — לא תומך עברית טוב

**המלצה**: ElevenLabs ל-4 הקולות (יואב/טלי/מיכל/אורי), עם cache של ההקראה
כדי לא לשלם פעמיים על אותו הסבר.

### Auth
- **Magic Link**: Resend / Postmark לשליחה + טבלת `auth_tokens`
- **Google OAuth**: NextAuth (אם Next.js) או Lucia או Supabase Auth

**המלצה**: NextAuth v5 (Auth.js) — תומך magic link + Google מתוך-הקופסא.

### Hosting / Deployment
- **Frontend + API Routes**: Vercel (אם Next.js)
- **Workers**: Railway / Fly.io / AWS ECS (לעבודות-עיבוד ארוכות)
- **DB**: Neon (Postgres מנוהל, עם pgvector) או Supabase
- **Object Storage**: Cloudflare R2 (זול ביחס ל-S3)

## DB Schema ראשוני (high-level)

```sql
users                  - id, email, name, google_id, created_at
auth_tokens            - id, user_id, token_hash, expires_at, type (magic|reset)
credits                - user_id, balance, last_updated
credit_transactions    - id, user_id, amount, reason, created_at
courses                - id, user_id, name, source_type, status, credits_cost, created_at
course_sources         - id, course_id, file_url, mime_type, size_bytes, parsed_text
lessons                - id, course_id, order, title, content
questions              - id, lesson_id, type (mcq|matching|fillblank|explanation),
                         content_json, correct_answer_json, source_chunk_id
chunks                 - id, course_id, content, embedding (vector), metadata
attempts               - id, user_id, question_id, answer_json, is_correct, xp_earned, created_at
streaks                - user_id, current, longest, last_active_date
user_settings          - user_id, daily_goal_min, theme, tts_voice, tts_enabled, notifications_email
```

## תזרים יצירת קורס - בפרוטוקול

```
POST /api/courses
  body: { source_type: 'file', file_id: '...' }
  → 1. credit check (>= estimated cost)
    2. create course row, status='PENDING'
    3. enqueue 'course-build' job
    4. return { course_id, estimated_credits, eta_seconds }

[Worker picks up job]
  → STAGE 1: parsing
    - download from R2
    - PyMuPDF / Unstructured
    - update: status='PARSING', progress=20%
    - websocket push to client: { stage: 'parsing', progress: 20 }

  → STAGE 2: chunking
    - semantic chunking, target ~500 tokens
    - update: status='CHUNKING', progress=40%

  → STAGE 3: embedding + indexing
    - batch embed via API (Voyage / OpenAI / Cohere)
    - INSERT chunks with embeddings
    - update: status='INDEXING', progress=60%

  → STAGE 4: lesson generation
    - LLM call: "Given these chunks, generate N lessons covering them"
    - prompt cache: chunks + system prompt cached
    - update: progress=80%

  → STAGE 5: question generation
    - for each lesson, generate 4-6 questions, mixed types
    - LLM call with RAG context per question
    - validation (correct answer present in source?)
    - update: status='COMPLETED', progress=100%

  → 6. charge credits, write transaction
  → 7. notify user (email + push)
```

## שיקולי-עלות

| פעולה | עלות מוערכת ליצירה (50 עמ' PDF) |
|---|---|
| LLM (Claude Sonnet) | ~$0.50 (עם prompt caching) |
| Embedding (Voyage) | ~$0.05 |
| TTS (ElevenLabs) | ~$0.10 לשיעור עם הסבר |
| Storage (R2) | זניח |
| **סה"כ** | **~$0.65 לקורס** |

עם מודל-קרדיטים: 23 קרדיטים = 23 × $X. אם 1 קרדיט = 5 סנט → $1.15 הכנסה
ל-$0.65 עלות = ~43% רווח-גולמי. סביר.

## פערים שייסגרו ב-intake (50 השאלות של workspace-template)

הסקירה לעיל נותנת **תמונת-על**. ה-intake יחדד:
- שלב הפרויקט (Q05: רעיון / MVP / מוצר-חי) → roster + ארכיטיפ
- דומיין (Q06: edtech נכון? יש סייגים?)
- שפת backend (Q22: TS / Python / Go?) → LSP, יחסים בין סוכנים
- DB וספק (Q24-Q26: pgvector? Postgres? ORM?)
- אבטחה (Q27, Q33: PII רגיש? GDPR?)
- צוות (Q39: יחיד? צוות?)
- ערכת-עיצוב (Q45: מוקפד? מותג?)
- פריסה (Q48: Vercel? AWS?)

אחרי ה-intake נריץ `matching_engine.py` ויקבל את הצוות המדויק של סוכני
Claude Code שילוו את הפיתוח.

## הצעד הבא: ה-Intake

נריץ עכשיו את 50 השאלות מ-`workspace-template/intake/questions.yaml`,
אך עם **ברירות-מחדל מהסקירה לעיל** - מוטי יאשר / יתקן בלבד, לא יתחיל מאפס.
