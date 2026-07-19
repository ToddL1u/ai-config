---
name: notion-add
description: Use when the user wants to add content to Notion, create a new page in a database, update an existing page, or perform any Notion write action. Triggers on "add to notion", "create page in", "update notion", "add to my wiki", "save to notion".
---

# Notion Add

Perform a Notion write action — create a page, add content, or update an existing entry.

## Workflow

1. **Parse the request**: From `$ARGUMENTS`, identify:
   - What content to add (topic, body, notes)
   - Where to add it (page name, database name, or "let me find it")

2. **Check capability**: Inspect the available tools for an authenticated Notion
   connector. If none exists, explain that Notion access is required and stop
   without attempting a write.

3. **Find the target**: Use the connector's search capability to locate the
   destination page or database by name.

4. **Fetch the schema**: Fetch the selected result to get:
   - Database properties and allowed values (Category, Tag, etc.)
   - Existing structure so new content fits in

5. **Create or update** using the connector's page creation or update capability:
   - New entry in a database → create with the selected database or data-source identifier
   - New subpage under a page → create with the selected parent page identifier
   - Update existing page → update the fetched page

6. **Confirm**: Return the Notion URL of the created/updated page.

## Guidelines

- Always fetch the target before writing — never guess property names or allowed values
- Match Category/Tag/Familiarity to existing schema options exactly
- Don't include the page title in the content body (Notion renders it separately)
- **Icon priority**: Always prefer a real logo over an emoji
  1. **Logo URL** — search for an official SVG/PNG logo from a reliable CDN (e.g. `https://cdn.simpleicons.org/<name>`, `https://static-00.iconduck.com`, or the project's own site). Use the direct image URL as the icon.
  2. **Emoji** — fallback only if no suitable logo is found

## Examples

- Add a page about Redis caching to Engineering Wiki.
- Create a new project called "AI dashboard" in PROJECTS.
- Update my FastAPI page with notes on dependency injection.
