# AGENT.md — Master AI & Developer Operating System

Welcome. This document defines the **core operating principles, decision-making workflows, and execution rules** for the AI Agent (Antigravity) and human engineers working on this repository.

To reduce context bloat, detailed domain guidelines are modularized in the [`/docs`](file://./docs) directory.

---

## 🛠️ Project Databases

* **Main Database**: `waste_management` (Schema: [`prisma/schema.prisma`](file://./prisma/schema.prisma))
* **Central Core Database**: `central_core_db` (Schema: [`prisma/schema.core-central.prisma`](file://./prisma/schema.core-central.prisma))

---

## 🚦 Core Decision & Planning Workflow

### 1. Never Implement Immediately
Before writing code for any non-trivial feature or architectural modification:
1. **Understand the problem**: Deeply analyze business and technical requirements.
2. **Ask clarifying questions**: Identify ambiguous requirements before coding.
3. **Explain the architecture**: Map out the structural impact.
4. **Explain trade-offs**: Present alternative solutions with Pros/Cons.
5. **Wait for approval**: Stop and receive explicit user confirmation.
6. **Only then implement**.

### 2. Decision Proposal Format
When proposing options or major decisions, use this structure:

```markdown
### Decision Proposal: [Feature/Component Name]

#### Options Evaluated
* **Option A**: [Name]
  * **Pros**: ...
  * **Cons**: ...
* **Option B**: [Name]
  * **Pros**: ...
  * **Cons**: ...

#### Impact Evaluation
* **Performance Impact**: ...
* **Security Impact**: ...
* **Scalability Impact**: ...
* **Maintainability & DX Impact**: ...

#### Recommendation
I recommend **[Option A/B]** because [Rationale].

Should I proceed with this plan?
```

### 3. Pre-Implementation Checklist (Think First)
Before writing any code:
- [ ] Understand the core business problem.
- [ ] Break the problem into small, independent tasks.
- [ ] Identify reusable modules/services.
- [ ] Identify edge cases and failure modes.
- [ ] Identify potential performance bottlenecks (e.g. N+1 queries).
- [ ] Identify security risks and input validation boundaries.
- [ ] Create an explicit implementation plan.

---

## 📚 Documentation Sitemap & Core Rules

Refer to the specialized guides in [`/docs`](file://./docs) for specific standards:

* 🏛️ **[Architecture & Modular Design](file://./docs/architecture.md)**: Feature-first architecture, low coupling, high cohesion, thin controllers, rich services, dedicated repository layer.
* 🧹 **[Coding Standards & Clean Code](file://./docs/coding-standards.md)**: SOLID, DRY, KISS, YAGNI, OOP, composition over inheritance, readable self-documenting code.
* 🧪 **[Testing Strategy & Mandatory Checklist](file://./docs/testing-guide.md)**: Unit, Integration, E2E, edge case matrix, and failure scenario checklist.
* 🌐 **[API Design Guidelines](file://./docs/api-guidelines.md)**: RESTful conventions, DTO validation, standard status codes, error response envelopes.
* 🛡️ **[Security Standards](file://./docs/security.md)**: Zero trust client inputs, XSS/SQLi defense, secret management, least privilege.
* ⚡ **[Performance Optimization](file://./docs/performance.md)**: Query optimization, database indexing, caching strategies, event loop non-blocking.
* 🪺 **[NestJS & Dual-Prisma Rules](file://./docs/nestjs-rules.md)**: NestJS 11 best practices, module isolation, dual database client rules (`waste_management` & `central_core_db`).
* 🗄️ **[Database & Migration Rules](file://./docs/database.md)**: Schema evolution, index strategies, transaction safety.
* ✅ **[Review & PR Quality Gates](file://./docs/review-checklist.md)**: Pre-commit checklists, quality gates, final review verification.

---

## ⚡ Execution Rules

1. **Step-by-Step Problem Solving**: Never solve a complex task in one giant step. Break it down, test each step, review, and proceed.
2. **Atomic Commits**: Never change multiple unrelated systems in one commit or pull request.
3. **No Dead Code / TODOs**: Never leave commented-out code, temporary debug logs, or unresolved TODOs in production files.
4. **Empirical Verification**: Never claim a bug is fixed or a feature works without executing unit tests or verification commands.
