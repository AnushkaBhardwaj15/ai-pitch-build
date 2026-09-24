# AI Pitch Deck — Build Chapters

A step-by-step guide to building this app from scratch. Each chapter builds on the previous one — follow them in order.

> **What you're building:** A user submits a startup idea → an AI agent generates structured slide content → OpenAI creates images → ImageKit hosts them → Inngest runs everything in the background → the UI shows a slide carousel.

---

## Architecture at a Glance

```
User (browser)
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  UI  (app/page.tsx, app/decks/*)                        │
│  CreateDeckForm → DeckViewer (polls every 3s)             │
└──────────────────────────┬──────────────────────────────┘
                           │ fetch
                           ▼
┌─────────────────────────────────────────────────────────┐
│  API  (app/api/decks/*)                                 │
│  POST creates Deck → sends Inngest event                │
│  GET returns deck + slides                              │
└──────────────────────────┬──────────────────────────────┘
                           │ inngest.send("deck/generate")
                           ▼
┌─────────────────────────────────────────────────────────┐
│  Inngest  (lib/inngest/functions/generate-deck.ts)      │
│  Step 1: run AI agent                                   │
│  Step 2: generate image per slide                       │
│  Step 3: upload to ImageKit → save to Postgres          │
└──────┬──────────────────────┬───────────────────────────┘
       │                      │
       ▼                      ▼
┌──────────────┐      ┌──────────────────┐
│ OpenAI Agent │      │ OpenAI Images +  │
│ + Guardrails │      │ ImageKit CDN     │
└──────────────┘      └──────────────────┘
       │                      │
       └──────────┬───────────┘
                  ▼
         ┌────────────────┐
         │ Prisma + Neon  │
         │ Deck / Slide   │
         └────────────────┘
```

---

## Chapter Map

| Chapter | Topic | Key output |
| --- | --- | --- |
| Chapter 1 | Project setup & environment | Next.js app + all packages installed |
| Chapter 2 | Database (Prisma) | `Deck` and `Slide` models in Postgres |
| Chapter 3 | Schemas & service helpers | Zod schema, OpenAI/ImageKit/Inngest clients |
| Chapter 4 | OpenAI Agent | Guardrails + structured pitch deck JSON |
| Chapter 5 | Images | OpenAI `gpt-image` → ImageKit upload |
| Chapter 6 | Inngest | Background job orchestrating the full pipeline |
| Chapter 7 | API routes | `POST /api/decks`, `GET /api/decks/[id]` |
| Chapter 8 | UI | Home form, deck list, slide carousel |
