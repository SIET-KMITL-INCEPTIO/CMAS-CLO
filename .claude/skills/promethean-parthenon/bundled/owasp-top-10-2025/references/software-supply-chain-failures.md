name: software-supply-chain-failures description: > Use when the user asks about third-party dependency vulnerabilities, transitive dependencies, SolarWinds-style supply chain attacks, malicious npm/PyPI packages, self-propagating package worms, CVE/NVD monitoring, SBOM generation, OWASP Dependency Track, Dependency Check, retire.js, staged rollouts, or canary deployments to limit blast radius of a compromised vendor. Trigger when reviewing dependency management practices, CI/CD toolchain security, or vendor risk for upstream software. Do NOT use for code signing or deserialization — use software-or-data-integrity-failures skill for those. license: Apache-2.0 metadata: author: example-org version: "1.1" owasp_id: A03:2025 last_updated: "2025-01-01"

---

# A03:2025 Software Supply Chain Failures

## Description

Software supply chain failures are breakdowns or other compromises in the process of building, distributing, or updating software. They are often caused by vulnerabilities or malicious changes in third-party code, tools, or other dependencies that the system relies on.

## Example Attack Scenarios

**Scenario #1:** A trusted vendor is compromised with malware, leading to your computer systems being compromised when you upgrade. The most famous example is the 2019 SolarWinds compromise that led to approximately 18,000 organizations being compromised. [(Read more)](https://www.npr.org/2021/04/16/985439655/a-worst-nightmare-cyberattack-the-untold-story-of-the-solarwinds-hack)

**Scenario #2:** A trusted vendor is compromised such that it behaves maliciously only under a specific condition. The 2025 Bybit theft of $1.5 billion was caused by [a supply chain attack in wallet software](https://www.sygnia.co/blog/sygnia-investigation-bybit-hack/) that only executed when the target wallet was being used.

**Scenario #3:** The [`Shai-Hulud` supply chain attack](https://www.cisa.gov/news-events/alerts/2025/09/23/widespread-supply-chain-compromise-impacting-npm-ecosystem) in 2025 was the first successful self-propagating npm worm. Attackers seeded malicious versions of popular packages, which used a post-install script to harvest and exfiltrate sensitive data to public GitHub repositories. The malware also detected npm tokens in the victim environment and automatically used them to push malicious versions of any accessible package. The worm reached over 500 package versions before being disrupted by npm.

**Scenario #4:** Components typically run with the same privileges as the application itself, so flaws in any component can result in serious impact. Examples include CVE-2017-5638, a Struts 2 remote code execution vulnerability blamed for significant breaches, and CVE-2021-44228 ("Log4Shell"), an Apache Log4j zero-day blamed for ransomware and cryptomining campaigns.

## How to Prevent

1. Centrally generate and manage the Software Bill of Materials (SBOM) of your entire software.
2. Track not just your direct dependencies, but their transitive dependencies, and so on.
3. Reduce attack surface by removing unused dependencies, unnecessary features, components, files, and documentation.
4. Continuously inventory the versions of both client-side and server-side components (e.g., frameworks, libraries) and their dependencies using tools like OWASP Dependency Track, OWASP Dependency Check, retire.js, etc.
5. Continuously monitor sources like Common Vulnerability and Exposures (CVE), National Vulnerability Database (NVD), and [Open Source Vulnerabilities (OSV)](https://osv.dev/) for vulnerabilities in the components you use. Use software composition analysis or security-focused SBOM tools to automate the process. Subscribe to alerts for security vulnerabilities related to components you use.
6. Only obtain components from official (trusted) sources over secure links. Prefer signed packages to reduce the chance of including a modified, malicious component (see [A08:2025-Software and Data Integrity Failures](https://owasp.org/Top10/2025/A08_2025-Software_or_Data_Integrity_Failures/)).
7. Deliberately choose which version of a dependency you use and upgrade only when there is a need.
8. Monitor for libraries and components that are unmaintained or do not create security patches for older versions. If patching is not possible, consider migrating to an alternative or deploying a virtual patch to monitor, detect, or protect against the discovered issue.
9. Update your CI/CD, IDE, and any other developer tooling regularly.
10. Avoid deploying updates to all systems simultaneously. Use staged rollouts or canary deployments to limit exposure in case a trusted vendor is compromised.