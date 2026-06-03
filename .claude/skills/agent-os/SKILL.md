---
name: agent-os
description: Scaffold a generic multi-agent governance OS into any project — a 4-layer agent hierarchy (council → mediator → team-leads → agents) plus an independent oversight branch, a 7-step work protocol, 12-field agent identities, drift-control + lifecycle, a Star-Chamber multi-model decision protocol, file-based JSONL inter-agent comms, an extended TODO meta-schema, quality gates, and a SessionStart repo-sync hook. Use when the user wants to bootstrap a project's agent/team structure, set up multi-agent governance, or replicate the agent-OS architecture in a new repo. Project-agnostic — fills placeholders ({{PROJECT_NAME}}, {{DOMAIN}}, {{TIERS}}, ...) from answers you collect; contains zero domain, stack, or secret content.
---

# agent-os — Generic Multi-Agent OS Scaffolder

Bootstrap a complete, file-based multi-agent governance system into **any** repo in one command. The templates are extracted from a real, battle-tested agent OS and stripped of all project/domain/stack specifics — you fill the placeholders from a short interview.

> The templates are written in **Hebrew (RTL-first)** — this kit targets Hebrew-language projects. The OS structure itself is universal. Translate the templates if your project works in another language.

## What this scaffolds

```
{{TEAMS_DIR}}/                         # default: teams/
├── PROJECT-CONTEXT.md                 # the context anchor every agent reads first
├── ORG.md                             # 4-layer hierarchy + 7-step protocol + drift-control + lifecycle + reporting cadence
├── HOWTO-add-agent.md                 # when + how to add an agent (6 steps, 12-field identity)
├── README.md                          # the roster (you grow it as you add agents)
├── strategic/_debate-protocol.md      # Star-Chamber multi-model decision protocol
├── oversight/                         # independent audit branch (if {{ENABLE_OVERSIGHT}})
│   ├── TEAM.md  ·  _oversight-protocol.md  ·  stop-orders-ledger.md  ·  oversight-report.md
└── <tier>/<slug>/{identity.md,memory.md,activity-log.md}   # per agent (via HOWTO)
.claude/agents/<slug>.md               # Claude Code agent stubs (frontmatter → identity.md)
{{COMMS_DIR}}/README.md                 # default: comms/ — file-based JSONL message bus
.claude/scripts/session-context.mjs    # SessionStart repo-sync + context-injection hook
docs/todo/README.md                    # extended TODO meta-line schema
```

## How to scaffold (follow in order)

**Step 0 — Collect placeholder values.** Ask the user for the **required** placeholders (table below). Offer sensible defaults for the optional ones and only ask if they want to customize. Confirm the tier set and whether to include the oversight branch.

**Step 1 — Team backbone.** Copy each file under `templates/` to its target path, substituting **every** `{{...}}`. Map:
| template | → target |
| --- | --- |
| `templates/PROJECT-CONTEXT.md` | `{{TEAMS_DIR}}/PROJECT-CONTEXT.md` |
| `templates/ORG.md` | `{{TEAMS_DIR}}/ORG.md` |
| `templates/HOWTO-add-agent.md` | `{{TEAMS_DIR}}/HOWTO-add-agent.md` |
| `templates/_debate-protocol.md` | `{{TEAMS_DIR}}/strategic/_debate-protocol.md` |
| `templates/_oversight-protocol.md` | `{{TEAMS_DIR}}/oversight/_oversight-protocol.md` (if oversight on) |
| `templates/TEAM.md` | `{{TEAMS_DIR}}/oversight/TEAM.md` (and as the model for any tier's TEAM.md) |
| `templates/comms-README.md` | `{{COMMS_DIR}}/README.md` |

**Step 2 — Seed the roster.** No concrete agents ship by default. For each agent the project needs, run the `HOWTO-add-agent` flow using `templates/identity-12-fields.md` (the identity contract) and `templates/agent-stub.md` (the `.claude/agents/<slug>.md` stub). Create the empty tier folders as you go.

**Step 3 — Governance plumbing.** Install `templates/TODO-schema.md` into `docs/todo/README.md`; `templates/quality-gates.md` into your gate docs; copy `templates/session-context-hook.mjs` → `.claude/scripts/session-context.mjs`; and **merge** `templates/session-context-hook.settings.json` into `.claude/settings.json` (do not overwrite existing hooks).

**Step 4 — Register & verify.** Register every new `.md` in your project's index/CLAUDE.md per its convention, run your formatter, and confirm the SessionStart hook executes.

## Placeholders

**Required (ask):**
| placeholder | meaning |
| --- | --- |
| `{{PROJECT_NAME}}` | project / product name |
| `{{PROJECT_TAGLINE}}` | one-line description of what the project builds |
| `{{DOMAIN}}` | problem domain (e.g. fintech, edtech) |
| `{{LANGUAGE}}` | working/UI language + locale |
| `{{COUNCIL_MEMBER}}` | who holds final authority (the human "council") + sole stop-order canceller |
| `{{PRIMARY_SOURCE_OF_TRUTH}}` | the authoritative source the project codes against |
| `{{TIERS}}` | execution tiers — default `strategic, builder, quality, coordinator` |

**Optional (defaults):** `{{ENABLE_OVERSIGHT}}`=yes · `{{OVERSIGHT_QUORUM}}`=2/3 · `{{DEBATE_MODELS_N}}`=3 · `{{OPUS_MODEL}}`/`{{SONNET_MODEL}}` (high-risk vs routine model tiers) · `{{DEFAULT_BRANCH}}`=origin/main · `{{TEAMS_DIR}}`=teams/ · `{{COMMS_DIR}}`=comms/ · `{{TODO_MASTER}}`=TODO.md · `{{STATE_DOC}}`/`{{HANDOFF_LOG}}` (the "what's next" + "last handoff" docs the hook injects) · `{{APPROVAL_CONDITION}}` (the standing rule for shipping) · `{{CREATOR_GATED}}`=no / `{{CREATOR_HANDLE}}`.

**Optional — toolchain commands (used by quality-gates / identity / HOWTO / PROJECT-CONTEXT):** `{{PKG_MANAGER}}`=npm · `{{TYPECHECK_CMD}}`=`tsc --noEmit` · `{{TEST_CMD}}`=`<test-runner> run` · `{{LINT_CMD}}`=`<linter>`. Collect these in Step 0 so every template that references a gate command resolves.

Concrete agent names/slugs are **not** Step-0 placeholders — the templates use inline `<slug>`/`<tier>`/`<lead>` markers, never real names. A few **per-instance placeholders** are filled when you run the HOWTO-add-agent / team-setup flow (NOT from the Step-0 interview): `{{AGENT_NAME}}` · `{{AGENT_MANDATE}}` · `{{MODEL}}` (per agent — in `agent-stub.md` + `identity-12-fields.md`) and `{{TEAM_MISSION}}` (per team — in `TEAM.md`).

## The {{TIERS}} question

Ship the four canonical execution tiers (`strategic`, `builder`, `quality`, `coordinator`) as the default `{{TIERS}}`, parametric (rename/add/drop as needed). Keep the **oversight branch a separate, parallel-to-mediator element** (governed by `{{ENABLE_OVERSIGHT}}`) — its independence (it reports directly to the council, not through the mediator) is the whole point; never fold it into the tier list.

## 🔒 Firewall / what this kit is NOT

These templates are **domain-, stack-, and secret-free by construction**. They contain no business logic, no framework names, no course/product content, and no organization-specific personas. If the host project needs a project-specific firewall (e.g. "do not copy from repo X"), that lives in the **project's** PROJECT-CONTEXT — never in this generic kit. Keep it that way when you extend the templates.

## Reference templates

All under `templates/` (read on demand): `ORG.md` · `HOWTO-add-agent.md` · `identity-12-fields.md` · `_debate-protocol.md` · `_oversight-protocol.md` · `TEAM.md` · `PROJECT-CONTEXT.md` · `agent-stub.md` · `comms-README.md` · `TODO-schema.md` · `quality-gates.md` · `session-context-hook.mjs` · `session-context-hook.settings.json`.
