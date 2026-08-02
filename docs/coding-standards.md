# Coding Standards & Clean Code Rules

## 🧩 SOLID Principles

- **S — Single Responsibility Principle**: Every class, module, and function must have one, and only one, reason to change.
- **O — Open/Closed Principle**: Software entities should be open for extension, but closed for modification.
- **L — Liskov Substitution Principle**: Derived classes must be substitutable for their base classes without breaking app functionality.
- **I — Interface Segregation Principle**: Many client-specific interfaces are better than one general-purpose interface.
- **D — Dependency Inversion Principle**: Depend upon abstractions, not concretions.

---

## 🧼 Clean Code Rules

### 1. Naming & Self-Documenting Code

- Use meaningful, explicit names for variables, methods, and classes (`calculateTotalWasteWeight()` vs `calc()`).
- Write self-documenting code. Avoid comments when the code can explain itself clearly.
- Use comments only to explain **why** a complex business decision was made, never **what** the code is doing.

### 2. Simplicity & Abstraction

- **DRY (Don't Repeat Yourself)**: Never duplicate business logic. Extract reusable services, helper functions, or shared modules.
- **KISS (Keep It Simple, Stupid)**: The simplest solution that solves the problem is usually the correct one. Prefer readability over cleverness.
- **YAGNI (You Aren't Gonna Need It)**: Never implement future or speculative features. Build only what is currently required by the specification.
- **Prefer Composition over Inheritance**: Avoid deep inheritance hierarchies; assemble behavior using interfaces and composable services.

### 3. Functions & Methods

- Keep functions small and focused on a single task.
- Avoid magic numbers and magic strings—use enums or constants.
- Avoid side effects in functions where possible.
