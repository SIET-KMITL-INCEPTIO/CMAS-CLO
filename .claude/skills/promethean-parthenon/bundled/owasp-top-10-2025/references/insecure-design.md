name: insecure-design description: > Use when the user asks about threat modeling, secure design principles, security architecture, business logic flaws, abuse cases, anti-bot design, rate limiting by design, secure SDLC, security requirements, misuse-case analysis, or design flaws that cannot be fixed by patching code alone. Trigger when a system is missing a security control by design rather than by a coding mistake, or when discussing how to embed security earlier in the development lifecycle. Do NOT use for implementation-level bugs — use the relevant skill (injection, authentication-failures, etc.) for those. license: Apache-2.0 metadata: author: example-org version: "1.1" owasp_id: A06:2025 last_updated: "2025-01-01"

---

# A06:2025 Insecure Design

## Description

Insecure design is a broad category representing different weaknesses, expressed as "missing or ineffective control design." Insecure design is not the source for all other Top Ten risk categories. Note that there is a difference between insecure design and insecure implementation. We differentiate between design flaws and implementation defects for a reason — they have different root causes, take place at different times in the development process, and have different remediations. A secure design can still have implementation defects leading to vulnerabilities that may be exploited. An insecure design cannot be fixed by a perfect implementation as the needed security controls were never created to defend against specific attacks. One of the factors that contributes to insecure design is the lack of business risk profiling inherent in the software or system being developed, and thus the failure to determine what level of security design is required.

## Example Attack Scenarios

**Scenario #1:** A credential recovery workflow might include "questions and answers," which is prohibited by NIST 800-63b, the OWASP ASVS, and the OWASP Top 10. Questions and answers cannot be trusted as evidence of identity, as more than one person can know the answers. Such functionality should be removed and replaced with a more secure design.

**Scenario #2:** A cinema chain allows group booking discounts and has a maximum of fifteen attendees before requiring a deposit. Attackers could threat model this flow and test if they can find an attack vector in the business logic of the application, e.g. booking six hundred seats across all cinemas at once in a few requests, causing a massive loss of income.

**Scenario #3:** A retail chain's e-commerce website does not have protection against bots run by scalpers buying high-end video cards to resell on auction websites. This creates terrible publicity for the video card makers and retail chain owners. Careful anti-bot design and domain logic rules, such as limiting purchases made within a few seconds of availability, might identify inauthentic purchases and reject such transactions.

## How to Prevent

1. Establish and use a secure development lifecycle with AppSec professionals to help evaluate and design security and privacy-related controls.
2. Establish and use a library of secure design patterns or paved-road components.
3. Use threat modeling for critical parts of the application such as authentication, access control, business logic, and key flows.
4. Use threat modeling as an educational tool to generate a security mindset.
5. Integrate security language and controls into user stories.
6. Integrate plausibility checks at each tier of your application (from frontend to backend).
7. Write unit and integration tests to validate that all critical flows are resistant to the threat model. Compile use-cases _and_ misuse-cases for each tier of your application.
8. Segregate tier layers on the system and network layers, depending on the exposure and protection needs.
9. Segregate tenants robustly by design throughout all tiers.