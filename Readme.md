<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0ea5e9,50:4f46e5,100:6d28d9&height=160&section=header&text=PeerCode&fontSize=60&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Real-Time%20Collaborative%20Coding%20%26%20Interview%20Practice&descAlignY=58&descSize=18" width="100%"/>

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

<br/>

> Pair with a stranger, pick a problem, and code together live — with WebRTC video, AI-powered debriefs, ELO rankings, and real-time code sync powered by Yjs CRDT.

<br/>

[✨ Features](#-features) · [🏗️ Architecture](#️-architecture) · [⚡ Quick Start](#-quick-start) · [🔧 Environment](#-environment-setup) · [📡 API Reference](#-api-reference) · [🚀 Deployment](#-deployment)

</div>

---

## 🖥️ Platform Preview

<div align="center">

| Collaborative Editor | Interview Room | AI-Powered Debrief |
|:---:|:---:|:---:|
| *Monaco + Yjs CRDT sync, remote cursor overlays, 7-language selector* | *Three-panel layout: problem · editor · WebRTC video tiles* | *Post-session scores: communication, code quality, complexity, readiness* |

| ELO Dashboard | Matching Queue | Session Replay |
|:---:|:---:|:---:|
| *GitHub-style heatmap, ELO trend chart, streak counter* | *Role + topic selector, live position, partner ELO* | *Timeline scrubber with line-level diff replay* |

> 🎬 **Live demo coming soon** — clone and run locally in under 5 minutes with the [Quick Start](#-quick-start) below.

</div>

---

## ✨ Features

<table>
<tr>
<td width="33%" valign="top">

**🖊️ Collaborative Code Editor**

Monaco editor (VS Code's engine) with Yjs CRDT sync over Socket.IO binary frames. Two users edit conflict-free — remote cursors render as absolute-positioned overlays via `y-monaco`. Debounced snapshots push to MongoDB every 5 seconds, enabling full session replay.

</td>
<td width="33%" valign="top">

**📹 Peer-to-Peer Video Chat**

Native WebRTC `RTCPeerConnection` with 3 Google STUN servers. Socket.IO is signaling only — media travels browser-to-browser. Supports mute, camera off, and screen sharing without interrupting the shared editor.

</td>
<td width="33%" valign="top">

**🤖 Gemini AI Assistant**

Gemini 3.1 Flash Lite with a 7-key round-robin pool that auto-skips any key returning HTTP 429 or 400 (invalid key). Three modes: contextual hints (never reveals full solutions), structured code analysis with complexity breakdown, and DSA question generation for interviewers. Users can bring their own API key via Settings to bypass pool limits.

</td>
</tr>
<tr>
<td width="33%" valign="top">

**⚡ Automated Code Execution**

Judge0 CE runs code against visible and hidden test cases. A custom `wrapCodeForTest` harness builds stdin/stdout-aware executables for 7 languages. Results include per-test pass/fail, execution time, memory usage, and stderr.

</td>
<td width="33%" valign="top">

**🎯 ELO-Based Peer Matching**

In-memory queue matches users within ±200 ELO, filtered by role (interviewer / interviewee / either) and topic. 60-second server-side timeout. Partner socket existence verified before match — disconnected partners re-queue the candidate cleanly.

</td>
<td width="33%" valign="top">

**📊 AI Post-Session Debrief**

An Agenda background job triggers Gemini after every session: communication (1–5), problem decomposition (1–5), code quality (1–5), complexity analysis (1–5), and overall readiness (1–10) — plus study topic recommendations.

</td>
</tr>
</table>

<table>
<tr>
<td width="50%" valign="top">

🏆 **ELO Rating System** — Starts at 1200, K=32 with difficulty and duration modifiers; displayed as a Recharts trend chart with per-session ELO deltas

⏱️ **Multi-Phase Interview Timer** — Setup (5 min) → Coding (35 min) → Q&A (5 min) → Ended; all phases socket-synced with an SVG ring visualization

📼 **Session Replay** — Scrubable playback through all code snapshots with `diffEngine.js` computing line-level diffs, approach-restart detection (< 20% line retention), and pause segment identification

🔥 **Streaks & Gamification** — Daily session streak on dashboard as a GitHub-style 52-week contribution heatmap built with Recharts

💡 **Community Solutions** — Submit code + explanation, browse community solutions sorted by upvotes, directly from the problem panel

</td>
<td width="50%" valign="top">

📚 **Learning Tracks** — Company-specific curated problem playlists (Amazon, Google, etc.) with per-user progress tracked via a compound-indexed `UserTrackProgress` collection

💳 **Subscription Tiers** — Free / Pro / Premium / Ultra via Razorpay payment links; webhook payloads verified with HMAC-SHA256; monthly usage counters auto-reset

🛡️ **Admin Panel** — Subscription revenue analytics (MRR, ARR, conversion rate), user ban toggle, full problem CRUD with Add/Edit/Archive/Restore, and report resolution

🚩 **Problem Reporting** — Users flag wrong answers, broken test cases, or unclear descriptions directly from any problem page; admins resolve via the admin panel

🔑 **Personal API Key Bypass** — Users supply their own Gemini key; bypasses all usage checks on any plan

🎨 **Premium UI** — Glass-morphism navbar, spring-animated theme toggle, staggered card entrance animations, skeleton loaders with shimmer, custom scrollbar styling

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
 │ Flash      │  │  Docker     │  │Payment   │  │ Gmail SMTP      │
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
        │                               │    Yjs.applyUpdate()    │
        │                               │    y-monaco re-renders  │
        │   [5 second debounce]         │                        │
        ├──── emit('code-snapshot') ───►│                        │
        │     {code, language}          ├─── Session.$push() ───► MongoDB
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

    Note over C,DB: Registration with OTP
    C->>API: POST /api/auth/register {username, email, password}
    API->>API: bcrypt.hash(password, 12 rounds)
    API->>DB: User.create({username, email, passwordHash, verified: false})
    API->>DB: Store 6-digit OTP with 3-minute expiry
    API-->>C: 201 {message, requiresVerification: true}
    C->>API: POST /api/auth/verify-otp {email, otp}
    API->>DB: Verify OTP + mark verified: true
    API-->>C: 200 {accessToken, user} + httpOnly refreshToken cookie

    Note over C,DB: Google OAuth
    C->>C: Redirect to Google consent screen
    C->>API: POST /api/auth/google {code}
    API->>Google: Exchange code for id_token
    Google-->>API: {sub, email, name, picture}
    API->>DB: Find or create user by googleId/email
    API-->>C: 200 {accessToken, user} + httpOnly refreshToken cookie

    Note over C,DB: Silent Token Refresh on 401 (global dedup)
    C->>A: Request to protected route
    A->>A: Attach Bearer accessToken
    A->>API: GET /api/dashboard
    API-->>A: 401 TOKEN_EXPIRED
    A->>A: sharedRefreshPromise — only one refresh at a time
    A->>API: POST /api/auth/refresh (httpOnly cookie sent automatically)
    API->>API: jwt.verify(refreshToken, JWT_REFRESH_SECRET) + tokenVersion check
    API->>DB: findOneAndUpdate tokenVersion (atomic $inc)
    API-->>A: 200 {accessToken, user} + new refresh cookie
    A->>A: Update stored accessToken, replay queued requests
    A->>API: Retry original request with new token
    API-->>C: 200 dashboard data

    Note over C,DB: Logout
    C->>API: POST /api/auth/logout
    API-->>C: 200 + clears refreshToken cookie with matching options
    C->>C: sessionStorage.clear() + redirect /
```

---

## 🛠️ Tech Stack

### Backend

<div align="center">

| Badge | Technology | Version | Decision Rationale |
|:---:|---|:---:|---|
| <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white"/> | **Node.js** | 20+ | Non-blocking I/O handles hundreds of concurrent socket connections without thread overhead; single language across full stack |
| <img src="https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white"/> | **Express** | 4.18 | Minimal surface area; the 9-step middleware chain maps 1:1 with the request lifecycle: security → parsing → auth → rate-limiting |
| <img src="https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white"/> | **MongoDB** | 7 (Atlas) | Session snapshots are deeply nested arrays; the document model eliminates the 4-table joins a relational schema would require |
| <img src="https://img.shields.io/badge/Socket.IO-010101?style=flat-square&logo=socketdotio&logoColor=white"/> | **Socket.IO** | 4.7 | Binary frame support for Yjs CRDT diffs; automatic polling fallback for corporate firewalls; built-in room abstraction |
| <img src="https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white"/> | **JWT** | — | Stateless auth: 60-minute access tokens + 7-day refresh tokens in httpOnly cookies with tokenVersion rotation — no server-side session store needed |
| <img src="https://img.shields.io/badge/bcryptjs-6d28d9?style=flat-square&logoColor=white"/> | **bcryptjs** | 2.4 | 12 salt rounds (~250 ms per hash); `passwordHash` uses `select: false` — never accidentally exposed in responses |
| <img src="https://img.shields.io/badge/Agenda-4f46e5?style=flat-square&logoColor=white"/> | **Agenda** | 5.0 | MongoDB-backed job queue; no additional Redis infrastructure for debrief generation, email dispatch, and weekly digest jobs |
| <img src="https://img.shields.io/badge/Razorpay-0C2451?style=flat-square&logo=razorpay&logoColor=white"/> | **Razorpay** | 2.9 | Payment link model fits one-time subscription activation without a recurring subscription entity to manage |
| <img src="https://img.shields.io/badge/Helmet-ef4444?style=flat-square&logoColor=white"/> | **Helmet** | 7.1 | Sets 15+ security headers (CSP, HSTS, X-Frame-Options, XSS-Protection) in a single middleware call |
| <img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white"/> | **Docker** | — | `node:20-alpine` under 150 MB; non-root `node` user; health-checked against `/api/health` every 30 seconds |

</div>

### Frontend

<div align="center">

| Badge | Technology | Version | Decision Rationale |
|:---:|---|:---:|---|
| <img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black"/> | **React** | 18.2 | Concurrent rendering; all 14 pages lazy-loaded; three context providers (Auth, Socket, Gemini) with no external state manager |
| <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white"/> | **Vite** | 5.0 | Native ESM dev server — no bundling during development; `/api` and `/socket.io` proxied to `:5000` in `vite.config.js` |
| <img src="https://img.shields.io/badge/Monaco_Editor-007ACC?style=flat-square&logo=visualstudiocode&logoColor=white"/> | **Monaco Editor** | 4.6 | VS Code's engine in the browser; full IntelliSense + syntax highlighting for all 7 languages; custom `peercode-dark` theme |
| <img src="https://img.shields.io/badge/Yjs-6d28d9?style=flat-square&logoColor=white"/> | **Yjs** | 13.6 | Production-proven CRDT; `y-monaco` binding; no central server needed for conflict resolution |
| <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white"/> | **Tailwind CSS** | 3.4 | Custom dark design system: `bg-base: #0a0a14`, `accent: #6d4df2`; JetBrains Mono for code, Inter for UI |
| <img src="https://img.shields.io/badge/React_Router-CA4245?style=flat-square&logo=reactrouter&logoColor=white"/> | **React Router** | 6.21 | SPA routing with lazy-loaded routes; `ProtectedRoute` and `AdminRoute` guard components |
| <img src="https://img.shields.io/badge/Recharts-22c55e?style=flat-square&logoColor=white"/> | **Recharts** | 2.10 | ELO trend AreaChart, session analytics, contribution heatmap — composable and tree-shakeable |
| <img src="https://img.shields.io/badge/Lucide_React-f97316?style=flat-square&logoColor=white"/> | **Lucide React** | 0.294 | Consistent icon set; tree-shakeable per icon |

</div>

---

## 📁 Project Structure

```
peercode/                        ← Git repository root
├── .husky/
│   └── pre-commit               ← Runs lint-staged in frontend + backend on every commit
├── .prettierrc                  ← Shared Prettier config (single quotes, no semis, 100-char width)
├── .gitignore                   ← Root-level ignores (node_modules, .env, .claude/, OS files)
├── Readme.md
│
├── peercode-frontend/           ← React + Vite SPA
│   ├── package.json             ← "prepare": "cd .. && husky"  ← installs hooks at git root on npm install
│   └── src/
│
└── peercode-backend/            ← Node.js + Express + Socket.IO
    ├── package.json             ← lint-staged config for src/**/*.js
    ├── server.js
    ├── Dockerfile
    ├── docker-compose.yml
    └── src/
```

<details>
<summary><b>📦 Backend — peercode-backend/src/</b> (click to expand)</summary>

```
peercode-backend/
├── server.js                    ← Entry: HTTP server, MongoDB connect, Socket.IO init, Agenda start
├── Dockerfile                   ← node:20-alpine, non-root user, /api/health healthcheck every 30s
├── docker-compose.yml           ← backend service + MongoDB 7 with health-checked depends_on
├── nginx.conf                   ← Nginx reverse proxy config with WebSocket upgrade support
│
└── src/
    ├── app.js                   ← Express: 9-step middleware chain + 14 route mounts + error handler
    │
    ├── config/
    │   ├── db.js                ← MongoDB connect with 5-retry exponential backoff (1s → 2s → 4s → 8s → 16s)
    │   ├── gemini.js            ← 7-key round-robin pool; skips 429; personal key bypass; validateKey()
    │   └── agenda.js            ← Agenda instance reuses existing Mongoose connection; collection: agendaJobs
    │
    ├── constants/
    │   └── elo.constants.js     ← DEFAULT_ELO = 1200; shared across matchingQueue + rating system
    │
    ├── models/
    │   ├── User.js              ← ELO, subscription sub-schema, usage counters, solvedProblems array
    │   ├── Session.js           ← Snapshots array, per-participant eloData, test results, problemSnapshot cache
    │   ├── Problem.js           ← hiddenTests (select:false), stubs, starterCode per language
    │   ├── Room.js              ← UUID v4 roomId, participants with roles, problemId FK, maxParticipants
    │   ├── Rating.js            ← Peer rating 1–5 with optional feedback text
    │   ├── Track.js             ← Company problem playlists with order and frequencyNote
    │   ├── UserTrackProgress.js ← Compound index {user, track}; completedProblems sub-array
    │   ├── AiDebrief.js         ← 4 scored categories + overallReadiness + strengths/improvements
    │   ├── ProblemReport.js     ← Issue reports categorized by type; resolved flag + admin resolver
    │   ├── Solution.js          ← User-submitted code with language, explanation, upvotes
    │   ├── MatchingQueue.js     ← Persisted queue snapshot; survives server restarts
    │   ├── Migration.js         ← Migration tracking document
    │   └── Notification.js      ← In-app notification model
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
    │   ├── subscription.js      ← Plans, status, create, cancel, Razorpay webhook
    │   ├── solutions.js         ← List, create, upvote user-submitted solutions
    │   ├── interview.js         ← Interview session routes
    │   ├── leaderboard.js       ← ELO leaderboard routes
    │   ├── notifications.js     ← In-app notification routes
    │   ├── ratings.js           ← Peer rating submission routes
    │   └── stats.js             ← Platform statistics routes
    │
    ├── controllers/
    │   ├── adminController.js
    │   ├── authController.js
    │   ├── dashboardController.js
    │   ├── debriefController.js
    │   ├── executeController.js
    │   ├── geminiController.js
    │   ├── interviewController.js
    │   ├── problemController.js
    │   ├── ratingController.js
    │   ├── roomController.js
    │   ├── sessionController.js
    │   ├── statsController.js
    │   ├── subscriptionController.js
    │   ├── trackController.js
    │   └── userController.js
    │
    ├── middleware/
    │   ├── auth.js              ← JWT Bearer → full Mongoose User document on req.user
    │   ├── adminAuth.js         ← Synchronous: req.user.role !== 'admin' → 403 FORBIDDEN
    │   ├── optionalAuth.js      ← Attaches user if token present; doesn't fail on missing token
    │   ├── rateLimiter.js       ← 5 tiers: general(500/15m) dashboard(200/5m) api(300/1m) gemini(30/1m) execute(30/1m)
    │   ├── validate.js          ← Joi schema middleware factory
    │   └── errorHandler.js      ← Mongoose ValidationError, CastError, JWT errors, E11000 duplicate, 500 fallback
    │
    ├── socket/
    │   ├── index.js             ← Socket.IO init; JWT auth on connection; loads handler modules
    │   ├── roomHandler.js       ← join/leave/chat/timer/ELO/session-end; lazy-init activeRooms + MongoDB fallback
    │   ├── codeSync.js          ← Yjs binary sync, cursor broadcasts, 5s snapshot persistence
    │   ├── matchingQueue.js     ← In-memory ELO ±200 queue; role+topic filtering; 60s timeout; socket liveness check
    │   ├── webrtcSignaling.js   ← offer/answer/ice-candidate relay; no media touches server
    │   ├── leaderboard.socket.js ← Real-time leaderboard push events
    │   ├── notifications.socket.js ← In-app notification delivery
    │   └── stats.socket.js      ← Live platform stats broadcast
    │
    ├── services/                ← Business logic separated from controllers
    │
    ├── utils/
    │   ├── httpResponse.js      ← ok(res, data, msg, status) / fail(res, status, msg) envelope
    │   ├── jwtUtils.js          ← signToken / verifyToken / signRefreshToken / verifyRefreshToken
    │   ├── diffEngine.js        ← computeDiffs(snapshots) → line-level changes array for playback
    │   ├── eloSystem.js         ← ELO delta with difficulty multiplier + duration modifier
    │   ├── streakCalculator.js  ← computeUserStreak(userId) → {currentStreak, longestStreak}
    │   ├── executeHelpers.js    ← getLanguageId, extractFunctionName regex per language, wrapCodeForTest
    │   ├── codeTemplates.js     ← Starter code + best practices for 6 languages
    │   ├── pistonExecutor.js    ← Alternative execution via Piston API (Judge0 fallback)
    │   ├── logger.js            ← Structured logger (dev-only console in non-production)
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
    ├── migrations/
    │   └── sessionSnapshotMigration.js    ← One-time data migration for session snapshot format
    │
    └── seeds/
        ├── problemSeed.js          ← 20 coding problems with visible + hidden test cases
        ├── trackSeed.js            ← 4 company learning tracks linked to seeded problems
        ├── adminSeed.js            ← Promote test@example.com to admin role
        ├── sessionSeed.js          ← 2 test users + 1 session with 3 code snapshots
        ├── testuser2Seed.js        ← Create second test account for paired session testing
        └── addMissingTestCases.js  ← Backfill test cases for problems missing them
```

</details>

<details>
<summary><b>⚛️ Frontend — peercode-frontend/src/</b> (click to expand)</summary>

```
peercode-frontend/src/
├── main.jsx       ← BrowserRouter > AuthProvider > SocketProvider > GeminiProvider > App + Toaster
├── App.jsx        ← React.lazy() for all pages; ProtectedRoute + AdminRoute guards; global key handlers
│
├── styles/
│   └── tokens.css             ← CSS custom properties: colors, spacing, typography tokens
│
├── pages/
│   ├── HomePage.jsx           ← Landing: login/register forms + feature showcase
│   ├── DashboardPage.jsx      ← ELO trend, streak, heatmap, session list, subscription cards
│   ├── RoomPage.jsx           ← Interview room: RoomLobby → RoomLayout (lobby phase → room phase)
│   ├── ProblemsPage.jsx       ← Filterable problem grid with difficulty/tag/company filters
│   ├── ProblemDetailPage.jsx  ← Problem statement + Monaco editor + TestCaseRunner + Report button
│   ├── ProfilePage.jsx        ← Username/password settings, achievements, GeminiKeyManager
│   ├── PlaybackPage.jsx       ← Session replay: PlaybackTimeline + PlaybackPlayer + SessionAnalytics
│   ├── DebriefPage.jsx        ← AI debrief with auto-generation, performance metrics
│   ├── TracksPage.jsx         ← Company learning track cards with search, gradients, progress bars
│   ├── TrackDetailPage.jsx    ← Problem list with difficulty bar, search, hover effects
│   ├── AdminPage.jsx          ← 5-tab panel: overview / subscriptions / users / problems / reports
│   ├── MatchPage.jsx          ← Thin wrapper rendering MatchingQueue component
│   ├── SubscriptionPage.jsx   ← Plan comparison cards, billing toggle, usage bars, Razorpay checkout
│   ├── AIInterviewPage.jsx    ← AI-driven interview practice mode
│   ├── LeaderboardPage.jsx    ← ELO leaderboard with rank, wins, rating trend
│   ├── PrivateRoomPage.jsx    ← Direct room creation/join without matchmaking
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
│   ├── admin/
│   │   └── AddEditProblemModal.jsx ← Full problem form with validation and per-language code templates
│   │
│   ├── video/
│   │   ├── VideoPanel.jsx        ← Google Meet-style: remote fills main, self-view PIP, screen-share
│   │   ├── VideoTile.jsx         ← Single video stream or avatar placeholder with status badges
│   │   └── VideoControls.jsx     ← Mute / camera off / screen-share / hang-up buttons
│   │
│   ├── gemini/
│   │   ├── AIHintPanel.jsx       ← Hint and analyze buttons with markdown result rendering
│   │   └── GeminiKeyManager.jsx  ← Key input, live Google API validation, save/remove
│   │
│   ├── problems/
│   │   ├── ProblemPanel.jsx      ← Description / hints / editorial / solutions tabs + Report button
│   │   ├── ReportProblemModal.jsx ← Issue type + description form
│   │   ├── TestCaseRunner.jsx    ← Per-test-case grid; auto-marks solved on all-pass
│   │   ├── ProblemBrowser.jsx    ← Full-screen search + difficulty filter modal with error state + retry
│   │   ├── ProblemList.jsx       ← Problem grid with difficulty badges
│   │   ├── SyntaxHighlight.jsx   ← Custom tokenizer with syntax coloring for 6 languages
│   │   ├── ExecutionOutput.jsx   ← stdin/stdout execution result display
│   │   └── BestPracticesPanel.jsx ← Language-specific coding tips panel
│   │
│   ├── playback/
│   │   ├── PlaybackTimeline.jsx  ← Scrubber with play/pause + speed control (0.5× to 4×)
│   │   ├── PlaybackPlayer.jsx    ← Read-only Monaco editor showing snapshot at current index
│   │   └── SessionAnalytics.jsx  ← Recharts AreaChart + approach count + pause segment markers
│   │
│   ├── chat/
│   │   └── ChatPanel.jsx          ← Real-time messaging with history, auto-scroll
│   │
│   ├── subscription/
│   │   ├── SubscriptionModal.jsx  ← Plan upgrade comparison modal
│   │   ├── UpgradeConfirmModal.jsx ← Razorpay payment confirmation
│   │   └── CancelSubscriptionModal.jsx ← Cancellation flow
│   │
│   ├── dashboard/
│   │   ├── ContributionHeatmap.jsx ← GitHub-style 52-week activity grid
│   │   └── ForYouSection.jsx      ← Personalized problem recommendations section
│   │
│   ├── leaderboard/               ← Leaderboard display components
│   ├── home/                      ← Hero, feature showcase, CTA components
│   ├── profile/                   ← Profile page sub-components
│   │
│   └── common/
│       ├── Navbar.jsx             ← Top nav: links, user dropdown, mobile sidebar, upgrade CTA
│       ├── Footer.jsx             ← Site footer with links and social
│       ├── Modal.jsx              ← Headless UI Dialog wrapper with backdrop blur
│       ├── ConnectionBanner.jsx   ← Fixed top banner showing socket connection state
│       ├── ErrorBoundary.jsx      ← Class component catching render errors with retry
│       ├── ErrorState.jsx         ← Full-page error display with retry and go-home actions
│       ├── EmptyState.jsx         ← Reusable empty state with icon, title, description, action
│       ├── LoadingButton.jsx      ← Button with inline spinner for async actions
│       ├── Badge.jsx              ← Difficulty/status badge (easy/medium/hard/custom)
│       ├── Skeleton.jsx           ← Pulsing placeholder for loading states
│       ├── StatCard.jsx           ← Metric card with icon, label, value, trend
│       ├── BackToTop.jsx          ← Scroll-to-top floating button
│       ├── CommandPalette.jsx     ← ⌘K quick-action search overlay
│       ├── NotificationCenter.jsx ← In-app notification bell + dropdown panel
│       ├── PageLayout.jsx         ← Standard page wrapper with Navbar + Footer
│       ├── PageTransition.jsx     ← Route-level entrance/exit animation wrapper
│       ├── Pagination.jsx         ← Generic page navigator component
│       ├── GlowCard.jsx           ← Card with animated glow border on hover
│       ├── RippleButton.jsx       ← Button with Material-style ripple click effect
│       ├── MagneticButton.jsx     ← Button with cursor-magnetic hover behavior
│       ├── TiltCard.jsx           ← Parallax tilt card on mouse-move
│       ├── ParticlesBackground.jsx ← Animated particle canvas background
│       ├── CustomCursor.jsx       ← Branded custom cursor overlay
│       ├── RatingModal.jsx        ← Post-session peer rating 1-5 stars + feedback
│       ├── SessionExpiryModal.jsx ← Warning modal when JWT session is about to expire
│       ├── LogoutConfirmModal.jsx ← Confirmation dialog before logout
│       ├── CompanyLogo.jsx        ← Inline SVGs for Amazon/Google/Meta/Apple/Microsoft/Netflix/Uber/Airbnb
│       ├── EmptyStateIllustrations.jsx ← SVG illustrations for tracks/sessions/empty data
│       ├── HeroIllustration.jsx   ← Hero image for the HomePage
│       └── KeyboardShortcutsCheatSheet.jsx ← ? key overlay showing all shortcuts
│
├── context/
│   ├── AuthContext.jsx    ← user, accessToken, isLoading, login / register / logout / refreshToken
│   ├── SocketContext.jsx  ← Socket.IO lifecycle: creates on auth, destroys on logout
│   └── GeminiContext.jsx  ← Personal API key in localStorage (key: peercode_gemini_key)
│
├── hooks/
│   ├── useWebRTC.js          ← RTCPeerConnection per peer; STUN servers; offer/answer/ICE flow
│   ├── useYjsEditor.js       ← Y.Doc + y-monaco binding; 3-minute no-edit stuck detection
│   ├── useGemini.js          ← Fetch hint / analysis / question with loading + error state
│   ├── useRoom.js            ← Room data fetch + all room socket event listeners
│   ├── useBookmarks.js       ← Problem bookmark state with localStorage persistence
│   ├── useLeaderboard.js     ← ELO leaderboard data fetching with pagination
│   ├── useNotifications.js   ← In-app notification polling + socket subscription
│   ├── useOnboardingTour.js  ← First-visit guided tour state machine
│   └── useReveal.js          ← IntersectionObserver scroll-reveal animation hook
│
├── services/
│   ├── api.js             ← Axios instance; silent 401 → refresh interceptor; all API functions
│   └── socketService.js   ← createSocket(token) factory; 15 reconnection attempts
│
└── utils/
    ├── codeTemplates.js   ← Starter code for 6 languages
    ├── confetti.js        ← canvas-confetti wrapper for celebration animations
    ├── diffUtils.js       ← Line diff, code stats, approach-restart detection (< 20% retention)
    ├── validation.js      ← Email / password / username validators + sanitize helpers
    └── webrtcConfig.js    ← STUN server list: stun.l.google.com 19302 × 3 servers
```

</details>

---

## ⚡ Quick Start

### Prerequisites

```bash
node --version    # Requires 20.x or later
npm --version     # Requires 9.x or later
mongod --version  # Requires 7.x locally — OR use a free MongoDB Atlas cluster
```

### Clone & Install

```bash
git clone https://github.com/GJBarhate/peercode.git
cd peercode

# Backend dependencies
cd peercode-backend && npm install

# Frontend dependencies — also installs git pre-commit hooks at the repo root
cd ../peercode-frontend && npm install
```

### Configure Environment

```bash
cp peercode-backend/.env.example peercode-backend/.env
# Minimum viable: MONGO_URI, JWT_SECRET, JWT_REFRESH_SECRET, FRONTEND_URL, GEMINI_KEY_1
```

Generate secure JWT secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Run twice — once for JWT_SECRET, once for JWT_REFRESH_SECRET
```

### Run Both Servers

```bash
# Terminal 1 — Backend (Express + Socket.IO on :5000)
cd peercode-backend
npm run dev

# Terminal 2 — Frontend (Vite dev server on :5173, proxied to :5000)
cd peercode-frontend
npm run dev
```

### Seed Sample Data

```bash
cd peercode-backend

npm run seed:problems          # 20 coding problems with test cases + hidden tests
npm run seed:tracks            # 4 company learning tracks
node src/seeds/adminSeed.js    # Promote test@example.com to admin
node src/seeds/testuser2Seed.js # Create a second test user for pair-session testing
```

### Verify

```bash
curl http://localhost:5000/api/health
# → {"status":"ok","db":"connected","geminiPool":{"totalKeys":1},"uptime":12,...}
```

Open `http://localhost:5173` — the PeerCode landing page should load.

> 🎉 **You're up.** Register two accounts in separate browser windows, click **Find Partner** from both, and start a live mock interview session.

### Docker Alternative

```bash
cd peercode-backend
docker compose up --build -d
docker compose logs -f backend
```

---

## 🔧 Environment Setup

<details>
<summary><b>📄 Complete .env Reference</b> (click to expand)</summary>

```bash
# ════════ SERVER ═══════════════════════════════════════════════════════
NODE_ENV=development        # 'production' disables morgan logging and stack traces in errors
PORT=5000                   # HTTP server port; Socket.IO shares this same port

# ════════ DATABASE ═════════════════════════════════════════════════════
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/?appName=Cluster0
# Local: mongodb://localhost:27017/peercode
# REQUIRED — server retries 5 times with exponential backoff then exits

# ════════ JWT ══════════════════════════════════════════════════════════
JWT_SECRET=<64-char hex>           # REQUIRED — signs 60-minute access tokens
JWT_REFRESH_SECRET=<64-char hex>   # REQUIRED — signs 7-day refresh tokens in httpOnly cookies
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ════════ CORS ═════════════════════════════════════════════════════════
FRONTEND_URL=http://localhost:5173  # REQUIRED — only this origin passes CORS + Socket.IO auth

# ════════ SMTP (optional — email jobs degrade gracefully if absent) ════
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=<gmail-app-password>      # Use a Gmail App Password, not your account password

# ════════ GOOGLE OAUTH ═════════════════════════════════════════════════
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com  # From Google Cloud Console > Credentials
GOOGLE_CLIENT_SECRET=GOCSPX-xxx                  # OAuth 2.0 Client Secret
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback  # Must match authorized redirect URI

# ════════ GEMINI AI ════════════════════════════════════════════════════
GEMINI_KEY_1=AIza...    # REQUIRED for AI features — free keys from aistudio.google.com
GEMINI_KEY_2=AIza...    # Optional — adds to round-robin pool (each free key = 1,500 req/day)
GEMINI_KEY_3=AIza...    # Keys returning 429 are skipped automatically
GEMINI_KEY_4=AIza...
GEMINI_KEY_5=AIza...
GEMINI_KEY_6=AIza...
GEMINI_KEY_7=AIza...    # Up to 7 keys; pool size shown in /api/health

# ════════ CODE EXECUTION ═══════════════════════════════════════════════
JUDGE0_BASE_URL=https://ce.judge0.com   # Public CE; self-host for production SLAs

# ════════ PAYMENTS ═════════════════════════════════════════════════════
RAZORPAY_KEY_ID=rzp_test_xxx       # Test-mode key — subscriptions mock if both keys absent
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx        # HMAC-SHA256 verification; optional in dev

# ════════ FRONTEND (peercode-frontend/.env) ════════════════════════════
VITE_API_URL=http://localhost:5000/api  # Set to production API URL when deploying frontend
```

> 💡 **Dev tip:** If `RAZORPAY_KEY_ID` is absent, `POST /api/subscription/create` returns a mock redirect URL that instantly activates the plan — no real payment needed for local development.

</details>

---

## 📡 API Reference

```http
GET http://localhost:5000/api/health
→ 200 {"status":"ok","db":"connected","uptime":342,"memoryMB":87,"nodeVersion":"v20.11.0","geminiPool":{"totalKeys":3,"currentIndex":1}}
```

**Auth legend:** `❌` = Public &nbsp;&nbsp; `✅` = Login required &nbsp;&nbsp; `🛡️` = Admin role required

<details>
<summary><b>🔐 Auth — /api/auth</b></summary>

| Method | Endpoint | Auth | Body | Response | Description |
|---|---|:---:|---|---|---|
| `POST` | `/register` | ❌ | `{username, email, password}` | 201 `{requiresVerification: true}` | Create account; sends 6-digit OTP email |
| `POST` | `/verify-otp` | ❌ | `{email, otp}` | 200 `{accessToken, user}` + refresh cookie | Verify OTP (3-min expiry) and log in |
| `POST` | `/resend-otp` | ❌ | `{email}` | 200 | Resend 6-digit OTP |
| `POST` | `/login` | ❌ | `{email, password}` | 200 `{accessToken, user}` + refresh cookie | Issue tokens; 5-attempt lockout |
| `POST` | `/google` | ❌ | `{code}` | 200 `{accessToken, user}` + refresh cookie | Google OAuth authorization code flow |
| `POST` | `/link-google` | ✅ | `{code}` | 200 | Link Google account to existing user |
| `POST` | `/unlink-google` | ✅ | — | 200 | Unlink Google account (requires password) |
| `POST` | `/refresh` | ❌ | Cookie: `refreshToken` | 200 `{accessToken, user}` | Silent refresh on 401; atomic tokenVersion increment |
| `POST` | `/logout` | ❌ | Cookie: `refreshToken` | 200 | Clear httpOnly refresh cookie with matching options |

> Duplicate username or email returns `409 DUPLICATE_FIELD`.

</details>

<details>
<summary><b>🚪 Rooms — /api/rooms</b> (auth + 300 req/min)</summary>

| Method | Endpoint | Auth | Body / Params | Response | Description |
|---|---|:---:|---|---|---|
| `POST` | `/` | ✅ | `{problemSlug?}` | 201 `{room}` | Create room; generates UUID v4 as `roomId` |
| `POST` | `/create` | ✅ | `{problemSlug?}` | 201 `{room}` | Alias for `POST /` |
| `GET` | `/:id` | ✅ | `_id` or `roomId` | 200 `{room}` | Room with populated participants and problem |
| `POST` | `/:id/join` | ✅ | `{role?}` | 200 `{room}` | Add self to participants; fails `ROOM_FULL` at capacity |
| `DELETE` | `/:id` | ✅ | — | 200 | Delete room; `NOT_HOST (403)` for non-hosts |

</details>

<details>
<summary><b>🧩 Problems — /api/problems</b> (300 req/min; admin writes)</summary>

| Method | Endpoint | Auth | Body / Params | Response | Description |
|---|---|:---:|---|---|---|
| `GET` | `/stats` | ❌ | — | `{total, easy, medium, hard}` | Problem counts by difficulty |
| `GET` | `/` | ❌ | `?difficulty&companies&tags&search&page&limit` | `{problems[], total, page, pages}` | Filtered paginated list |
| `GET` | `/:slug` | ❌ | `slug` | `{problem}` | Single problem — `hiddenTests` excluded |
| `POST` | `/` | 🛡️ | Full problem object | 201 `{problem}` | Create with stubs, starter code, test cases |
| `PUT` | `/:id` | 🛡️ | Partial problem | 200 `{problem}` | Update any problem field |
| `POST` | `/:id/report` | ✅ | `{type, description}` | 201 `{report}` | Report: `wrong-answer` / `broken-testcase` / `unclear-description` / `other` |
| `POST` | `/:slug/solve` | ✅ | — | 200 | Append to `user.solvedProblems`; auto-called when all tests pass |

</details>

<details>
<summary><b>📼 Sessions — /api/sessions</b> (auth + 200 req/5min)</summary>

| Method | Endpoint | Auth | Params | Response | Description |
|---|---|:---:|---|---|---|
| `GET` | `/` | ✅ | — | `{sessions[]}` | Session history (last 50, sorted by date) |
| `GET` | `/:roomId` | ✅ | `roomId` | `{session}` | Single session document |
| `GET` | `/:roomId/playback` | ✅ | `roomId` | `{snapshots[], diffs[]}` | Snapshots with line-level diffs |
| `POST` | `/:roomId/end` | ✅ | `roomId` | `{sessionId, duration}` | Queue `session-complete` Agenda job |
| `GET` | `/:roomId/debrief` | ✅ | `roomId` | `{debrief, problem, session}` | AI debrief; auto-generates if not yet created |
| `GET` | `/:roomId/analytics` | ✅ | `roomId` | `{totalSnapshots, approachCount, pauseSegments, codeGrowthCurve, linesWritten, linesDeleted}` | Computed session metrics |

</details>

<details>
<summary><b>🤖 Gemini AI — /api/gemini</b> (auth + 30 req/min)</summary>

| Method | Endpoint | Auth | Body | Response | Description |
|---|---|:---:|---|---|---|
| `POST` | `/hint` | ✅ | `{code, problem, language}` | `{hint}` | Contextual nudge — never reveals full solution |
| `POST` | `/analyze` | ✅ | `{code, problem, language}` | `{analysis}` | Structured review with time + space complexity |
| `POST` | `/generate-question` | ✅ | `{topic, difficulty}` | `{question}` | DSA question generation for interviewers |
| `GET` | `/usage` | ✅ | — | `{plan, hints, analyzes}` | Current period usage vs plan limits |

> Requests with `x-gemini-key` header skip plan checks and call Gemini with the personal key directly.

</details>

<details>
<summary><b>⚡ Execute — /api/execute</b> (auth + 30 req/min)</summary>

| Method | Endpoint | Auth | Body | Response | Description |
|---|---|:---:|---|---|---|
| `POST` | `/` | ✅ | `{code, language, testCases[], problemSlug?}` | `{results[], allPassed, passedCount, totalCount}` | Full test suite via Judge0 |
| `POST` | `/run` | ✅ | `{code, language, stdin?}` | `{stdout, stderr, exitCode, time, memory}` | Single stdin/stdout run |
| `GET` | `/testcases/:problemId` | ✅ | `problemId` | `{testCases[]}` | Visible test cases for a problem |
| `POST` | `/testcases/:problemId` | 🛡️ | `{input, expectedOutput}` | 201 | Add test case |
| `DELETE` | `/testcases/:problemId/:tcId` | 🛡️ | — | 200 | Delete test case |

</details>

<details>
<summary><b>💎 Subscription — /api/subscription</b></summary>

| Method | Endpoint | Auth | Body | Response | Description |
|---|---|:---:|---|---|---|
| `GET` | `/plans` | ❌ | — | `{plans[]}` | All plans with limits and pricing |
| `GET` | `/status` | ✅ | — | `{plan, status, currentPeriodEnd, usage}` | Current subscription state |
| `POST` | `/create` | ✅ | `{planId}` | `{shortUrl, mock?}` | Razorpay payment link (or mock URL in dev) |
| `POST` | `/cancel` | ✅ | `{immediately?}` | 200 | Revert to free plan |
| `POST` | `/webhook` | ❌ | Razorpay raw body | 200 | HMAC-SHA256 verified payment capture handler |

</details>

<details>
<summary><b>🛡️ Admin — /api/admin</b> (admin role required)</summary>

| Method | Endpoint | Params / Body | Response | Description |
|---|---|---|---|---|
| `GET` | `/stats` | — | `{totalUsers, totalSessions, topProblems[], subscriptionStats, geminiPool}` | Full platform metrics + revenue |
| `GET` | `/users` | `?page&limit&search` | `{users[], total, pages}` | Paginated user list |
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
| `GET` | `/progress` | ✅ | — | `{progress[]}` | All track progress records for current user |
| `GET` | `/:slug` | ❌ | `slug` | `{track}` | Single track with ordered + populated problems |
| `GET` | `/:slug/progress` | ✅ | `slug` | `{progress}` | Per-user progress for a single track |
| `POST` | `/:slug/complete-problem` | ✅ | `{problemId}` | 200 | Mark problem done; sets `completedAt` when all complete |

</details>

<details>
<summary><b>⭐ Ratings — /api/ratings</b> (auth required)</summary>

| Method | Endpoint | Auth | Body | Response | Description |
|---|---|---|---|---|---|
| `POST` | `/` | ✅ | `{sessionId, toUserId, score, feedback?}` | 200 `{rating}` | Submit or update peer rating; validates session participants |
| `GET` | `/me` | ✅ | — | `{ratings[]}` | Ratings received by current user |
| `GET` | `/:userId` | ✅ | `userId` | `{ratings[]}` | Ratings received by a specific user |

</details>

---

## 🔌 Socket Events

<details>
<summary><b>🚪 Room Handler — roomHandler.js</b></summary>

```js
// ── Client → Server ────────────────────────────────────────────────────
socket.emit('join-room',      { roomId, role? })              // join socket room, lazy-init activeRooms entry
socket.emit('leave-room',     { roomId })                     // explicit leave; triggers participant-left broadcast
socket.emit('send-message',   { roomId, text })               // chat message; max 100 chars; stored in memory (cap 100)
socket.emit('start-timer',    { roomId, durationSeconds })    // interviewer starts multi-phase countdown
socket.emit('pause-timer',    { roomId })                     // pause countdown
socket.emit('resume-timer',   { roomId })                     // resume from paused state
socket.emit('timer-advanced', { roomId, phaseIndex, timeLeft, bonusUsed })
socket.emit('end-session',    { roomId, testResults, finalCode, finalLanguage, duration? })

// ── Server → Client ────────────────────────────────────────────────────
socket.on('room-state',         { roomId, participants, currentProblem, currentCode, language, messages[] })
socket.on('participant-joined', { participant, participants[] })
socket.on('participant-left',   { userId, username, participants[] })
socket.on('timer-started',      { durationSeconds, startedAt, startedBy })
socket.on('timer-paused',       { pausedBy })
socket.on('timer-resumed',      { resumedBy })
socket.on('timer-advanced',     { phaseIndex, timeLeft, bonusUsed })
socket.on('timer-ended',        {})
socket.on('new-message',        { userId, username, text, timestamp, _id })
socket.on('session-ended',      { sessionId, duration })     // triggers client redirect to /debrief/:roomId
```

**Session end idempotency:** On `end-session`, the server checks for an existing `Session` with `status: 'completed'`. If it exists, the event is silently ignored. On a new session: computes ELO delta per participant (difficulty + duration modifiers, K=32), updates all `User.elo` fields, emits `session-ended` to the room, then queues one `ai-debrief` Agenda job per participant.

**activeRooms resilience:** Room state lives in an in-memory Map that lazy-initializes on first access. If the server restarts mid-session, `end-session` falls back to MongoDB (`Room.findOne` → `populated problemId`) so sessions can still close cleanly.

</details>

<details>
<summary><b>✏️ Code Sync — codeSync.js</b></summary>

```js
// ── Client → Server ────────────────────────────────────────────────────
socket.emit('yjs-update',         (roomId, update))           // binary Yjs CRDT diff (~bytes per keystroke)
socket.emit('yjs-request-state',  (roomId))                   // new joiner requests full document state
socket.emit('yjs-state-response', (to, state))                // existing peer sends full Y.Doc to new joiner
socket.emit('cursor-update',      (roomId, cursor))           // {line, column, userId} for CursorLabel
socket.emit('code-snapshot',      (roomId, code, language))   // debounced 5s; server $push to Session.snapshots
socket.emit('run-code',           { roomId, code, language, testCases[], problemSlug? })

// ── Server → Client ────────────────────────────────────────────────────
socket.on('yjs-update',           (update))                   // relay binary diff to all other peers in room
socket.on('yjs-state-request',    { requesterSocketId })      // tell peer to send full doc to requester
socket.on('yjs-state-response',   (state))                    // full Y.Doc state delivered to requesting peer
socket.on('cursor-update',        { socketId, ...cursor })    // CursorLabel repositions on receive
socket.on('run-code-result',      { results[], allPassed, passedCount, totalCount, language, runBy, timestamp })
```

**Yjs sync protocol:** The server holds no Y.Doc. When a new peer joins, it emits `yjs-request-state`. An existing peer serializes its Y.Doc and emits `yjs-state-response` to the new peer's socket ID. After initial sync, all edits flow as binary incremental diffs. Stuck detection fires a hint suggestion after 3 minutes of zero edits.

</details>

<details>
<summary><b>🎯 Matching Queue — matchingQueue.js</b></summary>

```js
// ── Client → Server ────────────────────────────────────────────────────
socket.emit('queue-join',  { role?, topic? })  // role: 'interviewer' | 'interviewee' | 'any'
socket.emit('queue-leave', {})

// ── Server → Client ────────────────────────────────────────────────────
socket.on('queue-matched', { roomId, partnerUsername, partnerElo, yourRole, partnerId, topic, timestamp })
socket.on('queue-waiting', { position, estimatedWaitSeconds, queueSize })
socket.on('queue-error',   { message })
socket.on('queue-left',    {})
socket.on('queue-timeout', { message })
```

**Matching algorithm:** Three simultaneous criteria — ELO difference ≤ 200; role compatibility (interviewer↔interviewee, or `any`↔anything); topic match (if both specify a non-"Any" topic they must match). Before joining partner to room, `fetchSockets()` verifies the partner socket still exists — disconnected partners re-queue the candidate with a descriptive error. 60-second server-side timeout emits `queue-timeout`.

</details>

<details>
<summary><b>📹 WebRTC Signaling — webrtcSignaling.js</b></summary>

```js
// ── Client → Server ────────────────────────────────────────────────────
socket.emit('offer',            { to: socketId, sdp })
socket.emit('answer',           { to: socketId, sdp })
socket.emit('ice-candidate',    { to: socketId, candidate })
socket.emit('kick-participant', { participantSocketId, reason? })

// ── Server → Client ────────────────────────────────────────────────────
socket.on('participant-joined', { socketId, userId, username })
socket.on('participant-left',   { socketId, username })
socket.on('offer',              { from: socketId, sdp })
socket.on('answer',             { from: socketId, sdp })
socket.on('ice-candidate',      { from: socketId, candidate })
socket.on('participant-kicked', { message, timestamp })
```

**The server never touches media.** It only relays SDP negotiation and ICE candidates. `useWebRTC.js` instantiates a separate `RTCPeerConnection` per remote participant, configured with 3 Google STUN servers. Screen sharing uses `replaceTrack` (not `addTrack`) to swap camera ↔ screen share without renegotiating the full connection.

</details>

---

## 🗄️ Data Models

<details>
<summary><b>👤 User</b></summary>

```js
{
  username:     String,   // required, unique, 3–20 chars
  email:        String,   // required, unique, lowercase
  passwordHash: String,   // select: false — requires .select('+passwordHash') to access
  elo:          Number,   // default: 1200, min: 0
  apiKey:       String,   // personal Gemini key; bypasses shared pool + all usage limits
  role:         String,   // 'user' | 'admin'  ← default: 'user'
  isBanned:     Boolean,  // default: false; auth middleware returns USER_NOT_FOUND for banned users

  solvedProblems: [{ problem: ObjectId, solvedAt: Date }],

  streakData: {
    currentStreak:   Number,
    longestStreak:   Number,
    lastSessionDate: Date
  },

  subscription: {
    plan:                   String,  // 'free' | 'pro' | 'premium' | 'ultra'
    status:                 String,  // 'active' | 'cancelled' | 'past_due' | 'trialing' | 'pending'
    razorpaySubscriptionId: String,
    currentPeriodStart:     Date,
    currentPeriodEnd:       Date,
    cancelAtPeriodEnd:      Boolean
  },

  usage: {
    hintsUsed:    Number,  // resets to 0 when monthDiff >= 1 in incrementUsage()
    analyzesUsed: Number,
    periodStart:  Date
  },

  weaknessProfile: Map     // topic → score; drives personalized recommendations
}
```

</details>

<details>
<summary><b>🖥️ Session</b></summary>

```js
{
  roomId:    String,    // UUID v4 — NOT MongoDB _id; matches socket room name
  problem:   ObjectId,

  problemSnapshot: {    // cached at session start; survives problem edits
    title: String, difficulty: String, slug: String, tags: [String]
  },

  participants: [ObjectId],

  snapshots: [{         // pushed every 5s; enables full replay
    timestamp: Date, code: String, language: String, userId: ObjectId
  }],

  startTime: Date, endTime: Date, duration: Number,
  status:    String,   // 'in-progress' | 'completed' | 'abandoned'
  finalCode: String, finalLanguage: String,

  testResults: { passed: Number, total: Number, allPassed: Boolean },
  eloData:     [{ userId: ObjectId, eloAtEnd: Number, delta: Number }],
  debrief:     ObjectId  // ref AiDebrief — populated after Agenda job
}
```

</details>

<details>
<summary><b>🧩 Problem</b></summary>

```js
{
  title: String, slug: String,   // slug unique — used as route param /problems/:slug
  description: String, difficulty: String, // 'easy' | 'medium' | 'hard'
  companies: [String], tags: [String], constraints: String,
  timeLimit: Number, memoryLimit: Number,
  isActive: Boolean,             // false = soft-deleted; hidden from public, shown to admin

  examples:    [{ input, output, explanation }],
  testCases:   [{ input, expectedOutput }],     // visible to users
  hiddenTests: [{ input, expectedOutput }],     // select: false

  stubs:       { javascript, typescript, python, java, cpp, go },
  starterCode: { javascript, typescript, python, java, cpp, go }
}
```

</details>

<details>
<summary><b>🗂️ Room, Rating, Track, AiDebrief, UserTrackProgress</b></summary>

```js
// ── Room ─────────────────────────────────────────────────────────────
{
  roomId: String,    // UUID v4 unique
  host:   ObjectId,
  participants: [{ user: ObjectId, role: String, joinedAt: Date }],
  status:          String,    // 'waiting' | 'active' | 'completed'
  problemId:       ObjectId,  // persisted on set_problem for server-restart resilience
  maxParticipants: Number     // default: 3
}

// ── AiDebrief ────────────────────────────────────────────────────────
{
  sessionId: ObjectId, generatedFor: ObjectId, roomId: String,
  scores: {
    communication: Number,  // 1–5
    decomposition: Number,  // 1–5
    codeQuality:   Number,  // 1–5
    complexity:    Number   // 1–5
  },
  overallReadiness: Number, // 1–10
  whatWentWell: [String], areasToImprove: [String],
  studyNext: [String], summary: String
}

// ── UserTrackProgress ────────────────────────────────────────────────
{
  user: ObjectId, track: ObjectId,  // compound unique index
  completedProblems: [{ problem: ObjectId, completedAt: Date }],
  startedAt: Date, completedAt: Date
}
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
| **Session Replay** | ✅ | ✅ | ✅ | ✅ |
| **AI Debrief** | ✅ | ✅ | ✅ | ✅ |
| **ELO Matching** | ✅ | ✅ | ✅ | ✅ |
| **Own API Key (unlimited AI)** | ✅ | ✅ | ✅ | ✅ |

</div>

**Monthly reset:** Usage counters (`hintsUsed`, `analyzesUsed`) live on the `User` document. `incrementUsage()` computes `monthDiff`; if `≥ 1`, both counters reset and `periodStart` advances before the new usage is saved.

**Personal API key bypass:** If `req.headers['x-gemini-key']` or `user.apiKey` is truthy, the controller skips `canUseFeature()` and passes the key directly to Gemini. No counter is touched — any user on Free has effective unlimited AI with their own key.

**Razorpay flow:** `POST /api/subscription/create {planId}` → Razorpay `paymentLink.create()` → user redirected to checkout → webhook `payment.captured` → `plan`, `status: 'active'`, `currentPeriodEnd: now + 30 days` set on User. Webhook signature verified with `HMAC-SHA256(body, RAZORPAY_WEBHOOK_SECRET)`.

---

## 🤖 AI Integration

### Gemini Key Pool Architecture

```
callGemini(prompt, userApiKey?)
    │
    ├── userApiKey present? ──YES──► call Gemini with personal key directly
    │
    └── NO ──► pool = [GEMINI_KEY_1..7].filter(Boolean)
                   │
                   ├── pool empty? ──► throw "No Gemini API keys configured"
                   │
                   └── Start at round-robin idx
                           ├── POST to Gemini API with pool[idx]
                           ├── HTTP 429? ──YES──► idx++; try next key
                           │                       all tried? ──► throw "All keys quota exceeded"
                           └── Success? ──► update idx; return response text
```

### AI Feature Specifications

| Feature | Endpoint | Prompt Strategy | Output Shape |
|---|---|---|---|
| **Hint** | `POST /api/gemini/hint` | Problem + current code + language; nudge without revealing | Free text hint |
| **Code Analysis** | `POST /api/gemini/analyze` | Code + problem; structured review request | Time/space complexity, feedback, suggestions |
| **Question Generation** | `POST /api/gemini/generate-question` | Topic + difficulty; DSA format | `{title, description, examples[], constraints}` |
| **AI Debrief** | Agenda `ai-debrief` job | Full session: problem, all snapshots, duration, test results | `{scores{}, overallReadiness, whatWentWell[], areasToImprove[], studyNext[]}` |

---

## ⚙️ Code Execution Engine

### Judge0 Integration

```
POST /api/execute { code, language, testCases[], problemSlug? }
    │
    ├─ 1. Fetch Problem by slug → get starterCode[language]
    ├─ 2. extractFunctionName(starterCode, language) via per-language regex
    ├─ 3. wrapCodeForTest(code, language, functionName) → stdin-reading executable
    │
    └─ For each testCase:
           POST https://ce.judge0.com/submissions?wait=true
           { source_code, language_id, stdin, expected_output }
           Parse → { stdout, stderr, exitCode, time_ms, memory_kb, status }

    → Aggregate: { results[], allPassed, passedCount, totalCount }
    → If allPassed: auto-call POST /problems/:slug/solve
```

### Supported Languages

| Language | Judge0 ID | stdin Method |
|---|:---:|---|
| JavaScript | 93 | `readline()` + JSON.parse/stringify |
| Python | 71 | `input()` + `print(output)` |
| Java | 62 | `Scanner` stdin; wraps in `class Solution` if absent |
| C++ | 54 | `cin` + `cout` |
| TypeScript | 74 | Same as JavaScript |
| C | 50 | `scanf` / `printf` |
| Go | 60 | `fmt.Scan` + `fmt.Println` |

**Fallback:** `pistonExecutor.js` wraps the [Piston API](https://github.com/engineer-man/piston) as a drop-in alternative when Judge0 CE is unreachable.

---

## 🚀 Deployment

### Option 1 — Railway or Render (Recommended for getting started)

```bash
# Environment variables to set in the dashboard:
NODE_ENV=production
PORT=5000
MONGO_URI=<Atlas connection string>
JWT_SECRET=<64-char hex>
JWT_REFRESH_SECRET=<64-char hex>
FRONTEND_URL=<your frontend domain>
GEMINI_KEY_1=<your key>
JUDGE0_BASE_URL=https://ce.judge0.com

# Start command
node server.js

# Health check path
/api/health
```

### Option 2 — Vercel (Frontend) + Railway (Backend)

```bash
# Build and deploy frontend
cd peercode-frontend
npm run build
# dist/ → Vercel

# Vercel project settings:
#   Framework preset: Vite
#   Build command:    npm run build
#   Output directory: dist
#   Env var:          VITE_API_URL=https://your-backend.railway.app/api
```

### Option 3 — Self-Hosted Docker

```bash
cd peercode-backend
docker compose up --build -d
docker compose logs -f backend
```

Nginx with WebSocket support:

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

---

## 🤝 Contributing

```bash
# Fork → clone → branch
git clone https://github.com/GJBarhate/peercode.git
cd peercode

git checkout -b feat/redis-matching-queue
#              fix/elo-negative-guard
#              docs/socket-events-detail

# Install — frontend install also sets up git pre-commit hooks
cd peercode-backend && npm install
cd ../peercode-frontend && npm install

# Commit with conventional format
git commit -m "feat(socket): add Redis adapter for matchingQueue horizontal scaling"
# Types: feat | fix | docs | refactor | test | chore | perf

git push origin feat/redis-matching-queue
# Open a Pull Request
```

**Dev gotchas:**

| | |
|---|---|
| **Matching queue is in-memory** | Restarting the backend with `nodemon` clears all queued users. Re-queue manually during testing. |
| **Seed before testing execute** | Test cases live in MongoDB. Without `npm run seed:problems`, execute calls fail on `extractFunctionName`. |
| **`passwordHash` is `select: false`** | Any code comparing passwords must chain `.select('+passwordHash')` on the query. |
| **Axios 401 interceptor is locked** | Don't call `/auth/refresh` directly in components — it breaks the single-flight lock. |
| **`send-message` vs `chat-message`** | `roomHandler` is canonical (stores + broadcasts). `codeSync` only broadcasts. Don't add storage logic to `codeSync`. |
| **activeRooms lazy init** | Use `getOrInitRoom(roomId)` (not `activeRooms.get()`) for any new room socket event handlers. |

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0ea5e9,50:4f46e5,100:6d28d9&height=120&section=footer" width="100%"/>

<br/>

Built with ☕ and too many late nights by **[Gaurav Barhate](https://github.com/GJBarhate)**

<br/>

[![GitHub Profile](https://img.shields.io/badge/GitHub-GJBarhate-6d28d9?style=for-the-badge&logo=github&logoColor=white)](https://github.com/GJBarhate)

<br/>

*If this helped you land an interview, a ⭐ on the repo means more than you'd think.*

<br/>

`Node.js` · `React` · `MongoDB` · `Express` · `Socket.IO` · `WebRTC` · `Yjs` · `Monaco` · `Gemini AI` · `Judge0` · `Razorpay` · `Agenda` · `Docker`

</div>
