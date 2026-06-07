
## 🖥️ Platform Preview

<div align="center">

| Collaborative Editor | Mock Interview Room | AI-Powered Debrief |
|:---:|:---:|:---:|
| *Monaco editor with live Yjs CRDT sync, remote cursor overlays, 7-language selector* | *Three-panel layout: problem description · live editor · WebRTC video tiles* | *Post-session scores: communication, code quality, complexity, overall readiness* |

| ELO Dashboard | Peer Matching Queue | Session Playback |
|:---:|:---:|:---:|
| *GitHub-style contribution heatmap, ELO trend AreaChart, streak counter* | *Role + topic selector, live queue position with wait estimate, partner ELO* | *Timeline scrubber with line-level diff replay, approach-restart detection, analytics* |

> 🎬 **Live demo coming soon** — clone and run locally in under 5 minutes with the Quick Start below.

</div>

---

<div align="center">

| [✨ Features](#-features) | [🏗️ Architecture](#️-architecture) | [⚡ Quick Start](#-quick-start) |
|---|---|---|
| [🔧 Environment Setup](#-environment-setup) | [📡 API Reference](#-api-reference) | [🔌 Socket Events](#-socket-events) |
| [🗄️ Data Models](#️-data-models) | [💎 Subscription & Pricing](#-subscription--pricing) | [🤖 AI Integration](#-ai-integration) |
| [⚙️ Code Execution](#️-code-execution-engine) | [🚀 Deployment](#-deployment) | [🗺️ Roadmap](#️-roadmap) |

</div>

---

## ✨ Features

<div align="center">

### Core Interview Features

</div>

<table>
<tr>
<td width="33%" align="center">

**🖊️ Collaborative Code Editor**

Monaco editor (the engine powering VS Code) with Yjs CRDT synchronization transported over Socket.IO binary frames. Two users edit the same document conflict-free with no central server reconciling state — remote cursors render as absolute-positioned overlays via `y-monaco`. Debounced snapshots push to MongoDB every 5 seconds, enabling full session replay.

</td>
<td width="33%" align="center">

**📹 Peer-to-Peer Video Chat**

Native WebRTC `RTCPeerConnection` per remote participant with 3 Google STUN servers for NAT traversal. Socket.IO acts as the signaling relay only — media travels directly browser-to-browser. Participants can mute audio, disable video, or share their screen without interrupting the shared editor state.

</td>
<td width="33%" align="center">

**🤖 Gemini AI Assistant**

Google Gemini Flash integration with a 7-key round-robin pool that skips any key returning HTTP 429. Three distinct modes: contextual hints (never reveals full solutions), structured code analysis with time and space complexity, and DSA question generation for interviewers. Users with a personal API key bypass the shared pool and all rate limits.

</td>
</tr>
<tr>
<td width="33%" align="center">

**⚡ Automated Code Execution**

Judge0 CE sandbox runs code against visible and hidden test cases. A custom `wrapCodeForTest` harness builds stdin/stdout-aware executables for 7 languages: JavaScript, Python, Java, C++, TypeScript, C, and Go. Results surface per-test pass/fail with execution time, memory usage, and stderr output.

</td>
<td width="33%" align="center">

**🎯 ELO-Based Peer Matching**

In-memory Socket.IO queue matches users within ±200 ELO points, filtered by preferred role (interviewer / interviewee / either) and topic tag. Queue positions update every 5 seconds; users timeout after 60 seconds. ELO uses K-factor 32 with per-session modifiers for problem difficulty and session duration.

</td>
<td width="33%" align="center">

**📊 AI Post-Session Debrief**

After every session, an Agenda background job triggers Gemini to generate a structured debrief: communication (1–5), problem decomposition (1–5), code quality (1–5), complexity analysis (1–5), and an overall interview readiness score (1–10). The debrief includes what went well, areas to improve, and personalized study topic recommendations.

</td>
</tr>
</table>

<div align="center">

### Platform Features

</div>

<table>
<tr>
<td width="50%">

🏆 **ELO Rating System** — Starts at 1200, K=32 with difficulty and duration modifiers; displayed on the dashboard as a Recharts trend chart alongside per-session ELO deltas

⏱️ **Multi-Phase Interview Timer** — Setup (5 min) → Coding (35 min) → Q&A (5 min) → Ended; all phases socket-synced to non-interviewer participants with an SVG ring visualization

📼 **Session Replay** — Full scrubable playback through all code snapshots with `diffEngine.js` computing line-level diffs, approach-restart detection (< 20% line retention), and pause segment identification

🔥 **Streaks & Gamification** — Daily session streak stored in `User.streakData`; displayed on the dashboard as a GitHub-style 52-week contribution heatmap built with Recharts

</td>
<td width="50%">

📚 **Learning Tracks** — Company-specific curated problem playlists (Amazon, Google, etc.) with per-user progress tracked via a compound-indexed `UserTrackProgress` collection

💳 **Subscription Tiers** — Free / Pro / Premium / Ultra plans via Razorpay payment links; webhook payloads verified with HMAC-SHA256; monthly usage counters auto-reset each billing period

🛡️ **Admin Panel** — Subscription revenue analytics (MRR, annual run rate, conversion rate), user ban toggle, full problem CRUD, and problem report resolution in a 5-tab interface

🔑 **Personal API Key Bypass** — Users supply their own Gemini key; it's stored server-side and short-circuits all usage checks, giving effective unlimited AI access on any plan

</td>
</tr>
</table>

---

## 🏗️ Architecture

### System Infrastructure

```
┌───────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                │
│   React 18 SPA — Vite dev server :5173                                │
│   ┌───────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────────┐   │
│   │  Monaco   │  │  Yjs     │  │  WebRTC   │  │  Socket.IO       │   │
│   │  Editor   │  │  CRDT    │  │  P2P A/V  │  │  Client          │   │
│   │ y-monaco  │  │ y-monaco │  │  3×STUN   │  │  WS + polling    │   │
│   └───────────┘  └──────────┘  └───────────┘  └──────────────────┘   │
└──────────────┬─────────────────────────────────┬──────────────────────┘
               │ HTTPS  /api/*                   │ WSS  /socket.io
               ▼                                 ▼
┌───────────────────────────────────────────────────────────────────────┐
│                         BACKEND  :5000                                │
│   ┌─────────────────────────┐   ┌───────────────────────────────────┐ │
│   │      Express App        │   │       Socket.IO Server            │ │
│   │  helmet · cors · morgan │   │  ┌────────────┬────────────────┐  │ │
│   │  json · cookie · gzip   │   │  │ roomHandler│  codeSync      │  │ │
│   │  5 rate-limit tiers     │   │  ├────────────┼────────────────┤  │ │
│   │  JWT auth middleware    │   │  │ matching   │  webrtc        │  │ │
│   │  14 route groups        │   │  │ Queue      │  Signaling     │  │ │
│   │  14 controllers         │   │  └────────────┴────────────────┘  │ │
│   └──────────┬──────────────┘   └───────────────────────────────────┘ │
│              │                                │                        │
│   ┌──────────▼────────────────────────────────▼──────────────────┐    │
│   │                     MongoDB Atlas                             │    │
│   │   Users · Sessions · Problems · Rooms · AiDebriefs · Tracks  │    │
│   └───────────────────────────────────────────────────────────────┘   │
│   ┌───────────────────────────────────────────────────────────────┐   │
│   │   Agenda Scheduler (MongoDB-backed — agendaJobs collection)   │   │
│   │   ai-debrief · session-complete · email · weekly-digest       │   │
│   └───────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────┘
        │               │               │                │
        ▼               ▼               ▼                ▼
 ┌────────────┐  ┌─────────────┐  ┌──────────┐  ┌─────────────────┐
 │ Gemini API │  │  Judge0 CE  │  │Razorpay  │  │ Google STUN /   │
 │ Flash Lite │  │  Docker     │  │Payment   │  │ Gmail SMTP      │
 │ 7-key pool │  │  Sandbox    │  │Links     │  │                 │
 └────────────┘  └─────────────┘  └──────────┘  └─────────────────┘
```

### Real-Time Collaborative Editing Flow

```
User A types in Monaco          Socket.IO Server          User B's Monaco
        │                               │                        │
        │  Yjs produces local update    │                        │
        │  y-monaco applies to editor   │                        │
        │                               │                        │
        ├──── emit('yjs-update') ──────►│                        │
        │     (binary CRDT diff)        │                        │
        │                               ├─── emit('yjs-update') ─►
        │                               │    (relay binary diff)  │
        │                               │                        │
        │                               │    Yjs.applyUpdate()    │
        │                               │    y-monaco re-renders  │
        │                               │                        │
        │   [5 second debounce]         │                        │
        ├──── emit('code-snapshot') ───►│                        │
        │     {code, language}          │                        │
        │                               ├─── Session.$push() ───► MongoDB
        │                               │                        │
        │   Cursor position changed     │                        │
        ├──── emit('cursor-update') ───►│                        │
        │     {line, column, userId}    ├─── emit('cursor-update') ►
        │                               │    CursorLabel overlays  │
```

### Authentication Lifecycle

```mermaid
sequenceDiagram
    participant C as React Client
    participant A as Axios Interceptor
    participant API as Express API
    participant DB as MongoDB

    Note over C,DB: Registration
    C->>API: POST /api/auth/register {username, email, password}
    API->>API: bcrypt.hash(password, 12 rounds)
    API->>DB: User.create({username, email, passwordHash})
    API-->>C: 201 {accessToken, user} + httpOnly refreshToken cookie

    Note over C,DB: Silent Token Refresh on 401
    C->>A: Request to protected route
    A->>A: Attach Bearer accessToken
    A->>API: GET /api/dashboard
    API-->>A: 401 TOKEN_EXPIRED
    A->>API: POST /api/auth/refresh (httpOnly cookie sent automatically)
    API->>API: jwt.verify(refreshToken, JWT_REFRESH_SECRET)
    API-->>A: 200 {accessToken, user}
    A->>A: Update stored accessToken
    A->>API: Retry original request with new token
    API-->>C: 200 dashboard data

    Note over C,DB: Logout
    C->>API: POST /api/auth/logout
    API-->>C: 200 + clears refreshToken cookie
    C->>C: localStorage.clear() + sessionStorage.clear() + redirect /
```

---

## 🛠️ Tech Stack

### Backend

<div align="center">

| Badge | Technology | Version | Decision Rationale |
|:---:|---|:---:|---|
| <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white"/> | **Node.js** | 20+ | Non-blocking I/O handles hundreds of concurrent socket connections without thread overhead; single language across full stack |
| <img src="https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white"/> | **Express** | 4.18 | Minimal surface area; the 9-step middleware chain maps 1:1 with the request lifecycle: security → parsing → auth → rate-limiting |
| <img src="https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white"/> | **MongoDB** | 7 (Atlas) | Session snapshots are deeply nested arrays; the document model eliminates the 4-table joins that a relational schema would require |
| <img src="https://img.shields.io/badge/Socket.IO-010101?style=flat-square&logo=socketdotio&logoColor=white"/> | **Socket.IO** | 4.7 | Binary frame support for Yjs CRDT diffs; automatic polling fallback for corporate firewalls; built-in room abstraction for sessions |
| <img src="https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white"/> | **JWT** | — | Stateless auth: 15-minute access tokens + 7-day refresh tokens in httpOnly cookies — no server-side session store needed |
| <img src="https://img.shields.io/badge/bcryptjs-6d28d9?style=flat-square&logoColor=white"/> | **bcryptjs** | 2.4 | 12 salt rounds (~250 ms per hash); `passwordHash` uses `select: false` — never accidentally exposed in responses |
| <img src="https://img.shields.io/badge/Agenda-4f46e5?style=flat-square&logoColor=white"/> | **Agenda** | 5.0 | MongoDB-backed job queue; no additional Redis infrastructure for debrief generation, email dispatch, and weekly digest jobs |
| <img src="https://img.shields.io/badge/Razorpay-0C2451?style=flat-square&logo=razorpay&logoColor=white"/> | **Razorpay** | 2.9 | Payment link model fits one-time subscription activation without a recurring subscription entity to manage on the Razorpay side |
| <img src="https://img.shields.io/badge/Helmet-ef4444?style=flat-square&logoColor=white"/> | **Helmet** | 7.1 | Sets 15+ security headers (CSP, HSTS, X-Frame-Options, XSS-Protection) in a single middleware call |
| <img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white"/> | **Docker** | — | `node:20-alpine` under 150 MB; non-root `node` user; health-checked against `/api/health` every 30 seconds |

</div>

### Frontend

<div align="center">

| Badge | Technology | Version | Decision Rationale |
|:---:|---|:---:|---|
| <img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black"/> | **React** | 18.2 | Concurrent rendering; all 14 pages lazy-loaded; three context providers (Auth, Socket, Gemini) with no external state manager |
| <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white"/> | **Vite** | 5.0 | Native ESM dev server — no bundling during development; `/api` and `/socket.io` proxied to `:5000` in `vite.config.js` |
| <img src="https://img.shields.io/badge/Monaco_Editor-007ACC?style=flat-square&logo=visualstudiocode&logoColor=white"/> | **Monaco Editor** | 4.6 | VS Code's engine in the browser; full IntelliSense + syntax highlighting for all 7 supported languages; custom `peercode-dark` theme |
| <img src="https://img.shields.io/badge/Yjs-6d28d9?style=flat-square&logoColor=white"/> | **Yjs** | 13.6 | Production-proven CRDT; `y-monaco` binding exists and is actively maintained; no central server needed for conflict resolution |
| <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white"/> | **Tailwind CSS** | 3.4 | Custom dark design system: `bg-base: #0a0a14`, `accent: #6d4df2`; JetBrains Mono for code, Inter for UI; utility classes stay colocated with components |
| <img src="https://img.shields.io/badge/React_Router-CA4245?style=flat-square&logo=reactrouter&logoColor=white"/> | **React Router** | 6.21 | SPA routing with lazy-loaded routes; `ProtectedRoute` and `AdminRoute` guard components prevent unauthenticated access |
| <img src="https://img.shields.io/badge/Recharts-22c55e?style=flat-square&logoColor=white"/> | **Recharts** | 2.10 | ELO trend AreaChart, session analytics curves, contribution heatmap — composable, tree-shakeable, and SSR-safe |
| <img src="https://img.shields.io/badge/Lucide_React-f97316?style=flat-square&logoColor=white"/> | **Lucide React** | 0.294 | Consistent icon set; single import path; tree-shakeable per icon |

</div>

---

## 📁 Project Structure

<details>
<summary><b>📦 Backend — peercode-backend/src/</b> (click to expand)</summary>

```
peercode-backend/
├── server.js                    ← Entry: HTTP server, MongoDB connect, Socket.IO init, Agenda start
├── Dockerfile                   ← node:20-alpine, non-root user, /api/health healthcheck every 30s
├── docker-compose.yml           ← backend service + MongoDB 7 with health-checked depends_on
│
└── src/
    ├── app.js                   ← Express: 9-step middleware chain + 14 route mounts + error handler
    │
    ├── config/
    │   ├── db.js                ← MongoDB connect with 5-retry exponential backoff (1s → 2s → 4s → 8s → 16s)
    │   ├── gemini.js            ← 7-key round-robin pool; skips 429; personal key bypass; validateKey()
    │   └── agenda.js            ← Agenda instance reuses existing Mongoose connection; collection: agendaJobs
    │
    ├── models/
    │   ├── User.js              ← ELO, subscription sub-schema, usage counters, solvedProblems array
    │   ├── Session.js           ← Snapshots array, per-participant eloData, test results, problemSnapshot cache
    │   ├── Problem.js           ← hiddenTests (select:false), stubs, starterCode per language
    │   ├── Room.js              ← UUID v4 roomId, participants with roles, maxParticipants
    │   ├── Rating.js            ← Peer rating 1–5 with optional feedback text
    │   ├── Track.js             ← Company problem playlists with order and frequencyNote
    │   ├── UserTrackProgress.js ← Compound index {user, track}; completedProblems sub-array
    │   ├── AiDebrief.js         ← 4 scored categories + overallReadiness + strengths/improvements
    │   └── ProblemReport.js     ← Issue reports categorized by type; resolved flag + admin resolver
    │
    ├── routes/
    │   ├── auth.js              ← POST register / login / refresh / logout
    │   ├── rooms.js             ← CRUD rooms + join; auth + 300 req/min rate limit
    │   ├── problems.js          ← Filtered list, stats, admin CRUD, solve, report
    │   ├── sessions.js          ← History, single, playback, end, debrief, analytics
    │   ├── users.js             ← Profile, Gemini API key save, solved problems list
    │   ├── profile.js           ← Update username/email + change password
    │   ├── debrief.js           ← Generate (cached 24h) + retrieve AI debrief
    │   ├── dashboard.js         ← Aggregated profile + stats + recent sessions
    │   ├── gemini.js            ← hint / analyze / generate-question / usage (30 req/min)
    │   ├── execute.js           ← Full execution, simple run, test case CRUD (30 req/min)
    │   ├── tracks.js            ← List, single, user progress, complete-problem
    │   ├── admin.js             ← Stats, user management, problem CRUD, reports (adminAuth guard)
    │   ├── geminiKey.js         ← Live validation against Google API
    │   └── subscription.js      ← Plans, status, create, cancel, Razorpay webhook
    │
    ├── middleware/
    │   ├── auth.js              ← JWT Bearer → full Mongoose User document on req.user
    │   ├── adminAuth.js         ← Synchronous: req.user.role !== 'admin' → 403 FORBIDDEN
    │   ├── rateLimiter.js       ← 5 tiers: general(500/15m) dashboard(200/5m) api(300/1m) gemini(30/1m) execute(30/1m)
    │   └── errorHandler.js      ← Mongoose ValidationError, CastError, JWT errors, E11000 duplicate, 500 fallback
    │
    ├── socket/
    │   ├── index.js             ← Socket.IO init; JWT auth on connection; loads 4 handler modules
    │   ├── roomHandler.js       ← join/leave/chat/timer/ELO calculation/session-end events
    │   ├── codeSync.js          ← Yjs binary sync, cursor broadcasts, 5s snapshot persistence
    │   ├── matchingQueue.js     ← In-memory ELO ±200 queue; role+topic filtering; 60s timeout
    │   └── webrtcSignaling.js   ← offer/answer/ice-candidate relay; no media touches server
    │
    ├── utils/
    │   ├── httpResponse.js      ← ok(res, data, msg, status) / fail(res, status, msg) envelope
    │   ├── jwtUtils.js          ← signToken / verifyToken / signRefreshToken / verifyRefreshToken
    │   ├── diffEngine.js        ← computeDiffs(snapshots) → line-level changes array for playback
    │   ├── eloSystem.js         ← ELO delta with difficulty multiplier + duration modifier
    │   ├── eloCalculator.js     ← Standard ELO formula; K=32
    │   ├── streakCalculator.js  ← computeUserStreak(userId) → {currentStreak, longestStreak}
    │   ├── executeHelpers.js    ← getLanguageId, extractFunctionName regex per language, wrapCodeForTest
    │   ├── codeTemplates.js     ← Starter code + best practices for 6 languages
    │   ├── pistonExecutor.js    ← Alternative execution via Piston API (Judge0 fallback)
    │   └── subscription.js      ← Plan limits map, canUseFeature(), incrementUsage() + monthly reset
    │
    ├── jobs/
    │   ├── scheduler.js                   ← Register 5 jobs, start Agenda, schedule weekly-digest cron
    │   └── definitions/
    │       ├── sessionCompleteJob.js      ← Finalize session → cascade: rating / email / debrief / streak
    │       ├── ratingUpdateJob.js         ← Compute ELO adjustment from submitted peer ratings
    │       ├── emailJob.js                ← SMTP send via nodemailer; Gmail app-password auth
    │       ├── aiDebriefJob.js            ← Gemini debrief generation → store AiDebrief document
    │       └── weeklyDigestJob.js         ← Build weekly performance summary email for active users
    │
    └── seeds/
        ├── problemSeed.js          ← 10 coding problems with visible + hidden test cases
        ├── trackSeed.js            ← 4 company learning tracks linked to seeded problems
        ├── adminSeed.js            ← Promote test@example.com to admin role
        ├── sessionSeed.js          ← 2 test users + 1 session with 3 code snapshots
        ├── testuser2Seed.js        ← Create second test account for paired session testing
        └── addMissingTestCases.js  ← Backfill test cases for 7 problems missing them
```

</details>

<details>
<summary><b>⚛️ Frontend — peercode-frontend/src/</b> (click to expand)</summary>

```
peercode-frontend/src/
├── main.jsx       ← BrowserRouter > AuthProvider > SocketProvider > GeminiProvider > App + Toaster
├── App.jsx        ← React.lazy() for all 14 pages; ProtectedRoute + AdminRoute guards; global key handlers
│
├── pages/
│   ├── HomePage.jsx           ← Landing: login/register forms + feature showcase
│   ├── DashboardPage.jsx      ← ELO trend, streak, heatmap, session list, subscription cards
│   ├── RoomPage.jsx           ← Interview room: RoomLobby → RoomLayout (lobby phase → room phase)
│   ├── ProblemsPage.jsx       ← Filterable problem grid with difficulty/tag/company filters + pagination
│   ├── ProblemDetailPage.jsx  ← Problem statement + Monaco editor + TestCaseRunner
│   ├── ProfilePage.jsx        ← Username/password settings, achievements, GeminiKeyManager
│   ├── PlaybackPage.jsx       ← Session replay: PlaybackTimeline + PlaybackPlayer + SessionAnalytics
│   ├── DebriefPage.jsx        ← AI debrief scores polled every 10s until the Agenda job finishes
│   ├── TracksPage.jsx         ← Company learning track cards with per-track progress bars
│   ├── TrackDetailPage.jsx    ← Track problem list with completion badges and practice links
│   ├── AdminPage.jsx          ← 5-tab panel: overview / subscriptions / users / problems / reports
│   ├── MatchPage.jsx          ← Thin wrapper rendering MatchingQueue component
│   ├── SubscriptionPage.jsx   ← Plan comparison cards, billing toggle, usage bars, Razorpay checkout
│   └── NotFoundPage.jsx       ← 404 with home link
│
├── components/
│   ├── editor/
│   │   ├── CodeEditor.jsx        ← Monaco wrapper: peercode-dark theme, all 7 languages configured
│   │   ├── CursorLabel.jsx       ← Absolute-positioned overlay rendering remote cursor + username
│   │   └── EditorToolbar.jsx     ← Language dropdown, run button, copy-to-clipboard button
│   │
│   ├── room/
│   │   ├── RoomLayout.jsx        ← Three-panel layout: [problem] [editor+tests] [chat/AI/participants]
│   │   ├── RoomLobby.jsx         ← Camera preview, mute/video toggles, role select before joining
│   │   ├── InterviewTimer.jsx    ← Multi-phase SVG ring timer; syncs state over socket to all peers
│   │   ├── MatchingQueue.jsx     ← State machine: idle → waiting → matched → expired
│   │   ├── InterviewerNotes.jsx  ← Freeform notes textarea, 5-star rating, hire/no-hire toggle
│   │   ├── ParticipantList.jsx   ← Avatar list with role badge and mute indicator
│   │   ├── ShareRoomModal.jsx    ← Copy room link + room ID with one click
│   │   └── TestResultsPanel.jsx  ← End-of-session test results summary + per-case detail
│   │
│   ├── video/
│   │   ├── VideoPanel.jsx        ← Floating draggable video tiles container with controls overlay
│   │   ├── VideoTile.jsx         ← Single video stream or avatar placeholder with status badges
│   │   └── VideoControls.jsx     ← Mute / camera off / screen-share / hang-up buttons
│   │
│   ├── gemini/
│   │   ├── AIHintPanel.jsx       ← Hint and analyze buttons with markdown result rendering
│   │   └── GeminiKeyManager.jsx  ← Key input, live Google API validation on blur, save/remove
│   │
│   ├── problems/
│   │   ├── ProblemPanel.jsx      ← Description / hints / editorial tab switcher
│   │   ├── TestCaseRunner.jsx    ← Per-test-case grid; auto-marks problem solved on all-pass
│   │   ├── ProblemBrowser.jsx    ← Full-screen search + difficulty/tag/company filter modal
│   │   ├── ExecutionOutput.jsx   ← Simple stdin/stdout execution result display
│   │   └── BestPracticesPanel.jsx ← Language-specific coding tips panel
│   │
│   ├── playback/
│   │   ├── PlaybackTimeline.jsx  ← Scrubber with play/pause + speed control (0.5× to 4×)
│   │   ├── PlaybackPlayer.jsx    ← Read-only Monaco editor showing snapshot at current index
│   │   └── SessionAnalytics.jsx  ← Recharts AreaChart + approach count + pause segment markers
│   │
│   ├── dashboard/
│   │   └── ContributionHeatmap.jsx ← GitHub-style 52-week activity grid built with Recharts
│   │
│   └── common/
│       ├── Navbar.jsx             ← Top nav: links, user dropdown, mobile sidebar, upgrade CTA
│       ├── Modal.jsx              ← Headless UI Dialog wrapper with backdrop blur
│       ├── ConnectionBanner.jsx   ← Fixed top banner showing socket connection state
│       ├── ErrorBoundary.jsx      ← Class component catching render errors with retry button
│       ├── LoadingButton.jsx      ← Button with inline spinner for async actions
│       ├── Badge.jsx              ← Styled difficulty/status badge (easy/medium/hard/custom)
│       └── Skeleton.jsx           ← Pulsing gray placeholder for loading states
│
├── context/
│   ├── AuthContext.jsx    ← user, accessToken, isLoading, login / register / logout / refreshToken
│   ├── SocketContext.jsx  ← Socket.IO lifecycle: creates on auth, destroys on logout
│   └── GeminiContext.jsx  ← Personal API key in localStorage (key: peercode_gemini_key)
│
├── hooks/
│   ├── useWebRTC.js       ← RTCPeerConnection per peer; STUN servers; offer/answer/ICE flow
│   ├── useYjsEditor.js    ← Y.Doc + y-monaco binding; 3-minute no-edit stuck detection
│   ├── useGemini.js       ← Fetch hint / analysis / question with loading + error state
│   └── useRoom.js         ← Room data fetch + all room socket event listeners
│
├── services/
│   ├── api.js             ← Axios instance; silent 401 → refresh interceptor; all API functions
│   └── socketService.js   ← createSocket(token) factory; 15 reconnection attempts
│
└── utils/
    ├── codeTemplates.js   ← Starter code for 6 languages
    ├── diffUtils.js       ← Line diff, code stats, approach-restart detection (< 20% retention)
    ├── validation.js      ← Email / password / username validators + sanitize helpers
    └── webrtcConfig.js    ← STUN server list: stun.l.google.com 19302 × 3 servers
```

</details>

---

## ⚡ Quick Start

### Step 1 — Prerequisites

```bash
node --version    # Requires 20.x or later
npm --version     # Requires 9.x or later
mongod --version  # Requires 7.x locally — OR use a free MongoDB Atlas cluster
```

### Step 2 — Clone & Install

```bash
git clone https://github.com/GJBarhate/peercode.git
cd peercode

# Backend dependencies
cd peercode-backend && npm install

# Frontend dependencies
cd ../peercode-frontend && npm install
```

### Step 3 — Configure Environment

Copy and edit the environment file:

```bash
cp peercode-backend/.env.example peercode-backend/.env
# Minimum viable config: MONGO_URI, JWT_SECRET, JWT_REFRESH_SECRET, FRONTEND_URL, GEMINI_KEY_1
```

Generate secure JWT secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Run this command twice — once for JWT_SECRET, once for JWT_REFRESH_SECRET
```

### Step 4 — Run Both Servers

```bash
# Terminal 1 — Backend (Express + Socket.IO on port 5000)
cd peercode-backend
npm run dev

# Terminal 2 — Frontend (Vite dev server on port 5173, proxied to :5000)
cd peercode-frontend
npm run dev
```

### Step 5 — Seed Sample Data

```bash
cd peercode-backend

# Seed 10 coding problems with test cases and hidden tests
npm run seed:problems

# Seed 4 company learning tracks linked to seeded problems
npm run seed:tracks

# Promote test@example.com to the admin role
node src/seeds/adminSeed.js

# Create a second test user for testing matched sessions
node src/seeds/testuser2Seed.js
```

### Step 6 — Verify Installation

```bash
curl http://localhost:5000/api/health
# Expected: {"status":"ok","db":"connected","geminiPool":{"totalKeys":1},"uptime":12,...}
```

Open `http://localhost:5173` — the PeerCode landing page should load.

### Docker Alternative

```bash
cd peercode-backend

# Build and start backend + MongoDB 7 together
docker compose up --build -d

# Tail logs
docker compose logs -f backend
```

> 🎉 **You're up.** Register two accounts in separate browser windows, click **Find Partner** from both, and start a live mock interview session.

---

## 🔧 Environment Setup

<details>
<summary><b>📄 Complete .env Reference</b> (click to expand)</summary>

```bash
# ════════ SERVER ═══════════════════════════════════════════════════════
NODE_ENV=development        # 'production' disables morgan request logging and stack traces in errors
PORT=5000                   # HTTP server port; Socket.IO server shares this same port

# ════════ DATABASE ═════════════════════════════════════════════════════
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/?appName=Cluster0
# Local: mongodb://localhost:27017/peercode
# REQUIRED — server retries 5 times with exponential backoff then exits

# ════════ JWT ══════════════════════════════════════════════════════════
JWT_SECRET=<64-char hex>           # REQUIRED — signs 15-minute access tokens
JWT_REFRESH_SECRET=<64-char hex>   # REQUIRED — signs 7-day refresh tokens stored in httpOnly cookies
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ════════ CORS ═════════════════════════════════════════════════════════
FRONTEND_URL=http://localhost:5173  # REQUIRED — only this origin passes CORS and Socket.IO auth

# ════════ SMTP (optional — email jobs degrade gracefully if absent) ════
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=<gmail-app-password>      # Use a Gmail App Password, not your account password

# ════════ GEMINI AI ════════════════════════════════════════════════════
GEMINI_KEY_1=AIza...    # REQUIRED for AI features — get free keys from aistudio.google.com
GEMINI_KEY_2=AIza...    # Optional — adds to round-robin pool; each free key = 1,500 req/day
GEMINI_KEY_3=AIza...    # Keys returning 429 are skipped automatically
GEMINI_KEY_4=AIza...
GEMINI_KEY_5=AIza...
GEMINI_KEY_6=AIza...
GEMINI_KEY_7=AIza...    # Up to 7 keys; pool size shown in /api/health response

# ════════ CODE EXECUTION ═══════════════════════════════════════════════
JUDGE0_BASE_URL=https://ce.judge0.com   # Public CE; self-host on own infra for production SLAs

# ════════ PAYMENTS ═════════════════════════════════════════════════════
RAZORPAY_KEY_ID=rzp_test_xxx       # Test-mode key — subscriptions auto-mock if both keys are absent
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx        # HMAC-SHA256 verification; optional in dev (skip signature check)

# ════════ FRONTEND (peercode-frontend/.env) ════════════════════════════
VITE_API_URL=http://localhost:5000/api  # Overrides Axios base URL; set to production API in prod
```

> 💡 **Dev mode tip:** If `RAZORPAY_KEY_ID` is absent, `POST /api/subscription/create` returns a mock redirect URL (`?payment=success&mock=true&plan=<planId>`) that instantly activates the selected plan — no real payment required for local development.

</details>

---

## 📡 API Reference

Health endpoint — always public, no authentication:

```http
GET http://localhost:5000/api/health
→ 200 {"status":"ok","db":"connected","uptime":342,"memoryMB":87,"nodeVersion":"v20.11.0","geminiPool":{"totalKeys":3,"currentIndex":1}}
```

**Auth legend used in all tables:**
`❌` = Public (no auth) &nbsp;&nbsp; `✅` = Requires login &nbsp;&nbsp; `🛡️` = Admin role required

<details>
<summary><b>🔐 Auth — /api/auth</b></summary>

| Method | Endpoint | Auth | Body | Response | Description |
|---|---|:---:|---|---|---|
| `POST` | `/register` | ❌ | `{username, email, password}` | 201 `{accessToken, user}` + refresh cookie | Create account + auto-login; bcrypt 12 rounds |
| `POST` | `/login` | ❌ | `{email, password}` | 200 `{accessToken, user}` + refresh cookie | Validate credentials and issue tokens |
| `POST` | `/refresh` | ❌ | Cookie: `refreshToken` | 200 `{accessToken, user}` | Silent refresh called by Axios on 401 |
| `POST` | `/logout` | ❌ | Cookie: `refreshToken` | 200 | Clear httpOnly refresh cookie |

> Username: 3–20 characters. Password validation is server-side only. Both `username` and `email` have unique indexes — duplicate registration returns `409 DUPLICATE_FIELD`.

</details>

<details>
<summary><b>🚪 Rooms — /api/rooms</b> (auth + 300 req/min)</summary>

| Method | Endpoint | Auth | Body / Params | Response | Description |
|---|---|:---:|---|---|---|
| `POST` | `/` | ✅ | `{problemSlug?}` | 201 `{room}` | Create room; generates UUID v4 as `roomId` |
| `POST` | `/create` | ✅ | `{problemSlug?}` | 201 `{room}` | Alias for `POST /` |
| `GET` | `/:id` | ✅ | `_id` or `roomId` | 200 `{room}` | Room with populated participants and problem |
| `POST` | `/:id/join` | ✅ | `{role?}` | 200 `{room}` | Add self to participants; fails with `ROOM_FULL` at capacity |
| `DELETE` | `/:id` | ✅ | — | 200 | Delete room; returns `NOT_HOST (403)` for non-hosts |

</details>

<details>
<summary><b>🧩 Problems — /api/problems</b> (300 req/min; admin writes)</summary>

| Method | Endpoint | Auth | Body / Params | Response | Description |
|---|---|:---:|---|---|---|
| `GET` | `/stats` | ❌ | — | `{total, easy, medium, hard}` | Problem counts by difficulty |
| `GET` | `/` | ❌ | `?difficulty&companies&tags&search&page&limit` | `{problems[], total, page, pages}` | Filtered paginated problem list |
| `GET` | `/:slug` | ❌ | `slug` | `{problem}` | Single problem — `hiddenTests` excluded (`select:false`) |
| `POST` | `/` | 🛡️ | Full problem object | 201 `{problem}` | Create with stubs, starter code, test cases |
| `PUT` | `/:id` | 🛡️ | Partial problem | 200 `{problem}` | Update any problem field |
| `POST` | `/:id/report` | ✅ | `{type, description}` | 201 `{report}` | Report: `wrong-answer` / `broken-testcase` / `unclear-description` / `other` |
| `POST` | `/:slug/solve` | ✅ | — | 200 | Append to `user.solvedProblems`; auto-called when all tests pass |

</details>

<details>
<summary><b>📼 Sessions — /api/sessions</b> (auth + 200 req/5min)</summary>

| Method | Endpoint | Auth | Params | Response | Description |
|---|---|:---:|---|---|---|
| `GET` | `/` | ✅ | — | `{sessions[]}` | Full session history populated with problem |
| `GET` | `/:roomId` | ✅ | `roomId` | `{session}` | Single session document |
| `GET` | `/:roomId/playback` | ✅ | `roomId` | `{snapshots[], diffs[]}` | All snapshots with line-level diffs from `diffEngine.js` |
| `POST` | `/:roomId/end` | ✅ | `roomId` | `{sessionId, duration}` | Queue `session-complete` Agenda job |
| `GET` | `/:roomId/debrief` | ✅ | `roomId` | `{debrief, problem, session}` | AI debrief; generates on-demand if not yet created |
| `GET` | `/:roomId/analytics` | ✅ | `roomId` | `{totalSnapshots, approachCount, pauseSegments, codeGrowthCurve, linesWritten, linesDeleted, languagesUsed}` | Computed session metrics |

</details>

<details>
<summary><b>🤖 Gemini AI — /api/gemini</b> (auth + 30 req/min)</summary>

| Method | Endpoint | Auth | Body | Response | Description |
|---|---|:---:|---|---|---|
| `POST` | `/hint` | ✅ | `{code, problem, language}` | `{hint}` | Contextual nudge — never reveals the full solution |
| `POST` | `/analyze` | ✅ | `{code, problem, language}` | `{analysis}` | Structured review with time + space complexity |
| `POST` | `/generate-question` | ✅ | `{topic, difficulty}` | `{question}` | DSA question generation for interviewers |
| `GET` | `/usage` | ✅ | — | `{plan, hints, analyzes}` | Current period usage counts vs plan limits |

> Requests with `x-gemini-key` header skip `canUseFeature()`, skip `incrementUsage()`, and call Gemini directly with the personal key. No plan tier applies.

</details>

<details>
<summary><b>⚡ Execute — /api/execute</b> (auth + 30 req/min)</summary>

| Method | Endpoint | Auth | Body | Response | Description |
|---|---|:---:|---|---|---|
| `POST` | `/` | ✅ | `{code, language, testCases[], problemSlug?}` | `{results[], allPassed, passedCount, totalCount}` | Full test suite via Judge0 with per-test detail |
| `POST` | `/run` | ✅ | `{code, language, stdin?}` | `{stdout, stderr, exitCode, time, memory}` | Single stdin/stdout run without test harness |
| `GET` | `/testcases/:problemId` | ✅ | `problemId` | `{testCases[]}` | Visible test cases for a problem |
| `POST` | `/testcases/:problemId` | 🛡️ | `{input, expectedOutput}` | 201 | Add test case to problem |
| `DELETE` | `/testcases/:problemId/:tcId` | 🛡️ | — | 200 | Delete specific test case |

</details>

<details>
<summary><b>💎 Subscription — /api/subscription</b></summary>

| Method | Endpoint | Auth | Body | Response | Description |
|---|---|:---:|---|---|---|
| `GET` | `/plans` | ❌ | — | `{plans[]}` | All plan definitions with feature limits and pricing |
| `GET` | `/status` | ✅ | — | `{plan, status, currentPeriodEnd, cancelAtPeriodEnd, usage}` | Current subscription state |
| `POST` | `/create` | ✅ | `{planId}` | `{shortUrl, mock?}` | Razorpay payment link (or mock URL in dev) |
| `POST` | `/cancel` | ✅ | `{immediately?}` | 200 | Revert to free plan |
| `POST` | `/webhook` | ❌ | Razorpay raw body | 200 | HMAC-SHA256 verified payment capture handler |

</details>

<details>
<summary><b>🛡️ Admin — /api/admin</b> (admin role required)</summary>

| Method | Endpoint | Params / Body | Response | Description |
|---|---|---|---|---|
| `GET` | `/stats` | — | `{totalUsers, totalSessions, topProblems[], subscriptionStats, geminiPool}` | Full platform metrics + revenue |
| `GET` | `/users` | `?page&limit&search` | `{users[], total, page, pages}` | Paginated user list |
| `PUT` | `/users/:id/toggle-ban` | `id` | 200 | Flip `user.isBanned` flag |
| `GET` | `/problems` | — | `{problems[]}` including `isActive: false` | All problems including soft-deleted |
| `PUT` | `/problems/:id` | Partial problem | 200 | Update any field including `isActive` |
| `DELETE` | `/problems/:id` | `id` | 200 | Soft-delete: sets `isActive: false` |
| `GET` | `/reports` | — | `{reports[]}` | All unresolved problem reports |
| `PUT` | `/reports/:id/resolve` | `id` | 200 | Mark resolved; sets `resolvedBy = req.user._id` |

</details>

<details>
<summary><b>🛤️ Tracks — /api/tracks</b></summary>

| Method | Endpoint | Auth | Body / Params | Response | Description |
|---|---|:---:|---|---|---|
| `GET` | `/` | ❌ | — | `{tracks[]}` | All active learning tracks |
| `GET` | `/progress` | ✅ | — | `{progress[]}` | All of the current user's track progress records |
| `GET` | `/:slug` | ❌ | `slug` | `{track}` | Single track with ordered and populated problems |
| `GET` | `/:slug/progress` | ✅ | `slug` | `{progress}` | Per-user progress for a single track |
| `POST` | `/:slug/complete-problem` | ✅ | `{problemId, sessionId?}` | 200 | Append to `completedProblems`; sets `completedAt` when all done |

</details>

---

## 🔌 Socket Events

<details>
<summary><b>🚪 Room Handler — roomHandler.js</b></summary>

```js
// ── Client → Server ────────────────────────────────────────────────────
socket.emit('join_room',      { roomId, role? })              // join socket room, track participants in memory
socket.emit('leave_room',     { roomId })                     // explicit leave; triggers participant_left broadcast
socket.emit('send_message',   { roomId, text })               // chat message; max 100 chars; stored in memory (cap 100)
socket.emit('start_timer',    { roomId, durationSeconds })    // interviewer starts multi-phase countdown
socket.emit('pause_timer',    { roomId })                     // pause countdown; broadcasts to all peers
socket.emit('resume_timer',   { roomId })                     // resume from paused state
socket.emit('timer_advanced', { roomId, phaseIndex, timeLeft, bonusUsed }) // advance to next phase
socket.emit('end_session',    { roomId, testResults, finalCode, finalLanguage, duration? })

// ── Server → Client ────────────────────────────────────────────────────
socket.on('room_state',        { roomId, participants, currentProblem, currentCode, language, messages[] })
socket.on('participant_joined',{ participant, participants[] })
socket.on('participant_left',  { userId, username, participants[] })
socket.on('timer_started',     { durationSeconds, startedAt, startedBy })
socket.on('timer_paused',      { pausedBy })
socket.on('timer_resumed',     { resumedBy })
socket.on('timer_advanced',    { phaseIndex, timeLeft, bonusUsed })
socket.on('timer_ended',       {})
socket.on('new_message',       { userId, username, text, timestamp, _id })
socket.on('session_ended',     { sessionId, duration })       // triggers client redirect to /debrief/:roomId
```

**Session end idempotency:** On `end_session`, the server checks for an existing `Session` with `status: 'completed'` for the `roomId`. If it exists, the event is silently ignored. On a new session: creates the document, computes ELO delta per participant (difficulty + duration modifiers with K=32), updates all `User.elo` fields, emits `session_ended` to the room, then queues one `ai-debrief` Agenda job per participant.

</details>

<details>
<summary><b>✏️ Code Sync — codeSync.js</b></summary>

```js
// ── Client → Server ────────────────────────────────────────────────────
socket.emit('yjs-update',         (roomId, update))           // binary Yjs CRDT diff (~bytes per keystroke)
socket.emit('yjs-request-state',  (roomId))                   // new joiner requests full document state
socket.emit('yjs-state-response', (to, state))                // existing peer sends full Y.Doc to new joiner's socketId
socket.emit('cursor-update',      (roomId, cursor))           // {line, column, userId} for CursorLabel rendering
socket.emit('code-snapshot',      (roomId, code, language))   // debounced 5s; server $push to Session.snapshots
socket.emit('run-code',           { roomId, code, language, testCases[], problemSlug? })

// ── Server → Client ────────────────────────────────────────────────────
socket.on('yjs-update',           (update))                   // relay binary diff to all other peers in room
socket.on('yjs-state-request',    { requesterSocketId })      // tell this peer to send its full doc to requester
socket.on('yjs-state-response',   (state))                    // full Y.Doc state delivered to requesting peer
socket.on('cursor-update',        { socketId, ...cursor })    // CursorLabel component repositions on receive
socket.on('run-code-result',      { results[], allPassed, passedCount, totalCount, language, runBy, timestamp })
```

**Yjs sync protocol:** The server holds no Y.Doc — document state lives entirely in connected clients. When a new peer joins, it emits `yjs-request-state`. The server broadcasts `yjs-state-request` to the room; an existing peer serializes its Y.Doc and emits `yjs-state-response` directly to the new peer's socket ID. After initial sync, all edits flow as binary incremental diffs. Stuck detection in `useYjsEditor.js` fires a hint suggestion callback after 3 minutes of zero edits.

</details>

<details>
<summary><b>🎯 Matching Queue — matchingQueue.js</b></summary>

```js
// ── Client → Server ────────────────────────────────────────────────────
socket.emit('queue-join',  { role?, topic? })  // role: 'interviewer' | 'interviewee' | 'either'
socket.emit('queue-leave', {})                  // cancel; server emits 'queue-left' to confirm

// ── Server → Client ────────────────────────────────────────────────────
socket.on('queue-matched', { roomId, partnerUsername, partnerElo, yourRole, partnerId, topic, timestamp })
socket.on('queue-waiting', { position, estimatedWaitSeconds, queueSize })   // broadcast every 5 seconds
socket.on('queue-error',   { message })
socket.on('queue-left',    {})
```

**Matching algorithm:** Candidates must satisfy all three criteria simultaneously: ELO difference ≤ 200; role compatibility (interviewer↔interviewee, or either↔anything); topic match (if both specify a non-"Any" topic it must be identical). The scorer ranks all candidates for a new joiner and picks the highest-scoring match. Both matched users receive `queue-matched` with the same pre-created `roomId`, and the frontend auto-navigates to `/room/:roomId`. The queue is in-memory — state is lost on server restart, which is acceptable for MVP load (see roadmap for Redis migration).

</details>

<details>
<summary><b>📹 WebRTC Signaling — webrtcSignaling.js</b></summary>

```js
// ── Client → Server ────────────────────────────────────────────────────
socket.emit('offer',           { to: socketId, sdp })       // SDP offer forwarded to target peer
socket.emit('answer',          { to: socketId, sdp })       // SDP answer forwarded to target peer
socket.emit('ice-candidate',   { to: socketId, candidate }) // ICE candidate forwarded to target peer
socket.emit('kick-participant',{ participantSocketId, reason? })

// ── Server → Client ────────────────────────────────────────────────────
socket.on('participant-joined',{ socketId, userId, username })
socket.on('participant-left',  { socketId, username })
socket.on('offer',             { from: socketId, sdp })
socket.on('answer',            { from: socketId, sdp })
socket.on('ice-candidate',     { from: socketId, candidate })
socket.on('participant-kicked',{ message, timestamp })
```

**The server never touches media.** It only relays SDP negotiation and ICE candidates. `useWebRTC.js` instantiates a separate `RTCPeerConnection` for each remote participant, configured with 3 Google STUN servers (`stun.l.google.com:19302`, `stun1.l.google.com:19302`, `stun2.l.google.com:19302`). On `participant-joined`, the local peer creates an offer; on `participant-left`, the corresponding `RTCPeerConnection` closes and the remote stream is removed from state.

</details>

---

## 🗄️ Data Models

<details>
<summary><b>👤 User</b></summary>

```js
{
  username:     String,   // required, unique, 3–20 chars, trim
  email:        String,   // required, unique, lowercase, trim
  passwordHash: String,   // ← select: false — never in responses; requires .select('+passwordHash')
  elo:          Number,   // default: 1200, min: 0
  apiKey:       String,   // personal Gemini key; bypasses shared pool + all usage limits
  role:         String,   // 'user' | 'admin'  ← default: 'user'
  isBanned:     Boolean,  // default: false; auth middleware returns USER_NOT_FOUND for banned users

  solvedProblems: [{ problem: ObjectId, solvedAt: Date }],

  streakData: {
    currentStreak:   Number,  // consecutive days with at least one session
    longestStreak:   Number,  // all-time personal best
    lastSessionDate: Date
  },

  subscription: {              // ← sub-schema; post('init') hook auto-initializes for old documents
    plan:                   String,  // 'free' | 'pro' | 'premium' | 'ultra'  ← default: 'free'
    status:                 String,  // 'active' | 'cancelled' | 'past_due' | 'trialing' | 'pending'
    razorpaySubscriptionId: String,
    razorpayPaymentLinkId:  String,
    razorpayPaymentLinkUrl: String,
    currentPeriodStart:     Date,
    currentPeriodEnd:       Date,
    cancelAtPeriodEnd:      Boolean  // default: false
  },

  usage: {
    hintsUsed:    Number,  // reset to 0 when monthDiff >= 1 in incrementUsage()
    analyzesUsed: Number,
    periodStart:  Date     // compared against Date.now() to detect new billing month
  },

  weaknessProfile: Map     // topic (String) → score (Number); drives personalized recommendations
}
// Indexes: { username: 1 } unique,  { email: 1 } unique
```

</details>

<details>
<summary><b>🖥️ Session</b></summary>

```js
{
  roomId:    String,    // UUID v4 — NOT the MongoDB _id; matches socket room name
  problem:   ObjectId,  // ref 'Problem'

  problemSnapshot: {    // ← cached at session creation; survives problem edits
    title: String, difficulty: String, slug: String, tags: [String]
  },

  participants: [ObjectId],  // ref 'User'

  snapshots: [{              // ← pushed every 5s via 'code-snapshot' socket event; enables replay
    timestamp: Date, code: String, language: String, userId: ObjectId
  }],

  startTime:     Date,
  endTime:       Date,
  duration:      Number,  // minutes
  status:        String,  // 'in-progress' | 'completed' | 'abandoned'
  finalCode:     String,
  finalLanguage: String,

  testResults: { passed: Number, total: Number, allPassed: Boolean },

  eloAtStart: Number,   // snapshot of user ELO before the session
  eloAtEnd:   Number,
  eloDelta:   Number,
  eloData:    [{ userId: ObjectId, eloAtEnd: Number, delta: Number }],

  debrief:    ObjectId  // ref 'AiDebrief' — populated after Agenda job completes
}
// Indexes: { roomId, startTime: -1 },  { participants },  { problem }
```

</details>

<details>
<summary><b>🧩 Problem</b></summary>

```js
{
  title:          String,  // required
  slug:           String,  // required, unique, lowercase — used as route param /problems/:slug
  description:    String,
  difficulty:     String,  // 'easy' | 'medium' | 'hard'  — required
  companies:      [String],
  tags:           [String],
  constraints:    String,
  timeLimit:      Number,  // default: 2000 ms
  memoryLimit:    Number,  // default: 256 MB
  isActive:       Boolean, // default: true — soft-delete; false hides from public, shown to admin
  acceptanceRate: Number,

  examples:    [{ input: String, output: String, explanation: String }],
  testCases:   [{ input: String, expectedOutput: String }],              // visible to users
  hiddenTests: [{ input: String, expectedOutput: String }],              // ← select: false

  stubs: {               // function signatures; used by extractFunctionName() for test wrapping
    javascript: String, typescript: String, python: String,
    java: String, cpp: String, go: String
  },
  starterCode: {         // full starter code templates shown in editor on problem load
    javascript: String, typescript: String, python: String,
    java: String, cpp: String, go: String
  }
}
// Indexes: { difficulty },  { tags },  { companies }
```

</details>

<details>
<summary><b>🗂️ Room, Rating, Track, AiDebrief, UserTrackProgress</b></summary>

```js
// ── Room ─────────────────────────────────────────────────────────────
{
  roomId:   String,    // required, unique — UUID v4; not MongoDB _id
  host:     ObjectId,  // ref 'User'
  participants: [{
    user:     ObjectId, // ref 'User'
    role:     String,   // 'interviewer' | 'interviewee' | 'observer'
    joinedAt: Date
  }],
  status:          String,    // 'waiting' | 'active' | 'completed'
  problemId:       ObjectId,  // ref 'Problem'
  maxParticipants: Number     // default: 3, max: 10
}
// Index: { roomId: 1 } unique

// ── Rating ───────────────────────────────────────────────────────────
{
  fromUser: ObjectId, toUser: ObjectId, roomId: String,
  score:    Number,   // 1–5 required
  feedback: String    // max 500 chars, optional
}
// Index: { toUser, createdAt: -1 }

// ── Track ────────────────────────────────────────────────────────────
{
  name: String, slug: String,  // slug unique, lowercase
  company: String,             // 'Amazon' | 'Google' | 'Meta' | etc.
  problems: [{
    problem:       ObjectId,   // ref 'Problem'
    order:         Number,
    frequencyNote: String      // e.g., 'Asked in ~60% of Amazon SDE-1 loops'
  }],
  estimatedHours: Number, isActive: Boolean
}
// Index: { slug: 1 } unique

// ── UserTrackProgress ────────────────────────────────────────────────
{
  user:  ObjectId,  // ref 'User'
  track: ObjectId,  // ref 'Track'
  completedProblems: [{ problem: ObjectId, completedAt: Date, sessionId: String }],
  startedAt:   Date,   // Date.now on first problem completion
  completedAt: Date    // set when all track problems are completed
}
// Index: { user, track } unique compound

// ── AiDebrief ────────────────────────────────────────────────────────
{
  sessionId: ObjectId, generatedFor: ObjectId, roomId: String,
  scores: {
    communication: Number,  // 1–5
    decomposition: Number,  // 1–5 — problem-solving approach quality
    codeQuality:   Number,  // 1–5
    complexity:    Number   // 1–5 — awareness of time/space tradeoffs
  },
  overallReadiness: Number, // 1–10
  whatWentWell:     [String],
  areasToImprove:   [String],
  studyNext:        [String],
  weakTopics:       [String],
  summary:          String
}
// Index: { roomId, generatedFor }
```

</details>

---

## 💎 Subscription & Pricing

<div align="center">

| | 🆓 Free | ⚡ Pro | 💎 Premium | 🚀 Ultra |
|---|:---:|:---:|:---:|:---:|
| **Price** | ₹0 / mo | ₹99 / mo | ₹299 / mo | ₹999 / mo |
| **AI Hints** | 30 / mo | 70 / mo | 180 / mo | ∞ |
| **Code Analysis** | 30 / mo | 70 / mo | 180 / mo | ∞ |
| **Personal API Key Bypass** | ✅ | ✅ | ✅ | ✅ Native |
| **Session Replay** | ✅ | ✅ | ✅ | ✅ |
| **AI Debrief** | ✅ | ✅ | ✅ | ✅ |
| **ELO Matching** | ✅ | ✅ | ✅ | ✅ |
| **Effective limit with own key** | ∞ | ∞ | ∞ | ∞ |

</div>

**Monthly reset logic:** Usage counters (`hintsUsed`, `analyzesUsed`) live directly on the `User` document inside the `usage` sub-object. Every time `incrementUsage()` is called, it computes `monthDiff` between `usage.periodStart` and the current date. If `monthDiff >= 1`, both counters reset to `0` and `periodStart` updates to the current timestamp before the new usage is incremented and saved.

**Personal API key bypass:** If `req.headers['x-gemini-key']` or `user.apiKey` is truthy, `geminiController` skips `canUseFeature()` entirely and passes the personal key directly to `callGemini()`. No usage counter is touched. This means any user on the Free plan has effectively unlimited AI access using their own Gemini key — the plan tiers only govern access to the shared key pool.

**Razorpay payment flow:** `POST /api/subscription/create {planId}` calls `razorpay.paymentLink.create()` with the plan's INR amount (₹ × 100 in paise). The returned `short_url` redirects the user to Razorpay checkout. After payment, Razorpay calls `POST /api/subscription/webhook`. The handler validates the `razorpay-signature` header using `HMAC-SHA256(webhookBody, RAZORPAY_WEBHOOK_SECRET)`. On `payment.captured`: sets `plan`, `status: 'active'`, `currentPeriodStart: now`, `currentPeriodEnd: now + 30 days`. On `payment.failed`: sets `status: 'past_due'`.

---

## 🤖 AI Integration

### Gemini Key Pool Architecture

```
callGemini(prompt, userApiKey?)
    │
    ├── userApiKey present? ──YES──► call Gemini with personal key
    │                                 skip all pool logic
    │                                 skip incrementUsage()
    │
    └── NO ──► pool = [GEMINI_KEY_1..7].filter(Boolean)
                   │
                   ├── pool empty? ──► throw "No Gemini API keys configured"
                   │
                   └── Start at round-robin idx (persistent across calls)
                           │
                           ├── POST to Gemini API with pool[idx]
                           │
                           ├── HTTP 429? ──YES──► idx++; try next key
                           │                        all tried? ──► throw "All keys quota exceeded"
                           │
                           └── Success? ──► update idx = this position; return response text
```

### AI Feature Specifications

| Feature | Endpoint | Prompt Strategy | Output Shape |
|---|---|---|---|
| **Hint** | `POST /api/gemini/hint` | Problem + current code + language; instructed to nudge without revealing solution | Free text hint |
| **Code Analysis** | `POST /api/gemini/analyze` | Code + problem + language; structured review request | Time complexity, space complexity, feedback, suggestions |
| **Question Generation** | `POST /api/gemini/generate-question` | Topic + difficulty; DSA problem format instruction | `{title, description, examples[], constraints}` |
| **AI Debrief** | Agenda `ai-debrief` job | Full session context: problem title, all code snapshots, duration, test results | `{scores{}, overallReadiness, whatWentWell[], areasToImprove[], studyNext[], summary}` |

**Model endpoint:**
```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=<KEY>
Body: { "contents": [{ "parts": [{ "text": "<prompt>" }] }] }
Parse: data.candidates[0].content.parts[0].text
```

**Key validation** (`POST /api/gemini-key/validate`): Sends a live `GET https://generativelanguage.googleapis.com/v1beta/models?key=<KEY>`. HTTP 200 → `{valid: true}`. HTTP 400/403 → `{valid: false, message: 'Key rejected by Google'}`. Network failure → `{valid: false, message: 'Network error'}`. The key is never logged anywhere in the codebase.

---

## ⚙️ Code Execution Engine

### Judge0 Integration Architecture

```
POST /api/execute { code, language, testCases[], problemSlug? }
    │
    ├─ 1. Fetch Problem by slug → get starterCode[language]
    ├─ 2. extractFunctionName(starterCode, language)
    │      JS/TS:  regex → function name or arrow function identifier
    │      Python: regex → def functionName
    │      Java:   regex → method name; check for 'class Solution'
    │      C/C++:  regex → return_type functionName(
    │      Go:     regex → func functionName(
    │
    ├─ 3. wrapCodeForTest(code, language, functionName, hasSolutionClass)
    │      Produces a self-contained stdin-reading executable source
    │
    └─ For each testCase in testCases[]:
           POST https://ce.judge0.com/submissions?base64_encoded=false&wait=true
           {
             source_code:      <wrapped code>,
             language_id:      <Judge0 language ID>,
             stdin:            testCase.input,
             expected_output:  testCase.expectedOutput
           }
           Parse response → { stdout, stderr, exitCode, time_ms, memory_kb, status }

    → Aggregate: { results[], allPassed, passedCount, totalCount }
    → If allPassed: auto-call POST /problems/:slug/solve
```

### Supported Languages

| Language | Judge0 ID | stdin Method | Notes |
|---|:---:|---|---|
| JavaScript | 93 | `readline()` + JSON.parse/stringify | Arrow function or `function` keyword detection |
| Python | 71 | `input()` + `print(output)` | `def functionName` regex |
| Java | 62 | `Scanner` stdin | Wraps in `class Solution` if not already present |
| C++ | 54 | `cin` + `cout` | Return type + function name regex |
| TypeScript | 74 | Same as JavaScript | TypeScript-aware type stripping |
| C | 50 | `scanf` / `printf` | Same pattern as C++ |
| Go | 60 | `fmt.Scan` + `fmt.Println` | `func functionName` regex |

**Alternative executor:** `pistonExecutor.js` wraps the [Piston API](https://github.com/engineer-man/piston) as a drop-in fallback when Judge0 CE is unreachable.

---

## 🚀 Deployment

### Option 1 — Railway or Render (Cloud PaaS)

```bash
# Set all these environment variables in your Railway/Render service dashboard:
NODE_ENV=
PORT=5000
MONGO_URI=
JWT_SECRET=
JWT_REFRESH_SECRET=
FRONTEND_URL=
GEMINI_KEY_1=
JUDGE0_BASE_URL=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Start command
node server.js

# Health check path (set in Railway/Render dashboard)
/api/health
```

### Option 2 — Vercel (Frontend) + Railway (Backend)

```bash
# Build frontend
cd peercode-frontend
npm run build
# Output in dist/ — deploy this folder to Vercel

# Vercel project settings:
#   Framework preset: Vite
#   Build command:    npm run build
#   Output directory: dist
#   Environment var:  VITE_API_URL=https://your-backend.railway.app/api
```

### Option 3 — Self-Hosted Docker

```bash
cd peercode-backend

# Start backend + MongoDB 7 in Docker
docker compose up --build -d

# Health check
curl http://localhost:5000/api/health

# View real-time logs
docker compose logs -f backend

# Stop
docker compose down
```

Place Nginx in front with WebSocket upgrade support:

```nginx
server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    location / {
        proxy_pass         http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade    $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host       $host;
        proxy_set_header   X-Real-IP  $remote_addr;
    }
}
```

**Verify any deployment:**

```bash
curl https://api.yourdomain.com/api/health
# → {"status":"ok","db":"connected","env":"production","geminiPool":{"totalKeys":7,"currentIndex":0}}
```

---

## 🤝 Contributing

```bash
# Fork, then clone your fork
git clone https://github.com/GJBarhate/peercode.git
cd peercode

# Create a branch — prefix matters
git checkout -b feat/redis-matching-queue
#              fix/elo-negative-guard
#              docs/socket-events-detail
#              refactor/gemini-controller-split

# Make changes; commit with conventional format
git add .
git commit -m "feat(socket): add Redis adapter for matchingQueue horizontal scaling"
#              type(scope): what changed and why
# Types: feat | fix | docs | refactor | test | chore | perf

git push origin feat/redis-matching-queue
# Open a Pull Request on GitHub
```

**Dev gotchas worth knowing:**
- The matching queue is in-memory — restarting the backend with `nodemon` clears all queued users. Expect queue-related tests to need manual re-queuing.
- Run `npm run seed:problems` before testing `/api/execute` — test cases live in MongoDB, not in code. Without seeded problems, execute calls fail on `extractFunctionName`.
- `send_message` (roomHandler) and `chat-message` (codeSync) both handle chat. `roomHandler` is canonical for storage and history. `codeSync` only broadcasts. Don't add storage logic to `codeSync`.
- `passwordHash` uses `select: false` — any code comparing passwords must explicitly chain `.select('+passwordHash')` on the query.
- The Axios `401` interceptor locks the refresh process (one concurrent refresh maximum). Don't call `/auth/refresh` directly in components — it breaks the lock.

---


<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0ea5e9,50:4f46e5,100:6d28d9&height=120&section=footer" width="100%"/>

<br/>

Built with ☕ and too many late nights by **[Gaurav Barhate](https://github.com/GJBarhate)**

<br/>

[![GitHub Profile](https://img.shields.io/badge/GitHub-gauravbarhate-6d28d9?style=for-the-badge&logo=github&logoColor=white)](https://github.com/GJBarhate)

<br/>

*If this helped you land an interview, a ⭐ on the repo means more than you'd think.*

<br/>

`Node.js` · `React` · `MongoDB` · `Express` · `Socket.IO` · `WebRTC` · `Yjs` · `Monaco` · `Gemini AI` · `Judge0` · `Razorpay` · `Agenda` · `Docker`

</div>