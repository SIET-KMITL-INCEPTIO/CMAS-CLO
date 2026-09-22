name: broken-access-control description: > Use when the user asks about authorization, access control, privilege escalation, IDOR (insecure direct object reference), horizontal/vertical privilege escalation, missing authorization checks, CORS misconfiguration, directory traversal, or JWT scope enforcement. Trigger when reviewing API endpoints, route guards, or any code that fetches resources using user-supplied IDs. Do NOT use for authentication (login, session) questions — use authentication-failures skill instead. license: Apache-2.0 metadata: author: example-org version: "1.1" owasp_id: A01:2025 last_updated: "2025-01-01"

---

# A01:2025 Broken Access Control

## Description

Access control enforces policy such that users cannot act outside of their intended permissions. Failures typically lead to unauthorized information disclosure, modification or destruction of all data, or performing a business function outside the user's limits.

## Example Attack Scenarios

**Scenario #1:** The application uses unverified data in an SQL call that is accessing account information:

```java
pstmt.setString(1, request.getParameter("acct"));
ResultSet results = pstmt.executeQuery();
```

An attacker can simply modify the browser's `acct` parameter to send any desired account number. If not correctly verified, the attacker can access any user's account.

```
https://example.com/app/accountInfo?acct=notmyacct
```

**Scenario #2:** An attacker simply forces browsers to target URLs. Admin rights are required for access to the admin page.

```
https://example.com/app/getappInfo
https://example.com/app/admin_getappInfo
```

If an unauthenticated user can access either page, it's a flaw. If a non-admin can access the admin page, this is a flaw.

**Scenario #3:** An application puts all of their access control in their front-end. While the attacker cannot get to `https://example.com/app/admin_getappInfo` due to JavaScript code running in the browser, they can simply execute:

```bash
$ curl https://example.com/app/admin_getappInfo
```

from the command line.

## How to Address It

Bad: Direct object reference without authorization

```javascript
app.get('/api/user/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user);
});
```

Good: Always verify authorization

```javascript
app.get('/api/user/:id', authenticate, async (req, res) => {
  const requestedId = req.params.id;
  const currentUserId = req.user.id;

  // Check if user can access this resource
  if (requestedId !== currentUserId && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const user = await User.findById(requestedId);
  res.json(user);
});
```

## How to Prevent

1. Except for public resources, deny by default.
2. Implement access control mechanisms once and reuse them throughout the application, including minimizing Cross-Origin Resource Sharing (CORS) usage.
3. Model access controls should enforce record ownership rather than allowing users to create, read, update, or delete any record.
4. Unique application business limit requirements should be enforced by domain models.
5. Disable web server directory listing and ensure file metadata (e.g., `.git`) and backup files are not present within web roots.
6. Log access control failures, alert admins when appropriate (e.g., repeated failures).
7. Implement rate limits on API and controller access to minimize the harm from automated attack tooling.
8. Stateful session identifiers should be invalidated on the server after logout. Stateless JWT tokens should be short-lived to minimize the window of opportunity for an attacker. For longer-lived JWTs, consider using refresh tokens and following OAuth standards to revoke access.