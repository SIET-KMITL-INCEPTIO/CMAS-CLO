# Worked Example: "Build a password reset system"

The whole method on one ask. Note how much of the final brief is *not* present in the original sentence — and how all of it would otherwise have been decided by the agent, silently.

---

## Step 1 — Frame

Answering Q1–Q4 from the request exactly as given:

| | First-pass answer | Verdict |
| --- | --- | --- |
| What | "A password reset system." | Names a folder, not a behavior. |
| For whom | "Users." | Which users? Which excluded? |
| Limitations | *(none stated)* | The entire security surface is unspecified. |
| Proof | *(none stated)* | Nothing to check against. |

This is the normal starting state. Nothing is wrong with the request — it is what a request looks like. The work is what comes next.

---

## Step 2 — Interrogate

Running the banks from [interrogation](interrogation.md). Each answer is marked **[decided]** — resolvable by a careful engineer, so decided and recorded — or **[ask]** — a real product trade-off.

**Bank 1, lifetime and reuse.** *The questions from the source note: how long does the token last, can it be reused, is there a rate limit, what are the possible cases?*

- How long is the link valid? **[decided]** 30 minutes. Long enough to find the email, short enough that a leaked inbox ages out.
- Can it be used twice? **[decided]** No. Consumed on successful password change.
- Requesting a second link while the first is alive? **[decided]** The new one invalidates the old. Otherwise two live links double the attack surface for no user benefit.
- Stored form? **[decided]** Store a hash of the token; the raw value exists only in the email. A leaked database must not yield working reset links.
- Where does the token travel? **[decided]** Query string in the emailed URL — so it must never be logged, and the reset page must not forward it in a Referer to third-party scripts.

**Bank 2, volume and abuse.**

- Rate limit? **[decided]** 3 requests per email address per hour, and a separate per-IP cap. Each request costs an email send and puts mail in someone else's inbox.
- Does the response reveal whether the account exists? **[decided]** No — identical response body for known and unknown addresses. This is the enumeration case, and it is the one most often missed.
- Response *timing* leak? **[decided]** Do the work asynchronously so known and unknown paths return in comparable time.

**Bank 3, identity and permission.**

- Who may request it? **[decided]** Anyone with an email address — it is an unauthenticated endpoint by nature.
- Deleted or suspended account? **[decided]** Same generic response, no email sent.

**Bank 4, state and concurrency.**

- Link clicked twice in quick succession, two tabs? **[decided]** First submission wins; the second gets "this link has already been used."

**Bank 5, failure and recovery.**

- Mail provider down? **[decided]** The token is issued and the send is retried; the user sees the same generic response either way. Failures alert operators, since a silent mail outage looks exactly like normal use from the outside.

**Bank 6 / 7.**

- Does a successful reset log out the user's other sessions? **[ask]** — a genuine trade-off: safer if the reset was triggered by a compromise, annoying if the user simply forgot their password. Product call.
- Password policy? **[ask]** — must match whatever signup already enforces; needs a look at the existing rule rather than a new invention.

---

## Step 3 — The brief

```markdown
# Brief: Let a user regain account access without knowing their current password

## What
A user who cannot log in receives a one-time email link that lets them set a new password.

## Who
For: signed-up end users who lost access to their own account.
Not for: admins (separate support-console path); not a way for anyone to discover
whether an email is registered.
Scale: low volume — hundreds/day at current size.

## Rules
R1. Reset token is valid 30 minutes from issue.
R2. Token is single-use; consumed on successful password change.
R3. Issuing a new token invalidates any outstanding token for that account.
R4. Only a hash of the token is stored; the raw value exists only in the email.
R5. Max 3 requests per email address per hour, plus a per-IP cap.
R6. The request endpoint returns an identical response for known and unknown
    addresses, in comparable time.
R7. Mail send failures are retried and alert operators; the user-facing response
    is unchanged.
R8. Concurrent submissions of the same token: the first succeeds, the rest are
    rejected as already used.

## Must never
N1. A response, error, or timing difference reveals whether an account exists.
N2. A raw token appears in application logs, analytics, or a third-party Referer.
N3. An expired, consumed, or superseded token can change a password.
N4. A password change succeeds without the new password meeting the signup policy.

## Out of scope
- Password change while logged in (separate, existing flow).
- Account recovery when the user has lost the email address itself.
- Second-factor reset or recovery codes.

## Assumptions
A1. Email is the only channel; no SMS.
A2. The existing transactional mail provider is used as-is.

## Open questions
Q1. Does a successful reset invalidate the user's other active sessions?
Q2. Which password policy applies — confirm it matches signup exactly.

## Proof
P1. Happy path: request → email → link → new password → login works.
P2. Token older than 30 minutes is rejected. (R1, N3)
P3. Token reused after a successful change is rejected. (R2, N3)
P4. After issuing a second token, the first is rejected. (R3, N3)
P5. Stored token value does not equal the emailed value. (R4)
P6. 4th request within an hour is limited; no 4th email is sent. (R5)
P7. Unknown address returns byte-identical response to a known one, within a
    comparable time band. (R6, N1)
P8. Two concurrent submissions of one token: exactly one succeeds. (R8)
P9. Log scan over a full reset run contains no raw token. (N2)
P10. Password below the signup policy is rejected at reset. (N4)

## Environment
Existing PERN stack; reuses the current mail provider and password hashing.
Needs: one new table (or column set) for reset tokens; no new secrets.
```

---

## Step 4 — What changed

The original ask contained one of these ten proof lines: none. An agent handed the raw sentence would still have produced a working password reset — with some token lifetime, some reuse behavior, some enumeration characteristic. Each of those is a coin flip you did not know was being flipped, and P7 and P9 in particular describe defects that ship silently and are found by someone else.

Elapsed cost of the above: minutes. It is the cheapest step in the entire build, and the only one that decides whether the rest is aimed at the right target.
