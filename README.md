# Live Chat App

Random stranger video / audio / text chat (OpenTalk / Omegle-style).

Monorepo: Next.js frontend (`web`) + Socket.IO backend (`server`).

## Structure

```
web/      → Next.js app (Vercel)
server/  → Node.js + Socket.IO (Railway)
```

## Prerequisites

- Node.js 20+
- npm 10+

## Setup

```bash
npm install
cp web/.env.example web/.env.local
cp server/.env.example server/.env
```

## Run locally

Terminal 1 — frontend (http://localhost:3000):

```bash
npm run dev:web
```

Terminal 2 — backend (http://localhost:4000):

```bash
npm run dev:server
```

Health check: [http://localhost:4000/health](http://localhost:4000/health)

## Deploy

- **web** → Vercel (root directory: `web`)
- **server** → Railway (root directory: `server`; uses `railway.toml`)

## Stack (planned)

| Layer        | Tech                          |
|-------------|-------------------------------|
| Frontend    | Next.js, React, TS, Tailwind  |
| Auth        | Clerk                         |
| Database    | Supabase (PostgreSQL)         |
| Matchmaking | Upstash Redis + backend       |
| Realtime    | Socket.IO signaling           |
| Media       | WebRTC (+ TURN later)         |
