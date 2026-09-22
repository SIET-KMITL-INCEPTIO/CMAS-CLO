name: memory-management-failures description: > Use when the user asks about buffer overflows, stack overflow, heap overflow, use-after-free (UAF), format string vulnerabilities, memory leaks, off-by-one errors, dangling pointers, uninitialized variables, ASLR/DEP/SEHOP mitigations, or memory-safe language adoption. Trigger when reviewing C/C++ code or other non-memory-safe languages for memory safety issues, or when discussing fuzzing, canaries, StackGuard, or memory corruption exploits. Do NOT use for general application availability — use lack-of-application-resilience skill for that. license: Apache-2.0 metadata: author: example-org version: "1.1" owasp_id: X02:2025 last_updated: "2025-01-01"

---

# X02:2025 Memory Management Failures

## Description

When an application is forced to manage memory itself, it is very easy to make mistakes. Memory-safe languages are being used more often, but there are still many legacy systems in production worldwide, new low-level systems that require the use of non-memory-safe languages, and web applications that interact with mainframes, IoT devices, firmware, and other systems that may be forced to manage their own memory. Representative CWEs are _CWE-120 Buffer Copy without Checking Size of Input ('Classic Buffer Overflow')_ and _CWE-121 Stack-based Buffer Overflow_.

Memory management failures can happen when:

- You do not allocate enough memory for a variable.
- You do not validate input, causing an overflow of the heap, the stack, or a buffer.
- You store a data value that is larger than the type of the variable can hold.
- You attempt to use unallocated memory or address spaces.
- You create off-by-one errors (counting from 1 instead of zero).
- You try to access an object after it has been freed.
- You use uninitialized variables.
- You leak memory or otherwise use up all available memory until the application fails.

Memory management failures can lead to failure of the application or even the entire system. See also [X01:2025 Lack of Application Resilience](https://owasp.org/Top10/2025/X01_2025-Next_Steps/#x012025-lack-of-application-resilience).

## Example Attack Scenarios

**Scenario #1:** Buffer overflows are the most famous memory vulnerability, a situation where an attacker submits more information into a field than it can accept, such that it overflows the buffer created for the underlying variable. In a successful attack, the overflow characters overwrite the stack pointer, allowing the attacker to insert malicious instructions into your program.

**Scenario #2:** Use-After-Free (UAF) happens often enough that it is a semi-common browser bug bounty submission. The attacker crafts a JavaScript payload that creates an object (such as a DOM element) and obtains references to it. Through careful manipulation, they trigger the browser to free the object's memory while keeping a dangling pointer to it. Before the browser realizes the memory has been freed, the attacker allocates a new object that occupies the _same_ memory space. When the browser tries to use the original pointer, it now points to attacker-controlled data. If this pointer was for a virtual function table, the attacker can redirect code execution to their payload.

**Scenario #3:** A network service that accepts user input passes it directly to the logging function as `syslog(user_input)` instead of `syslog("%s", user_input)`, which doesn't specify the format. The attacker sends malicious payloads containing format specifiers such as `%x` to read stack memory (sensitive data disclosure) or `%n` to write to memory addresses. This is a Format String vulnerability (uncontrolled string format).

## How to Prevent

1. Enable the following server features that make memory management errors harder to exploit: address space layout randomization (ASLR), Data Execution Protection (DEP), and Structured Exception Handling Overwrite Protection (SEHOP).
2. Monitor your application for memory leaks.
3. Validate all input to your system very carefully, and reject all input that does not meet expectations.
4. Study the language you are using and make a list of unsafe and safer functions, then share that list with your entire team. For example, in C, prefer `strncpy()` over `strcpy()` and `strncat()` over `strcat()`.
5. If your language or framework offers memory safety libraries, use them. For example: Safestringlib or SafeStr.
6. Use managed buffers and strings rather than raw arrays and pointers whenever possible.
7. Take secure coding training that focuses on memory issues and/or your language of choice.
8. Perform code reviews and/or static analyses.
9. Use compiler tools that help with memory management such as StackShield, StackGuard, and Libsafe.
10. Perform fuzzing on every input to your system.
11. If you have a penetration test performed, inform your tester that you are concerned about memory management failures and that you would like them to pay special attention to this while testing.
12. Fix all compiler errors _and_ warnings. Do not ignore warnings because your program compiles.
13. Ensure your underlying infrastructure is regularly patched, scanned, and hardened.
14. Monitor your underlying infrastructure specifically for potential memory vulnerabilities and other failures.
15. Consider using [canaries](https://en.wikipedia.org/wiki/Buffer_overflow_protection#Canaries) to protect your address stack from overflow attacks.