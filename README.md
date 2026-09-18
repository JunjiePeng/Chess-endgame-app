# Endgame

A static chess endgame practice room. Serve `dist/` using a local HTTP server. Chess rules use chess.js 1.4.0 and the automated opponent uses Stockfish.js 17.1 lite single-threaded in a Web Worker.

Six curated positions include promotion and checkmate objectives, progressive hints, legal moves, promotion choices, undo, restart, board rotation, keyboard board navigation, and session completion. No account, API key, or external chess API is required. Fonts are optional remote assets; the app and engine are hosted locally with the site.

Third-party attribution and license links are in `dist/credits.html`.

## Publishing

The website is published on GitHub Pages from `dist/`. The `Publish GitHub Pages` workflow deploys every push to `main`, and can also be run manually in GitHub Actions. Relative asset paths allow the app to work at a GitHub Pages repository URL and in a local preview.

The `.openai/hosting.json` file records the original, unpublished Sites registration; GitHub Pages is the active hosting destination.
