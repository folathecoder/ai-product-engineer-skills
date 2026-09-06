# Claude Code skill conventions

Read [`authoring-principles.md`](authoring-principles.md) first for content
rules, and [`../assets/frontmatter-reference.md`](../assets/frontmatter-reference.md)
for the field surface. This doc adds only the Claude Code mechanics.

Claude Code has a real shell and filesystem, so these skills can run commands,
execute bundled scripts, and read their own reference files directly. That is
the main difference from Ask Cuvama runtime skills
([`runtime-skill-conventions.md`](runtime-skill-conventions.md)); the two
formats are not interchangeable.

## Where a skill lives, and what that changes

| Location | Path | Scope |
| -------- | ---- | ----- |
| Project | `.claude/skills/<name>/SKILL.md` | this repo, plus every parent directory up to the repo root |
| Personal | `~/.claude/skills/<name>/SKILL.md` | all your projects |
| Plugin | `<plugin>/skills/<name>/SKILL.md` | wherever the plugin is enabled; invoked as `/plugin-name:skill-name` |
| Enterprise | `.claude/skills/` in the managed settings directory | all org users |

Nested project skills also load from `.claude/skills/` in subdirectories, picked
up when Claude first reads a file there, and get directory-qualified names such
as `apps/web:deploy`. Use a nested skill when guidance applies only to one part
of a monorepo; use `paths` in frontmatter when it applies to a glob rather than
a directory.

On a name clash: Enterprise beats Personal beats Project, plugin skills are
namespaced, and nested skills expose both the qualified and unqualified name.
Two skills with the same name in the same tier is a bug, not a fallback.

Skill file edits are picked up within the current session, so iteration does not
need a restart.

## Body structure

```
## Dynamic Context
<```! bash blocks printing live repo state, if and only if it changes what the
agent should do>

---

## Your Task
<one line, referencing "$0" / "$1" (0-based) or "$ARGUMENTS">

---

## Step 0: <the cheapest gate that can stop the work>
## Step 1: <...>
## Gotchas
## Definition of done
## Reference files          (complex skills only)
```

Start from [`../assets/skeleton-cc.md`](../assets/skeleton-cc.md) rather than
retyping this; copy it and delete what you do not need. For a reference-shaped
skill (conventions applied throughout a conversation, not a procedure), delete
the steps and the Dynamic Context entirely.

## Dynamic Context

` ```! ` fenced blocks (and inline `` !`cmd` ``) run before the body reaches the
model, so it sees live state rather than stale prose. Rules:

- Include a block only if the output changes what the agent does. A block that
  prints the same thing every run is pure token cost on every invocation.
- Guard every command: `2>/dev/null || echo "<what an empty result means>"`. A
  missing prerequisite should degrade to a helpful message, never a raw error.
- Every binary you invoke needs a matching `Bash(<binary>:*)` in
  `allowed-tools`. The validator checks this because it is easy to add `ls` or
  `grep` to a block and forget the permission.
- Output is inserted as plain text and is not rescanned for placeholders.

## Simple versus complex

- **Simple** (no subfolder): everything in `SKILL.md`, steps as
  `## Step N: ...` separated by `---`, `### If <condition>:` for branching.
- **Complex** (`SKILL.md` + `reference/`): `SKILL.md` holds routing and
  decisions only; procedural detail moves into `reference/*.md`, each with an
  explicit load condition ("Read `reference/x.md` BEFORE your first
  iteration").

## Bundled scripts

Allowed here, unlike runtime skills, and preferred for anything deterministic.

- Use `.cjs` (this repo's `package.json` sets `"type": "module"`), or `.ts` via
  `npx tsx`.
- Reference scripts by relative path from the skill root.
- A script-bundling skill MUST also bundle `test/self-test.cjs` and run it after
  every edit to the script. The validator makes this an error, not a
  convention.
- Design for agentic use: no interactive prompts (the shell is non-interactive
  and will hang), a real `--help`, actionable error messages, and structured
  output (JSON or CSV) so the agent can parse results rather than scrape them.

## Tool permissions

`allowed-tools` pre-approves tools for the invoking turn. Scope Bash tightly:
`Bash(node:*)`, never bare `Bash`.

Omitting a tool from `allowed-tools` only removes the pre-approval; the tool is
still in the pool and the agent can ask for it. To make a read-only skill
genuinely read-only, use `disallowed-tools: Edit, Write, NotebookEdit`, which
removes them.

Use `disable-model-invocation: true` for anything with a side effect the user
should choose: deploys, commits, publishes, anything that writes outside the
repo. The skill stays available as `/name`.

Use `context: fork` when the skill reads widely and reports a conclusion, so
the intermediate reading never lands in the main context. Pair it with `agent`
to pick the subagent type and `background: false` if the invoking turn needs the
result.

## Discoverability wiring

Add a row to this repo's `CLAUDE.md` "Available Skills" table:

```
| `/skill-name` | one-line when-to-use | example invocation |
```

If the skill supersedes an older one, move the old directory to
`.claude/skills/legacy-do-not-use/` (keep its frontmatter valid; the directory
name marks it dead, not broken YAML) rather than deleting it, and say so in
`CLAUDE.md`.

## Validation

See [`validation-tooling.md`](validation-tooling.md). The short version: run
`validate-skill.cjs`, run `claude plugin validate`, then test triggering in a
**fresh session** in both directions. Invoking the skill in the session that
wrote it proves nothing.
