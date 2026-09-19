# Endgame

A static chess endgame practice room, published at https://junjiepeng.github.io/Chess-endgame-app/. Serve `dist/` using any local HTTP server. Chess rules use chess.js 1.4.0 and the automated opponent uses Stockfish.js 17.1 lite single-threaded in a Web Worker.

24 curated promotion, checkmate and defensive-draw exercises can be played as White or mirrored as Black. Features include English/Chinese, adjustable opponent skill (0–20), full-strength hints, optional evaluation and board aids, click or touch drag moves, arrows and marks, move review, undo, promotion choices, keyboard navigation, and move sounds. The library includes Lucena and Philidor, connected and protected passed pawns, bishop and knight endings, and rook/knight underpromotion. Search in either language, filter by theme, level or completion, or use Surprise me to prioritise unfinished positions.

Settings, per-colour results (including successful defensive draws), daily completion streaks and the current game are saved locally. Your progress offers validated JSON backup export/import. Language and mute preferences are initially inherited from the opening trainer when available on the same origin; its progress and other settings are never changed. There is no cloud sync or account requirement.

Progress changes merge across open tabs using Web Locks where available. An idle tab preserves the latest saved game and settings. Damaged autosaved positions are discarded independently of valid results; manual backup imports remain strictly validated. Superseded queued engine analyses are skipped, and engine failures can be retried.

The installable app caches lessons, pieces and the complete engine for offline practice after the initial download. Font loading is optional and does not block practice. Third-party attributions and license links are in `dist/credits.html`.

## Publishing

The `Publish GitHub Pages` workflow deploys `dist/` on every push to `main`, and can also be run manually. Relative asset paths support GitHub Pages repository URLs and local preview.

**Bump the cache version in `dist/sw.js` whenever an app asset changes.** App assets are cached as a complete release; returning visitors see an update banner. Reloading from that banner first saves their game and activates the new worker. Cache cleanup is restricted to this app's `endgame-` prefix, so it does not affect the opening trainer.

The `.openai/hosting.json` file records the original, unpublished Sites registration; GitHub Pages is the active hosting destination.

## Lesson checks

All 24 starting positions have been checked against the [Lichess tablebase](https://github.com/lichess-org/lila-tablebase). `tests/positions.json` stores the verified FENs, outcomes and outcome-preserving first moves. Run `node --test tests/*.test.mjs` to check lesson integrity, mirrored positions, underpromotion, defensive draw scoring, backup compatibility, concurrent saves, long-game recovery, engine retries and app updates. These fixtures are authoring checks; practice still works completely offline.
