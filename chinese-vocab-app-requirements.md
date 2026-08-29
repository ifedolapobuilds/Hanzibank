# HanziBank — Chinese Vocabulary Practice App — Requirements Document

## 1. Overview

A personal web app for practicing Mandarin Chinese vocabulary, named **HanziBank**. The app manages a personal "word bank" (English ↔ Pinyin ↔ Chinese character entries) and offers two core practice modes: flip-card review and a matching game.

Single-user in practice (one account, belonging to the app owner), but built with **real auth and a cloud database** so the word bank syncs across devices (laptop + phone), and the codebase is structured cleanly enough to serve as a dev portfolio piece.

**Primary goals:**
- Maintain a structured word bank with metadata, synced across devices
- Review words via flip cards (English front, Pinyin + Character back)
- Practice via a matching game (English/Pinyin/Character, configurable pairing)
- Filter/select practice sets flexibly (random N, by date, by category/tag, by character count)
- Installable/usable comfortably on mobile (PWA)
- Built on a stack that can later support voice and AI-assisted features without a rewrite

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js (React, TypeScript)** | Single codebase for both frontend and backend API routes |
| Database | **Postgres via Supabase** | Cloud-hosted, real Postgres — enables cross-device sync |
| Auth | **Supabase Auth** | Simple email/magic-link login; single real user account, but real auth (not hardcoded), to support sync securely |
| ORM | **Drizzle** (Prisma acceptable alternative) | Type-safe schema + queries between Next.js and Postgres |
| Data fetching/caching | **TanStack Query (React Query)** | Client-side caching/sync layer over the API |
| UI | **shadcn/ui + Tailwind CSS** | Component source is copied into the project (not a black-box package), easy for an agent to customize; built on accessible Radix primitives |
| CSV parsing | **PapaParse** | For the bulk import feature (§3) |
| Mobile access | **PWA** (web app manifest + service worker) | Installable on phone home screen, works reasonably offline, avoids building a separate native app |
| Hosting | **Vercel** (app) + **Supabase** (database) | Free-tier friendly, deploys from GitHub, standard for a portfolio project |

**Explicitly not used:** no separate/self-managed backend server, no native mobile app (React Native etc.) — the PWA approach covers mobile use without that overhead.

**Designed for future extension (not built now, but the stack should not block these later):**
- **Voice**: browser-native Web Speech API for basic TTS/pronunciation to start; a Next.js API route calling an external speech/TTS API if higher quality is needed later
- **AI features** (e.g. example-sentence generation, smarter review suggestions): a Next.js API route calling an LLM API; Supabase's Postgres supports the `pgvector` extension if semantic/embedding-based features are wanted later

---

## 3. Data Model

Modeled as Postgres tables (via Drizzle schema), scoped per user via `user_id` (from Supabase Auth) with Row Level Security so each account only sees its own data. In practice there's one real account, but the schema should be correct multi-tenant-safe design regardless.

### `words` table

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key, auto-generated |
| `user_id` | uuid | Foreign key → Supabase auth user; enforced via Row Level Security |
| `english` | text | Required. **Unique per user** (case-insensitive) — reject/warn on duplicate |
| `pinyin` | text | Required. Store with proper tone diacritics (e.g. `nǐ hǎo`), not numeral tone marks |
| `character` | text | Required. Simplified Chinese characters |
| `character_count` | integer | **Auto-derived** from length of `character` field at write time — never accepted as direct input |
| `category` | text | Single primary category, from a fixed/extensible list (see §4 below) |
| `tags` | text[] | Optional, freeform, multiple allowed |
| `notes` | text | Optional free text (e.g. usage notes, example sentences) |
| `date_added` | timestamptz | Auto-generated on creation, not editable |
| `date_modified` | timestamptz | Auto-updated on any edit |

### `word_stats` table (or columns on `words` — agent's choice, but keep logically separate)

| Field | Type | Notes |
|---|---|---|
| `word_id` | uuid | Foreign key → `words.id` |
| `times_reviewed` | integer | Incremented each time word appears in flip-card or matching practice |
| `times_correct` | integer | Incremented on correct match in matching game |
| `times_incorrect` | integer | Incremented on incorrect match attempt |
| `last_practiced` | timestamptz \| null | Updated on each practice session appearance |

**Categories** (seed list, should be editable/extensible in-app — either a fixed enum/table or free text with a suggested list in the UI):
pronouns, connectors, question words, nouns, countries, languages, verbs, occupations, family, adjectives, measure words, places, seasons, time words, weights and measures, greetings, food and drink, sports, home furnishings and rooms, travel, cooking and kitchen items, fruits, Beijing landmarks, miscellaneous

---

## 4. Feature 1: Word Bank (Add / View / Edit / Delete)

### Add Word (form)
- Fields in order: English → Pinyin → Character → Category (dropdown) → Tags (optional, multi) → Notes (optional)
- Validate: all three core fields required; warn on duplicate English entry (case-insensitive match) before saving, but allow user to override if they confirm (e.g. legitimately different senses of a word)
- On save: auto-generate `id`, `characterCount`, `dateAdded`, `dateModified`, and zeroed `stats`

### View / Browse
- List/grid view of all words, showing English word only by default
- Clicking a word opens a **flip card**: front shows English, back (on click/tap) shows Pinyin + Character
- Include a search bar (matches English, pinyin, or character) and filter controls (category, tag) in this view
- Support sorting by: date added, alphabetical (English), category

### Edit / Delete
- Every word entry editable and deletable from the browse view
- Editing updates `dateModified`; does not reset `stats`
- Deleting requires a confirmation step

### Export
- Export full word bank as JSON (backup/portability)

### Bulk Import (CSV / JSON)

Separate from the single-word form — supports adding many words at once from an externally generated file (e.g. a CSV or JSON export the user builds from their own records).

**Required columns/fields** (import fails/rejects the row if missing):
- `english`
- `pinyin`
- `character`

**Optional columns/fields** (used if present, defaulted if absent):
- `category` — if missing, default to `"miscellaneous"` (or leave uncategorized, flagged for the user to fix later)
- `tags` — if missing, default to empty array; if present as a delimited string (e.g. `"food;kitchen"`), split into an array
- `notes` — if missing, default to empty string

**Fields the import must NOT accept from the file** (always system-generated, even if a column with that name exists in the upload):
- `id`
- `characterCount` — always derived from `character` length, never taken from the file
- `dateModified`
- `stats.*` — always initialized to zero/null, never taken from the file

**Batch date handling:**
- All words in a single import batch share **one `dateAdded` timestamp** — the date/time of the import itself, not per-row dates, even if the source file contains its own date column (ignore any such column, or optionally store it as a note if present).

**Validation & duplicate handling:**
- Same duplicate check as the manual form: case-insensitive match against existing `english` entries.
- On duplicate found: don't silently overwrite. Either (a) skip the row and report it, or (b) show the user a review list of conflicts before commit — user's choice which behavior to implement, but silent overwrite is not acceptable.
- Before committing the batch, show a **preview/summary screen**: number of new words to be added, number of rows skipped (missing required fields or duplicates), and which optional fields were defaulted — so the user can confirm before the import is finalized.

**Format support:**
- CSV: first row as headers, matching the field names above (case-insensitive header matching is fine)
- JSON: array of objects with the same field names
- Agent may support either or both; CSV is the more likely use case given the stated workflow (exporting from a personal word bank/spreadsheet)

---

## 5. Feature 2: Flip-Card Review

- Grid or list of English words from the **currently selected practice set** (see §6 for selection logic)
- Tap/click a card → flips to reveal Pinyin (with correct tone marks) + Character
- Tap/click again → flips back
- No scoring in this mode — it's pure review, not testing
- Each card viewed increments `stats.timesReviewed` and updates `stats.lastPracticed`

---

## 6. Feature 3: Matching Game

### Setup
Before starting a round, user configures:
1. **Pairing mode** (single-select): English↔Pinyin, English↔Character, or Pinyin↔Character
2. **Word set** — drawn from the practice-set selector (§7)
3. **Round size** — number of pairs per round (e.g. default 6, adjustable, capped at a reasonable max like 10-12 for screen legibility)

### Gameplay
- Present two shuffled columns (or a grid) of the round's words in the two chosen representations
- User selects one item from each side to attempt a match
- Correct match: visually confirmed, pair removed/locked, `stats.timesCorrect` + `stats.timesReviewed` incremented for that word
- Incorrect match: visual feedback (shake/flash), `stats.timesIncorrect` incremented, both items remain available for retry
- Round complete when all pairs matched; show a summary (time taken, mistakes made)
- Update `stats.lastPracticed` for all words in the round

---

## 7. Practice Set Selector (used by both Flip-Card and Matching modes)

User can build a practice set using any **combination** of:
- **Random N words** — specify a count, drawn randomly from the full bank (or from other filters applied below)
- **By date added** — e.g. words added in the last N days, or a specific date range
- **By category/tag** — select one or more categories/tags
- **By character count** — e.g. only 1-character, only 2-character, only 3+ character words
- **By performance** *(optional/stretch)* — e.g. "words with accuracy below X%" or "words not practiced in last N days," to support spaced-repetition-style review of weak words

Filters should be combinable (AND logic) — e.g. "5 random words from the 'food and drink' category with 3 characters."

---

## 8. Non-Functional Requirements

- **Persistence & sync:** All word bank data and stats are stored in Postgres (Supabase) and must be identical/up to date whether accessed from laptop or phone
- **Auth:** Real login required (Supabase Auth, e.g. email magic-link) — one real account for the app owner, but the app should not skip auth just because it's single-user, since that's what enables safe sync
- **Responsive & installable:** Usable on both desktop and mobile screen sizes; installable as a PWA on a phone home screen
- **Tone accuracy:** Pinyin must support and correctly render tone diacritics (ā á ǎ à etc.), not numeral notation, in both storage and display
- **No data loss:** Editing/deleting should require confirmation for destructive actions; export/backup should be easily accessible
- **Extensibility:** Code structured so a future voice feature (Web Speech API or external TTS) and AI feature (LLM API call from a Next.js route) can be added without restructuring the data model or app architecture

---

## 9. Open Decisions (resolve before or during build)

1. **Initial data:** Start empty and add words manually through the form, or seed/import an existing word bank via the bulk CSV/JSON import (§4)?
2. **Weak-word tracking:** Include the performance-based filter in §7 (accuracy tracking, "most missed words") now, or defer as a v2 feature?
3. **ORM choice:** Drizzle vs. Prisma — either is acceptable; agent should pick one and note why if it has a preference for this project's shape.
4. ~~Tech stack~~ — **Resolved**, see §2.

---

## 10. Explicitly Out of Scope (for this version)

- Audio/pronunciation playback and voice input (planned as a **future** addition — see §2 — not part of this build)
- AI-assisted features like example-sentence generation (also future, see §2)
- True multi-user support (multiple distinct accounts with separate data) — auth exists for sync purposes, but building out invite/multi-account flows is not in scope
- Native mobile app (iOS/Android app store builds) — PWA covers mobile use for now
- Stroke-order writing practice
- Sentence-level or grammar practice (this app is vocabulary-only)
