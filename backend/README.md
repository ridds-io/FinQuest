# Backend Service (Phase 2)

> **Status:** Placeholder — planned for Phase 2 implementation

This directory will contain the Node.js / Express API server that handles:

- Authentication & session management
- User data persistence (profiles, progress, leaderboard)
- Game session orchestration
- Real-time events (WebSocket / Supabase Realtime)

## Planned Structure

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── games/
│   │   ├── leaderboard/
│   │   └── rewards/
│   ├── shared/
│   │   ├── database/
│   │   ├── middleware/
│   │   └── utils/
│   └── index.ts
├── tests/
├── package.json
├── tsconfig.json
└── Dockerfile
```

## Phase 2 Migration Notes

Currently, backend logic is handled by:
- Next.js API routes in `frontend/src/app/api/`
- Supabase client calls in frontend components
- `frontend/src/lib/supabase-server.ts` for server-side queries

When extracting to this service:
1. Move API routes to Express controllers
2. Replace direct Supabase calls with service-layer abstractions
3. Add Redis caching for leaderboard data
4. Implement proper JWT authentication middleware
