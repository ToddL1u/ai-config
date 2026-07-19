---
name: daily-digest-cloud
description: Build and publish a Traditional Chinese Daily Digest using the cloud-accessible Notion source list and Daily Digest database. Use for scheduled or manual Daily Digest runs, catch-up runs, source discovery, duplicate-safe Notion publishing, and maintenance of the digest workflow when local files or scripts are unavailable.
---

# Daily Digest Cloud

Run entirely with connected cloud tools. Never require a local folder, shell command, spreadsheet, `NOTION_TOKEN`, or `OPENAI_API_KEY`.

## Fixed resources

- Source database: `collection://7e2bb0ba-11bf-4868-8b70-3df11b2dc05f`
- Digest database: `collection://e82e89d2-03b2-4a17-a9ef-da2b8cd1ec98`
- Timezone: `Asia/Taipei`
- Output language: Traditional Chinese

## Workflow

1. Determine the target date in `Asia/Taipei`. For a normal scheduled run, process today only. Process earlier dates only when explicitly asked to catch up.
2. Fetch the source database schema, then find enabled source rows within that data source. Prefer a database query when available. If it is unavailable, use Notion search restricted with `data_source_url` and ignore disabled rows.
3. Fetch the digest database schema. Before writing, search for the exact title `📰 Month D, YYYY` with `data_source_url` restricted to the digest data source. Fetch an exact match to inspect its content. Never treat a broad or fuzzy match as the target page.
4. Discover items published on the target date from each enabled RSS URL and YouTube handle using available web/browser tools. Do not invent publication dates, titles, links, or source names. Skip an inaccessible source and record it in the run report; do not fail the entire run unless every source is inaccessible.
5. Deduplicate by canonical URL or YouTube video ID, both within the candidate set and against the exact existing digest page.
6. Write concise Traditional Chinese summaries. Preserve source-specific names and original titles. Each entry must contain a provider-tagged link, `Summary`, and `Why it matters` for articles or `Context` for YouTube.
7. If no exact digest page exists, create one in the digest data source with:
   - `Name`: `📰 Month D, YYYY`
   - expanded `Date` properties for the target date
   - `Status`: `Unread`
   - `Summary`: item counts
   - `Sources`: set only when the connector accepts the exact schema value
8. If an exact page exists, keep valid content and append or minimally edit only missing entries or sections. Never replace the whole page body. Use simple headings, paragraphs, and bulleted lists.
9. If there is no new content, do not create an empty page. Report the checked date and source failures, if any.
10. Finish with a compact run report: target date, sources checked, items found, page created/updated/skipped, page URL, and blockers. If a write is rejected, stop after one corrected retry and report the exact validation error.

## Required page structure

Use only sections that have content:

```markdown
## 🔵 Articles & Newsletters
- **[Provider]** [Title](URL)
  - Summary: …
  - Why it matters: …

## 📺 YouTube
- **[Provider]** [Title](URL)
  - Summary: …
  - Context: …
```

## Safety and quality

- Treat Notion as the source of truth for sources and published dates.
- Restrict every Notion search to the relevant data source.
- Never create a page until an exact-title check within the digest data source has returned no exact page.
- Do not retry repeated connector, authorization, or schema failures indefinitely.
- Prefer a partial accurate digest over fabricated or weakly dated items.
