name: security-logging-and-alerting-failures description: > Use when the user asks about security logging, audit trails, SIEM integration, alerting thresholds, monitoring gaps, log tampering, log injection, insufficient logging, incident detection, SOC playbooks, honeytokens, log sanitization of PII, or the inability to detect breaches in progress. Trigger when a system lacks evidence of attacks after the fact or cannot detect active attacks in real time. Do NOT use for general application error handling — use mishandling-of-exceptional-conditions skill for that. license: Apache-2.0 metadata: author: example-org version: "1.1" owasp_id: A09:2025 last_updated: "2025-01-01"

---

# A09:2025 Security Logging & Alerting Failures

## Description

Without logging and monitoring, attacks and breaches cannot be detected, and without alerting it is very difficult to respond quickly and effectively during a security incident. Insufficient logging, continuous monitoring, detection, and alerting occurs any time:

1. Auditable events, such as logins, failed logins, and high-value transactions, are not logged or logged inconsistently (for instance, only logging successful logins, but not failed attempts).
2. Warnings and errors generate no, inadequate, or unclear log messages.
3. The integrity of logs is not properly protected from tampering.
4. Logs of applications and APIs are not monitored for suspicious activity.
5. Logs are only stored locally and not properly backed up.
6. Appropriate alerting thresholds and response escalation processes are not in place or effective.
7. Penetration testing and scans by dynamic application security testing (DAST) tools (such as Burp or ZAP) do not trigger alerts.
8. The application cannot detect, escalate, or alert for active attacks in real-time or near real-time.
9. Logging and alerting events are visible to a user or an attacker (see [A01:2025-Broken Access Control](https://owasp.org/Top10/2025/A01_2025-Broken_Access_Control/)), or sensitive information that should not be logged (such as PII or PHI) is being logged.
10. Log data is not correctly encoded, leaving the system vulnerable to log injection attacks.
11. The application is missing or mishandling errors and other exceptional conditions, such that the system is unaware there was an error, and is therefore unable to log the problem.
12. Use cases for issuing alerts are missing or outdated, leading to important events going unrecognized.
13. Too many false positive alerts make it impossible to distinguish important alerts from unimportant ones (physical overload of the SOC team).
14. Detected alerts cannot be processed correctly because the playbook for the use case is incomplete, out of date, or missing.

## Example Attack Scenarios

**Scenario #1:** A children's health plan provider's website operator couldn't detect a breach due to a lack of monitoring and logging. An external party informed the health plan provider that an attacker had accessed and modified thousands of sensitive health records of more than 3.5 million children. A post-incident review found that the website developers had not addressed significant vulnerabilities. As there was no logging or monitoring, the data breach had potentially been in progress since 2013 — a period of more than seven years.

**Scenario #2:** A major Indian airline had a data breach involving more than ten years' worth of personal data of millions of passengers, including passport and credit card data. The data breach occurred at a third-party cloud hosting provider, who notified the airline of the breach after some time.

**Scenario #3:** A major European airline suffered a GDPR-reportable breach. The breach was reportedly caused by payment application security vulnerabilities exploited by attackers, who harvested more than 400,000 customer payment records. The airline was fined 20 million pounds as a result.

## How to Prevent

```python
# Structured logging example with security events
import logging
import json
from datetime import datetime

class SecurityLogger:
    def __init__(self):
        self.logger = logging.getLogger('security')
        self.logger.setLevel(logging.INFO)

    def log_security_event(self, event_type, user_id, details, severity='INFO'):
        event = {
            'timestamp': datetime.utcnow().isoformat(),
            'event_type': event_type,
            'user_id': user_id,
            'severity': severity,
            'details': details,
            'source_ip': self.get_client_ip()
        }

        sanitized_event = self.sanitize_event(event)
        self.logger.info(json.dumps(sanitized_event))

        if severity in ['HIGH', 'CRITICAL']:
            self.send_to_siem(sanitized_event)

    def sanitize_event(self, event):
        # Remove passwords, tokens, PII
        sensitive_fields = ['password', 'token', 'ssn', 'credit_card']
        sanitized = event.copy()

        for field in sensitive_fields:
            if field in sanitized.get('details', {}):
                sanitized['details'][field] = '[REDACTED]'

        return sanitized

security_logger = SecurityLogger()

security_logger.log_security_event(
    'LOGIN_FAILURE',
    user_id='user123',
    details={'reason': 'invalid_password', 'attempt': 3},
    severity='MEDIUM'
)

security_logger.log_security_event(
    'UNAUTHORIZED_ACCESS',
    user_id='user456',
    details={'resource': '/admin/users', 'action': 'READ'},
    severity='HIGH'
)
```

## Rules

1. Ensure all login, access control, and server-side input validation failures can be logged with sufficient user context to identify suspicious or malicious accounts and held for enough time to allow delayed forensic analysis.
2. Ensure that every part of your app that contains a security control is logged, whether it succeeds or fails.
3. Ensure that logs are generated in a format that log management solutions can easily consume.
4. Ensure log data is encoded correctly to prevent injections or attacks on the logging or monitoring systems.
5. Ensure all transactions have an audit trail with integrity controls to prevent tampering or deletion, such as append-only database tables or similar.
6. Ensure all transactions that throw an error are rolled back and started over. Always fail closed.
7. If your application or its users behave suspiciously, issue an alert. Create guidance for your developers on this topic so they can code against this, or buy a system for this purpose.
8. DevSecOps and security teams should establish effective monitoring and alerting use cases including playbooks such that suspicious activities are detected and responded to quickly by the Security Operations Center (SOC) team.
9. Add honeytokens as traps for attackers into your application, e.g. into the database or as technical user identities. As they are not used in normal business, any access generates logging data that can be alerted with nearly no false positives.
10. Behavior analysis and AI support can be an additional technique to support low rates of false positives for alerts.
11. Establish or adopt an incident response and recovery plan, such as NIST 800-61r2 or later. Teach your software developers what application attacks and incidents look like, so they can report them.