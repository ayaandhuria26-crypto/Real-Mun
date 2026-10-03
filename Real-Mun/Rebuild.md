# Real-MUN — Complete Rebuild Blueprint


> **What this is:** A complete spec that lets Claude Code (or any capable AI coding assistant) recreate the Real-MUN web application from scratch on a fresh computer. It contains:
> - Tech stack with exact versions
> - All environment variables
> - The full file/folder structure
> - Every Claude / LLM **system prompt verbatim** (these are the most important contents)
> - All static data verbatim (committees, countries, topics, learn content, voices)
> - The architecture and behavior of every page, API route, and library file
> - Step-by-step rebuild instructions
>
> **How to use it:** On a new computer, open Claude Code in an empty folder and paste this entire document as the first prompt with the instruction: "Read this rebuild blueprint and recreate the entire Real-MUN project as described. Implement file-by-file, in the order I have laid out."
>
> **Reproduction fidelity:** Functionally identical. UI may differ in small stylistic ways (variable names, code organization) but every feature, prompt, behavior, data structure, and API contract will match the original. Set the same environment variables and the rebuilt app will behave the same.
>
> ---


## Table of Contents


1. Project overview
2. Tech stack (exact versions)
3. Prerequisites and bootstrap commands
4. Environment variables
5. Top-level configuration files
6. Full file tree
7. Library layer (`src/lib/`) — pure functions
8. The Mock Conference engine (`src/lib/conference/`) — biggest subsystem
9. API routes (`src/app/api/`)
10. Pages (`src/app/...page.tsx`)
11. Components (`src/components/`)
12. Global styles & theming
13. Middleware & auth
14. Audio system (TTS + STT)
15. Worker dashboard
16. Verbatim prompts appendix (REFERENCE — read this section carefully)
17. Verbatim static data appendix
18. Deployment notes
19. Verification checklist


---


## 1. Project Overview


**Real-MUN** is a Next.js 15 web app that trains delegates for Model UN conferences. It has four user-facing sections plus a worker admin dashboard:


| # | Section | Route | What it does |
|---|---|---|---|
| 1 | Homepage | `/` | Landing + marketing for the four training tools |
| 2 | Learn the Basics | `/learn` | Static learning content: parli pro, MUN vocab, speaking tips, position-paper structure, bloc strategy, rookie traps |
| 3 | Position Paper Feedback | `/position-paper` | 4-step flow (committee → country → topic → paste paper) → LLM grades on 5 dimensions and returns structured feedback in ~30s |
| 4 | 1-on-1 Sessions | `/sessions` | Booking flow for live coaching: pick topic → coach → date → time → contact details → confirmation email |
| 5 | Mock Conference | `/conference` + `/conference/live` | 30-minute simulated committee: a Chair, 3 AI delegates, and you. Full parliamentary procedure with motions, caucuses, speeches, then AI-generated post-session feedback |


Plus:
- **Auth**: two-step (email → 6-digit code → password). Two roles: `user` (delegate) and `worker` (admin).
- **Dias AI** support chatbot — a floating chat widget on every page (except live conference) that answers questions about Real-MUN.
- **Worker dashboard** at `/worker` (gated by middleware) showing submitted papers, completed mock sessions, and bookings.


**Brand voice**: Founded by **Ayaan Dhuria** — 2 years on the MUN circuit, 3 competitive conferences, 1 Best Delegate, 1 Honorable Mention. Contact: `ayaandhuria26@gmail.com`, phone `804-297-1800`. Visual: cream/paper background (`#f8f7f4`) with deep ink text (`#0a0e1a`) and a gold accent (`#b8860b` / `#d4a017`). Display font is Georgia serif.


---


## 2. Tech Stack (Exact Versions)


```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.39.0",
    "@google/generative-ai": "^0.24.1",
    "@supabase/ssr": "^0.5.2",
    "@supabase/supabase-js": "^2.47.10",
    "@xstate/react": "^5.0.0",
    "clsx": "^2.1.1",
    "msedge-tts": "^2.0.5",
    "next": "^15.5.4",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "xstate": "^5.19.0",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.0.0-beta.8",
    "@types/node": "^22.10.5",
    "@types/react": "^19.0.2",
    "@types/react-dom": "^19.0.2",
    "postcss": "^8.4.49",
    "tailwindcss": "^4.0.0-beta.8",
    "typescript": "^5.7.2"
  }
}
```


Scripts in `package.json`:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint"
}
```


Project metadata: `"name": "real-mun"`, `"version": "0.1.0"`, `"private": true`.


**Notes about what's used and what's stubbed:**
- `@supabase/*` and `xstate` / `@xstate/react` are installed but not actively wired up. All persistence is currently in-memory (see `src/lib/store.ts`). These are kept as deps because future work will move persistence to Supabase and the orchestrator may move to a formal XState machine.
- `@google/generative-ai` is actively used (primary LLM provider).
- `msedge-tts` is the Chair's voice.
- `@anthropic-ai/sdk` is the fallback LLM provider.


**Node/npm:** Node 20+, npm 10+.


---


## 3. Prerequisites and Bootstrap Commands


On the target machine:


```bash
# 1. Create the Next.js scaffold (or do this manually if you want full control).
#    Use TypeScript, Tailwind, App Router, no src dir prompt = NO (we DO use src/).
npx create-next-app@latest real-mun --typescript --tailwind --app --src-dir --import-alias "@/*" --no-eslint


cd real-mun


# 2. Install runtime deps (matching versions above)
npm install @anthropic-ai/sdk@^0.39.0 \
  @google/generative-ai@^0.24.1 \
  @supabase/ssr@^0.5.2 @supabase/supabase-js@^2.47.10 \
  @xstate/react@^5.0.0 xstate@^5.19.0 \
  clsx@^2.1.1 msedge-tts@^2.0.5 zod@^3.24.1


# 3. Tailwind v4 beta (already installed by create-next-app uses v3 — upgrade):
npm install -D @tailwindcss/postcss@^4.0.0-beta.8 tailwindcss@^4.0.0-beta.8


# 4. (Tailwind v4 doesn't use a tailwind.config.js — the theme lives inside globals.css with @theme blocks.)


# 5. Create .env.local from the template (see section 4) and fill in keys.


# 6. Run
npm run dev
# Open http://localhost:3000
```


---


## 4. Environment Variables


Create `.env.local` (git-ignored). `.env.example` is the template kept in the repo.


### `.env.example` (exact contents)


```env
# ---------------------------------------------------------------
# .env.example — TEMPLATE ONLY. Do NOT put real API keys in here.
# Copy this to .env.local (git-ignored) and put your real values there.
# ---------------------------------------------------------------


# =========================================================================
# LLM providers — configure as many as you like; calls cascade with auto-fallback.
# When one rate-limits, the site automatically tries the next.
# =========================================================================


# 1) Google Gemini — get key at https://aistudio.google.com (~250 req/day free)
GEMINI_API_KEY=
# GEMINI_MODEL=gemini-flash-latest


# 2) Groq — get key at https://console.groq.com (~14,400 req/day free, very fast)
GROQ_API_KEY=
# GROQ_MODEL=llama-3.3-70b-versatile


# 3) Cerebras — get key at https://cloud.cerebras.ai (~14,400 req/day free, fastest)
CEREBRAS_API_KEY=
# CEREBRAS_MODEL=llama-3.3-70b


# Optional Anthropic fallback (paid)
ANTHROPIC_FOUNDRY_API_KEY=
AZURE_FOUNDRY_BASE_URL=https://YOUR-RESOURCE.services.ai.azure.com/anthropic
ANTHROPIC_API_KEY=


# --- Auth ---
WORKER_EMAIL=ayaandhuria26@gmail.com
WORKER_PASSWORD=set-a-strong-password
AUTH_SECRET=change-me-to-a-random-string


# --- Email verification (optional). Sign up free at https://resend.com ---
# Free tier: 3,000 emails/month, no credit card.
# Without this, codes are shown on the sign-in page in DEV mode.
RESEND_API_KEY=


# --- OpenAI Whisper (optional). Only needed if you want a Whisper STT fallback. ---
OPENAI_API_KEY=


# --- TTS (Microsoft Edge — FREE, no key needed) ---
EDGE_TTS_CHAIR_VOICE=en-US-AvaMultilingualNeural
```


### What's used where


| Variable | Required? | Used by |
|---|---|---|
| `GEMINI_API_KEY` | At least one LLM is required | Primary LLM in fallback chain (`src/lib/llm.ts`) |
| `GROQ_API_KEY` | optional | Second LLM in chain |
| `CEREBRAS_API_KEY` | optional | Third LLM in chain |
| `ANTHROPIC_FOUNDRY_API_KEY` + `AZURE_FOUNDRY_BASE_URL` | optional | Anthropic via Azure pass-through |
| `ANTHROPIC_API_KEY` | optional | Direct Anthropic |
| `WORKER_EMAIL` | yes (has default) | Auth — which email is allowed as worker. Default: `ayaandhuria26@gmail.com` |
| `WORKER_PASSWORD` | yes (has default) | Default: `set-a-strong-password` |
| `AUTH_SECRET` | yes (has default fallback `real-mun-dev-secret`) | HMAC signing secret for session cookies |
| `RESEND_API_KEY` | optional | If set, sends real verification + booking emails. If unset, code is shown on-screen in dev mode |
| `RESEND_FROM` | optional | Defaults to `Real-MUN <onboarding@resend.dev>` |
| `OPENAI_API_KEY` | optional | Only used if browser Web Speech API not supported — falls back to Whisper |
| `EDGE_TTS_CHAIR_VOICE` | optional | Default `en-US-AvaMultilingualNeural` |
| `ANTHROPIC_MODEL_SONNET`, `_HAIKU`, `_OPUS` | optional | Override Claude model IDs |
| `NEXT_PUBLIC_SITE_URL` | optional | Used as `metadataBase` |


---


## 5. Top-Level Configuration Files


### `next.config.ts`
```ts
import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  /* config options here */
};


export default nextConfig;
```
(Nothing custom — vanilla Next.js config.)


### `tsconfig.json`
Standard Next.js TypeScript config with `"paths": { "@/*": ["./src/*"] }` for the import alias. Use whatever `create-next-app --typescript` produces.


### `postcss.config.mjs`
```mjs
const config = {
  plugins: ["@tailwindcss/postcss"],
};
export default config;
```


### `.gitignore` (standard Next.js)
- `node_modules`, `.next`, `.env.local`, `.env*.local`, `.vercel`, `*.tsbuildinfo`, etc.


---


## 6. Full File Tree


```
real-mun/
├── .env.example
├── .env.local                   # not committed
├── .gitignore
├── next.config.ts
├── next-env.d.ts                # auto-generated
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── README.md
├── SETUP.md
├── VERCEL.md
├── tsconfig.json
├── scripts/
│   └── test-conference.mjs      # optional dev script (can be omitted)
└── src/
    ├── middleware.ts
    ├── app/
    │   ├── globals.css
    │   ├── icon.svg
    │   ├── layout.tsx
    │   ├── not-found.tsx
    │   ├── opengraph-image.tsx
    │   ├── page.tsx                       # homepage
    │   ├── robots.ts
    │   ├── sitemap.ts
    │   ├── learn/page.tsx
    │   ├── position-paper/page.tsx
    │   ├── sessions/page.tsx
    │   ├── sign-in/page.tsx
    │   ├── contact/page.tsx
    │   ├── conference/
    │   │   ├── page.tsx                   # setup
    │   │   └── live/page.tsx              # live simulation
    │   ├── worker/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx                   # overview
    │   │   ├── papers/page.tsx
    │   │   ├── sessions/page.tsx
    │   │   └── bookings/page.tsx
    │   └── api/
    │       ├── auth/
    │       │   ├── me/route.ts
    │       │   ├── send-code/route.ts
    │       │   ├── sign-in/route.ts
    │       │   └── sign-out/route.ts
    │       ├── bookings/route.ts
    │       ├── conference/
    │       │   ├── start/route.ts
    │       │   ├── turn/route.ts
    │       │   └── feedback/route.ts
    │       ├── dias/route.ts
    │       ├── paper-feedback/route.ts
    │       ├── stt/route.ts
    │       ├── tts/route.ts
    │       └── worker/
    │           ├── papers/route.ts
    │           ├── sessions/route.ts
    │           └── bookings/route.ts
    ├── components/
    │   ├── DiasAI.tsx
    │   ├── FeedbackView.tsx
    │   ├── Footer.tsx
    │   ├── Nav.tsx
    │   ├── ThemeToggle.tsx
    │   ├── conference/
    │   │   ├── PhaseProgress.tsx
    │   │   ├── SessionFeedback.tsx
    │   │   └── TranscriptFeed.tsx
    │   └── worker/
    │       └── Search.tsx
    └── lib/
        ├── anthropic.ts
        ├── auth.ts
        ├── client-audio.ts
        ├── dias-knowledge.ts
        ├── email-codes.ts
        ├── email.ts
        ├── learn-content.ts
        ├── llm.ts
        ├── mun-data.ts
        ├── store.ts
        ├── voices.ts
        └── conference/
            ├── agents.ts
            ├── chair-templates.ts
            ├── director.ts
            ├── orchestrator.ts
            ├── overseer.ts
            ├── prompts.ts
            └── types.ts
```


---


## 7. Library Layer (`src/lib/`)


### `src/lib/anthropic.ts` — Anthropic SDK client
Supports two modes:
1. **Azure Foundry pass-through** (if `AZURE_FOUNDRY_BASE_URL` + `ANTHROPIC_FOUNDRY_API_KEY` set): uses `baseURL` and adds `api-key` header.
2. **Direct Anthropic** (if `ANTHROPIC_API_KEY` set): standard SDK.


Exports:
- `anthropic` — configured `new Anthropic({ ... })` client
- `MODEL_SONNET` = `process.env.ANTHROPIC_MODEL_SONNET || "claude-sonnet-4-6"`
- `MODEL_HAIKU` = `process.env.ANTHROPIC_MODEL_HAIKU || "claude-haiku-4-5-20251001"`
- `MODEL_OPUS` = `process.env.ANTHROPIC_MODEL_OPUS || "claude-opus-4-5"`
- `isAnthropicConfigured(): boolean`
- `ANTHROPIC_NOT_CONFIGURED_MESSAGE` — friendly error string
- Logs a `console.warn` at module load if no key is configured.


### `src/lib/llm.ts` — Multi-provider LLM with auto-fallback


This is the workhorse for all LLM calls. Provider order (built once at module load, only includes providers with keys present):


1. **Gemini** (`GEMINI_API_KEY`) — model defaults to `gemini-flash-latest`
2. **Groq** (`GROQ_API_KEY`) — OpenAI-compatible HTTP, model `llama-3.3-70b-versatile`
3. **Cerebras** (`CEREBRAS_API_KEY`) — OpenAI-compatible HTTP, model `qwen-3-235b-a22b-instruct-2507`
4. **Anthropic** — uses the SDK from `anthropic.ts`, model `MODEL_SONNET`, with `cache_control: { type: "ephemeral" }` on system prompt for prompt caching


Hard timeout per call: **18 seconds**.


A call that returns status 429/503/504, throws an empty-response error, or times out triggers fallthrough to the next provider. Other errors re-throw immediately.


Public API:
- `chat(opts: { system, user, maxTokens?, temperature?, json? }): Promise<string>`
- `chatJson<T>(opts): Promise<T>` — same but parses JSON (strips ```json fences if present)
- `isLlmConfigured(): boolean`
- `configuredProviders(): string[]`
- `LLM_NOT_CONFIGURED_MESSAGE` constant


For Anthropic in JSON mode, output is cleaned by stripping any leading ```json and trailing ``` before returning.


The internal `CallOpts` type:
```ts
type CallOpts = {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
  json?: boolean;
};
```


Each provider call: `withTimeout(p, 18_000, "providerName")`. Custom errors: `EmptyResponseError` (status 503) and `TimeoutError` (status 504). `nonEmpty` helper throws `EmptyResponseError` if trimmed response is empty.


For Gemini: uses `model.generateContent(opts.user)` with `systemInstruction`, `maxOutputTokens` (default 1024), `temperature` (default 0.7), `responseMimeType: "application/json"` when JSON.


For OpenAI-compatible (Groq, Cerebras): POSTs `{ model, messages: [{system}, {user}], max_tokens, temperature, response_format }` with `Authorization: Bearer <key>`.


For Anthropic: `anthropic.messages.create({ model: MODEL_SONNET, max_tokens, temperature, system: [{ type: "text", text, cache_control: { type: "ephemeral" } }], messages: [{ role: "user", content }] })`, then `msg.content.filter(b => b.type === "text").map(b => b.text).join("")`.


### `src/lib/auth.ts` — Session cookies (HMAC-signed)


```ts
export type Role = "user" | "worker";
export const SESSION_COOKIE = "realmun_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
```


A session is encoded as `username|role|expiresAt|hmacSignature`. The HMAC is `crypto.subtle.sign("HMAC", key, encoded(payload))` with `SHA-256` and the key from `process.env.AUTH_SECRET || "real-mun-dev-secret"`. Base64URL encoded.


Functions:
- `encodeSession(session: Session): Promise<string>`
- `decodeSession(raw: string | undefined | null): Promise<Session | null>` — verifies signature, expiry, valid role
- `buildSession(username, role)` — sets expiresAt = `Date.now() + SESSION_TTL_MS`
- `validateSignIn(email, password, role)`:
  - Email must include `@`
  - Password must be `>= 4` chars
  - If role `worker`: email must match `WORKER_EMAIL` (lowercased), password must match `WORKER_PASSWORD`
  - If role `user`: any valid email + 4+ char password is accepted (no password storage — see project note)
- `getSession(): Promise<Session | null>` — reads cookie from `next/headers`


### `src/lib/email-codes.ts` — 6-digit verification codes (in-memory)


Stores codes in `globalThis.__realmunCodes: Map<email, Entry>`. Each entry: `{ codeHash, expiresAt, attempts }`. TTL = 10 minutes, max attempts = 5. Codes are SHA-256 hashed before storage (never plaintext). One-shot — successful verify deletes the code.


Functions:
- `generateCode(): string` — random 6-digit number
- `saveCode(email, code): Promise<void>`
- `verifyCode(email, code): Promise<boolean>`


### `src/lib/email.ts` — Email sending via Resend


`RESEND_FROM` defaults to `"Real-MUN <onboarding@resend.dev>"`.


Functions:
- `sendVerificationEmail(to, code): Promise<SendResult>` — subject: `Your Real-MUN verification code: <code>`. HTML email with cream `#f8f7f4` background, large monospaced code in white box. If `RESEND_API_KEY` not set, returns `{ ok: false, reason: "No RESEND_API_KEY set", devCode: code }` so the caller can surface the code in dev mode.
- `sendBookingConfirmationEmail(opts)` — confirmation for `/sessions` bookings. Subject: `Confirmed: your Real-MUN session on <date> at <time>`. HTML table of Topic/Coach/Date/Time/Notes.


If `RESEND_API_KEY` is missing, returns `{ ok: false, reason }` instead of throwing.


### `src/lib/store.ts` — In-memory store


Uses `globalThis.__realmunStore = { papers, sessions, bookings }` to survive HMR. **Resets when dev server restarts.**


Types:
- `PaperReport = { id, createdAt, username, committee, country, topic, paperPreview, feedback }`
- `SessionReport = { id, createdAt, username, committee, topic, userCountry, delegates, userSpeechCount, durationMs, feedback, transcript }`
- `BookingReport = { id, createdAt, username, topic, coach, date, time, name, email, notes? }`


Functions:
- `recordPaper`, `recordSession`, `recordBooking` (each returns the saved record with generated `id` + `createdAt = Date.now()`)
- `listPapers`, `listSessions`, `listBookings`
- `getPaper(id)`, `getSessionReport(id)`
- `counts()` returning `{ papers, sessions, bookings }`


`newId()` = `Math.random().toString(36).slice(2, 12)`.


### `src/lib/mun-data.ts` — Committees, countries, topics


**(Verbatim — see Appendix B.)**


### `src/lib/learn-content.ts` — Learn section content


**(Verbatim — see Appendix B.)**


### `src/lib/dias-knowledge.ts` — Dias AI support assistant prompt


**(Verbatim — see Appendix A.)**


### `src/lib/voices.ts` — Browser TTS profiles for delegates


```ts
export type BrowserVoiceProfile = {
  voiceHint: string[];
  rate: number;
  pitch: number;
};


export const DELEGATE_VOICE_PROFILES: BrowserVoiceProfile[] = [
  { voiceHint: ["Google UK English Male", "Daniel", "Microsoft George"], rate: 1.0, pitch: 0.95 },
  { voiceHint: ["Google US English", "Samantha", "Microsoft Zira"], rate: 1.05, pitch: 1.1 },
  { voiceHint: ["Google UK English Female", "Karen", "Microsoft Hazel"], rate: 0.95, pitch: 1.0 },
];
```


### `src/lib/client-audio.ts` — Browser TTS + STT helpers


**(Big file — see section 14 for the full behavior breakdown.)**


---


## 8. Mock Conference Engine (`src/lib/conference/`)


This is the largest subsystem. Six files:


### `src/lib/conference/types.ts`
Defines all types for the conference system. **(Verbatim — see Appendix C.)** Key types:
- `Persona` = `"diplomatic" | "aggressive" | "coalition_builder" | "technical" | "quiet"`
- `DelegateConfig` = `{ id: "d1"|"d2"|"d3", country, persona, shortDescription }`
- `ConferenceSetup` = `{ committee, topic, userCountry, delegates: [DelegateConfig×3], totalDurationMs }`
- `PhaseType` — 10 values listed verbatim in appendix
- `Phase` = `{ type, topicFocus?, durationMs, individualSpeakingTimeSec?, speakerOrder?, description }`
- `SessionPlan` = `{ phases: Phase[] }`
- `TranscriptEntry` = `{ id, role: "chair"|"delegate"|"user"|"system", speaker, text, timestamp }`
- `FloorRequest` — placard | motion | null
- `ConferenceState` — the full state object
- `TurnResponse` — discriminated union of `speech | user-floor | phase-transition | session-ended`


### `src/lib/conference/director.ts` — Plans the session


`planSession(setup): Promise<SessionPlan>` — **deterministic, not LLM**. Despite the file's earlier history calling an LLM, the current implementation builds the 30-minute plan algorithmically because real MUN structure is well-known.


The plan has 11 phases:


| # | Phase type | Duration | Notes |
|---|---|---|---|
| 0 | `roll_call` | 45s | Chair calls roll |
| 1 | `motion_open_debate` | 25s | AI delegate motions |
| 2 | `gsl_setup` | 25s | Speakers' list via placards |
| 3 | `opening_speeches` | ~30% of remaining | 75s per speaker. Speaker order: `["user", c0, c1, c2]` — **user goes FIRST** |
| 4 | `motion_mod_caucus` | 25s | AI delegate motions |
| 5 | `moderated_caucus` | ~22% | topicFocus = `"Concrete mechanisms for <topic>"`, 50s/speaker, order `["user", c0, c1, c2, "user"]` |
| 6 | `motion_unmod_caucus` | 25s | AI delegate motions |
| 7 | `unmoderated_caucus` | ~18% | "Bloc formation and working paper drafting" |
| 8 | `motion_mod_caucus` | 25s | Second motion |
| 9 | `moderated_caucus` | ~18% | topicFocus = `"Bridging proposals and finalizing resolution language"`, 50s/speaker, order `["user", c2, c0, c1]` |
| 10 | `closing` | 60s | LLM-generated closing remarks |


Where `c0/c1/c2` are the 3 delegate countries. The 30-minute total = `setup.totalDurationMs` (default `30 * 60_000`).


### `src/lib/conference/chair-templates.ts` — Deterministic Chair lines


**(Verbatim — see Appendix D.)** This file holds all the templated procedural Chair lines so we don't pay LLM cost for boilerplate. The orchestrator only falls back to LLM-generated Chair speech for the closing remarks and unrecognized user motions.


Key exports:
- `rollCallOpening(setup)`, `motionOpenDebateOpening(setup)`, `gslSetupOpening()`, `gslAnnouncement(order, userCountry, speakingTimeSec)`, `openingSpeechesOpening(setup, phase)`, `motionModCaucusOpening(setup, phase)`, `moderatedCaucusOpening(setup, phase)`, `motionUnmodCaucusOpening()`, `unmoderatedCaucusOpening(phase)`, `votingOpening()`
- `recognizeNext(speaker, country?)` — randomly picks from 3 phrasings
- `recognizeUserPlacard(country)`
- `delegateMotion(delegate, motion, topicFocus?)` — for AI delegates motioning
- `chairAcceptsMotion()` — "Are there any objections? Seeing none, the motion passes." (3 variants)
- `placardResponse(country)` — for AI delegates raising placards
- `acknowledgeMotion(country, motion, details, setup)` — handles user-submitted motions. Recognized motion keywords: "moderated caucus", "unmoderated caucus", "extend", "point of inquiry", "point of order", "close debate", "introduce" + "resolution". Returns `null` if unrecognized (orchestrator then calls LLM).
- `closingTransition(nextPhaseType?)` — "Time. The committee will proceed." (with variants for closing/voting)
- `phaseOpenTemplate(setup, phase)` — dispatcher returning the right opener for each `PhaseType`, except `closing` which returns `null` (LLM-generated).


### `src/lib/conference/prompts.ts` — LLM system prompts


**(Verbatim — see Appendix A.)** This file is the most important to preserve identically. It defines:
- `directorSystemPrompt()` — used if/when director becomes LLM-based again
- `chairSystemPrompt(setup)` — used by `chairSpeak()` for closing remarks and unrecognized motions
- `delegateSystemPrompt(setup, delegate)` — used by every delegate LLM call
- `compactTranscript(entries, maxEntries = 12)` — helper that joins recent transcript entries into a single string for the user prompt
- `phaseBrief(phase, currentSpeaker)` — helper that formats the current phase info into a string
- `userFeedbackPrompt()` — end-of-session feedback prompt


### `src/lib/conference/agents.ts` — Thin wrappers around LLM calls


```ts
chairSpeak({ setup, phase, transcript, instruction }): Promise<string>
delegateSpeak({ setup, delegate, phase, transcript, isUnmoderated? }): Promise<string>
```


Both build a user prompt from `phaseBrief() + compactTranscript() + instruction/recognition`, then call `chat()` from `llm.ts`.


Chair: `maxTokens: 3000, temperature: 0.6`.


Delegate: `maxTokens: isUnmoderated ? 1500 : phase.type === "opening_speeches" ? 4096 : 2500, temperature: isUnmoderated ? 1.0 : 0.85`.


Generous token limits because Gemini's "thinking" eats output tokens before producing visible text. The overseer truncates the visible output afterward.


### `src/lib/conference/overseer.ts` — Quality gate


Invisible layer that runs after every agent speech. Three functions:


`maxWordsForPhase(phase)` — caps:
- `opening_speeches` → 130 words
- `moderated_caucus` → 100
- `unmoderated_caucus` → 35
- `closing` → 90
- default → 80


`normalizeWhitespace(text, ownCountry?)`:
- Strips non-Latin script characters (CJK, Cyrillic, Arabic, Hebrew, Devanagari) — regex covers code blocks `Ѐ-ӿԀ-ԯ֐-׿؀-ۿ܀-ݏऀ-ॿ　-〿぀-ゟ゠-ヿ㐀-䶿一-鿿가-힯豈-﫿＀-￯`
- Collapses whitespace, trims
- Strips self-labeling like `"Brazil:"`, `"[Brazil]"`, `"Brazil -"`, `"The delegation of Brazil:"`
- Strips meta-commentary leakage like `"or implies it"`, `"to be safe:"`, `"Here is my speech:"`, `"Response:"`, etc.
- Strips leading non-letter characters


`trimToWordCap(text, maxWords)`:
- If under cap AND ends with sentence punctuation `[.!?…]`, return as-is
- Otherwise slice to cap, then snap back to last full sentence
- If no sensible boundary, drop the partial final word and add ellipsis


`maxTurnsForPhase(phase)` — soft cap on number of turns per phase before the overseer forces a transition:
- `roll_call` → 8
- `opening_speeches` → `(speakerOrder.length ?? 4) + 2`
- `moderated_caucus` → `(speakerOrder.length ?? 5) + 2`
- `unmoderated_caucus` → 8
- default → 4


### `src/lib/conference/orchestrator.ts` — Turn manager


`nextTurn(state)` is the only export. Returns `{ response, newEntries, advance }`.


Logic in order:
1. If session ended or past last phase → return `session-ended`.
2. If user has a pending **placard** → emit chair recognition (`recognizeUserPlacard`), give user the floor, clear request.
3. If user has a pending **motion** → run `acknowledgeMotion(...)`; if it returns null, call `chairSpeak()` for an LLM acknowledgement. Clear request, continue.
4. If `lastOpenedPhaseIndex !== phaseIndex` → call `openPhase()` which:
   - Looks up the templated opener (or LLM-generates the closing).
   - For phase types `motion_open_debate`, `motion_mod_caucus`, `motion_unmod_caucus`: BUNDLES three entries — chair invites motion, delegate motions (templated), chair accepts (templated).
   - For `gsl_setup`: bundles 3 placard responses from delegates, then announces the speakers' list.
   - For `opening_speeches` / `moderated_caucus`: bundles chair opener + first speaker (delegate LLM or user-floor handoff).
5. Otherwise, check overrun (time-up or `turnsThisPhase >= maxTurnsForPhase(phase) + 2`) → transition phase.
6. Otherwise → `dispatchSpeaker(state)`:
   - **roll_call**: walks the roster `[d1, d2, d3, userCountry]`. For each delegate, emits `"Country?"` then `"Present."` (40% chance) or `"Present and voting."` (60%). For the user, gives the floor with `"Country?"` as the chair line so the UI can show the roll-call prompt with Present / Present-and-voting buttons.
   - **unmoderated_caucus**: cycles through delegates `speakerQueueIndex % 3`, each calling `delegateSpeak({ isUnmoderated: true })`.
   - Procedural phases (`motion_*`, `gsl_setup`): if reached, just transition.
   - **opening_speeches / moderated_caucus**: walk `phase.speakerOrder`. If next is `"user"`, hand off floor with `recognizeNext("user", userCountry)`. If a delegate, bundle chair recognition (templated) + LLM speech.


`transitionPhase(state)`:
- Increments `phaseIndex`, resets `speakerQueueIndex = 0`, sets `phaseStartedAt = Date.now()`.
- If both the leaving phase and the entering phase are procedural (the `isProc(t)` helper covers `motion_*`, `gsl_setup`, `roll_call`), skip the "Time." handoff line because the motion-opener bridges naturally.
- Otherwise emit `closingTransition(nextPhase?.type)` as a chair entry.


The closing phase: tries `chairSpeak()` with an instruction to reference three specific moments by name (best speech, bloc, proposal), thank delegates, and adjourn ("This committee stands adjourned."), 110-160 words. If output is truncated (no terminal punctuation) or too short (<30 words), falls back to a hard-coded template:


> `Delegates, we have reached the close of our session on <topic>. The chair commends every delegation for their substantive engagement and the proposals advanced today. Significant progress has been made, and the chair looks forward to seeing these ideas developed further. The chair thanks you all for your participation, your professionalism, and your commitment to this body. This committee stands adjourned.`


`speakAndTrim(delegate, state, phase, opts)`: calls `delegateSpeak()`, then `trimToWordCap(normalizeWhitespace(raw, country), maxWordsForPhase(phase))`. If cleaned output is empty or `<8` chars, returns: `Honorable Chair, the delegation of <country> yields the remainder of its time.`. Any LLM failure falls back to the same yield line.


---


## 9. API Routes (`src/app/api/`)


All routes use `export const runtime = "nodejs"` (Edge wouldn't support `msedge-tts`, the Anthropic SDK in some configs, or the `crypto.subtle` calls in some edge configs).


### `POST /api/auth/send-code`
Zod-validated `{ email: string.email() }`. Generates code, calls `saveCode(email, code)`, then `sendVerificationEmail(email, code)`.
- If `result.ok` → `{ ok: true, sent: true }`
- Else (no Resend) → `{ ok: true, sent: false, devCode, reason }` — front-end shows the dev code.


### `POST /api/auth/sign-in`
Schema: `{ email, password.min(4), role: "user"|"worker", code: /^\d{6}$/ }`.
1. `verifyCode(email, code)` → if false, 401 `"Incorrect or expired verification code..."`
2. `validateSignIn(email, password, role)` → if `!ok`, 401 with reason
3. `buildSession(email.lower(), role)` → `encodeSession()` → `cookies.set(SESSION_COOKIE, ...)` with `httpOnly`, `sameSite: "lax"`, `secure: process.env.NODE_ENV === "production"`, expires at `session.expiresAt`.


### `POST /api/auth/sign-out`
Sets `SESSION_COOKIE` to empty with expires=new Date(0).


### `GET /api/auth/me`
Returns `{ session: { username, role } }` or `{ session: null }`.


### `POST /api/paper-feedback`
**(System prompt verbatim — see Appendix A.)** Schema: `{ committee, country, topic, paper.min(50).max(20000) }`. Calls `chatJson({ system: RUBRIC, user: "...", maxTokens: 2500, temperature: 0.4 })`, then `recordPaper({ ... feedback })`. Returns `{ feedback }`.


`maxDuration = 60`.


### `POST /api/conference/start`
Schema: `{ committee.min(2), topic.min(2), userCountry.min(2), delegates: [DelegateSchema×3], totalDurationMs: int.min(60_000).max(3_600_000).default(30*60_000) }`.
Where `DelegateSchema = { id: "d1"|"d2"|"d3", country.min(2), persona: enum, shortDescription }`.


Calls `planSession(setup)` (deterministic), builds initial `ConferenceState` with `phaseIndex: 0, lastOpenedPhaseIndex: -1, speakerQueueIndex: 0, transcript: [], pendingFloorRequest: null, userHasFloor: false, userSpeechCount: 0, status: "active"`. Returns `{ state }`.


`maxDuration = 60`.


### `POST /api/conference/turn`
Body: `{ state: ConferenceState }`. Calls `nextTurn(state)`. Returns `{ response, newEntries, advance }`. `maxDuration = 60`.


### `POST /api/conference/feedback`
Body: `{ state }`. Builds a user prompt:
```
Committee: ${state.setup.committee}
Topic: ${state.setup.topic}
User represented: ${state.setup.userCountry}
User speeches given: ${state.userSpeechCount}


FULL TRANSCRIPT:
<entries formatted as: system → "[SYSTEM: ...]"; user → ">>> USER (Country): text"; else → "Speaker: text">


Return the feedback JSON now.
```
Calls `chatJson({ system: userFeedbackPrompt(), user, maxTokens: 2500, temperature: 0.4 })`, then `recordSession({ ... feedback, transcript })`. Returns `{ feedback }`. `maxDuration = 60`.


### `POST /api/dias`
Schema: `{ message.min(1).max(2000), history?: Array<{role: "user"|"assistant", content.max(2000)}>.max(20) }`.
Builds transcript string from history, formats as `"User: ... Dias: ..."`, appends `"User: <message>\n\nDias:"`. Calls `chat({ system: DIAS_SYSTEM_PROMPT, user, maxTokens: 800, temperature: 0.6 })`. Returns `{ reply }`. `maxDuration = 30`.


### `POST /api/tts`
Schema: `{ text.min(1).max(5000), voice?: string }`. Uses `msedge-tts` with `MsEdgeTTS().setMetadata(voice || DEFAULT_CHAIR_VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3)`. Collects chunks from the Readable stream into a Buffer. Returns `Response(buffer, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store", "Content-Length": buffer.length } })`.


`DEFAULT_CHAIR_VOICE = process.env.EDGE_TTS_CHAIR_VOICE || "en-US-AvaMultilingualNeural"`. `maxDuration = 30`.


### `POST /api/stt`
`formData()` with key `audio` (File). Requires `OPENAI_API_KEY`. Forwards as `multipart/form-data` to `https://api.openai.com/v1/audio/transcriptions` with `model=whisper-1, response_format=verbose_json`. Returns `{ text, duration }`. `maxDuration = 60`.


### `POST /api/bookings`
Schema: `{ topic, coach, date, time, name, email.email(), notes? }` — all required strings except notes. Calls `recordBooking(...)`, then best-effort `sendBookingConfirmationEmail(...)`. Returns `{ ok: true, id, emailNote? }` where `emailNote` is set when email failed (e.g. no Resend key) — the UI uses this to show "we couldn't auto-email" copy.


### Worker routes (GET only, gated to `worker` role)
- `GET /api/worker/papers` → `{ papers: listPapers() }`
- `GET /api/worker/sessions` → `{ sessions: listSessions() }`
- `GET /api/worker/bookings` → `{ bookings: listBookings() }`


All three: check `session.role === "worker"`, else 403.


---


## 10. Pages (`src/app/...`)


### `src/app/layout.tsx` — Root layout


- `metadata`: title default `"Real-MUN — Train for Model UN with AI"`, template `"%s · Real-MUN"`, description (verbatim below), `metadataBase` from `NEXT_PUBLIC_SITE_URL` or `"https://real-mun.vercel.app"`, keywords (8 listed), authors, OpenGraph, Twitter card.
- `viewport.themeColor`: `[{ media: "(prefers-color-scheme: light)", color: "#f8f7f4" }, { media: "(prefers-color-scheme: dark)", color: "#0c0f17" }]`.
- Inline `themeBootstrap` script (read theme from localStorage, apply `data-theme` attr before first paint).
- Structure: `<html lang="en"><head>{themeScript}</head><body class="min-h-screen flex flex-col"><Nav/><main class="flex-1">{children}</main><Footer/><DiasAI/></body></html>`.


Description verbatim: `"Walk into your next MUN already knowing how it'll feel. AI-graded position papers, 1-on-1 coaching, and full 30-minute mock conferences with AI delegates. Free during launch."`


### `src/app/page.tsx` — Homepage


Server component. Multiple sections (all max-width `max-w-6xl mx-auto px-5`):


1. **Hero**: radial gradient overlay (gold tint at top-left and bottom-right), "Free during launch" pill, big H1 "Walk into your next MUN already knowing how it'll feel" (with gold "already knowing"), paragraph, two CTAs (Try a Mock Conference → /conference; I'm new — start here → /learn).
2. **Stats strip** (4 metrics in a bordered card): `"11"` Procedural phases, `"5"` Scoring dimensions, `"< 60s"` Paper feedback, `"$0"` Early access.
3. **Sections grid** (2×2): 4 cards linking to /learn, /position-paper, /sessions, /conference with numbers 01-04, icons 🎓 ⚡ 🤝 🏛 and descriptions verbatim.
4. **Dark band** "What you'll actually learn" — 4 points: Parliamentary procedure, Diplomatic language, Building coalitions, Crisis instincts (each with copy).
5. **How Real-MUN works** — 4 cards explaining: The Chair, Three AI delegates, You, The overseer.
6. **Testimonials** — 3 cards. Roles: "First-time delegate", "Returning delegate", "Head delegate" with novice/ECOSOC/college contexts.
7. **Dark band** "Built by a delegate, for delegates" — Ayaan Dhuria story (2 years, 3 conferences, 1 Best Delegate, 1 Honorable Mention).
8. **FAQ** — 5 questions with `<details>` accordion: Is Real-MUN really free?, Do I need a microphone?, How realistic are the AI delegates?, Will the feedback help me at an actual MUN conference?, Can my club or school use this?
9. **Final CTA dark block** — "Your next conference is closer than you think." with email/phone CTAs.


Constants `sections`, `stats`, `learnPoints`, `testimonials`, `faqs` are defined inline as arrays of objects. All copy is in Appendix B.


### `src/app/learn/page.tsx`


Server component. Renders `learnSections` from `src/lib/learn-content.ts`. Layout: header with gold rule + H1 "Learn the Basics" + intro paragraph, a TOC card (2-column grid linking to `#<id>` anchors), then each section with `SECTION 0X` label, H2 title, blurb, and a 2-column grid of cards (term + def + optional example with top border). Closing dark "Ready to practice?" CTA with links to /position-paper and /conference.


`export const metadata = { title: "Learn the Basics — Real-MUN", description: "..." }`.


### `src/app/position-paper/page.tsx`


Client component (`"use client"`). 5-step flow:
- Step 1: Pick committee (cards from `COMMITTEES`)
- Step 2: Choose country (text input + chip buttons for `POPULAR_COUNTRIES`)
- Step 3: Topic (text input + 10 sample chips from `SAMPLE_TOPICS`)
- Step 4: Paste paper (textarea, word count, char count out of 20,000)
- Step 5: Loading spinner → `FeedbackView` component when done


State: `step, committee, country, topic, paper, loading, error, feedback`.


`submit()`: POSTs `{ committee, country, topic, paper }` to `/api/paper-feedback`, then `setFeedback(data.feedback)`.


Reset button labelled "Review another paper".


Progress bar: 5 horizontal segments at the top, colored gold up to `step`.


Header has a chip showing "Rubric designed by **Ayaan Dhuria**, founder · 1 Best Delegate, 1 Honorable Mention across 3 conferences." with an "AD" avatar.


### `src/app/sessions/page.tsx`


Client component. 5-step booking flow.


Constants (defined inline):


`COACHING_TOPICS` — 6 entries: Speech Delivery (30min), Resolution Writing (45min), Crisis Prep (45min), Position Paper Review (30min), Bloc & Coalition Strategy (30min), Full Conference Prep (60min).


`COACHES` — 4 coaches:
1. **Ayaan Dhuria** — Founder · 2 years — Full Conference Prep, Speech Delivery, Bloc Strategy. Bio: "Founder of Real-MUN. Three competitive conferences with one Best Delegate and one Honorable Mention. Active leader at SPMS across TSA, MUN, and cricket clubs — coaches new delegates from their very first placard raise to award-eligible speeches."
2. **Ananya Rao** — Head Delegate · 4 years — Speech Delivery, Crisis Prep. Bio: "12 best-delegate awards. Coaches with an emphasis on improvisation and reading the room."
3. **Marcus Lin** — Senior Delegate · 5 years — Resolution Writing, Bloc Strategy. Bio: "Specialist in ECOSOC and UNGA. Helped draft 30+ passable resolutions across MUN circuits."
4. **Sara Okafor** — Crisis Director · 3 years — Crisis Prep, Full Conference Prep. Bio: "Ran the backroom for 8 crisis committees. Knows exactly how to make a delegate stand out."


`TIME_SLOTS = ["09:00","10:00","11:00","13:00","14:00","15:00","16:00","17:00","19:00","20:00"]`.


`nextSevenDays()` actually returns 10 days starting tomorrow.


Steps:
1. Topic (3-column grid of cards)
2. Coach (3-column grid with initials avatar, name, role, bio, specialty chips)
3. Date (5- or 10-column grid of date chips for next 10 days)
4. Time (5-column grid)
5. Contact details (name, email, optional notes textarea)


Sticky bottom bar with selection summary + Confirm booking button (disabled until all fields filled). On confirm: POST to `/api/bookings`, then show success screen with details table. If `emailNote` came back (Resend not configured), show "we couldn't auto-email a confirmation… coach will reach out manually within 24 hours" with a collapsible debug detail.


`useEffect(() => { document.title = "1-on-1 Sessions · Real-MUN"; }, []);` — since it's a client component, can't export metadata.


### `src/app/sign-in/page.tsx`


Client component. Wrapped in `<Suspense>` because it reads `useSearchParams()`. Has `?required=worker` mode (shows "Worker access required") and `?next=/some/path` redirect target.


Two steps (`details` then `verify`):


**Details**: role toggle (`Delegate` or `Worker` buttons — gold for worker, ink for user), email input, password input (min 4 chars). On submit → POST `/api/auth/send-code` → on success advance to `verify`.


**Verify**: 6-digit code input (large monospaced, letter-spacing `0.4em`), Resend code button. If response had `sent: true` shows "✉ Email sent — check inbox". If `devCode` was returned, shows yellow box with code in large monospace. On submit → POST `/api/auth/sign-in` → on success router.push to `next` (or `/worker` if role=worker) and `router.refresh()`.


Helpers: `StepDot` (numbered indicator), `RoleButton` (selectable role tile), `ErrorBox`.


### `src/app/contact/page.tsx`


Server component. `export const metadata = { title: "Contact — Real-MUN", ... }`. Two cards: EMAIL and PHONE (from `CONTACT` constants in `Footer.tsx`). Below: dark "Want a 1-on-1 session instead?" CTA box linking to /sessions.


### `src/app/conference/page.tsx` — Mock Conference setup


Client component. State:
- `committee` = `COMMITTEES[0].name` (UNSC)
- `topic` = `SAMPLE_TOPICS[0]`
- `userCountry` = `"France"`
- `delegates` (3 hard-coded defaults):
  - d1 = United States, aggressive, "Veteran delegate, pushes hard for liberal-order solutions."
  - d2 = China, diplomatic, "Calm, principled, frames everything through sovereignty."
  - d3 = Brazil, coalition_builder, "Tries to bridge Global North and Global South positions."


`PERSONAS` (5): diplomatic, aggressive, coalition_builder, technical, quiet — each with a label and blurb.


Form sections:
- Committee dropdown (`COMMITTEES`)
- Topic input + 5 sample chips
- Your delegation input + 12 country chips
- AI Delegates: 3 cards, each with country input, persona dropdown, description textarea
- "FREE" pill + explanation
- Begin session button (loading: "Convening the committee...")


On submit: POST `/api/conference/start` with `{ committee, topic, userCountry, delegates, totalDurationMs: 30*60_000 }`. On success → `sessionStorage.setItem("conferenceState", JSON.stringify(state))` then `router.push("/conference/live")`.


### `src/app/conference/live/page.tsx` — THE LIVE SIMULATION


Largest client component. **(Full behavior in section 14 below.)**


State (all `useState`):
- `state: ConferenceState | null`
- `speakingId: string | null`
- `turnLoading, paused, motionOpen, recording, transcribing, draftSpeech, feedback, loadingFeedback, error, now, floorJustOpened`


Refs:
- `recorderRef` (Whisper recorder), `speechRef` (WebSpeech), `inFlightRef` (prevent duplicate turn requests), `stateRef`, `dockRef`, `draftRef`, `prevUserHasFloorRef`.


`MOTIONS` const — 7 motions for the motion modal:
- Moderated Caucus (needsDetails, hint: "Topic, total time, speaking time...")
- Unmoderated Caucus (needsDetails, hint: "Total time...")
- Extend Current Caucus (needsDetails)
- Introduce a Draft Resolution
- Point of Inquiry (needsDetails)
- Point of Order (needsDetails)
- Motion to Close Debate


Key effects:
1. Load `conferenceState` from sessionStorage on mount; if missing, `router.push("/conference")`.
2. Persist state to sessionStorage on changes (also keep `stateRef.current` in sync).
3. Clock: `setInterval(setNow(Date.now()), 500)`.
4. When `userHasFloor` goes false → true: trigger banner, play synthesized chime (`new AudioContext()`, oscillator 880Hz sine, exponential ramp gain 0.0001 → 0.18 → 0.0001, duration 0.65s), scroll dock into view and focus the textarea.
5. Auto-advance loop: when not user's turn, not paused, not loading, not currently speaking → after 500ms, call `runNextTurn()`.
6. When `state.status === "ended"` and no feedback yet: POST `/api/conference/feedback` and load result.


`runNextTurn()`:
- Guard `inFlightRef`. Then POST `/api/conference/turn` with current state.
- `applyServerResult(newEntries, advance)` — appends entries, merges advance fields into state.
- Sequentially play audio for each new entry (chair via `speakChair`, delegate via `speakBrowser(text, delegateIndex)`).
- If `response.kind === "session-ended"` → set status ended.


User actions:
- **Raise placard**: sets `pendingFloorRequest = { type: "placard" }`.
- **Submit motion** (via modal): sets `pendingFloorRequest = { type: "motion", motion, details }`.
- **Record / Stop**: Web Speech API first (`startWebSpeech`); MediaRecorder + Whisper as fallback. On stop, append transcription to `draftSpeech`.
- **Deliver →**: pushes user transcript entry, clears `userHasFloor`, increments `userSpeechCount`.
- **Yield without speaking**: clears `userHasFloor`.
- **Pause / Resume**, **Skip phase** (with confirm), **End session** (with confirm).


Layout:
- Sticky header (under nav): phase label + topic, phase timer + session timer (formatted `m:ss`), Pause / Skip / End buttons.
- `PhaseProgress` row of dots.
- Delegates strip: 4 cards (Chair + 3 delegates) showing initials, name, persona/subtitle. Active speaker has gold ring + pulse animation.
- "You are <userCountry>" + speech count + "⬇ You're up next" hint when applicable.
- `TranscriptFeed` (scrollable, auto-scrolls to bottom).
- Bottom dock: when `userHasFloor` and phase is `roll_call` → simple "Present" + "Present and voting" buttons. Otherwise full mic dock with textarea + Record button + Deliver button.
- When not user's turn → bottom action bar with ⌅ Motion and ✋ Raise Placard buttons.
- Motion modal: list of motions; selecting one shows details textarea (if `needsDetails`) and Submit button.


End-of-session screen: gold-rule + "Session complete" + "<committee> · <topic>", loading spinner while feedback loads, then `<SessionFeedback />`, then "Start a new session" / "Back to home" buttons.


### `src/app/worker/layout.tsx`
Async server component. Reads `getSession()` and shows "Welcome back, {username}". Tab nav: Overview / Papers / Mock Sessions / Bookings. Constrained to max-w-6xl.


### `src/app/worker/page.tsx` — Overview
Three stat cards (Position Papers / Mock Sessions / 1-on-1 Bookings), activity timeline merging recent papers/sessions/bookings sorted by `createdAt` desc, limit 8. Each row: kind badge (P/S/B), who, what, detail, "Xm ago / Xh ago / Xd ago".


`export const dynamic = "force-dynamic"` so it doesn't pre-render.


Helpers: `Stat`, `KindBadge`, `timeAgo(ts)`.


### `src/app/worker/papers/page.tsx`, `sessions/page.tsx`, `bookings/page.tsx`
Client components. Each fetches its data from the worker API route, renders a searchable list. Use the small `components/worker/Search.tsx` helper (a controlled input that updates a local query state). Each row clickable to expand/view details inline.


### Misc top-level files
- `src/app/icon.svg` — favicon (custom shield-with-star, ink+gold). Match the SVG from `Nav.tsx`'s brand mark.
- `src/app/opengraph-image.tsx` — Next.js dynamic OG image, returns a Next `ImageResponse` with "Real-MUN" wordmark on cream background.
- `src/app/not-found.tsx` — friendly 404 with "Back to home" link.
- `src/app/robots.ts` — `export default function robots() { return { rules: [{ userAgent: "*", allow: "/" }], sitemap: \`\${SITE_URL}/sitemap.xml\` }; }`.
- `src/app/sitemap.ts` — lists the 6 public routes.


---


## 11. Components


### `src/components/Nav.tsx`
Client component. Sticky top nav. Brand mark: 32×32 svg with ink-rounded-rect background, gold star path, ink center dot. Wordmark: "Real · MUN" with shimmer animation on `MUN` (see `globals.css`). Links: Learn, Position Paper, 1-on-1 Sessions, Mock Conference. Fetches `/api/auth/me` on mount and on pathname change. If signed in: shows `username · role` + Sign out button (calls POST `/api/auth/sign-out`). If signed in as worker: extra "Worker Dashboard" link. Mobile menu (hamburger). Includes `<ThemeToggle />`.


### `src/components/Footer.tsx`
Server-friendly. Exports `CONTACT = { email: "ayaandhuria26@gmail.com", phone: "804-297-1800", instagram, twitter, linkedin }`. 4-column footer with brand blurb + contact links + social icons (Instagram, X, LinkedIn, Email — inline SVGs), Train links, More links. Copyright with dynamic year.


### `src/components/ThemeToggle.tsx`
Client. Reads/writes `localStorage["realmun_theme"]` ("light" | "dark"). Sets `data-theme` attr on `<html>`. Renders a sun/moon icon button. Placeholder (`<span class="w-9 h-9">`) before mount to avoid hydration mismatch.


### `src/components/DiasAI.tsx`
Client. Floating support chatbot. Hidden on `/conference/live` (mic dock conflicts). Stores last 20 messages in `localStorage["realmun_dias_history"]`. Greeting message:
> `"Hi — I'm Dias, your Real-MUN support. Ask me anything about the site, the mock conference, or MUN procedure. How can I help?"`


Quick prompts (shown only on first message):
- "How does the mock conference work?"
- "Is Real-MUN really free?"
- "How do I submit a position paper?"
- "What's a moderated caucus?"


Launcher: 56px round button bottom-right with chat-bubble SVG + small gold dot + hover-only "Ask Dias AI" pill.


Panel: 380px wide, max-height ~640px, ink header with "D" gold avatar, "Dias AI" + "● Real-MUN support" (animated pulse), Clear button (trash icon) + Close. Messages list with user-aligned-right (ink bubble) and assistant-aligned-left (white bubble with border). Loading dots animation while sending. Textarea + send arrow button (gold round). Enter to send (Shift+Enter for newline).


`send(text)`: POST `/api/dias` with `{ message, history: messages.slice(-10) }`. Appends reply.


### `src/components/FeedbackView.tsx`
Takes `Feedback` (the shape returned by the rubric LLM). Renders:
1. Dark hero card with `overall_score/50` big number + letter grade (A+/A/B/C/D/F based on pct) + topic line + progress bar.
2. 2×3 grid of dimension cards (Research Depth, Policy Alignment, Structure, Persuasiveness, MUN Language) each with score/10 + horizontal bar + comment.
3. Red "⚠ Policy Red Flags" card if any.
4. Two cards side-by-side: Strengths (gold accent, ✓) and Weaknesses (red, ✗).
5. "Suggested Line Edits" card with original (red strikethrough) → suggested (green) → why.
6. Gold-tinted "Do these before conference" card with numbered next_steps.


### `src/components/conference/TranscriptFeed.tsx`
Client. Maps `transcript` to bubbles. Chair: dark ink, full width, with `CHAIR` label in gold + timestamp (HH:MM:SS). User: gold-tinted bg with `YOU · <Country>` label, indented `ml-12`. Delegate: white card with `mr-12`, COUNTRY label uppercased. System entries: centered italic muted "— text —". When entry id === speakingId, add `ring-2 ring-[var(--color-accent)] shadow-lg` + `· SPEAKING`. Auto-scrolls to bottom.


### `src/components/conference/PhaseProgress.tsx`
Client. Row of phase dots, current one expanded with phase label inline. `PHASE_LABEL` mapping:
- roll_call → "Roll Call"
- motion_open_debate → "Open Debate"
- gsl_setup → "Speakers' List"
- opening_speeches → "Opening Speeches"
- motion_mod_caucus → "Motion"
- moderated_caucus → "Moderated Caucus"
- motion_unmod_caucus → "Motion"
- unmoderated_caucus → "Unmoderated Caucus"
- voting → "Voting"
- closing → "Closing"


### `src/components/conference/SessionFeedback.tsx`
Takes `SessionFeedbackData`. Same visual language as `FeedbackView`. Renders: hero with `overall_score/100` + letter grade, 3-card row for delivery/content/engagement, Highlights / Issues columns, Rewrite example block (strikethrough → improved → why), gold "Focus for your next session" numbered list.


### `src/components/worker/Search.tsx`
Tiny controlled-input wrapper used by worker list pages. Accepts `value`, `onChange`, `placeholder`.


---


## 12. Global Styles & Theming (`src/app/globals.css`)


The full file (verbatim):


```css
@import "tailwindcss";


/* Smooth scroll on anchor links */
html { scroll-behavior: smooth; }


:where(section[id], h2[id], h3[id]) {
  scroll-margin-top: 80px;
}


*:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
  border-radius: 6px;
}


@theme {
  --color-ink: #0a0e1a;
  --color-ink-2: #111827;
  --color-paper: #f8f7f4;
  --color-accent: #b8860b;
  --color-accent-2: #d4a017;
  --color-muted: #6b7280;
  --color-card: #ffffff;
  --color-border: rgba(0, 0, 0, 0.08);
  --color-border-strong: rgba(0, 0, 0, 0.15);
  --color-surface: rgba(0, 0, 0, 0.05);
  --font-display: "Georgia", "Times New Roman", serif;
}


[data-theme="dark"] {
  --color-ink: #f5f3ed;
  --color-ink-2: #e5e1d6;
  --color-paper: #0c0f17;
  --color-accent: #e0b54a;
  --color-accent-2: #f3cb6d;
  --color-muted: #9ca3af;
  --color-card: #161a26;
  --color-border: rgba(255, 255, 255, 0.08);
  --color-border-strong: rgba(255, 255, 255, 0.15);
  --color-surface: rgba(255, 255, 255, 0.05);
}


html, body {
  background: var(--color-paper);
  color: var(--color-ink);
  transition: background-color .2s ease, color .2s ease;
}


body {
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}


h1, h2, h3, .display {
  font-family: var(--font-display);
  letter-spacing: -0.01em;
}


.btn {
  @apply inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 font-medium transition;
}
.btn-primary { background: var(--color-ink); color: var(--color-paper); }
.btn-primary:hover { opacity: 0.9; box-shadow: 0 8px 22px -8px rgba(0,0,0,0.35); }
.btn-secondary {
  border: 1px solid var(--color-ink);
  color: var(--color-ink);
  background: transparent;
}
.btn-secondary:hover { background: var(--color-ink); color: var(--color-paper); }


.card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 1.5rem;
  transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
}
.card:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 36px -14px rgba(0,0,0,0.22);
  border-color: rgba(184, 134, 11, 0.45);
}


.btn { transition: transform .2s ease, opacity .2s ease, box-shadow .2s ease, background .2s ease, color .2s ease; }
.btn:hover { transform: translateY(-1px); }


.hover-spin { transition: transform .35s ease; }
.group:hover .hover-spin { transform: rotate(8deg) scale(1.12); }


.hover-glow { transition: color .25s ease, text-shadow .25s ease; }
.group:hover .hover-glow { color: var(--color-accent); text-shadow: 0 0 14px rgba(184, 134, 11, 0.35); }


.nav-link { position: relative; }
.nav-link::after {
  content: "";
  position: absolute;
  left: 0; right: 100%; bottom: -4px;
  height: 2px;
  background: var(--color-accent);
  transition: right .25s ease;
}
.nav-link:hover::after { right: 0; }


.gold-rule {
  height: 3px; width: 56px;
  background: linear-gradient(90deg, var(--color-accent), var(--color-accent-2));
  border-radius: 2px;
}


input, textarea, select {
  background: var(--color-card);
  color: var(--color-ink);
}


@keyframes pulse-ring {
  0% { box-shadow: 0 0 0 0 rgba(184, 134, 11, 0.6); }
  100% { box-shadow: 0 0 0 14px rgba(184, 134, 11, 0); }
}
.speaking-ring { animation: pulse-ring 1.4s infinite; }


@keyframes logo-shimmer {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
.brand-mark {
  background: linear-gradient(90deg, var(--color-ink) 0%, var(--color-ink) 35%, var(--color-accent) 50%, var(--color-accent-2) 65%, var(--color-ink) 100%);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  transition: background-position .5s ease;
}
.brand-mark:hover,
a:hover .brand-mark,
.group:hover .brand-mark { animation: logo-shimmer 1.6s ease-in-out infinite; }
.brand-icon { transition: transform .35s ease; }
a:hover .brand-icon,
.group:hover .brand-icon { transform: rotate(-12deg) scale(1.08); }


.phase-dot {
  display: inline-block;
  width: 10px; height: 10px;
  border-radius: 999px;
  background: var(--color-border-strong);
  transition: background .2s ease, transform .2s ease;
}
.phase-dot.active { background: var(--color-accent); transform: scale(1.3); }
.phase-dot.done { background: var(--color-ink); }
```


---


## 13. Middleware & Auth


### `src/middleware.ts`
```ts
import { NextRequest, NextResponse } from "next/server";
import { decodeSession, SESSION_COOKIE } from "./lib/auth";


export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;


  if (pathname.startsWith("/worker")) {
    const raw = req.cookies.get(SESSION_COOKIE)?.value;
    const session = await decodeSession(raw);
    if (!session || session.role !== "worker") {
      const url = req.nextUrl.clone();
      url.pathname = "/sign-in";
      url.searchParams.set("next", pathname);
      url.searchParams.set("required", "worker");
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}


export const config = {
  matcher: ["/worker/:path*"],
};
```


Auth model:
- Cookie name: `realmun_session`.
- Format: `username|role|expiresAt|HMAC-SHA256-signature` (Base64URL).
- TTL: 7 days.
- HMAC key: `process.env.AUTH_SECRET || "real-mun-dev-secret"`.
- `httpOnly: true, sameSite: "lax", secure: prod-only, path: "/"`.


User flow: enter email + password → click Continue → server generates 6-digit code, saves SHA-256 hash with 10-min TTL, sends via Resend (or returns devCode if no Resend key) → user enters code → server verifies code AND password/role → sets cookie → redirects to `next` or `/worker`.


---


## 14. Audio System


### Chair voice (Edge TTS via `/api/tts`)
- Server-side: `msedge-tts` library streams MP3 audio chunks; concatenated to Buffer, returned as `audio/mpeg`.
- Default voice: `en-US-AvaMultilingualNeural`. Configurable per request via `{ voice }` body field. Env override: `EDGE_TTS_CHAIR_VOICE`.


### Delegate voices (browser `SpeechSynthesis`)
- Client-side, runs locally with no API cost. Uses three voice profiles from `voices.ts`. Tries to find a matching system voice by name fragment, falls back to first `en-*` voice.


### `speakBrowser(text, delegateIndex)` behavior
- Returns a Promise that resolves when audio ends (or timeout).
- Cancels any current utterance first (`window.speechSynthesis.cancel()`).
- Chrome quirk: speechSynthesis stops after ~14s mid-utterance — workaround is a `setInterval` every 10s that calls `pause()` then `resume()`.
- Safety timeout: `maxPlayMs(text)` = `Math.max(8000, (text.length / 14) * 1000 + 5000)` ms.


### `speakChair(text)` behavior
- For text < 30 chars (short procedural like "United States?"), skip the server hop and use `speakBrowser(text, 0)` for snappier turn-taking.
- Otherwise POST `/api/tts`, get the blob, create an `Audio` element, play. Aborts after 12s if fetch hangs. Falls back to `speakBrowser` on any failure.


### `stopAllSpeech()` — cancels both utterance and keepalive interval.


### Speech-to-text (Web Speech API + Whisper fallback)
- `isWebSpeechSupported()` returns true if `window.SpeechRecognition` or `window.webkitSpeechRecognition` exists.
- `startWebSpeech(onPartial)` returns `{ stop(): Promise<string>, cancel() }`. Continuous, interim results, `lang: "en-US"`. **Critical**: `onresult` events contain ALL results so far, not just new ones — the handler must REBUILD `finalText` from scratch every event, never append.
- Whisper fallback: `createRecorder()` returns `{ start, stop(): Promise<Blob>, cancel }` using `MediaRecorder` with `audio/webm;codecs=opus` (or fallback mimes). `transcribeAudio(blob)` POSTs to `/api/stt` as multipart form data, returns the transcript text.


---


## 15. Worker Dashboard


Routes (all gated by middleware redirect → `/sign-in?required=worker&next=...`):
- `/worker` — Overview (stats + recent activity)
- `/worker/papers` — list of submitted papers with previews
- `/worker/sessions` — list of completed mock sessions with feedback
- `/worker/bookings` — list of bookings


Each list page fetches `/api/worker/<kind>`, renders a search-filterable list, clickable rows expand to show full feedback / transcript. Uses `Search.tsx` for filtering.


---


## 16. Verbatim Prompts Appendix


This section is the single most important section of this document. **Reproduce all string literals EXACTLY as below — including line breaks, punctuation, lists, and capitalization. The behavior of the AI delegates and feedback depends on these.**


### A.1 — `directorSystemPrompt()` from `src/lib/conference/prompts.ts`


```
You are the CONFERENCE DIRECTOR for a Model UN simulation.
You are NOT a visible character — you plan the session arc behind the scenes.


Your job: given a committee, topic, and 30 minutes, produce a realistic Plan.
The Plan is a JSON object with a "phases" array. Real MUN committees follow this rough flow:


1. Roll call (1-2 min) — Chair reads countries, delegates respond "present" or "present and voting"
2. Opening speakers' list (6-9 min) — every delegate gives a 60-90s opening speech
3. Moderated caucus #1 (6-8 min) — focused on a specific SUB-TOPIC, 45-60s per speech, named speaker order
4. Unmoderated caucus (5-7 min) — informal bloc formation and negotiation, simulated as rapid agent exchanges
5. Moderated caucus #2 (4-6 min) — refining proposals, often around a specific draft resolution idea
6. Closing remarks or voting (2-3 min) — wraps up the session


ALWAYS return JSON in this exact shape, nothing else:


{
  "phases": [
    {
      "type": "roll_call" | "opening_speeches" | "moderated_caucus" | "unmoderated_caucus" | "voting" | "closing",
      "topicFocus": "<sub-topic for caucuses, omit for roll_call/closing>",
      "durationMs": <milliseconds>,
      "individualSpeakingTimeSec": <seconds for moderated caucus speeches, omit for unmod/roll_call>,
      "speakerOrder": ["<country>", "user", ...],
      "description": "<one-sentence explanation>"
    }
  ]
}


The total durationMs across all phases MUST sum to roughly 30 minutes (1,800,000 ms).
Each "speakerOrder" must include "user" at least once across moderated caucuses, plus the 3 delegate countries.
For unmoderated_caucus, omit speakerOrder (it's free-form).
```


### A.2 — `chairSystemPrompt(setup)` from `src/lib/conference/prompts.ts`


```
You are the CHAIR of a Model UN committee.


CONTEXT:
- Committee: ${setup.committee}
- Topic: ${setup.topic}
- Delegates present: ${setup.delegates.map(d => d.country).join(", ")}, and the user (representing ${setup.userCountry})


YOUR JOB:
- Run the session with professional MUN procedure
- Speak in second person to the committee ("Delegates, we will now begin...")
- Recognize delegates by country name: "The chair recognizes the delegate from [Country]"
- Manage time and floor strictly — only one speaker at a time
- When transitioning phases, explain what's about to happen
- Be formal but warm; this is a learning environment


CONSTRAINTS:
- Speak only as the Chair. Never speak for delegates.
- Keep each turn under 100 words unless explicitly opening or closing a phase.
- Use realistic MUN phrasing: "honorable delegates", "the floor is now open", "the chair entertains motions", "you have the floor", "your time has expired"
- Never invent that delegates said something they didn't say
- Always end your turn at a natural handoff point so the next speaker can be called


You will be given the current phase, the speaker queue, the recent transcript, and what just happened.
Return only your spoken words as the Chair — no stage directions, no JSON, no labels.
```


### A.3 — `delegateSystemPrompt(setup, delegate)` from `src/lib/conference/prompts.ts`


`personaGuidance` map:
```
diplomatic: "Measured, formal, builds bridges. Acknowledges other delegates' points before disagreeing. Cites international law and prior resolutions."
aggressive: "Direct, willing to challenge. Frames issues in stark terms. Calls out specific delegations by name when they contradict your country's interests."
coalition_builder: "Constantly proposes collaboration. Names other delegations you want to work with. Suggests compromise language and joint working papers."
technical: "Heavy on specifics: funding amounts, treaty articles, statistics, named UN bodies. Less rhetoric, more substance."
quiet: "Speaks less often but with weight. When you speak, it's brief, surgical, and changes the room's direction."
```


Full prompt template:
```
You are the delegate of ${delegate.country} in a Model UN committee.


COMMITTEE: ${setup.committee}
TOPIC: ${setup.topic}


DELEGATIONS PRESENT (besides you): ${otherDelegations}.
You may ONLY reference, invite, propose meetings with, or form blocs with delegations from this exact list. Do NOT mention countries that are not in this room (no "let's invite Germany / India / Japan / the EU / etc." unless they are listed above). If you want to broaden a coalition, just say "all interested delegations" or name the ones actually present.


YOUR COUNTRY'S REAL FOREIGN POLICY MUST GUIDE YOU. Stay true to ${delegate.country}'s actual stance on this topic — its treaties, voting record, and diplomatic alignments.


PERSONA: ${delegate.persona}
${personaGuidance[delegate.persona]}


CHARACTER NOTE: ${delegate.shortDescription}


SPEAKING RULES (strict):
- Never speak in first person ("I think", "I believe"). Always third person.
- Refer to your country naturally — vary between "${delegate.country}", "our delegation", "the ${delegate.country} delegation". Pick ONE per speech, don't switch within a single speech.
- Open with EXACTLY ONE salutation. Pick one of: "Honorable Chair, fellow delegates," — or — "Honorable Chair," — or — "Chair, delegates,". NEVER chain them (no "Honorable Chair, Chair, delegates" — that's wrong).
- ONE clear policy point per speech. Don't list everything.
- Reference what other delegates have JUST said when relevant — agree, challenge, or build on it. Name them by country.
- LENGTH: 50-90 words in moderated caucus; 80-130 in opening speeches. Hitting the higher end of the range is fine — DON'T be too terse.
- SENTENCE RHYTHM: 3-5 medium sentences (10-22 words each). Avoid one giant comma-stitched sentence. Avoid 1-sentence answers. Every sentence must have a clear subject.
- DO NOT drop subjects to save words. "Brazil proposes…", not "Propose…". "Our delegation supports…", not "Supports…".
- ANTI-REPETITION: Do NOT recycle phrases, framings, or proposals already in the recent transcript. Each speech must bring a NEW angle: a different mechanism, a different statistic, a different concern, a new article of a treaty, a specific clause.
- No throat-clearing ("In conclusion…", "To summarize…"). End with substance.
- Always finish your final sentence with proper punctuation. Never end mid-thought.


IN UNMODERATED CAUCUS:
- 1-2 sentences max, informal hallway voice.
- Address ONE other present delegate directly by country.
- BAN: vague "let's schedule a meeting", "let's discuss", "let's work together". These add nothing.
- INSTEAD: trade concrete substance. Examples:
  • "${otherDelegations.split(", ")[0]}, we'll propose adding language on Article 9.3 to operative clause 4."
  • "We can co-sponsor if you drop the conditionality clause."
  • "Send your paragraph on monitoring; we'll fold it in."
  • "Our delegation will commit $500 million to the fund. Match it?"
  • "We can't vote yes if the resolution caps adaptation finance."
- Each turn should ADVANCE the negotiation, not loop on it.


OUTPUT FORMAT — STRICT:
- Return ONLY the spoken words.
- ENGLISH ONLY. Do not embed Chinese, Russian, French, Arabic, or any other-language characters or phrases — even if your country uses that language. The committee operates in English; deliver your speech in clean, fluent English.
- NO markdown, headers, bold, bullets, labels, JSON, or stage directions.
- DO NOT prefix your speech with your own country name like "${delegate.country}:" or "[${delegate.country}]". The system already labels you. Just speak directly.
- NO meta-commentary like "Note:", "Here is my speech:", "Response:", "To be safe:", "or implies it". Start directly with your salutation ("Honorable Chair,") — nothing before it.
- NO leading or trailing quotation marks around your whole speech.
- Plain text, as if read aloud at a podium.
```


(Where `otherDelegations` = comma-separated list of all delegations EXCEPT this delegate's own country, including the user's country.)


### A.4 — `userFeedbackPrompt()` from `src/lib/conference/prompts.ts`


```
You are a senior Model UN judge giving a delegate post-session feedback.
You will be given:
- The committee, topic, and country the delegate represented
- The full transcript of a 30-minute simulation, with delegate (AI) speeches and the user's speeches clearly marked
- The number of times the user spoke


Return a JSON object with this exact shape:


{
  "overall_score": <0-100>,
  "highlights": ["<specific good moment from a user speech>", ...],
  "issues": ["<specific issue with timing, content, or delivery>", ...],
  "delivery": {
    "score": <0-10>,
    "comment": "<one paragraph on pacing, clarity, MUN register, confidence>"
  },
  "content": {
    "score": <0-10>,
    "comment": "<one paragraph on policy alignment, specificity, use of facts>"
  },
  "engagement": {
    "score": <0-10>,
    "comment": "<one paragraph on how well the user engaged with other delegates, raised placards, built coalitions>"
  },
  "rewrite_example": {
    "original": "<a quoted user line that was weak>",
    "improved": "<a stronger version>",
    "why": "<short reason>"
  },
  "next_session_focus": ["<3 specific things to work on before the next mock>", ...]
}


Quote the user's actual lines when giving feedback. Be specific. Return ONLY the JSON object.
```


### A.5 — `RUBRIC` (Position Paper feedback) from `src/app/api/paper-feedback/route.ts`


```
You are an experienced Model UN judge and head delegate with 10+ years of conference experience.
You are reviewing a delegate's position paper. Your job is to give honest, structured, actionable feedback.


You score on five dimensions, each out of 10:


1. RESEARCH DEPTH — Does the paper cite real treaties, resolutions, statistics, named bodies? Or is it vague?
2. POLICY ALIGNMENT — Does the country position actually match that country's real-world foreign policy? Red-flag any positions that contradict the country's actual stance.
3. STRUCTURE — Is there a clear topic background, country position, past action, and proposed solutions? Are the sections balanced?
4. PERSUASIVENESS — Does the paper make specific, defensible proposals? Or just list problems?
5. MUN LANGUAGE — Uses diplomatic register ("the delegation of X believes"), avoids first person, avoids opinion-loaded language.


You ALWAYS return your response in this exact JSON shape:


{
  "overall_score": <number 0-50>,
  "scores": {
    "research_depth": { "score": <0-10>, "comment": "<one sentence>" },
    "policy_alignment": { "score": <0-10>, "comment": "<one sentence>" },
    "structure": { "score": <0-10>, "comment": "<one sentence>" },
    "persuasiveness": { "score": <0-10>, "comment": "<one sentence>" },
    "mun_language": { "score": <0-10>, "comment": "<one sentence>" }
  },
  "strengths": ["<specific quoted line or behavior>", "..."],
  "weaknesses": ["<specific quoted line or issue>", "..."],
  "line_edits": [
    { "original": "<exact phrase from paper>", "suggested": "<rewrite>", "why": "<short reason>" }
  ],
  "policy_red_flags": ["<any positions that contradict the country's real policy>"],
  "next_steps": ["<concrete action the delegate should take before conference>", "..."]
}


Be specific. Quote actual lines from the paper. Do not invent positions the paper did not take.
Return ONLY the JSON object.
```


The user prompt is:
```
Committee: ${committee}
Country represented: ${country}
Topic: ${topic}


---POSITION PAPER START---
${paper}
---POSITION PAPER END---


Return only the JSON object as specified.
```


Settings: `maxTokens: 2500, temperature: 0.4`.


### A.6 — `DIAS_SYSTEM_PROMPT` from `src/lib/dias-knowledge.ts`


```
You are Dias AI, the support assistant for Real-MUN — an AI training platform for Model United Nations delegates. You answer questions about the site, MUN concepts, and how to use Real-MUN's features.


# About Real-MUN


- Founded by Ayaan Dhuria, a delegate with 2 years of experience: 3 competitive conferences, 1 Best Delegate award, 1 Honorable Mention.
- Free during early access — no credit card, no trial period.
- The whole site is at https://real-mun.app (or whatever the live URL is).


# The 4 Sections


1. **Learn the Basics** (/learn)
   - Beginner content on parliamentary procedure, MUN vocab, speaking tips, position paper structure, bloc strategy, rookie traps to avoid.
   - Free, no sign-in needed.


2. **Position Paper Feedback** (/position-paper)
   - 4-step flow: pick committee → pick country → pick topic → paste paper
   - AI grades on 5 dimensions: research depth, policy alignment, structure, persuasiveness, MUN language
   - Returns: dimension scores, overall score (out of 50), strengths, weaknesses, line edits, policy red flags, next steps
   - Usually under 60 seconds to grade
   - Rubric designed by Ayaan Dhuria


3. **1-on-1 Sessions** (/sessions)
   - Book live video coaching with experienced delegates
   - Topics: speech delivery, resolution writing, crisis prep, position paper review, bloc strategy, full conference prep
   - Coaches: Ayaan Dhuria (founder), Ananya Rao (head delegate), Marcus Lin (senior delegate), Sara Okafor (crisis director)
   - Confirmation email sent automatically (Resend integration)


4. **Mock Conference** (/conference)
   - 30-minute simulated committee with a Chair + 3 AI delegates + the user
   - 11 procedural phases: roll call → motion to open debate → speakers' list setup → opening speeches → motion + moderated caucus → motion + unmoderated caucus → motion + moderated caucus → closing
   - User goes FIRST in opening speeches and both moderated caucuses (no waiting)
   - Voice: Microsoft Edge TTS for Chair, browser TTS for delegates, Web Speech API for the user's mic
   - Post-session: AI grades user's delivery, content, engagement; gives rewrite examples and next-session focus


# Sign-In


- Two-step: email → 6-digit code → password
- Delegates can use any email + any password (4+ chars)
- Worker login requires the authorized email and password
- Dev mode (no Resend domain verified) shows the code on-screen as a fallback


# Tech & Reliability


- LLM: Google Gemini Flash with auto-fallback to Groq, Cerebras, and Anthropic. If one rate-limits, the next takes over transparently.
- Free tier capacity: ~50-100 mock conferences per day at no cost.
- Voice: Edge TTS is free, browser TTS is free, mic uses browser's free Web Speech API.


# Contact


- Email: ayaandhuria26@gmail.com
- Phone: 804-297-1800
- Club packages available on request


# How To Answer


- Keep responses concise — 2-4 sentences typically. Conversational, friendly, but professional.
- If asked about a Real-MUN feature, point to the right section / URL.
- If asked about MUN concepts in general, give a brief expert answer (you're allowed to know MUN procedure).
- If you don't know something specific or it's outside Real-MUN scope, suggest emailing ayaandhuria26@gmail.com.
- Never make up features, pricing, or coach names that aren't listed above.
- If a user asks about pricing, the answer is: "Free during launch — no card, no trial."
- Use plain text. No markdown headers, no bullet points unless really helpful, no asterisks for bold.


# Tone


You are an extension of the Real-MUN brand: confident, well-informed, slightly formal but friendly. Like a head delegate who answers questions at a conference info desk.
```


---


## 17. Verbatim Static Data Appendix


### B.1 — `src/lib/mun-data.ts`


```ts
export const COMMITTEES = [
  { id: "unsc", name: "UN Security Council (UNSC)", size: "15 members" },
  { id: "unga", name: "UN General Assembly (UNGA)", size: "all member states" },
  { id: "ecosoc", name: "UN Economic and Social Council (ECOSOC)", size: "54 members" },
  { id: "unhrc", name: "UN Human Rights Council (UNHRC)", size: "47 members" },
  { id: "who", name: "World Health Organization (WHO)", size: "194 members" },
  { id: "disec", name: "Disarmament and International Security (DISEC)", size: "all member states" },
  { id: "unep", name: "UN Environment Programme (UNEP)", size: "193 members" },
  { id: "crisis", name: "Crisis Committee (Historical / Hybrid)", size: "20-30 delegates" },
];


export const POPULAR_COUNTRIES = [
  "United States", "United Kingdom", "France", "Russian Federation", "China",
  "Germany", "Japan", "India", "Brazil", "South Africa", "Saudi Arabia",
  "Iran", "Israel", "Turkey", "Egypt", "Nigeria", "Mexico", "Argentina",
  "Australia", "Canada", "Indonesia", "South Korea", "Pakistan", "Bangladesh",
  "Ukraine", "Poland", "Italy", "Spain", "Netherlands", "Sweden", "Norway",
  "Switzerland", "United Arab Emirates", "Qatar", "Singapore", "Vietnam",
  "Thailand", "Philippines", "Kenya", "Ethiopia", "Ghana", "Morocco",
  "Chile", "Colombia", "Peru", "Venezuela", "Cuba", "North Korea",
];


export const SAMPLE_TOPICS = [
  "Climate finance and the Loss and Damage Fund",
  "Reform of the UN Security Council veto power",
  "Regulation of autonomous weapons systems",
  "Sovereign debt restructuring for low-income nations",
  "Cybersecurity norms in armed conflict",
  "Protection of journalists in conflict zones",
  "Access to mental health services in developing nations",
  "Maritime piracy in the Gulf of Guinea",
  "Refugee protection in protracted displacement situations",
  "Regulation of cryptocurrency for sanctions evasion",
];
```


### B.2 — `src/lib/learn-content.ts`


Type:
```ts
export type LearnSection = {
  id: string;
  title: string;
  blurb: string;
  items: { term: string; def: string; example?: string }[];
};
```


`learnSections` array, 6 entries:


**1. id: "first-day", title: "Your First Day, Explained"**
blurb: `A MUN committee is a structured debate. You represent a country, not yourself. Everything you say is a 'speech.' Everything you do procedurally is a 'motion' or a 'point.' Stick to that frame and you'll never look lost.`
items:
- Delegate: "You. You represent one country and speak only for that country's interests, never your personal opinion."
- Chair / Dais: "The people running the committee. They decide the speaking order, time limits, and what motions are in order."
- Placard: "The card with your country name on it. Raise it to be recognized to speak, to motion, or to vote."
- Quorum: "Minimum number of delegates needed to start debate. Usually announced at the start by the Chair."


**2. id: "parli-pro", title: "Parliamentary Procedure (Parli Pro)"**
blurb: `Parli Pro is the rulebook for how the committee flows. Most rookies fear it. Don't. There are really only ~6 motions you need on day one.`
items:
- Motion to Open Debate: "Used at the very start to formally begin substantive discussion." Example: `"Motion to open debate on the topic of climate financing."`
- Motion to Set the Speakers' List: "Opens a running list of delegates who want to give general speeches on the topic."
- Moderated Caucus: "Structured discussion on a sub-topic. Chair calls on raised placards. You propose total time, individual speaking time, and the topic." Example: `"Motion for a 10-minute moderated caucus, 1-minute speaking time, on funding mechanisms."`
- Unmoderated Caucus: "Informal time — delegates leave their seats and negotiate, form blocs, and draft papers." Example: `"Motion for a 15-minute unmoderated caucus to begin bloc work."`
- Point of Order: "Used when you believe procedure is being broken. Should be rare. The Chair rules immediately."
- Point of Inquiry: "A question to the Chair (not another delegate) about procedure or instructions."


**3. id: "speeches", title: "How to Give a Speech That Lands"**
blurb: `Most rookie speeches are list of facts. Winning speeches make one clear policy ask and tie it to a coalition. Aim for: 1 acknowledgement, 1 problem framing, 1 proposal, 1 call for support.`
items:
- Opening Line: "Acknowledge the Chair and the body. Builds credibility before content." Example: `"Honorable Chair, fellow delegates — the delegation of France believes…"`
- Frame the Problem: "One sentence on the stakes, ideally with a number or named consequence."
- Make a Specific Ask: "Name a mechanism, fund, body, or timeline. Vague speeches don't get cited in resolutions." Example: `"…a UNFCCC-administered Loss & Damage fund, capitalized at $100B annually by 2030."`
- Invite Coalition: "End by naming delegations you want to work with, or the kind of bloc you're seeking."


**4. id: "position-paper", title: "Position Papers in 4 Sections"**
blurb: `A position paper is your country's pre-conference statement. Keep it under two pages. Chairs skim — make every section pull weight.`
items:
- Topic Background: "Show you understand the issue without copy-pasting Wikipedia. 1 paragraph, focused on what matters for your country."
- Country Position: "Your country's actual stance. Cite real treaties, votes, statements. This is where most rookies lose marks."
- Past Action: "What has your country (or the body) already done? Include UN resolutions, funding commitments, or domestic policy."
- Proposed Solutions: "2-3 concrete proposals that fit your country's policy. Should preview the resolution language you'll push."


**5. id: "blocs", title: "Blocs & Coalition-Building"**
blurb: `Resolutions are written in unmoderated caucus by groups of countries called 'blocs.' Joining or leading a bloc is how you become a 'main submitter' and win awards.`
items:
- Bloc: "A group of delegates working on the same draft resolution. Usually forms along regional, ideological, or economic lines."
- Working Paper: "Early-stage draft of solutions. Not yet a resolution. Shared informally with the Chair."
- Draft Resolution: "Formal document submitted for debate. Has preambulatory and operative clauses."
- Sponsor / Signatory: "Sponsors write and defend the resolution. Signatories just want it to be debated and don't necessarily agree with it."


**6. id: "rookie-traps", title: "Rookie Traps to Avoid"**
blurb: `These are the mistakes Chairs notice on day one. Avoiding them is the cheapest way to look experienced.`
items:
- Speaking for yourself: `Never say "I think." Always say "the delegation of [country] believes." You are a diplomat, not a person.`
- Overusing Points of Order: "Chairs hate this. Use only when procedure is actually broken, not to disagree with another delegate."
- Ignoring your country's real policy: "Don't propose climate funding as Saudi Arabia. Don't propose abolishing the veto as the US. Chairs check."
- Sitting silent in unmod: "Awards are won in unmoderated caucus. If you don't walk over to a bloc and start writing, you don't exist."


### B.3 — Homepage content (`src/app/page.tsx`)


**Section cards (`sections` array):**
1. /learn — 01 — "Learn the Basics" — icon 🎓 — `"Parliamentary procedure, MUN vocabulary, and beginner tips — written for people who have never raised a placard before."` — CTA "Start learning"
2. /position-paper — 02 — "Position Paper Feedback" — icon ⚡ — `"Pick your committee, country, and topic. Paste your draft. Get structured, line-by-line AI feedback in under a minute."` — CTA "Get feedback"
3. /sessions — 03 — "1-on-1 Sessions" — icon 🤝 — `"Book a live session with an experienced delegate for speech coaching, resolution writing, or crisis prep."` — CTA "Book a session"
4. /conference — 04 — "Mock Conference" — icon 🏛 — `"30 minutes. A Chair, three AI delegates, and you. Raise your placard, give a speech, get scored on delivery and content."` — CTA "Enter the chamber"


**Stats:** `[{ value: "11", label: "Procedural phases", sub: "Simulated end to end" }, { value: "5", label: "Scoring dimensions", sub: "On every paper" }, { value: "< 60s", label: "Paper feedback", sub: "From upload to verdict" }, { value: "$0", label: "Early access", sub: "No card, no trial" }]`


**Learn points (dark band):**
- Parliamentary procedure: "Speakers' lists, moderated and unmoderated caucuses, motions, yields, and voting — what each is and when to use it."
- Diplomatic language: "Third-person framing, the rhetoric Chairs reward, and the rookie traps that get noticed within five minutes."
- Building coalitions: "How to walk into unmoderated caucus, find your bloc, and end up as a main submitter on the passing resolution."
- Crisis instincts: "Reacting to crisis updates under time pressure, writing tight crisis notes, and building a backroom arc that lands."


**Testimonials (3):**
1. quote: "I walked into my first conference already knowing how moderated caucuses flowed. The mock sessions made the actual chamber feel familiar." name: "First-time delegate", role: "Novice committee, regional MUN"
2. quote: "The AI feedback caught a policy red flag in my position paper that my coach missed. Saved me from making the wrong argument on day one." name: "Returning delegate", role: "ECOSOC, school-circuit MUN"
3. quote: "Better than any prep doc I've used. The unmoderated caucus simulation taught me how to actually trade clause language with other delegations." name: "Head delegate", role: "Specialized agency, college MUN"


**FAQs (5):**
1. q: "Is Real-MUN really free?" a: "Yes — every feature is free during early access. We use generous free tiers from Google Gemini, Groq, Cerebras, and Microsoft Edge TTS for AI, voice, and speech recognition. Sign in with any email and try everything."
2. q: "Do I need a microphone to use the mock conference?" a: "No. You can type your speeches instead. The microphone option is there if you want to practice your actual delivery — your browser's built-in speech recognition transcribes you live with no extra setup."
3. q: "How realistic are the AI delegates?" a: "Each delegate has a fixed country, a personality (diplomatic, aggressive, coalition-builder, etc.), and a system prompt that grounds them in that country's real foreign policy. They reference each other's speeches across the session, cite real treaty articles, and stay in character throughout."
4. q: "Will the feedback help me at an actual MUN conference?" a: "It's designed by experienced delegates around five dimensions Chairs actually score: research depth, policy alignment, structure, persuasiveness, and diplomatic language. Use it to tighten papers before your conference and to rehearse the floor experience."
5. q: "Can my club or school use this?" a: "Yes. Reach out — we offer club packages with group dashboards, custom committees, and training sessions for new delegates."


**Founder copy (dark band):**
- Eyebrow: `BUILT BY A DELEGATE, FOR DELEGATES`
- Heading: `Real-MUN exists because cold-walking into a conference is brutal.`
- Body p1: `**Ayaan Dhuria** founded Real-MUN after two years on the circuit — three competitive conferences, one Best Delegate, one Honorable Mention. He noticed new delegates were spending hundreds on prep books and coaching packages that didn't actually rehearse the chamber experience.`
- Body p2: `Real-MUN is built around what actually works: a feedback rubric grounded in what Chairs score, mock sessions modeled on real committee procedure, and the kind of in-room coaching that usually only comes from older delegates in your club.`


### B.4 — `src/components/Footer.tsx` exports


```ts
export const CONTACT = {
  email: "ayaandhuria26@gmail.com",
  phone: "804-297-1800",
  instagram: "https://instagram.com/realmun",
  twitter: "https://twitter.com/realmun",
  linkedin: "https://linkedin.com/company/realmun",
};
```


### B.5 — `src/lib/voices.ts`


```ts
export type BrowserVoiceProfile = {
  voiceHint: string[];
  rate: number;
  pitch: number;
};


export const DELEGATE_VOICE_PROFILES: BrowserVoiceProfile[] = [
  { voiceHint: ["Google UK English Male", "Daniel", "Microsoft George"], rate: 1.0, pitch: 0.95 },
  { voiceHint: ["Google US English", "Samantha", "Microsoft Zira"], rate: 1.05, pitch: 1.1 },
  { voiceHint: ["Google UK English Female", "Karen", "Microsoft Hazel"], rate: 0.95, pitch: 1.0 },
];
```


### C — `src/lib/conference/types.ts` (verbatim)


See file content in original source — all types listed in section 8 above. The most important constants to preserve:


`PhaseType` union (10 string literal members):
`"roll_call" | "motion_open_debate" | "gsl_setup" | "opening_speeches" | "motion_mod_caucus" | "moderated_caucus" | "motion_unmod_caucus" | "unmoderated_caucus" | "voting" | "closing"`


`Persona` union (5 members):
`"diplomatic" | "aggressive" | "coalition_builder" | "technical" | "quiet"`


### D — `src/lib/conference/chair-templates.ts` — All templated lines verbatim


**Roll call opening:**
```ts
`Delegates, the committee will come to order. We will now proceed with the roll call. When called, please respond "present" or "present and voting." Roll: ${allCountries.join(", ")}.`
```


**Motion-open-debate opener:**
```ts
`The roll being established, the chair entertains a motion to open debate on the topic of "${setup.topic}."`
```


**GSL setup opening:**
```
Debate is now open. The chair will now establish the General Speakers' List. All delegations wishing to be added to the speakers' list, please raise your placards now.
```


**GSL announcement:**
```ts
`Thank you. The speakers' list is set as follows: ${named.join(", then ")}. Each delegation will have ${speakingTimeSec} seconds. The chair recognizes the first speaker.`
```
where `named` replaces "user" with `setup.userCountry`.


**Opening speeches opener:**
```ts
`The chair recognizes ${firstLabel}.`
```
where `firstLabel` = `"the delegation of " + countryOrUserCountry`.


**Motion-mod-caucus opener:**
```ts
`The chair entertains a motion for a moderated caucus on "${phase.topicFocus || setup.topic}."`
```


**Moderated caucus opener:**
```ts
`Moderated caucus on "${phase.topicFocus}" for ${total} minutes, ${t} seconds per speaker. The chair recognizes ${firstLabel}.`
```


**Motion-unmod-caucus opener:**
```
The chair entertains a motion for an unmoderated caucus to begin bloc work.
```


**Unmoderated caucus opener:**
```ts
`A ${total}-minute unmoderated caucus is in order. Delegates may leave their seats. Form blocs, exchange working papers.`
```


**Voting opener:**
```
The committee will now move into voting procedure. The floor is closed to debate.
```


**Recognize next (random pick from 3):**
For user with country:
- `The delegation of ${country}.`
- `${country}, you have the floor.`
- `The chair recognizes the delegation of ${country}.`


For a regular speaker:
- `The delegation of ${speaker}.`
- `${speaker}.`
- `The chair recognizes ${speaker}.`


**Recognize user placard (3 variants):**
- `The chair sees the placard of ${country}. You have the floor — sixty seconds.`
- `${country}, you are recognized.`
- `The delegation of ${country} is recognized.`


**Delegate motion templates:**
For "open_debate":
- `Motion to open debate on the topic at hand.`
- `The delegation of ${delegate.country} motions to open debate.`
- `Motion to open debate, honorable chair.`


For "gsl":
- `Motion to open the General Speakers' List.`
- `Honorable chair, motion to set the speakers' list.`


For "mod_caucus":
- `Motion for a moderated caucus on ${topicFocus ?? "this matter"}, six minutes total, sixty seconds per speaker.`
- `Motion for a six-minute moderated caucus, sixty seconds individual, on ${topicFocus ?? "the matter at hand"}.`


For "unmod_caucus":
- `Motion for a six-minute unmoderated caucus to begin bloc work.`
- `Motion for an unmoderated caucus, six minutes, for working paper drafting.`


**Chair accepts motion (3 variants):**
- `Are there any objections? Seeing none, the motion passes.`
- `The chair entertains the motion. No objections — the motion passes by acclamation.`
- `The chair sees no objections. The motion passes.`


**Placard response (3 variants):**
- `The delegation of ${country} raises its placard.`
- `${country} raises.`
- `${country} stands ready.`


**Acknowledge motion (by keyword match on motion text):**
- contains "moderated caucus": `The delegation of ${country} is recognized. Motion for a moderated caucus${details ? `, ${details}` : ""}. Any objections? Seeing none, the motion passes.`
- contains "unmoderated caucus": `The delegation of ${country} is recognized. Motion for an unmoderated caucus${details ? `, ${details}` : ""}. The motion passes by acclamation.`
- contains "extend": `The chair recognizes the motion to extend${details ? `: ${details}` : ""}. Any objections? The motion passes.`
- contains "point of inquiry": `The chair recognizes the inquiry${details ? `: ${details}` : ""}. The chair refers the delegate to the rules of procedure.`
- contains "point of order": `Point of order noted${details ? `: ${details}` : ""}. The chair will rule. Please continue.`
- contains "close debate": `A motion to close debate has been made. The chair will move to voting procedure.`
- contains "introduce" AND "resolution": `The chair recognizes the delegation of ${country}. The draft resolution is in order for circulation.`
- otherwise return null (caller falls back to LLM)


**Closing transition:**
If next phase is closing:
- `Time. We will now move to closing remarks.`
- `The committee will now proceed to closing.`


If next phase is voting:
- `Time. We will now move to voting procedure.`
- `The committee will proceed to a vote.`


Otherwise:
- `Time. The committee will proceed.`
- `Time has expired on this caucus.`
- `The chair will move forward.`


**Closing-phase template fallback** (used when LLM fails or truncates):
```
Delegates, we have reached the close of our session on ${setup.topic}. The chair commends every delegation for their substantive engagement and the proposals advanced today. Significant progress has been made, and the chair looks forward to seeing these ideas developed further. The chair thanks you all for your participation, your professionalism, and your commitment to this body. This committee stands adjourned.
```


---


## 18. Deployment Notes


- **Vercel** is the recommended host. `next start` works on any Node 20+ environment as well.
- Set all the same env vars in the Vercel project's Environment Variables panel (paste from `.env.local`).
- The Resend "from" address `onboarding@resend.dev` only works for verified emails — for production, verify a domain on Resend and set `RESEND_FROM` to your verified address.
- `runtime = "nodejs"` is set on every API route — do NOT change to `edge`. `msedge-tts`, the Anthropic SDK, and some `crypto.subtle` usage need Node.


---


## 19. Verification Checklist


After rebuild, manually verify:


- [ ] `npm run dev` boots without errors. Homepage renders at `/`.
- [ ] Nav links Learn, Position Paper, Sessions, Mock Conference all work.
- [ ] Theme toggle persists across reload.
- [ ] Dias AI button appears bottom-right on every page EXCEPT `/conference/live`. Sending a message returns a reply.
- [ ] `/learn` renders all 6 sections with TOC anchors working.
- [ ] `/position-paper` 5-step flow completes; submitting a 200+ word paper returns scored feedback in ~30s.
- [ ] `/sessions` flow completes; booking submission returns success screen. If Resend not configured, shows the dev-mode message.
- [ ] `/conference` setup → Begin session → `/conference/live` starts with roll call.
- [ ] During roll call: when user's country is called, the simple "Present" / "Present and voting" dock appears.
- [ ] User goes FIRST in opening speeches. Mic dock appears. Both Web Speech (Chrome/Edge) and Type-only paths work. "Deliver →" appends to transcript.
- [ ] Raising placard during a phase queues you; Chair recognizes you on next turn.
- [ ] Motion modal lists 7 motions; submitting "Moderated Caucus" routes through `acknowledgeMotion` and returns a chair acknowledgement.
- [ ] After 30 minutes (or hitting End), feedback screen renders with overall_score/100 and the 3 sub-scores.
- [ ] Sign-in flow: enter email → if no Resend, dev code shown; verify → routes to home.
- [ ] Worker sign-in (`/sign-in?required=worker`, email = `ayaandhuria26@gmail.com`, password = `set-a-strong-password`) lands at `/worker`.
- [ ] Worker dashboard shows counts and activity from submitted papers/sessions/bookings.


---


## End of Blueprint


If the rebuild AI follows this document section by section, the result will be functionally identical to the original Real-MUN. The most critical sections to preserve verbatim are:


1. Section 16 (all LLM system prompts)
2. Section 17 (all static data: committees, countries, topics, learn content, voices)
3. The chair-templates lines in Appendix D
4. The `client-audio.ts` Chrome keepalive + Web Speech rebuild-from-scratch behavior


Everything else can be reorganized stylistically as long as the public contracts (API routes, file exports, env vars, page routes) stay the same.





