# Feature Standards

Apply these defaults after repository-specific instructions. Repository rules take precedence.

- Define observable acceptance criteria before editing.
- Understand the existing behavior and follow nearby implementation patterns.
- Make the smallest coherent change that satisfies the request.
- Preserve public behavior and compatibility unless the request explicitly changes them.
- Add or update tests for changed behavior; include failure and boundary cases when relevant.
- Use the narrowest relevant verification first, then run the broader project checks required for confidence.
- Keep unrelated refactors, formatting, dependency updates, and cleanup out of scope.
- Do not weaken tests, types, lint rules, or security controls to make verification pass.
- Record material decisions, failed approaches, blockers, and the next action in progress memory.
- Do not merge, deploy, publish, or make destructive changes without explicit authorization.
