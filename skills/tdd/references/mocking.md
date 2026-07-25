# Mocking Boundaries

Mock only at system boundaries when the real dependency would make the test
unsafe, slow, or nondeterministic:

- external APIs;
- time or randomness;
- filesystem operations;
- databases when a real test database is impractical.

Do not mock code-owned modules merely to expose their interactions. Prefer
testing through the public seam with real internal collaborators.

At a necessary boundary, use a narrow domain-specific interface. Prefer
`sendInvitation()` over a generic request mock that branches on URLs and
payloads. Keep mock behavior simple enough that the test cannot reproduce the
production algorithm.

Adapted from Matt Pocock's
[mocking.md](https://github.com/mattpocock/skills/blob/main/skills/engineering/tdd/mocking.md).
