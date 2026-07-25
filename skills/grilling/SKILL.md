---
name: grilling
description: Grill the user one decision at a time to stress-test a plan, design, or idea before action. Use when the user asks to be grilled, wants assumptions challenged, or needs unresolved decisions surfaced before implementation.
---

# Grilling

Interview the user relentlessly until both sides share the same understanding.
Walk the decision tree one branch at a time, resolving dependencies between
decisions in order.

For each question:

- ask only one question;
- provide a recommended answer and its main trade-off;
- wait for the user's answer before continuing.

If a fact can be discovered from the environment, repository, or available
tools, look it up instead of asking. Decisions remain with the user: present
each material choice and wait for their answer.

Do not act on the plan during grilling. Do not edit files, implement, publish,
or invoke a downstream workflow.

When the user confirms shared understanding, return a concise handoff containing:

- objective;
- confirmed decisions;
- constraints and explicit exclusions;
- observable success criteria;
- unresolved questions, if any.

Then stop. The user chooses whether and when to invoke the next skill.

Adapted from Matt Pocock's
[grilling](https://github.com/mattpocock/skills/tree/main/skills/productivity/grilling)
skill.
