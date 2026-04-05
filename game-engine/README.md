# Game Engine Service (Phase 2)

> **Status:** Placeholder — planned for Phase 2 implementation

This directory will contain the Python game logic service responsible for:

- Server-side game rule validation
- XP / progression calculations
- Plug-and-play game mechanics (budgeting, trading, quiz, café)
- Anti-cheat validation for score submissions

## Planned Structure

```
game-engine/
├── app/
│   ├── main.py
│   ├── api/routes/
│   ├── core/
│   │   ├── mechanics/
│   │   │   ├── budgeting.py
│   │   │   ├── trading.py
│   │   │   ├── quiz.py
│   │   │   └── cafe.py
│   │   └── progression/
│   ├── plugins/        # Modular game plugin registry
│   └── models/
├── tests/
├── requirements.txt
├── pyproject.toml
└── Dockerfile
```

## Phase 2 Migration Notes

Currently, game logic lives in:
- `frontend/src/components/games/` — React component logic
- `frontend/src/lib/gameState.ts` — XP thresholds, badge checks, state helpers

When extracting to this service:
1. Port XP / badge logic from `gameState.ts` to Python
2. Build FastAPI endpoints for game action validation
3. Implement the plugin registry for modular game mechanics
4. Connect from the frontend via the Backend API
