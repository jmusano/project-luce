# Luce Web Foundation

One-screen Naomi companion for iPad Safari. Soft beige/sage, dual captions, giant talk face, exactly two huge picture choices, no Help chrome. Parent corner is long-press visual + vibrate — never sound.

## Drop-in target

**Temp park:** this web foundation currently lives at **jmusano/project-luce** (repo root) only until org access works.

**Migrate to** `project-luce/luce-app/web/` when org `project-luce` / `luce-app` access returns. Not long-term constitution without explicit Jarrod yes.

Treat this package as a self-contained Vite + React + TypeScript web foundation without pulling Expo, Mini agent, ElevenLabs, or Notion wiring.

## Product lock (this build)

- **One screen only** — no Stories / Folklore / Nature / Feelings / Learn tile home.
- **Talk** — whole face is the talk control; one tap starts a session.
- **Seamless Web Speech session** — after TTS ends, ~400ms pause, then listen again. Mic never opens while Luce is speaking. Short silence ends one utterance, not the session. Hang up on bye/bye-bye/goodbye/see you later/see ya/night-night/"I am going later"/gotta go, or ~2 minutes quiet. No "are you there?" nag.
- **Captions** — Naomi + Luce every turn (Deaf parents follow on screen).
- **Pictures** — always exactly two huge choices after Luce speaks; tap and/or talk.
- **Allergy** — hard local interrupt on nut-food talk; never show nuts as food (labels/emoji); teach line that nuts make Naomi sick.
- **Parent corner** — tiny mark, long-press; visual + captions + vibrate; no sound. Optional first-run Add to Home Screen tip lives only here (never kid chrome).
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
2. Status line (Tap Luce to talk / Your turn — listening / Luce is talking)
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

## TTS (soft preschool voice)

Web Speech defaults in `src/lib/tts.ts` target a warm preschool-teacher storyteller for Naomi (~3):

- Rate ~0.92, pitch ~1.05
- Prefer warm female English voices (iPad/iOS: Samantha, Karen, Moira, Fiona, Tessa, Victoria, …)
- Pure helpers `pickVoice` / `scoreSoftPreschoolVoice` are unit-tested

Later swap: same `TextToSpeech` interface → ElevenLabs / Mini.

## Private preview (Cloudflare Pages)

- Host: Cloudflare Pages project `luce-naomi` (password gate via Pages Functions).
- Live preview: https://luce-naomi.pages.dev (family password gate; password is not in this repo).
- Gate: `functions/` (Charca-style cookie auth). Env var **`CFP_PASSWORD`** must be set or the site returns 503 (fail closed).
- Parents open the `*.pages.dev` URL → enter family password once → cookie lasts ~1 week.
- Dashboard: Pages → Settings → Functions → **Fail closed** on.
- Never commit the password. Never leave `CFP_PASSWORD` unset in production.
