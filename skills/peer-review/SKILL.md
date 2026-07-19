---
name: peer-review
description: >
  Quarterly peer review assistant for Lattice. Use this skill whenever the user mentions
  peer review, quarterly review, Lattice review, writing reviews for colleagues, or
  filling in performance review forms. This skill guides the user through reviewing
  each incomplete candidate by interviewing them about each topic, then polishes their
  raw thoughts into professional review comments, and presents a final summary.
  Trigger on: "peer review", "quarterly review", "lattice review",
  "help me write reviews", "fill in my peer reviews", "performance review".
---

# Peer Review Skill

You are helping the user complete their quarterly peer reviews on Lattice. You will:
1. Read the review form structure from the Lattice page
2. Find which candidates still need reviews
3. Interview the user about each candidate
4. Polish their raw answers into professional written comments
5. Show a final summary

## Review Form Structure

Each peer review on Lattice has these sections:

| Section | Type | Notes |
|---|---|---|
| Proximity | Select one | Never / Almost Never / Sometimes / Frequently / Daily |
| Business Impact | Score 1–5 + optional comment | Customer focus, outcomes, quality |
| Agency | Score 1–5 + optional comment | Ownership, speed, initiative, innovation |
| Teamwork | Score 1–5 + optional comment | Collaboration, communication, morale |
| Manager Score | Score 1–5 + optional comment | Only fill if the reviewee is a manager |
| Additional Feedback | Optional freeform text | Use if there's anything not covered above |

**Default rule**: If the user skips a question or doesn't answer, assume score = 3 and no comment.

## Step 1: Get the Peer Reviews Page

If the user hasn't provided URLs, ask for the peer reviews list URL (e.g. `https://sportygroup.latticehq.com/reviews/.../participant/peer-reviews`).

Navigate to the page using the browser tool and identify all candidates. Look for candidates whose status is **"Continue review"** (Draft) or **"Write review"** (Not started) — these are the ones that need to be completed. Skip candidates marked **"Completed"**.

Tell the user which candidates you found that still need reviews, and confirm before proceeding.

## Step 2: Interview the User — One Candidate at a Time

For each incomplete candidate, ask all questions in a single message to keep things efficient. Use this format:

---
**Reviewing [Name]**

1. How closely did you work with [Name] this quarter? *(Never / Almost Never / Sometimes / Frequently / Daily)*
2. **Business Impact** — How customer-focused, outcome-driven, and quality-conscious were they? *(score 1–5, any thoughts)*
3. **Agency** — Did they take ownership, deliver efficiently, show initiative? *(score 1–5, any thoughts)*
4. **Teamwork** — Did they collaborate well, communicate clearly, boost the team? *(score 1–5, any thoughts)*
5. Is [Name] a manager? If yes, how would you rate their **Manager Score**? *(score 1–5, any thoughts)*
6. Any **Additional Feedback** not covered above? *(optional)*

*Tip: Skip any question to default to score 3. You can answer all in one go.*

---

### Handling answers

- If the user gives a score and raw thoughts, polish the thoughts (see below)
- If the user only gives a score, record it with no comment
- If the user skips entirely, use score = 3, no comment
- If the candidate is not a manager, skip the Manager Score section entirely (don't fill it in at all)
- Numbers like "1." or "2." in the user's reply map to your questions in order

## Step 3: Polish the Comments

Transform the user's casual, raw thoughts into professional review language. Keep these principles:

- **Preserve the substance** — don't invent achievements or exaggerate
- **Fix grammar and flow** — correct typos, restructure sentences naturally
- **Stay warm but professional** — avoid overly formal or cold language
- **Be specific** — keep concrete examples the user mentioned, don't generalize them away
- **Keep it concise** — 2–4 sentences per comment is ideal

**Example:**
- Raw: *"she spends lot time to coordinate resources for RD could continue their work smoothly without thinking what might need to worry about, at the same time she's not only receiving but willing to learn some technical aspect"*
- Polished: *"She invests significant effort in coordinating resources so the engineering team can maintain focus without having to worry about logistics or blockers. What stands out is that she actively seeks to understand the technical aspects of the domain, making her collaboration more thoughtful and effective."*

## Step 4: Present and Confirm Each Review

After polishing, show the full review for that candidate and ask: "Does this look good? Any changes before we move on to [next candidate]?"

Wait for the user to confirm before moving to the next candidate. Make any edits they request.

Format each review like this:

---
**[Name] — Q[N] [Year] Peer Review**

- **Proximity:** [answer]
- **Business Impact:** [score] *(+ polished comment if any)*
- **Agency:** [score] *(+ polished comment if any)*
- **Teamwork:** [score] *(+ polished comment if any)*
- **Manager Score:** [score or N/A] *(+ polished comment if any)*
- **Additional Feedback:** [text or none]

---

## Step 5: Final Summary

Once all candidates are done, show a summary table:

| Candidate | Proximity | Business Impact | Agency | Teamwork | Manager Score |
|---|---|---|---|---|---|
| Name | Daily | 4 | 3 | 4 | N/A |

Remind the user that the comments are ready and they can now fill them into Lattice themselves.
