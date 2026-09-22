name: authentication-failures description: > Use when the user asks about login security, authentication bypass, MFA/2FA, session management, credential stuffing, brute force attacks, password hashing, password policies, JWT token handling, SSO/SLO, session fixation, or account takeover. Trigger when reviewing authentication code, login flows, session handling, or password storage. Do NOT use for authorization/access control decisions — use broken-access-control skill instead. license: Apache-2.0 metadata: author: example-org version: "1.1" owasp_id: A07:2025 last_updated: "2025-01-01"

---

# A07:2025 Authentication Failures

## Description

When an attacker is able to trick a system into recognizing an invalid or incorrect user as legitimate, this vulnerability is present. There may be authentication weaknesses if the application:

1. Permits automated attacks such as credential stuffing, where the attacker has a breached list of valid usernames and passwords. More recently this type of attack has been expanded to include hybrid password attacks (also known as password spray attacks), where the attacker uses variations or increments of spilled credentials to gain access, for instance trying Password1!, Password2!, Password3! and so on.
2. Permits brute force or other automated, scripted attacks that are not quickly blocked.
3. Permits default, weak, or well-known passwords, such as "Password1" or "admin" username with an "admin" password.
4. Allows users to create new accounts with already known-breached credentials.
5. Allows use of weak or ineffective credential recovery and forgot-password processes, such as "knowledge-based answers," which cannot be made safe.
6. Uses plain text, encrypted, or weakly hashed passwords data stores (see [A04:2025-Cryptographic Failures](https://owasp.org/Top10/2025/A04_2025-Cryptographic_Failures/)).
7. Has missing or ineffective multi-factor authentication.
8. Allows use of weak or ineffective fallbacks if multi-factor authentication is not available.
9. Exposes session identifier in the URL, a hidden field, or another insecure location that is accessible to the client.
10. Reuses the same session identifier after successful login.
11. Does not correctly invalidate user sessions or authentication tokens (mainly single sign-on (SSO) tokens) during logout or a period of inactivity.
12. Does not correctly assert the scope and intended audience of the provided credentials.

## Example Attack Scenarios

**Scenario #1:** Credential stuffing, the use of lists of known username and password combinations, is now a very common attack. More recently attackers have been found to "increment" or otherwise adjust passwords, based on common human behavior. For instance, changing `Winter2025` to `Winter2026`, or `ILoveMyDog6` to `ILoveMyDog7`. This adjusting of password attempts is called a hybrid credential stuffing attack or a password spray attack, and they can be even more effective than the traditional version. If an application does not implement defences against automated threats (brute force, scripts, or bots) or credential stuffing, the application can be used as a password oracle to determine if the credentials are valid and gain unauthorized access.

**Scenario #2:** Most successful authentication attacks occur due to the continued use of passwords as the sole authentication factor. Once considered best practices, password rotation and complexity requirements encourage users to both reuse passwords and use weak passwords. Organizations are recommended to stop these practices per NIST 800-63 and to enforce use of multi-factor authentication on all important systems.

**Scenario #3:** Application session timeouts aren't implemented correctly. A user uses a public computer to access an application and instead of selecting "logout," the user simply closes the browser tab and walks away. If a Single Sign-On (SSO) session cannot be closed by a Single Logout (SLO), logging out of one system may leave the user still authenticated to others. An attacker using the same browser can then access the victim's account.

## How to Prevent

1. Where possible, implement and enforce use of multi-factor authentication to prevent automated credential stuffing, brute force, and stolen credential reuse attacks.
2. Where possible, encourage and enable the use of password managers, to help users make better choices.
3. Do not ship or deploy with any default credentials, particularly for admin users.
4. Implement weak password checks, such as testing new or changed passwords against the top 10,000 worst passwords list.
5. During new account creation and password changes validate against lists of known breached credentials (e.g. using [haveibeenpwned.com](https://haveibeenpwned.com/)).
6. Align password length, complexity, and rotation policies with [NIST 800-63b Section 5.1.1](https://pages.nist.gov/800-63-3/sp800-63b.html) for Memorized Secrets or other modern, evidence-based password policies.
7. Do not force human beings to rotate passwords unless you suspect breach. If you suspect breach, force password resets immediately.
8. Ensure registration, credential recovery, and API pathways are hardened against account enumeration attacks by using the same messages for all outcomes (`"Invalid username or password."`).
9. Limit or increasingly delay failed login attempts but be careful not to create a denial of service scenario. Log all failures and alert administrators when credential stuffing, brute force, or other attacks are detected or suspected.
10. Use a server-side, secure, built-in session manager that generates a new random session ID with high entropy after login. Session identifiers should not be in the URL, be securely stored in a secure cookie, and invalidated after logout, idle, and absolute timeouts.
11. Ideally, use a premade, well-trusted system to handle authentication, identity, and session management. Transfer this risk whenever possible by buying and utilizing a hardened and well tested system.
12. Verify the intended use of provided credentials, e.g. for JWTs validate `aud`, `iss` claims and scopes.