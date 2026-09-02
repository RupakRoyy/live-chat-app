# Live Chat App

Random stranger video / audio / text chat (OpenTalk / Omegle-style).

Monorepo: Next.js frontend (`web`) + Socket.IO backend (`backend`).

## Structure

```
web/      → Next.js app (Vercel)
backend/ → Node.js + Socket.IO (Railway)
```

## Prerequisites

- Node.js 20+
- npm 10+

## Setup

```bash
npm install
cp web/.env.example web/.env.local
cp backend/.env.example backend/.env
```

## Run locally

Terminal 1 — frontend (http://localhost:3000):

```bash
npm run dev:web
```

Terminal 2 — backend (http://localhost:5000):

```bash
npm run dev:backend
```

Health check: [http://localhost:5000/health](http://localhost:5000/health)

## Deploy

- **web** → Vercel (root directory: `web`)
- **backend** → Railway (root directory: `backend`; uses `railway.toml`)

## Stack (planned)

| Layer        | Tech                          |
|-------------|-------------------------------|
| Frontend    | Next.js, React, TS, Tailwind  |
| Auth        | Clerk                         |
| Database    | Supabase (PostgreSQL)         |
| Matchmaking | Upstash Redis + backend       |
| Realtime    | Socket.IO signaling           |
| Media       | WebRTC (+ TURN later)         |
