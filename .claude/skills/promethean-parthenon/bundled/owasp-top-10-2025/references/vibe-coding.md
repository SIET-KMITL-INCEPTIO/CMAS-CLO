name: inappropriate-trust-in-ai-generated-code description: > Use when the user asks about AI-assisted development, vibe coding, using LLMs to write code, reviewing AI-generated code for security, prompt engineering for secure code generation, Shadow AI risks, RAG for secure coding, MCP security guardrails, or SDLC policies for AI tooling. Trigger when someone asks whether it is safe to ship AI-generated code without review, or how to govern AI use in software development. Do NOT use for general code review questions unrelated to AI-generated content. license: Apache-2.0 metadata: author: example-org version: "1.1" owasp_id: X03:2025 last_updated: "2025-01-01"

---

# X03:2025 Inappropriate Trust in AI Generated Code ('Vibe Coding')

## Description

We are seeing software development practices change to include not only code written with the assistance of AI, but code written and committed almost entirely without human oversight (often referred to as vibe coding). Just as it was never a good idea to copy code snippets from blogs or websites without thinking twice, the problem is exacerbated in this case. Good, secure code snippets were and are rare and might be statistically neglected by AI due to system constraints.

## Example Attack Scenarios

**Scenario #1:** A developer uses an AI assistant to generate an authentication module and ships it directly without review. The generated code stores passwords using MD5 without salting — a well-known weakness that the AI included because it is statistically common in its training data.

**Scenario #2:** A team uses vibe coding to build an internal API. The AI generates SQL queries using string concatenation, introducing SQL injection vulnerabilities that would have been caught by a basic code review or static analysis tool.

**Scenario #3:** An employee uses an unapproved public AI service (Shadow AI) to generate business logic code, inadvertently exfiltrating proprietary algorithms and internal data structures to a third-party service with no privacy agreement.

## How to Prevent

1. You should be able to read and fully understand all code you submit, even if it is written by an AI or copied from an online forum. You are responsible for all code that you commit.
2. Review all AI-assisted code thoroughly for vulnerabilities, ideally with your own eyes and also with security tooling made for this purpose (such as static analysis). Consider using classic code review techniques as described in [OWASP Cheat Sheet Series: Secure Code Review](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Code_Review_Cheat_Sheet.html).
3. Ideally, write your own code, let the AI suggest improvements, check the AI's code, and let the AI make corrections until you are satisfied with the result.
4. Consider using a Retrieval Augmented Generation (RAG) server with your own collected and reviewed secure code samples and documentation, such as your organization's security coding guideline, standard, or policy, and have the RAG server enforce any policies or standards.
5. Consider purchasing tooling that implements guardrails for privacy and security for use with your AI(s) of choice.
6. Consider purchasing a private AI, ideally with a contract agreement (including a privacy agreement) that the AI is not to be trained on your organization's data, queries, code or any other sensitive information.
7. Consider implementing a Model Context Protocol (MCP) server in-between your IDE and AI, then set it up to enforce the use of your security tooling of choice.
8. Implement policies and processes as part of your SDLC to inform developers (and all employees) of how they should and should not use AI within your organization.
9. Create a list of good and effective prompts that take IT security best practices into account. Ideally they should also consider your internal secure coding guidelines. Developers can use these prompts as a starting point for their programs.
10. AI is likely to become part of each phase of your system development life cycle. Use it wisely, both effectively and safely.
11. It is **not** recommended to use vibe coding for complex functions, business-critical programs, or programs that are used for a long time.
12. Implement technical checks and safeguards against the use of Shadow AI.
13. Train your developers on your policies, as well as safe AI usage and best practices for using AI in software development.