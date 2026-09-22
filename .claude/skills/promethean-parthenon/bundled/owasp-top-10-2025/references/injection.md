name: injection description: > Use when the user asks about SQL injection, command injection, LDAP injection, XSS (cross-site scripting), prompt injection, OS command injection, XML/XPath injection, template injection, or any vulnerability where untrusted user input reaches an interpreter (database, browser, OS shell, LLM). Trigger when reviewing code that builds queries, shell commands, or LLM prompts by concatenating user input. Also trigger for questions about parameterized queries, ORMs, input validation, or output encoding. Do NOT use for access control questions — use broken-access-control skill instead. license: Apache-2.0 metadata: author: example-org version: "1.1" owasp_id: A05:2025 last_updated: "2025-01-01"

---

# A05:2025 Injection

## Description

An injection vulnerability is an application flaw that allows untrusted user input to be sent to an interpreter (e.g. a browser, database, the command line, or an LLM) and causes the interpreter to execute parts of that input as commands.

## Example Attack Scenarios

**Scenario #1:** An application uses untrusted data in the construction of the following vulnerable SQL call:

```java
String query = "SELECT * FROM accounts WHERE custID='" + request.getParameter("id") + "'";
```

An attacker modifies the `id` parameter value in their browser to send `' OR '1'='1`. For example:

```
http://example.com/app/accountView?id=' OR '1'='1
```

This changes the meaning of the query to return all records from the accounts table. More dangerous attacks could modify or delete data or even invoke stored procedures.

**Scenario #2:** An application's blind trust in frameworks may result in queries that are still vulnerable. For example, Hibernate Query Language (HQL):

```java
Query HQLQuery = session.createQuery("FROM accounts WHERE custID='" + request.getParameter("id") + "'");
```

An attacker supplies `' OR custID IS NOT NULL OR custID='`. This bypasses the filter and returns all accounts.

**Scenario #3:** An application passes user input directly to an OS command:

```java
String cmd = "nslookup " + request.getParameter("domain");
Runtime.getRuntime().exec(cmd);
```

An attacker supplies `example.com; cat /etc/passwd` to execute arbitrary commands on the server.

## How to Prevent

Bad: String concatenation creates SQL injection vulnerability

```python
def get_user(username):
    query = f"SELECT * FROM users WHERE username = '{username}'"
    return db.execute(query)
```

Good: Parameterized queries prevent injection

```python
def get_user(username):
    query = "SELECT * FROM users WHERE username = ?"
    return db.execute(query, (username,))

# For ORM usage (even better)
def get_user(username):
    return User.objects.filter(username=username).first()
```

For AI/ML systems, implement prompt injection defenses:

```python
# Defense against prompt injection in LLM applications
def sanitize_user_input(user_input):
    forbidden_patterns = [
        'ignore previous instructions',
        'disregard all',
        'system:',
        'admin:'
    ]

    sanitized = user_input.lower()
    for pattern in forbidden_patterns:
        if pattern in sanitized:
            raise ValueError("Potential prompt injection detected")

    return user_input

def process_llm_query(user_query, context):
    validated_query = sanitize_user_input(user_query)

    # Separate user input from system instructions
    prompt = f"""
    System: You are a helpful assistant. Only answer based on the following context.
    Context: {context}
    User Query: {validated_query}
    """

    return llm.generate(prompt)
```

## Rules

1. The best means to prevent injection requires keeping data separate from commands and queries. The preferred option is to use a safe API, which avoids using the interpreter entirely, provides a parameterized interface, or migrates to Object Relational Mapping Tools (ORMs). **Note:** Even when parameterized, stored procedures can still introduce SQL injection if PL/SQL or T-SQL concatenates queries and data or executes hostile data with `EXECUTE IMMEDIATE` or `exec()`.
2. When it is not possible to separate the data from commands, reduce threats using the following techniques.
3. Use positive server-side input validation. This is not a complete defense as many applications require special characters, such as text areas or APIs for mobile applications.
4. For any residual dynamic queries, escape special characters using the specific escape syntax for that interpreter. **Note:** SQL structures such as table names, column names, and so on cannot be escaped, and thus user-supplied structure names are dangerous. This is a common issue in report-writing software.