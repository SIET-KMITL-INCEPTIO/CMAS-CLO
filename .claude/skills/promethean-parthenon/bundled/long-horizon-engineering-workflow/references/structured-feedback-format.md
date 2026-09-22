# Structured Feedback Format

Unstructured feedback — "it's broken," "doesn't work," "wrong" — isn't actionable. It costs a round trip to even find out what happened, and it creates friction that pure ambiguity doesn't need to create. Every bug report or piece of feedback, whether it comes from the user or whether you're writing one up yourself after testing, should take this shape:

```
TITLE:         [Short, specific description]
ENVIRONMENT:   [Browser / OS / Device / URL / Stage or Production]
USER ROLE:     [Who was performing the action]
STEPS TO REPRODUCE:
  1. ...
  2. ...
  3. ...
EXPECTED RESULT:  [What should happen, based on use case or acceptance criteria]
ACTUAL RESULT:    [What actually happened]
SCREENSHOT/LOG:   [Attached, if available]
SEVERITY:         [Critical / High / Medium / Low]
TICKET REFERENCE: [Link to the original requirement, if one exists]
```

## How to use this during a long build

- If the user reports something vague mid-session, fill in as much of this as you can infer from context, then ask only for the gaps — don't bounce the whole template back at them as homework.
- If you're the one finding a bug while testing your own work (Stage 4), write it up in this shape before fixing it. It forces you to state the expected result against the actual acceptance criteria rather than patching toward a vague memory of "what it should do."
- Severity should track real impact, not how annoying the bug is to fix. A typo in a label is Low even if it's been bugging you; a flow that loses user data on failure is Critical even if the fix is one line.

## Communicating around feedback, more broadly

- Report status in terms of outcomes, not activity: "the login flow is complete and tested," not "I'm working on the auth module."
- Surface a blocker the moment you hit it. A blocker mentioned at the end of a long session is a blocker that already cost the time it took to discover it.
- When a requirement is unclear mid-build, ask in writing and carry the answer forward in the conversation rather than relying on memory of a verbal aside.
- Don't say "done" when you mean "done assuming the happy path" or "done but untested." Say what's actually true.