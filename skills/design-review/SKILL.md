---
name: design-review
description: Use when the user wants to practice system design, review an architecture, prepare for a technical interview, or discuss scalability trade-offs. Triggers on "system design", "design review", "architecture review", "interview practice", "design a system".
---

# Design Review

Run an interactive system design session. Delegate to a system-design specialist
when the current agent supports subagents; otherwise run the same workflow
directly.

## Workflow

1. **Choose mode**: Ask the user what they want:
   - **Interview practice**: Full mock interview with scoring
   - **Architecture review**: Critique a specific design they propose
   - **Exploration**: Open-ended discussion of a system's trade-offs
2. **Run the review**: Delegate with the chosen mode and topic when a suitable
   subagent is available. Otherwise act as the system-design coach directly.
3. **After the session**: Ensure the result provides:
   - Structured scorecard (for interview mode)
   - Specific strengths and areas to improve
   - Study recommendations for weak areas

## Suggested Topics
- URL shortener, chat system, notification service, rate limiter
- Or bring your own: "design review for [your system]"
