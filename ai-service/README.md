# AI Service (Phase 2)

> **Status:** Placeholder — planned for Phase 2 implementation

This directory will contain the Python RAG (Retrieval-Augmented Generation) service for:

- Socratic financial tutoring (AI tutor assistant)
- Dynamic scenario generation for financial dilemmas
- Document embedding and semantic search over financial literacy content
- Contextual hints based on player game state

## Planned Structure

```
ai-service/
├── app/
│   ├── main.py
│   ├── api/routes/
│   │   └── tutor.py
│   ├── core/
│   │   ├── rag.py
│   │   ├── embeddings.py
│   │   └── llm.py
│   └── config/
│       └── settings.py
├── docs/
│   └── knowledge_base/   # Financial literacy PDFs
├── requirements.txt
├── pyproject.toml
└── Dockerfile
```

## Phase 2 Migration Notes

Currently, AI logic lives in:
- `frontend/src/lib/groq.ts` — Groq LLM API calls & scenario generation
- `frontend/src/lib/rag.ts` — RAG pipeline with HuggingFace embeddings + Supabase vector store
- `frontend/src/app/api/rag-query/` — RAG query endpoint
- `frontend/src/app/api/generate-scenario/` — Scenario generation endpoint
- `frontend/src/app/api/generate-expenses/` — Expense generation endpoint
- `frontend/scripts/pdfs/` — Knowledge base documents

When extracting to this service:
1. Port `groq.ts` and `rag.ts` to Python using LangChain or LlamaIndex
2. Build FastAPI endpoints mirroring existing Next.js API routes
3. Set up a proper vector database (pgvector or Pinecone)
4. Replace frontend API calls to point to this service
