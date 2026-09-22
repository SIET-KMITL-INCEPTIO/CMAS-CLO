---
tags: [index, MOC, senior-leadership]
aliases: [Home, Index, Role Map]
---

# 🗺️ Senior Leadership Advisor — Knowledge Graph Index

This is the **Map of Content (MOC)** for the Senior Leadership Advisor skill vault.
Open in Obsidian → Graph View to see all role relationships as a network.

---

## 📚 Skill Files

- [SKILL](./SKILL.md) — Main agent instructions (role detection → assumption → team formation → answer style)
- [roles](references/roles.md) — Full role catalog (~50 roles)
- [thinking-framework](references/thinking-framework.md) — 7-point thinking discipline detail
- [team-protocol](references/team-protocol.md) — role self-activation, lead/support seats, conflict ladder, handoff contracts

---

## 🗂️ Role Tracks (สาย)

### 1. สาย Software & Logic
→ [01-Software-Logic](roles/01-Software-Logic.md)
- [Backend Developer](roles/01-Software-Logic.md#backend-developer)
- [Frontend Developer](roles/01-Software-Logic.md#frontend-developer)
- [Logic / Algorithm Engineer](roles/01-Software-Logic.md#logic-algorithm-engineer)
- [Embedded / Firmware Engineer](roles/01-Software-Logic.md#embedded-firmware-engineer)
- [QA / Automation Tester](roles/01-Software-Logic.md#qa-automation-tester)

### 2. สาย IoT (Internet of Things)
→ [02-IoT](roles/02-IoT.md)
- [IoT Architect](roles/02-IoT.md#iot-architect)
- [IoT Developer](roles/02-IoT.md#iot-developer)
- [Cloud / Network Engineer](roles/02-IoT.md#cloud-network-engineer)

### 3. สาย UX/UI & Design
→ [03-UX-UI-Design](roles/03-UX-UI-Design.md)
- [UX Researcher](roles/03-UX-UI-Design.md#ux-researcher)
- [UI Designer](roles/03-UX-UI-Design.md#ui-designer)
- [Interaction Designer](roles/03-UX-UI-Design.md#interaction-designer)
- [Product Designer](roles/03-UX-UI-Design.md#product-designer)

### 4. สาย Writing & Content
→ [04-Writing-Content](roles/04-Writing-Content.md)
- [UX Writer](roles/04-Writing-Content.md#ux-writer)
- [Technical Writer](roles/04-Writing-Content.md#technical-writer)
- [Tech Content Strategist](roles/04-Writing-Content.md#tech-content-strategist)

### 5. สายบริหารจัดการและประสานงาน (Management)
→ [05-Management](roles/05-Management.md)
- [Product Manager / Owner](roles/05-Management.md#product-manager-owner)
- [Solutions Architect](roles/05-Management.md#solutions-architect)

### 6. Engineering & Leadership (Original Roles)
→ [06-Engineering-Leadership](roles/06-Engineering-Leadership.md)
- Software Architecture, Frontend/Backend Engineering, QA, Security, DevOps, SRE, Cloud, Data, AI/ML, Prompt Engineering, Executive Leadership, Product Management

---

## 🔬 Silicon / Big-Tech Hardware Tracks

Roles at an AMD / NVIDIA-class silicon company, ordered upstream → downstream.
**Flow:** [R&D](roles/07-Silicon-RnD.md) → [TEST](roles/08-Silicon-Test.md) → [SELL](roles/09-Silicon-Sell.md) → [Client Service](roles/10-Silicon-Client-Service.md)

### 7. สาย R&D (Research & Development)
→ [07-Silicon-RnD](roles/07-Silicon-RnD.md)
- [Silicon Architect / Microarchitect](roles/07-Silicon-RnD.md#silicon-architect-microarchitect)
- [ASIC / RTL Design Engineer](roles/07-Silicon-RnD.md#asic-rtl-design-engineer)
- [AI / Deep Learning Research Scientist](roles/07-Silicon-RnD.md#ai-deep-learning-research-scientist)
- [Software / Compiler Engineer](roles/07-Silicon-RnD.md#software-compiler-engineer)

### 8. สาย TEST (Verification & Quality Assurance)
→ [08-Silicon-Test](roles/08-Silicon-Test.md)
- [Design Verification (DV) Engineer](roles/08-Silicon-Test.md#design-verification-dv-engineer)
- [Silicon Validation Engineer](roles/08-Silicon-Test.md#silicon-validation-engineer)
- [Post-Silicon Test Engineer](roles/08-Silicon-Test.md#post-silicon-test-engineer)
- [Quality Assurance (QA) Engineer](roles/08-Silicon-Test.md#quality-assurance-qa-engineer)

### 9. สาย SELL (Sales, Marketing & Business)
→ [09-Silicon-Sell](roles/09-Silicon-Sell.md)
- [Technical Marketing Engineer](roles/09-Silicon-Sell.md#technical-marketing-engineer)
- [Silicon Product Manager](roles/09-Silicon-Sell.md#silicon-product-manager)
- [Strategic Account Manager / Enterprise Sales](roles/09-Silicon-Sell.md#strategic-account-manager-enterprise-sales)
- [Business Development Manager](roles/09-Silicon-Sell.md#business-development-manager)

### 10. สาย Client Service (Customer Support & Technical Services)
→ [10-Silicon-Client-Service](roles/10-Silicon-Client-Service.md)
- [Field Application Engineer (FAE)](roles/10-Silicon-Client-Service.md#field-application-engineer-fae)
- [Solutions Architect / Systems Engineer](roles/10-Silicon-Client-Service.md#solutions-architect-systems-engineer)
- [Customer Support Engineer](roles/10-Silicon-Client-Service.md#customer-support-engineer)
- [Technical Account Manager (TAM)](roles/10-Silicon-Client-Service.md#technical-account-manager-tam)

---

## 🔗 Cross-Track Relationships (Graph Edges)

| From | To | Relationship |
|---|---|---|
| [02-IoT](roles/02-IoT.md) | [01-Software-Logic](roles/01-Software-Logic.md) | IoT dev needs Backend + Embedded |
| [02-IoT](roles/02-IoT.md) | [06-Engineering-Leadership](roles/06-Engineering-Leadership.md) | IoT Architect ↔ Cloud/SRE |
| [03-UX-UI-Design](roles/03-UX-UI-Design.md) | [04-Writing-Content](roles/04-Writing-Content.md) | Design + copy always paired |
| [03-UX-UI-Design](roles/03-UX-UI-Design.md) | [01-Software-Logic](roles/01-Software-Logic.md) | UI Designer ↔ Frontend Dev |
| [05-Management](roles/05-Management.md) | [06-Engineering-Leadership](roles/06-Engineering-Leadership.md) | PM ↔ Engineering leadership |
| [05-Management](roles/05-Management.md) | [02-IoT](roles/02-IoT.md) | Solutions Architect spans IoT+Software |
| [04-Writing-Content](roles/04-Writing-Content.md) | [03-UX-UI-Design](roles/03-UX-UI-Design.md) | UX Writer ↔ UX Researcher |
| [07-Silicon-RnD](roles/07-Silicon-RnD.md) | [08-Silicon-Test](roles/08-Silicon-Test.md) | RTL ↔ DV — adversarial by design |
| [07-Silicon-RnD](roles/07-Silicon-RnD.md) | [01-Software-Logic](roles/01-Software-Logic.md) | Compiler/RTL ↔ Embedded + Algorithm |
| [08-Silicon-Test](roles/08-Silicon-Test.md) | [09-Silicon-Sell](roles/09-Silicon-Sell.md) | Bin yields define the SKU stack |
| [09-Silicon-Sell](roles/09-Silicon-Sell.md) | [10-Silicon-Client-Service](roles/10-Silicon-Client-Service.md) | Account Manager ↔ FAE / TAM pairing |
| [10-Silicon-Client-Service](roles/10-Silicon-Client-Service.md) | [08-Silicon-Test](roles/08-Silicon-Test.md) | Field failures → RMA → RCCA loop |
| [09-Silicon-Sell](roles/09-Silicon-Sell.md) | [05-Management](roles/05-Management.md) | Silicon PM ↔ software PM (different gates) |

---

## 🧠 Thinking Framework
→ [thinking-framework](references/thinking-framework.md)

| Concept | Apply When |
|---|---|
| Think Thoroughly | Always, before any answer |
| Pre-Mortem | Architecture, irreversible decisions |
| Edge-Case Analysis | API design, firmware, agent prompts |
| First-Principles | Build-vs-buy, tech stack choices |
| Holistic View | Cross-track integration requests |