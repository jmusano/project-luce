# Luce Web

One-screen talking companion for Naomi. Soft beige/sage preschool UI, Web Speech STT/TTS, dual captions, two giant picture choices, silent parent corner.


## Temporary park

**Temp park:** this web foundation currently lives at **https://github.com/jmusano/project-luce** (repo root) only until org access works. Migrate to `project-luce/luce-app/web/` when org access returns.
## Drop-in for GitHub

This package is a **drop-in foundation** for:

```
project-luce/luce-app/web/
```

Copy the contents of this folder into that path (or use it as the `web/` package root). It is intentionally free of Expo, Mac Mini agent, ElevenLabs, and Notion — those plug in later behind the STT/TTS/mind interfaces.

See **FOUNDATION.md** for the product lock and architecture notes.

## Quick start

```bash
npm install
npm run dev
```

Open the local Vite URL on a browser with Web Speech (Chrome/Edge desktop, or Safari on iPad after mic permission).

```bash
npm test
npm run build
```

## Scripts

| Script | What |
|---|---|
| `npm run dev` | Vite dev server |
| `npm test` | Vitest (allergy filter) |
| `npm run build` | `tsc -b` + production bundle |
| `npm run preview` | Preview the production build |

## PWA

- `public/manifest.webmanifest`
- Icons: `favicon.svg`, `luce-icon.svg`, `pwa-192.png`, `pwa-512.png`
- Service worker via `vite-plugin-pwa` (autoUpdate)

## iPad Safari notes

- Prefer **Add to Home Screen** for standalone display and fewer chrome distractions.
- Mic/speech require a **user gesture** to start the first session (face tap).
- `webkitSpeechRecognition` can end utterances aggressively; the session loop re-arms listen after TTS (~400ms).
- `speechSynthesis` voices may load asynchronously; soft female English voice is preferred when available.
- `navigator.vibrate` is limited/unavailable on many iPads — parent long-press still opens the visual panel.
- Use HTTPS (or localhost) for mic permission.
- Landscape + safe-area insets are handled in CSS; keep the one-screen layout (no tile home).

## License

Private — Musano family / project-luce. Not for public grok.me discovery.
