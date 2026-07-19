---
name: english-learn
description: Analyze any English content URL (YouTube, BBC, articles, podcasts) for CEFR-level vocabulary and phrases, then save to Notion. Triggers on "english learn", "analyze english", "learn english from", "english vocab from".
---

# English Learn

Fetch any English content URL, analyze vocabulary and phrases by CEFR level with 繁體中文 translations, and save structured notes to a dedicated Notion database.

## Workflow

1. **Parse input**: From `$ARGUMENTS`, extract:
   - **URL** — the content link (YouTube, article, podcast page, etc.)
   - **Focus modifier** (optional) — e.g., `focus:business`, `focus:phrasal-verbs`, `focus:slang`, `focus:academic`
   - **Source type** detection:
     - `YouTube` — URL contains `youtube.com/watch`, `youtu.be`, or is a bare 11-char video ID
     - `Article` — news sites, blogs, Medium, etc.
     - `Podcast` — podcast platforms or pages with audio content
     - `Other` — anything else

2. **Check capabilities**: Require available web retrieval and an authenticated
   Notion connector. If either is missing, explain the missing dependency and
   stop before analysis or writing.

3. **Fetch content** using available web or browser capabilities. Adapt by source type:

   **YouTube:**

   > ⚠️ Known failures — do NOT attempt these:
   > - Fetching the YouTube watch page directly — returns mostly client configuration
   > - Unauthenticated transcript scraper sites — commonly return 403 or marketing pages
   > - Search API endpoints without configured credentials — return authorization failures

   **Step 3a — Get metadata (title + channel):**
   - Fetch `https://noembed.com/embed?url=https://www.youtube.com/watch?v=VIDEO_ID`
   - Extract `title` and `author_name` from the JSON response — this reliably returns both

   **Step 3b — Get transcript:**
   - Search the web for `"[video title]" transcript` using the title obtained from noembed
   - If a transcript page is found, fetch it and extract the full speech text
   - If no transcript found via search, proceed with description-only (note this limitation to the user)

   **Article / Podcast / Other:**
   - Fetch the URL directly
   - Extract: title, author/publication, and body text

4. **Analyze English**: Using your CEFR knowledge, produce:

   - **Overall CEFR level** (A1–C2) with a one-sentence justification based on sentence complexity, vocabulary frequency, idiomatic density, and topic specificity
   - **15–30 vocabulary items and phrases**, each with:
     - CEFR level tag
     - Part of speech
     - English definition (concise)
     - 繁體中文 translation
     - Example sentence quoted from the content
   - **Selection criteria**: Skip ultra-common words (A1 unless the content is mostly A1). Prioritize phrasal verbs, idioms, collocations, and B1+ vocabulary. If a `focus:` modifier is provided, weight selection toward that category.
   - **5–8 key sentences** from the content suitable for shadowing or reading practice
   - **2–3 sentence summary** of the content
   - **Full original script** — always include the complete verbatim text in the Notion page under a "Full Original Script" section

5. **Find or create the Notion database** using the available connector:
   - Search for a database named **"English Learn"**, restricted to the user's
     workspace when the connector supports scoping.
   - If found, fetch it and use its actual database or data-source identifier.
   - If it is not found, ask the user to select a parent page, then create it
     with the connector's database-creation capability:
     - Title: "English Learn"
     - Properties:
       - `Title` (title) — content title
       - `CEFR Level` (select: A1, A2, B1, B2, C1, C2)
       - `Source` (select: YouTube, Article, Podcast, Other)
       - `Channel/Author` (rich_text)
       - `URL` (url)
       - `Focus` (rich_text)
       - `Date` (date)

6. **Create the Notion page** in the database from the previous step:

   **Properties:**
   - Title = content title
   - CEFR Level = overall level from analysis
   - Source = detected source type
   - Channel/Author = creator name
   - URL = original link
   - Focus = the focus modifier used, or leave empty
   - Date = today's date

   **Icon:** 🎬 (YouTube), 📰 (Article), 🎧 (Podcast), 📝 (Other)

   **Page content** (use enhanced markdown):
   ```
   ## Content Info
   - **Source:** YouTube / BBC News / Medium / ...
   - **Author/Channel:** ...
   - **Duration/Read time:** ... (if available)
   - **Overall CEFR Level:** B2 — Uses varied sentence structures with some idiomatic expressions
   - **Focus:** business (or "general" if none specified)

   ## Vocabulary & Phrases

   ### C1
   | Word/Phrase | Type | Definition | 中文 | Example |
   |---|---|---|---|---|
   | nuanced | adj | having subtle differences | 細膩的 | "It's a more nuanced approach..." |

   ### B2
   | Word/Phrase | Type | Definition | 中文 | Example |
   |---|---|---|---|---|
   | prevalent | adj | widespread, common | 普遍的 | "This trend is prevalent across..." |

   ## Key Sentences for Practice
   1. "..."
   2. "..."

   ## Full Original Script

   [complete verbatim transcript here]

   ## Summary
   ...
   ```

   - Only include CEFR level sections that have vocabulary items (skip empty levels)
   - Order CEFR sections from highest to lowest (C2 → A1)

7. **Confirm**: Tell the user:
   - The Notion page URL
   - Overall CEFR level
   - Top 3 most interesting vocabulary finds with their definitions and 中文 translations

## Guidelines

- Always retrieve the content before analyzing; never guess or fabricate it
- If content fetch fails entirely, tell the user and stop — do not create a Notion page with made-up content
- For very long content (long videos, lengthy articles), analyze the full content but note if only partial text was available
- Match Notion property values exactly to the schema (e.g., select options must match)
- Don't include the page title in the content body (Notion renders it separately)
- Use Traditional Chinese (繁體中文) for all translations, never Simplified

## Examples

```
https://www.youtube.com/watch?v=dQw4w9WgXcQ
https://www.bbc.com/news/world-europe-12345 focus:business
https://medium.com/@author/interesting-post focus:phrasal-verbs
https://youtu.be/abc123 focus:slang
https://www.ted.com/talks/some-talk focus:academic
```
