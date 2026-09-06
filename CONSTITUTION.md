# CONSTITUTION.md — Architectural Invariants & Trust Boundaries

> **Purpose:** Non-negotiable technical, architectural, and security constraints for this repository. All AI agents must strictly comply with these rules.

---

## 1. Technical Stack Invariants
- **Primary Language & Runtime**: JavaScript (Vanilla ES Modules, modern browser standard APIs).
- **Architecture**: Zero-runtime-dependency static web application; zero build step required.
- **Testing Framework**: Vitest (`vitest run`).

---

## 2. Security Boundaries & Forbidden Actions
- **Zero Hardcoded Credentials**: API keys, database secrets, or tokens must never be written in source files or test fixtures. Always use environment variables or secret managers.
- **No Destructive Commands**: Never run `rm -rf /`, `DROP DATABASE`, `TRUNCATE`, or force-push to `main`/`master`.
- **SQL Security**: Direct raw SQL string formatting/concatenation is strictly forbidden. Parameterized queries or type-safe query builders only.
- **Input Sanitization**: All incoming data across public HTTP endpoints or CLI arguments must be validated against a strict schema.

---

## 3. Dependency Management Policy
- **Zero Speculative Dependencies**: Adding a new package to `package.json` or `pyproject.toml` requires explicit justification that standard libraries cannot solve the problem.
- **Lockfile Integrity**: Always update lockfiles (`poetry.lock`, `package-lock.json`, `pnpm-lock.yaml`) whenever dependencies are altered.

---

## 4. Code Quality & Formatting
- **Linter / Formatter**: Run deterministic formatters (`ruff`, `black`, `prettier`) before committing.
- **Backward Compatibility**: Do not break public APIs or database schemas without a documented migration plan.
