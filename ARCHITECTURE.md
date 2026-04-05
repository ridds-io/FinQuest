# ARCHITECTURE.md — FinQuest Phase-Based Migration Guide

## Overview

FinQuest follows a **phased migration strategy** from a Next.js monolith towards a
service-oriented architecture. This document describes each phase, the rationale, and
the migration checklist.

---

## Phase 1 (Current) — Frontend Reorganization ✅

**Goal:** Reorganize the Next.js monolith into a clean, domain-based frontend structure
without changing any business logic.

### Directory Structure

```
FinQuest/
├── frontend/                          # Next.js + React + Phaser
│   ├── public/                        # Static assets
│   │   ├── sprites/                   # Game sprites
│   │   ├── maps/                      # Map images
│   │   ├── extra_sprites/             # Additional sprites
│   │   └── assets/                    # Misc image assets
│   │
│   ├── src/
│   │   ├── app/                       # Next.js App Router
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── globals.css
│   │   │   ├── api/                   # API Routes (Groq, RAG)
│   │   │   ├── game/                  # Game pages
│   │   │   ├── login/
│   │   │   ├── profile/
│   │   │   └── reset-password/
│   │   │
│   │   ├── components/
│   │   │   ├── games/                 # Game-specific React components
│   │   │   │   ├── BudgetGame.tsx
│   │   │   │   ├── BudgetTetris.tsx
│   │   │   │   ├── BudgetingCityView.tsx
│   │   │   │   ├── CafeGame.tsx
│   │   │   │   ├── GameView.tsx
│   │   │   │   ├── MainGameView.tsx
│   │   │   │   ├── QuestSidebar.tsx
│   │   │   │   └── QuizGame.tsx
│   │   │   ├── ui/                    # Generic reusable UI components
│   │   │   │   └── GameCanvas.tsx
│   │   │   ├── layout/                # Layout & context providers
│   │   │   │   └── SupabaseProvider.tsx
│   │   │   └── game-engine/           # Phaser integration (placeholder)
│   │   │
│   │   ├── lib/                       # Shared utilities & server logic
│   │   │   ├── gameState.ts           # Client-side game state helpers
│   │   │   ├── groq.ts                # Groq LLM API client
│   │   │   ├── rag.ts                 # RAG pipeline
│   │   │   └── supabase-server.ts     # Server-side Supabase client
│   │   │
│   │   ├── phaser/                    # Phaser engine code (placeholder)
│   │   │   ├── scenes/
│   │   │   ├── objects/
│   │   │   ├── physics/
│   │   │   └── animations/
│   │   │
│   │   ├── store/                     # State management (placeholder)
│   │   ├── types/                     # TypeScript definitions
│   │   │   └── index.ts
│   │   └── middleware.ts              # Next.js middleware
│   │
│   ├── scripts/                       # Utility & seed scripts
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── postcss.config.js
│   └── tailwind.config.ts
│
├── backend/                           # Phase 2 placeholder
├── game-engine/                       # Phase 2 placeholder
├── ai-service/                        # Phase 2 placeholder
├── supabase/                          # Database migrations
├── docker-compose.yml
├── vercel.json
├── .env.example
└── README.md
```

### Import Path Convention (`@/` alias)

The `@/` alias in `frontend/tsconfig.json` maps to `frontend/src/`:

| Import | Resolves to |
|--------|-------------|
| `@/components/games/BudgetGame` | `frontend/src/components/games/BudgetGame.tsx` |
| `@/components/layout/SupabaseProvider` | `frontend/src/components/layout/SupabaseProvider.tsx` |
| `@/lib/gameState` | `frontend/src/lib/gameState.ts` |
| `@/types` | `frontend/src/types/index.ts` |

---

## Phase 2 (Planned) — Service Extraction

**Goal:** Extract backend, game-engine, and AI concerns into independent services for
independent scaling and team ownership.

### Services to extract (in recommended order):

1. **AI Service** (`/ai-service`) — Cleanest boundary; pure input/output
   - Port `lib/groq.ts` and `lib/rag.ts` to Python FastAPI
   - Replace Next.js API routes `api/rag-query`, `api/generate-scenario`, `api/generate-expenses`

2. **Game Engine** (`/game-engine`) — Server-side rule validation
   - Port XP/badge logic from `lib/gameState.ts`
   - Add anti-cheat score validation

3. **Backend API** (`/backend`) — Auth, leaderboard, user data
   - Replace direct Supabase calls with a typed API layer
   - Add Redis caching for leaderboard

### When to proceed to Phase 2

- Team has members dedicated to each service domain
- Independent deployment/scaling is needed
- Docker/Kubernetes infrastructure is ready
- CI/CD pipelines are established per service

---

## Technology Stack

| Layer | Technology | Status |
|-------|-----------|--------|
| Frontend | Next.js 16, React 18, Phaser 3, Tailwind CSS | ✅ Active |
| Database | Supabase (PostgreSQL + pgvector) | ✅ Active |
| AI / LLM | Groq (Llama 3.1) + HuggingFace embeddings | ✅ Active |
| Backend API | Node.js / Express | 🔜 Phase 2 |
| Game Engine | Python / FastAPI | 🔜 Phase 2 |
| AI Service | Python / FastAPI + LangChain | 🔜 Phase 2 |
| Orchestration | Docker Compose / Kubernetes | 🔜 Phase 2 |
