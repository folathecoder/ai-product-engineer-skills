# Ask Cuvama runtime skill conventions

Read [`authoring-principles.md`](authoring-principles.md) first for content
rules, and [`../assets/frontmatter-reference.md`](../assets/frontmatter-reference.md)
for the field surface. This doc adds only what is specific to runtime skills.

Runtime skills live at `src/config/ask_cuvama/skills/<name>/SKILL.md` in the
`agent-config` repo and are read by the Ask Cuvama chat **agent** at chat time,
not by Claude Code. They are synced to S3 and loaded by the backend behind
`CHAT_SKILLS_ENABLED`. This is a different audience and format from Claude Code
skills ([`cc-skill-conventions.md`](cc-skill-conventions.md)); the two are not
interchangeable and picking wrong means a full rewrite.

## How the backend loads one

1. **Index** - every applicable skill's `name` + `description` is composed into
   the system prompt.
2. **Body** - when a turn matches, the agent calls `load_skill` and receives the
   rendered `SKILL.md` body.
3. **Supporting files** - the agent calls `read_skill_file` to pull a
   `references/` or `assets/` file on demand.

`load_skill` appends an automatic manifest of the bundled files, but the agent
loads at the right moment only if the body says WHEN.

### Placeholders

Only `{{currentDate}}`, `{{currentYear}}`, `{valueCaseContext}` (Value Case
skills) and `{webSearchTool}` (the web-search skill, rendering as whichever
search tool `chat-agent.yaml`'s `webSearch` block bound for this chat) resolve
at load time. The backend rejects any other brace token at parse time, and a
skill that fails parsing is skipped with an error log rather than failing the
chat. The consequence is quiet and total: the config push succeeds, but that
skill is absent from every chat until the backend allowlist ships
(`skill-parser.ts`, `SKILL_BODY_PLACEHOLDERS`). Land the backend change first.
The validator flags non-allowlisted tokens.

## Frontmatter specifics

- `applicability: always` puts the skill in every chat's index.
  `applicability: { requires: <flag> }` gates it behind a discovery-level
  condition such as `value_case`. Check `chat-agent.yaml`'s
  `{{#if valueCaseAppConnected}}` blocks for flags that already exist before
  inventing one.
- `tools` lists the exact backend tool names the skill may call. `mcp_servers`
  is only for skills needing a whole MCP surface, such as `value_case`.
- There is no tool-permission layer, no argument substitution, and no shell, so
  every Claude Code field is meaningless here.

## Supporting files: references/ and assets/ only. NEVER scripts/

- `references/*` - detailed docs the agent reads when the body points it there.
- `assets/*` - templates, schemas, lookup data.

Constraints, because the runtime is not a sandbox:

- **No `scripts/`.** The agent has no shell and cannot execute anything; the
  loader enumerates only `references/` and `assets/`, and silently ignores a
  `scripts/` folder. If a task needs computation it belongs in a backend tool.
  This is the routing consequence to establish before authoring, not after.
- **Plural `references/`.** The loader does not enumerate `reference/`. A
  singular directory is invisible.
- **Text only, read raw.** `.md`, `.markdown`, `.txt`, `.json`, `.csv`, `.tsv`,
  `.xml`, `.html`, `.svg`. Binary assets can be listed but never read into the
  model.
- **256 KB per file.** Split anything larger.

Drive the loads from the body, naming each file and its trigger:

```markdown
## Reference material

Load one with the read_skill_file tool only when a task needs it:

- references/domain-source-guide.md: authoritative sources and domain_filter
  recipes. Load before building a domain_filter for regulatory queries.
- assets/query-templates.json: reusable query patterns. Load when you need a
  starting query shape.
```

## Body structure

Start from [`../assets/skeleton-runtime.md`](../assets/skeleton-runtime.md).
The established shape:

1. `# Title`.
2. Short framing paragraph: what source of truth this skill owns.
3. `## Tool routing` - a `| User request | Tool |` table. The most load-bearing
   section; the agent uses it to decide which tool fires.
4. Capability sections, one per major operation, each a numbered procedure with
   a worked example in blockquote form showing the exact text the agent should
   produce.
5. `## Reference material`, if the skill bundles files.
6. `## Reliability rules` - closing hard negative constraints, where the
   hallucination and overreach guardrails live.

## Critical rule: the body is model-facing

The agent sees the index text, then this skill's body, then files it pulls. It
does not see other skills' bodies. Therefore:

- **Never name another skill in the body** ("see the value-case skill"). The
  agent has not loaded it and there is no label to resolve. If two skills need
  the same instruction, restate it in each. The validator treats a sibling
  skill name in the body as an error.
- **DO reference this skill's own bundled files** by relative path and tell the
  agent to `read_skill_file` them. That is the one legitimate in-body pointer.
- Referencing a named `## ...` section of `chat-agent.yaml`'s `systemMessage`
  is fine, because the base prompt is always present alongside the skill.

YAML comments, this doc, and design notes may name skills freely; their audience
can look things up. The `SKILL.md` body may not.

## Mandatory pattern: propose-then-apply for any mutation

Any skill that can mutate state (Boxes, outcomes, metrics) MUST use the two-turn
pattern:

- **Turn 1:** read current state with metadata, draft the exact proposed change,
  ask a direct confirmation question, then END the message. No mutating tool
  call in the same turn as the proposal.
- **Turn 2:** call the mutating tool only on an unambiguous confirmation. List
  the valid confirmation phrases, and list what does NOT count: silence, the
  original request restated, a question, an unrelated reply.
- **After:** re-read the record and verify before reporting success. Never trust
  the mutation tool's own response; treat a write error as "may have succeeded
  anyway" and re-read.

If the skill must refuse operations an adjacent tool could technically perform,
list them by literal tool name in `## Disallowed operations` and say plainly
where the user should go instead.

## Wiring

Place the directory beside the existing ones at
`src/config/ask_cuvama/skills/<name>/`. `push-test-config.ts` walks
`src/config` recursively and uploads the allowed text extensions, including
`references/` and `assets/`. Nothing else is needed for the backend to pick it
up under `CHAT_SKILLS_ENABLED`. Add a `CLAUDE.md` row only if a future Claude
Code session would need to find it; runtime skills are not slash commands.

## Validation

See [`validation-tooling.md`](validation-tooling.md) for the `/chat-run` loop
and the four things to confirm in the LangSmith trace.
