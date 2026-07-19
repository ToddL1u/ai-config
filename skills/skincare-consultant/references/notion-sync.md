# Optional Notion sync

Use Notion only when the user requests it and the Notion connection is available. Keep the local Markdown files functional without Notion.

## Discover before mapping

1. Search for the user's skincare hub, inventory database, and routine page.
2. Fetch the database and its data-source schema.
3. Read representative product pages and the current routine.
4. Map existing properties by meaning; do not require exact names.
5. Preserve unknown fields, views, page sections, and user-authored notes.

Common semantic fields include:

| Meaning | Possible properties |
|---|---|
| Product identity | Product, Name, Brand |
| Inventory state | Have, Owned, Status, Finished |
| Purchase state | To Buy, Wishlist, Repurchase |
| Routine role | Category, Step, Use Time, Frequency |
| Product function | Main Function, Benefits, Concerns |
| Decision | Keep?, Verdict, Priority |
| Safety | Avoid With, Cautions, Reactions |
| Fit | Skin Fit, Suitability |
| Evidence | Source URL, Formula Region, Date Checked, Confidence |

If no suitable database exists, propose a schema before creating anything. Do not alter a database schema without explicit approval.

## Read and consistency checks

Before recommending or syncing:

- Compare owned/status properties with products named in the routine.
- Flag routine entries that refer to products no longer owned.
- Flag owned essentials missing from the routine and routine gaps such as absent sun protection when relevant.
- Check conflicting frequency, timing, verdict, and caution fields.
- Treat page-body notes and structured properties as potentially different snapshots; report the mismatch instead of silently choosing one.

## Preview and confirm

Show one preview containing:

- Pages or rows to create
- Properties to change, with old and new values
- Page sections to replace or append
- Routine changes and the reason for each
- Sensitive profile fields that would leave local storage

Ask for one explicit confirmation. Apply only confirmed changes. Never silently mark products owned, purchased, stopped, safe, or recommended.

## Verify after writing

Re-fetch the changed pages or rows. Confirm that the intended properties and content were saved and that unrelated content remains intact. Report any partial update or schema mismatch.

## Conflict policy

Local Markdown is canonical by default. If Notion changed since the last sync:

1. Show both values and timestamps when available.
2. Ask which value to keep.
3. Preserve history for reactions and routine changes.
4. Never resolve sensitive or safety-relevant conflicts automatically.
