# Portfolio 2026

Personal portfolio built with Next.js App Router and TypeScript, following a mobile-first and scalable architecture.

## Scripts

- `npm run dev`: run development server.
- `npm run build`: create production build.
- `npm run start`: serve production build.
- `npm run lint`: run ESLint.

## Architecture

- `src/app`: App Router entries, layout and global styles.
- `src/components/ui`: generic reusable UI primitives (`Section`).
- `src/components/layout`: layout components (`Header`, `Footer`, `Container`).
- `src/components/sections`: top-level page sections.
- `src/components/features`: domain components grouped by feature.
- `src/data`: typed content separated from UI.
- `src/types`: domain type contracts.
- `src/lib`: shared constants and utility helpers.

## Content Maintenance

Update portfolio content without touching UI by editing:

- `src/data/site.ts`
- `src/data/projects.ts`
- `src/data/experience.ts`
- `src/data/contact.ts`

All files are validated by TypeScript through `satisfies` and strict typing.

## Conventions

- Prefer Server Components. Add `'use client'` only when browser APIs or interactivity require it.
- Avoid `any` (explicit and implicit) and keep strict TypeScript enabled.
- Keep `sections` focused on composition and move reusable pieces into `ui` or `features`.
- Reuse `Section` for shared section structure (id, spacing, headings, container).
- Keep domain data serializable and independent from JSX to ease future migration to CMS/API.

## Run locally

1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Open `http://localhost:3000`
