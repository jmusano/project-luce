# Luce Web Foundation

One-screen Naomi companion for iPad Safari. Soft beige/sage, dual captions, giant talk face, exactly two huge picture choices, no Help chrome. Parent corner is long-press visual + vibrate — never sound.

## Drop-in target

**Temp park:** this web foundation currently lives at **jmusano/project-luce** (repo root) only until org access works.

**Migrate to** `project-luce/luce-app/web/` when org `project-luce` / `luce-app` access returns. Not long-term constitution without explicit Jarrod yes.

Treat this package as a self-contained Vite + React + TypeScript web foundation without pulling Expo, Mini agent, ElevenLabs, or Notion wiring.

## Product lock (this build)

- **One screen only** — no Stories / Folklore / Nature / Feelings / Learn tile home.
- **Talk** — whole face is the talk control; one tap starts a session.
- **Seamless Web Speech session** — after TTS ends, ~400ms pause, then listen again. Mic never opens while Luce is speaking. Short silence ends one utterance, not the session. Hang up on bye/bye-bye/goodbye/see you later/"I am going later", or ~2 minutes quiet. No "are you there?" nag.
- **Captions** — Naomi + Luce every turn (Deaf parents follow on screen).
- **Pictures** — always exactly two huge choices after Luce speaks; tap and/or talk.
- **Allergy** — local tree-nut food filter; never show nuts as food; occasional teach line.
- **Parent corner** — tiny mark, long-press; large visual captions/status + vibrate; clear hang-up; no sound.
- **Wake lock** — Screen Wake Lock while session active (release on hang-up); graceful no-op if unsupported (keeps iPad awake).
- **No** kid Help button, typing field, grades, Expo/Mini/ElevenLabs in this web slice.

## Stack

| Piece | Choice |
|---|---|
| Bundler | Vite 5 |
| UI | React 18 + TypeScript |
| STT / TTS | Web Speech API wrappers (`src/lib/stt.ts`, `tts.ts`) — swap-ready interfaces |
| Mind | Local lightweight beats (`src/lib/mind.ts`) |
| Safety | `src/lib/allergyFilter.ts` (+ Vitest) |
| PWA | `vite-plugin-pwa` + `public/manifest.webmanifest` + icons |

## Layout (top to bottom)

1. Soft Luce face (talk control)
2. Status line (Tap to talk / Listening / Luce is talking)
3. Dual captions
4. Two huge picture choices
5. Hidden parent mark (top-right)

## Scripts

```bash
npm install
npm test
npm run build
npm run dev
```

## Swap points (later)

- `createWebSpeechStt` / `createWebSpeechTts` → Mini / cloud STT or ElevenLabs voice behind the same interfaces.
- `nextTurn` ‒ WebSocket mind on Mac Mini; keep captions + two-picture contract.
- Medical interrupt / parent pager stay out of this foundation (local tripwire + Mini later).

## Not in this package

Git clone of `project-luce`, Expo app shell, Notion logs, Telegram parent ping, on-device model.
