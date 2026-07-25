# Good Behavioral Tests

Prefer tests that:

- exercise a public interface;
- describe behavior a user or caller cares about;
- survive internal refactoring;
- use expected values independent from the production algorithm;
- fail when the required behavior is absent.

Avoid tests that:

- call private methods or inspect internal state;
- assert internal collaborator call order or counts;
- verify through a side channel instead of the public interface;
- calculate the expected value with the same logic as the implementation;
- use broad snapshots where a specific behavioral assertion is clearer.

Work vertically: one test, one minimal implementation, then the next behavior.
Do not write the whole test suite against an imagined implementation first.

Adapted from Matt Pocock's
[tests.md](https://github.com/mattpocock/skills/blob/main/skills/engineering/tdd/tests.md).
