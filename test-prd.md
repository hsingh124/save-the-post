# PRD — IG Saves Knowledge Dashboard (working title)

## 0) One‑liner / Vision

A **personal knowledge dashboard for Instagram saves**: import or forward post links → hydrate via Instagram oEmbed → parse captions/hashtags → enrich with LLM topics & keywords → provide **instant, hybrid search** and lightweight organization (collections, notes) with a fast, cached gallery.

> **Hard constraint**: No scraping. Only user‑provided exports/links, official oEmbed for display. Comments/likers for arbitrary posts are out of scope (IG Graph allows comments only for media owned by the authenticated Business/Creator account).

---

## 1) Problem Statement

Instagram’s native “Saved” view is slow, non‑searchable beyond basic text, and weak at organization. Users save posts intending to revisit knowledge (recipes, workouts, coding tips, career advice) but can’t quickly find what they saved.

**Opportunity**: Treat IG saves as a knowledge corpus. Make them **searchable, organized, and fast**.

---

## 2) Goals & Non‑Goals

### Goals (MVP → V1)

1. **Seamless ingestion** of saved posts via IG data export and “send‑to‑bot” flow (Telegram/Discord/IG DM/WhatsApp Business).
2. **Compliant hydration** using Instagram oEmbed to render public posts with cached embeds/thumbnails.
3. **LLM enrichment** of captions/hashtags into topics, entities, and user‑searchable keywords.
4. **Hybrid search** (BM25 + vector + keyword expansion) with filters (creator, media type, saved date, topics, language).
5. **Light organization**: collections/tags + personal notes.
6. **Performance**: p95 dashboard initial load < 1.5s with cached thumbnails; search p95 < 300ms for 10k items.

### Non‑Goals (for MVP)

* Fetching **comments**/likers for arbitrary posts.
* Any scraping of Instagram web/app.
* Multi‑network aggregation (TikTok, X, Pinterest). (Candidate for V2.)
* Collaboration (multi‑user sharing) beyond a single account. (V1.1 candidate.)

---

## 3) Personas

* **Collector** (consumer/creator): Saves tutorials, workouts, recipes. Wants *fast recall* and *topic browsing*.
* **Researcher/Builder**: Saves technical posts, design patterns. Wants *search by concept/entity* and *notes*.
* **Creator/SME**: Tracks competitors/inspiration. Wants *creator filters* and *weekly insights*.

---

## 4) Top User Stories (MVP)

* As a user, I can **import** my IG data export and see my saved posts hydrated in a gallery.
* As a user, I can **send a link to a bot** and see the post appear within seconds.
* As a user, I can **search** by keywords or concepts and get relevant results instantly.
* As a user, I can **filter** by creator/media type/date/topic.
* As a user, I can **tag** items with my own collections and add **notes**.
* As a user, I can **open** the original post on IG to read live comments.
* As a user, I can **delete** my data (account‑wide, or per‑item) at any time.

---

## 5) Scope by Release

| Release        | Key Features                                                                                                                                                                                               | Out of Scope                           |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| **MVP (0.1)**  | Import from export (ZIP/JSON), Telegram/Discord bot capture, oEmbed hydration, cached embeds/thumbnails, caption parsing, LLM topics+keywords, hybrid search, collections/tags, notes, filters, delete‑all | Comments, collaboration, multi‑network |
| **V1 (0.2)**   | WhatsApp Business DM capture, IG DM (Professional acct) capture, insights (top topics/creators), timeline view, synonym table & query rewrite, keyboard shortcuts                                          | Team spaces, mobile apps               |
| **V1.1 (0.3)** | Shareable views (export link), CSV/JSON export, basic multi‑user (invite read‑only), per‑topic notifications                                                                                               | Full roles/ACL                         |
| **V2**         | Bring‑your‑own sources (X/Twitter bookmarks, YouTube “watch later”), browser extension capture                                                                                                             | —                                      |

---

## 6) Experience/UX Summary

### IA

* **Left rail**: Search bar; quick filters (All, Reels, Posts), Topics chips; date histogram.
* **Main grid**: Cached thumbnails; hover shows creator, caption snippet, labels.
* **Detail pane**: Cached embed (with “Open on Instagram”), notes, tags, metadata, related items (same topic/creator/hashtags).

### Key Flows (MVP)

1. **Import Flow**: Upload ZIP/JSON → progress → X items hydrated → summary of failures (private/deleted).
2. **Bot Flow**: Send IG URL → bot ACK → item appears in “Recent” within N seconds → background enrichment adds topics.
3. **Search Flow**: Query → hybrid results (BM25+vector) → chips to refine by topic/creator/media type/date/lang.
4. **Organize Flow**: Add to collections; add/edit personal notes.

### Accessibility & Quality

* Keyboard‑first (⌘K global search; arrows to navigate; Enter to open; T to tag; N to add note).
* High‑contrast theme support, semantic roles for embeds.

---

## 7) Functional Requirements

1. **Ingestion**

   * Accept IG data export ZIP/JSON; resilient to schema drift; de‑dupe by normalized permalink/post ID.
   * Bot webhooks for Telegram/Discord (MVP), WhatsApp Business/IG DM (V1) → validate URL pattern → enqueue hydration job.
2. **Hydration**

   * Instagram oEmbed fetch with app token; cache HTML + metadata; handle private/deleted gracefully.
3. **Parsing/Enrichment**

   * Strip HTML → caption text; extract hashtags/mentions/URLs.
   * Language detection; LLM topic/keyword/entity extraction (bounded vocabulary + freeform keywords).
   * Generate embeddings for vector search; store enrichment.
4. **Search**

   * Hybrid retrieval (BM25 + vector cosine); query rewrite via synonym table; facets (topics, creator, media type, saved date, lang).
5. **Organization**

   * User collections/tags; personal notes; de‑duplication; batch tagging.
6. **Privacy/Controls**

   * Full delete; export (V1.1); no scraping; rate‑limit user actions to prevent abuse.

---

## 8) Non‑Functional Requirements

* **Performance**: p95 search < 300ms @ 10k items; ingest 1k URLs/minute sustained with queued hydration.
* **Availability**: 99.9% monthly for API; graceful degradation when oEmbed is unavailable (show cached UI).
* **Scalability**: single‑tenant up to 100k items/user; multi‑tenant alpha.
* **Cost**: LLM tagging <\$0.15 per 100 posts (target; depends on model). Embedding via local or hosted small model to control costs.
* **Security**: Encrypt secrets; TLS everywhere; at‑rest encryption for user content; audit logging.

---

## 9) System Architecture (proposed)

* **Monorepo**: pnpm + Turborepo; TypeScript end‑to‑end.
* **Web App**: **Next.js 15 (App Router)**. Server Components for data-heavy views; Route Handlers for APIs; SSR/ISR as needed.
* **Mobile App**: **React Native** (Expo or bare). Share sheet to send links to the bot; deep links to open item detail.
* **API & Workers (default)**: Next.js **Route Handlers** for synchronous APIs; background **Node workers** (Fastify/NestJS‑lite) running **BullMQ** queues for hydrate/tag/embed jobs.
* **Alternative API**: **NestJS** microservice if you prefer layered architecture/DI and long‑lived workers. Expose the same REST endpoints; reuse BullMQ module.
* **Job Queue**: **Redis + BullMQ** (separate connection pool; backoff/retry; dead‑letter queues).
* **Storage**: **Postgres + pgvector**; S3‑compatible object store for import files and optional cached thumbnails.
* **Search**: **Meilisearch** for BM25 (or Postgres FTS); pgvector for embeddings; hybrid ranker in app layer.
* **LLM**: Node workers; provider‑agnostic adapter; batch tagging; caption‑hash cache.
* **Integrations**: Instagram oEmbed (Meta app), Telegram/Discord webhooks (MVP), WhatsApp Business & Instagram Messenger API (V1).
* **Observability**: OpenTelemetry (OTLP) traces, Prometheus metrics, structured logs.

**API framework choice**

* **Default: Next.js API (Route Handlers)** — simplest ops (same deploy as web), great for CRUD/search; pair with a separate Node worker for queues.
* **Option: NestJS** — stronger modularity/DI, guards/interceptors, better for larger teams and long‑lived processes. Deploy behind the web app.

**Data Flow**

1. URL/Export → **Ingestion** → 2) **Hydrator** calls oEmbed → cache → 3) **Parser** → 4) **Tagger** (LLM topics/keywords/entities) → 5) **Embedder** (vector) → 6) **Indexer** (BM25/vector) → 7) **API** serves search & detail.

---

## 10) Data Model (initial)

```sql
-- Users & auth
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Items (one per IG post URL)
CREATE TABLE items (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  permalink TEXT NOT NULL,
  post_id TEXT,              -- extracted from permalink if available
  creator_handle TEXT,
  media_type TEXT CHECK (media_type IN ('image','video','reel','album')),
  saved_at TIMESTAMPTZ,      -- when user saved/forwarded
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  lang TEXT,
  source TEXT,               -- 'export','telegram','discord','whatsapp','igdm'
  status TEXT NOT NULL DEFAULT 'active' -- 'active','unavailable','error'
);
CREATE UNIQUE INDEX items_user_permalink_idx ON items(user_id, permalink);

-- Raw/parsed text & embed
CREATE TABLE item_content (
  item_id UUID PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
  caption TEXT,
  hashtags TEXT[],
  mentions TEXT[],
  embed_html TEXT,
  thumb_url TEXT,
  width INT, height INT
);

-- Enrichment from LLM/heuristics
CREATE TABLE item_enrichment (
  item_id UUID PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
  topics TEXT[],              -- controlled vocab
  keywords TEXT[],            -- freeform search terms
  entities JSONB,             -- {people:[], brands:[], places:[]}
  qualities TEXT[]            -- e.g., how-to, tutorial, opinion
);

-- Vector embedding
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE item_embeddings (
  item_id UUID PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
  embedding vector(768)
);

-- User organization
CREATE TABLE collections (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT
);
CREATE TABLE collection_items (
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  PRIMARY KEY (collection_id, item_id)
);

-- Notes
CREATE TABLE notes (
  id UUID PRIMARY KEY,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  body TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Jobs / audit
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  user_id UUID,
  type TEXT,            -- hydrate|tag|embed|import
  payload JSONB,
  status TEXT,          -- queued|running|done|error
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  action TEXT,
  item_id UUID,
  meta JSONB,
  at TIMESTAMPTZ DEFAULT now()
);
```

**Controlled Vocab (topics)**
`["recipes","fitness","coding","career","design","travel","finance","politics","philosophy","photography","DIY","health","news","memes","inspiration","fashion","beauty","home","education","gaming"]`

---

## 11) Public API (internal/external)

```
POST /import                 # upload ZIP/JSON; returns import_id
GET  /import/:id/status      # progress; failures
POST /ingest                 # {url} from bot/web; returns item_id
GET  /items/:id              # item detail (embed HTML, text, enrichment)
GET  /items                  # list with filters & pagination
POST /items/:id/notes        # add note
POST /collections            # create collection
POST /collections/:id/items  # add item to collection
DELETE /items/:id            # delete item
DELETE /account              # delete all data

GET  /search?q=&filters=...  # hybrid search; returns ranked items
```

**Search Response (example)**

```json
{
  "query": "meal prep",
  "results": [
    {
      "item_id": "uuid",
      "score": 0.91,
      "permalink": "https://www.instagram.com/p/XYZ/",
      "creator": "@strongchef",
      "media_type": "reel",
      "snippet": "5 high-protein meal prep ideas...",
      "topics": ["recipes","fitness"],
      "keywords": ["meal prep","batch cooking","macro friendly"],
      "thumb_url": "..."
    }
  ]
}
```

---

## 12) LLM Tagger Spec

* **Input**: `caption + hashtags + creator_handle` (truncated to N chars).
* **Output JSON**: `{topics[], keywords[], entities{brands[],people[],places[]}, qualities[]}`.
* **Prompt guardrails**: low temperature (0–0.2); topics **must** be from controlled vocab; keywords 5–12 terms, ≤2 words each, no `#`.
* **Batching**: process 100–500 items per job; retry with backoff; cache by caption hash.
* **Confidence**: produce `confidence` score; if < threshold, fall back to heuristic keywords (hashtags + curated lists).
* **Internationalization**: detect language → either run language‑specific model or translate → tag.

**Sample Prompt (system)**

```
You are a tagger. Given Instagram post text, return normalized JSON with fields:
- topics: choose 1–3 from the provided set only.
- keywords: 5–12 concise search terms users might type (no hashtags, max 2 words, dedupe/stem similar terms).
- entities: proper names (brands/people/places), arrays may be empty.
- qualities: any of ["how-to","tutorial","review","opinion","list","news","reference","meme"].
Return JSON only.
```

---

## 13) Search & Ranking

* **Hybrid retrieval**: BM25 (caption + hashtags + keywords + notes) + vector cosine (embedding of caption+hashtags+creator).
* **Query rewrite**: synonym table (manual + mined) expands queries (e.g., `meal prep` → `batch cooking`, `macro friendly`).
* **Final score**

```
score = 0.55 * bm25 + 0.35 * cosine + 0.05 * topic_match + 0.05 * recency_decay
```

* **Facets**: topics, creator, media\_type, lang, saved\_at (date histogram).
* **Pagination**: cursor‑based; return highlighting snippets.

---

## 14) Performance Targets

* Import 10k items: complete hydration (cached) within < 15 min under light load.
* Bot capture: URL → visible card < 5s (hydration), LLM enrichment < 60s (async).
* Search p95 < 300ms for 10k items (warm cache), < 600ms cold.

---

## 15) Security, Privacy, Compliance

* **No scraping** of IG content; display via oEmbed; respect robots and platform terms.
* **Data minimization**: store only URLs, captions, derived metadata, and user notes.
* **Secrets**: store Meta app secrets and bot tokens in a secret manager; rotate quarterly.
* **At rest**: encrypt DB volume; row‑level encryption optional for notes.
* **Deletion**: hard delete per‑item and per‑account within 24h; logs retain anonymized metrics only.
* **Abuse**: rate‑limit endpoints; verify URL host patterns; strip PII from logs.

---

## 16) Telemetry & Success Metrics

**Product KPIs**

* 7‑day Search Activity Rate (% users who search ≥1×/week)
* Median time‑to‑find (import → first successful search click)
* Saved‑to‑Seen latency (bot share → card visible)
* Topic precision\@10 (manual eval), Query success rate (click‑through)

**System Metrics**

* Hydration success rate; oEmbed error rate; cache hit ratio
* LLM tagging coverage (% items enriched) & avg cost per item
* Search latency p50/p95; ingestion throughput; queue depth

---

## 17) Rollout Plan

1. **Alpha** (internal/dogfood): Telegram bot + import; 5–10 users; manual eval of topic precision.
2. **Closed Beta**: Add Discord + insights; instrument KPIs; docs for export import; add help center.
3. **Public Beta (V1)**: WhatsApp Business + IG DM (Professional); export function; landing page.

**Docs**: “How to export IG data”, “Share to bot”, “Privacy & Terms”.

---

## 18) Risks & Mitigations

* **Platform policy change**: oEmbed limits → cache aggressively; feature‑flag degraded mode (thumbnail + link, no embed).
* **Private/deleted posts**: mark `unavailable`, preserve user notes/tags; show link‑rot reminders.
* **LLM drift/cost**: batch, cache by caption hash; use small local models for keywording; route low‑confidence to stronger model.
* **Rate limits**: exponential backoff; nightly re‑hydration for failures; shared cache.
* **Legal**: maintain strict compliance documentation; provide DMCA/contact info.

---

## 19) QA Plan & Acceptance Criteria

**Acceptance (MVP)**

* Can import a real IG export ZIP; ≥ 95% of public links hydrated; failures summarized.
* Send IG URL to Telegram bot; item visible in ≤ 5s; enrichment appears in ≤ 60s.
* Search for `meal prep` returns relevant items with topic chips; p95 < 300ms.
* Add tags/collections and notes; they persist; appear in filters.
* Delete account removes all rows (items, content, enrichment, embeddings, notes) within 24h.

**Testing**

* Unit tests: URL parser, de‑dupe, caption parser, synonym rewrite, ranker math.
* Integration: oEmbed client with stub; LLM tagger mocked; vector/BM25 hybrid queries.
* Load: hydrate 10k items; search under load (concurrent 50 QPS) holds p95 targets.

---

## 20) Engineering Plan (Phases)

**Phase 0 (Infra)**: Monorepo (pnpm + Turborepo); Next.js skeleton (web + API routes); Node worker service (Fastify or NestJS); Postgres + pgvector; Redis; Meilisearch; CI/CD; secret manager; feature flags.

**Phase 1 (Ingestion & Hydration)**: Import endpoint (Next.js Route Handler); Telegram/Discord webhooks; URL validator; oEmbed client with caching (Node); item tables.

**Phase 2 (Parsing & Indexing)**: Node caption/hashtag parser; embeddings; Meilisearch/PG FTS; hybrid search APIs; result highlighting.

**Phase 3 (LLM Tagger)**: Node worker; prompt files; confidence routing; synonym table; enrichment UI.

**Phase 4 (UX & Perf)**: **Next.js web UI** and **React Native app** (Expo): grid + detail pane; keyboard nav; cached thumbnails; metrics dashboards; perf budgets.

**Phase 5 (V1 polish)**: Insights, timeline, WhatsApp Business + IG DM capture, docs, export, deletion flows.

---

## 21) Open Questions

* Do we snapshot thumbnails or always use remote thumbnails (licensing/performance trade‑off)?
* Do we want browser extension capture in MVP?
* Where to set the topic vocabulary size (20 vs 40)?
* Offer local‑only mode (no hosted LLM) for privacy‑sensitive users?

---

## 22) Appendix A — Cost Rough‑Cut (per 1,000 posts)

* oEmbed calls: free but rate‑limited; cache hit target ≥ 85% after first pass.
* LLM tagger: \~\$0.10–\$0.40 depending on model/length; batch to minimize overhead; cache by caption hash.
* Vector storage: \~3 MB for 1k \* 768‑dim float32; smaller with int8 quantization.

## 23) Appendix B — Bot Webhooks (MVP)

* **Telegram**: `/webhook/telegram` → parse `message.text` URLs; ACK via `sendMessage`.
* **Discord**: `/webhook/discord` → parse `content`; respond with ephemeral confirmation.

**Regex (permalink)**: `^https?://(www\.)?instagram\.com/(p|reel|tv)/[A-Za-z0-9_-]+/` (tune as needed).

## 24) Appendix C — Error Handling

* oEmbed 4xx → mark `unavailable`; show badge; retry 24h later for 429/5xx.
* Import parsing error → capture sample and show actionable error to user.
* LLM timeout → queue retry with exponential backoff; cap 3 attempts.
