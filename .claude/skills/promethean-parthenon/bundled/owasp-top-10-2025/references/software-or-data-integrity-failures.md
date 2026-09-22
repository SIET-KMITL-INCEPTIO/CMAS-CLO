name: software-or-data-integrity-failures description: > Use when the user asks about insecure deserialization, unsigned firmware updates, auto-update integrity verification, digital signatures for software artifacts, CI/CD pipeline integrity, SBOM (Software Bill of Materials), code signing, Sigstore/Cosign, untrusted plugins or CDN scripts, or serialization attacks such as Java deserialization or pickle exploits. Trigger when reviewing code that deserializes untrusted data, or when designing a build and release pipeline that must resist tampering. Do NOT use for dependency-sourcing or supply chain management — use software-supply-chain-failures skill for those. license: Apache-2.0 metadata: author: example-org version: "1.1" owasp_id: A08:2025 last_updated: "2025-01-01"

---

# A08:2025 Software or Data Integrity Failures

## Description

Software and data integrity failures relate to code and infrastructure that does not protect against invalid or untrusted code or data being treated as trusted and valid. An example is where an application relies upon plugins, libraries, or modules from untrusted sources, repositories, and content delivery networks (CDNs). An insecure CI/CD pipeline without software integrity checks can introduce the potential for unauthorized access, insecure or malicious code, or system compromise. Another example is a CI/CD pipeline that pulls code or artifacts from untrusted places and/or doesn't verify them before use (by checking the signature or similar mechanism). Many applications also include auto-update functionality, where updates are downloaded without sufficient integrity verification and applied to the previously trusted application. Attackers could potentially upload their own updates to be distributed and run on all installations. Finally, where objects or data are encoded or serialized into a structure that an attacker can see and modify, they are vulnerable to insecure deserialization.

## Example Attack Scenarios

**Scenario #1 — Inclusion of Web Functionality from an Untrusted Source:** A company uses an external service provider to provide support functionality. For convenience, it has a DNS mapping for `myCompany.SupportProvider.com` to `support.myCompany.com`. This means that all cookies, including authentication cookies, set on the `myCompany.com` domain will now be sent to the support provider. Anyone with access to the support provider's infrastructure can steal the cookies of all users that have visited `support.myCompany.com` and perform a session hijacking attack.

**Scenario #2 — Update without Signing:** Many home routers, set-top boxes, and device firmware do not verify updates via signed firmware. Unsigned firmware is a growing target for attackers. In many cases there is no mechanism to remediate other than to fix in a future version and wait for previous versions to age out.

**Scenario #3 — Use of Package from an Untrusted Source:** A developer has trouble finding the updated version of a package they are looking for, so they download it from a website online rather than the regular, trusted package manager. The package is not signed, and thus there is no opportunity to ensure integrity. The package includes malicious code.

**Scenario #4 — Insecure Deserialization:** A React application calls a set of Spring Boot microservices. Being functional programmers, they serialize the user state and pass it back and forth with each request. An attacker notices the `rO0` Java object signature (in base64) and uses the [Java Deserialization Scanner](https://github.com/federicodotta/Java-Deserialization-Scanner) to gain remote code execution on the application server.

## How to Prevent

```yaml
# Secure CI/CD pipeline example (GitHub Actions)
name: Secure Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
      id-token: write # For signing

    steps:
      - uses: actions/checkout@v3

      - name: Build application
        run: npm run build

      - name: Install Cosign
        uses: sigstore/cosign-installer@main

      - name: Sign container image
        run: |
          cosign sign --key cosign.key \
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}

      - name: Generate SBOM
        run: |
          syft packages . -o spdx-json > sbom.json

      - name: Scan SBOM for vulnerabilities
        run: |
          grype sbom:sbom.json
```

## Rules

1. Use digital signatures or similar mechanisms to verify the software or data is from the expected source and has not been altered.
2. Ensure libraries and dependencies, such as npm or Maven, are only consuming trusted repositories. If you have a higher risk profile, consider hosting an internal known-good repository that is vetted.
3. Ensure that there is a review process for code and configuration changes to minimize the chance that malicious code or configuration could be introduced into your software pipeline.
4. Ensure that your CI/CD pipeline has proper segregation, configuration, and access control to ensure the integrity of the code flowing through the build and deploy processes.
5. Ensure that unsigned or unencrypted serialized data is not received from untrusted clients and subsequently used without some form of integrity check or digital signature to detect tampering or replay of the serialized data.