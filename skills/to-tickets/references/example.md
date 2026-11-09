# Example: KanaMaster tournaments

For the Epic "Let players run KanaMaster tournaments", a reasonable board is:

| Card | Vertical slice | Mock-first boundary | Depends on |
| --- | --- | --- | --- |
| C1 | A player sees an upcoming individual tournament and its time CTA, then joins before the start time. | Use fixture tournament and join result; defer live scheduling service. | None |
| C2 | A player chooses a partner and both see a pending partner-tournament entry. | Use fixture partner availability and approval result; defer invitation delivery. | C1 |
| C3 | After a completed tournament, a player sees the leaderboard and their own placement. | Use fixture scores and ranking calculation contract; defer live score ingestion. | C1 |

An acceptance criterion for C1: "Given an upcoming individual tournament, the
eligible player sees its local start time and a Join CTA; after joining, the CTA
changes to Joined; after the start time, joining is unavailable with a clear
reason." If timezone display or late-join policy is unconfirmed, record it as an
open question instead of guessing.

Technical-layer cards such as "build leaderboard API" or "create tournament
components" are the wrong shape: each card names the smallest complete
behaviour, such as "a signed-in competitor can join an individual tournament
before its start time and sees their ranking after a submitted result."
