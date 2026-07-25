# Risk checks

Repository instructions are authoritative. Use this list as a safety baseline
and apply only checks relevant to the frozen change.

## Blocking candidates

- SQL or command injection, unsafe HTML, authorization bypass, or unvalidated
  external and LLM-generated values crossing a trust boundary.
- Non-atomic read-check-write sequences, find-or-create races without a unique
  constraint, or unsafe state transitions.
- Direct data writes that bypass validation or row-level security.
- New enum, status, schema, or public-interface values missing from required
  consumers, allowlists, serializers, or exhaustive branches.
- Incorrect null, empty, error, boundary, or rapid-interaction behavior that
  causes a concrete failure.
- Tests that fail, assert the wrong behavior, rely on shared mutable state, or
  omit a high-risk changed path such as authentication, payment, or mutation.
- Material violations of applicable repository instructions.

## Advisory candidates

- Duplicated logic, long functions, deep conditionals, unclear naming, feature
  envy, inappropriate coupling, or comments that contradict the code.
- N+1 queries, request waterfalls, avoidable quadratic lookups, heavy production
  dependencies, oversized assets, or render-blocking resources.
- Fragile time-based tests, nondeterministic data, or weak negative-path
  assertions.
- Missing focus states, semantics, contrast, interaction states, responsive
  behavior, or stable layout dimensions in changed interfaces.
- Production debug logging, unjustified broad types, stale TODOs, or dead code
  introduced by the change.

Promote an advisory candidate to blocking only when repository rules require it
or evidence shows a concrete correctness, safety, or release risk.

## Suppress

- Redundancy that improves readability.
- Consistency-only preferences without functional impact.
- Requests for explanatory comments where clearer code is sufficient.
- Development-only dependencies without demonstrated production impact.
- Intentional dynamic imports and small utilities.
- Hypothetical issues unsupported by the supplied diff or surrounding code.
