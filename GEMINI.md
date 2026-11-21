# Agent Entrypoint & Cold-Start Protocol (GEMINI.md)

Welcome, AI Lead Architect. You are operating in a self-governing **"1 Chat = 1 Version"** development cycle.

To prevent hallucinations, cognitive overload, and token bloat, you must follow the strict **Cold-Start Reading Order** below. Never load the entire repository or historical changelogs into your working memory at the start of a chat.

---

## 🚀 Cold-Start Reading Order (Hot Context < 20 KB)

Every fresh chat session MUST read files in this exact hierarchical order:

1. **Read FIRST: Live Handover Baton**
   - Path: [`docs/handovers/CURRENT_HANDOVER.md`](./docs/handovers/CURRENT_HANDOVER.md)
   - *Purpose*: Contains current verified baseline (version, commit, test status), active runtime rules, the pre-planned execution brief for this version, and the exact task scope.

2. **Read SECOND: Master Decision Ledger & Active Invariants**
   - Path: [`docs/DECISIONS_MASTER.md`](./docs/DECISIONS_MASTER.md)
   - *Purpose*: Contains all active architectural decisions, chosen paths (Path A vs Path B), reasons, and "Do-Not-Break Invariants" so you never revive retired approaches or re-introduce solved bugs.

3. **Read THIRD: Active Version Blueprint**
   - Path: [`docs/blueprint/v1.0_blueprint.md`](./docs/blueprint/v1.0_blueprint.md) (or [`docs/blueprint/main_blueprint.md`](./docs/blueprint/main_blueprint.md))
   - *Purpose*: Identifies where this chat sits within the 10-phase production roadmap and provides verifiable acceptance criteria for the current milestone.

4. **Read ON-DEMAND ONLY (Never on Start):**
   - Historical version dossiers: `docs/versions/v*.md`
   - Master release log: [`docs/APP_JOURNEY_LOG.md`](./docs/APP_JOURNEY_LOG.md)
   - Specialized guides: [`docs/ai/security.md`](./docs/ai/security.md), [`docs/ai/workflow.md`](./docs/ai/workflow.md), [`docs/ai/memory.md`](./docs/ai/memory.md)
   - Operational runbooks: `docs/ops/*`
   - *Rule*: Consult these ONLY when an active task specifically requires deep historical context or specialized domain specs.

---

## 🛡️ Repository Governance & Invariants
- Detailed governance, system-2 pre-flight checks, circuit breakers, and architectural invariants are defined in [`AGENTS.md`](./AGENTS.md).
- The version development cycle and mandatory 7-step closeout ritual are executed via `.agents/skills/version-ritual/SKILL.md`.
- Private workspace credentials (for automated testing) reside exclusively in `.agents/AGENTS.md`.
