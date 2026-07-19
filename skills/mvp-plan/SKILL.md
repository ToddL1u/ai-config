---
name: mvp-plan
description: Use when the user wants to turn an idea into an MVP plan, design an AI-powered product, scope a side project, evaluate whether to use AI for a feature, or plan a product build. Triggers on "MVP", "product idea", "build plan", "AI product", "scope this idea".
---

# MVP Plan

Turn a product idea into a concrete, phased build plan. Delegate to a product
planning specialist when subagents are available; otherwise perform the same
analysis directly.

## Workflow

1. **Gather the idea**: Ask the user for:
   - The product idea or feature (even if vague is fine)
   - Target user / who benefits
   - Preferred tech stack (or let the agent recommend)
   - Timeline constraints (if any)
2. **Build the plan**: Delegate to a suitable product-planning subagent when
   available, passing the full context. Otherwise continue directly.
3. **Ensure output includes**:
   - Problem statement and target user
   - AI value assessment (is AI actually needed?)
   - Technical architecture with model/API choices
   - MVP scope — what to build in phase 1, what to skip
   - Cost estimate at target scale
   - Next 3 concrete implementation steps
4. **Optionally**: If the user has an existing codebase, analyze it to identify integration points

## Output Format
Produce a structured product brief that can be saved as a specification.
