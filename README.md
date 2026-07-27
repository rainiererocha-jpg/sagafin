# Sagafin — Financial Advisor Site + AI Content Engine

A production website for a Brazilian XP Investimentos financial advisor, combining an
interactive public-facing site with an internal AI-powered content marketing platform.

## What it does

**Public site**
- Landing page with a live market ticker, a compound-interest simulator, an investor-profile
  quiz, and a fixed-income comparator — interactive tools instead of static copy
- Blog + digital library (`Biblioteca`) serving educational ebooks and articles
- Lead capture (contact form, WhatsApp button) and a diagnostic/quiz funnel

**Admin platform** (`/admin`)
- AI-assisted content generation for blog posts and ebooks
- An approvals queue — generated content is reviewed before publishing, not auto-posted
- A content calendar and basic performance metrics dashboard

## Stack

- **Frontend**: Vite + React + TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Postgres, Auth, Row Level Security, Edge Functions)
- **Admin scripts** (`scripts/`): one-off Node scripts for seeding/generating content and
  ebook PDFs (Puppeteer-rendered), reading credentials from a local `.env` — see `.env.example`

## Running locally

```sh
npm install
cp .env.example .env   # fill in your own Supabase project values
npm run dev
```

## Notes

This started as a Lovable-generated scaffold and has since been substantially extended by
hand (admin platform, AI content pipeline, interactive financial tools, Supabase backend).
