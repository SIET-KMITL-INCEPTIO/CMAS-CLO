name: security-misconfiguration description: > Use when the user asks about insecure default configurations, unnecessary features or services left enabled, verbose error messages exposing stack traces, open cloud storage buckets, missing security headers (CSP, HSTS, X-Frame-Options), Kubernetes pod security, hardening guides, infrastructure-as-code security, sample applications left on production, or secrets embedded in code or config files. Trigger when reviewing deployment configurations, Docker/Kubernetes manifests, cloud IAM policies, or web server settings. Do NOT use for application code vulnerabilities — use the relevant OWASP skill (injection, broken-access-control, etc.) for those. license: Apache-2.0 metadata: author: example-org version: "1.1" owasp_id: A02:2025 last_updated: "2025-01-01"

---

# A02:2025 Security Misconfiguration

## Description

Security misconfiguration is when a system, application, or cloud service is set up incorrectly from a security perspective, creating vulnerabilities.

## Example Attack Scenarios

**Scenario #1:** The application server comes with sample applications not removed from the production server. These sample applications have known security flaws that attackers use to compromise the server. If one of these applications is the admin console and default accounts weren't changed, the attacker logs in with the default password and takes over.

**Scenario #2:** Directory listing is not disabled on the server. An attacker discovers they can simply list directories. The attacker finds and downloads the compiled Java classes, which they decompile and reverse engineer to view the code. The attacker then finds a severe access control flaw in the application.

**Scenario #3:** The application server's configuration allows detailed error messages, such as stack traces, to be returned to users. This potentially exposes sensitive information or underlying flaws, such as component versions that are known to be vulnerable.

**Scenario #4:** A cloud service provider (CSP) defaults to having sharing permissions open to the Internet. This allows sensitive data stored within cloud storage to be accessed.

## How to Address It

Bad: Kubernetes pod configuration (running as root, no resource limits, privileged mode)

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: vulnerable-pod
spec:
  containers:
  - name: app
    image: myapp:latest
```

Good: Kubernetes pod configuration (hardened)

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secure-pod
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 2000
  containers:
  - name: app
    image: myapp:latest
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop:
        - ALL
    resources:
      limits:
        memory: "256Mi"
        cpu: "500m"
      requests:
        memory: "128Mi"
        cpu: "250m"
```

For web applications, implement security headers:

```javascript
// Express.js middleware for security headers
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny'
  },
  noSniff: true,
  xssFilter: true
}));
```

## How to Prevent

1. A repeatable hardening process enabling the fast and easy deployment of another environment that is appropriately locked down. Development, QA, and production environments should all be configured identically, with different credentials used in each environment. This process should be automated to minimize the effort required to set up a new secure environment.
2. A minimal platform without any unnecessary features, components, documentation, or samples. Remove or do not install unused features and frameworks.
3. A task to review and update configurations appropriate to all security notes, updates, and patches as part of the patch management process (see [A03 Software Supply Chain Failures](https://owasp.org/Top10/2025/A03_2025-Software_Supply_Chain_Failures/)). Review cloud storage permissions (e.g., S3 bucket permissions).
4. A segmented application architecture that provides effective and secure separation between components or tenants, with segmentation, containerization, or cloud security groups (ACLs).
5. Sending security directives to clients, e.g., Security Headers.
6. An automated process to verify the effectiveness of configurations and settings in all environments.
7. Proactively add a central configuration to intercept excessive error messages as a backup.
8. If these verifications are not automated, they should be manually verified annually at a minimum.
9. Use identity federation, short-lived credentials, or role-based access mechanisms provided by the underlying platform instead of embedding static keys or secrets in code, configuration files, or pipelines.