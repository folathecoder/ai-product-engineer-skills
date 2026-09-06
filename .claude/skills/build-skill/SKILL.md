---
name: build-skill
description: >
  Author or revise an agent skill so that it actually changes behaviour. Use
  when the user says "build a skill for X", "create a skill that does Y",
  "improve the <name> skill", "why isn't my skill triggering", or wants to turn
  a repeated correction into something durable. Covers both flavours: a Claude
  Code skill (`.claude/skills/` or `~/.claude/skills/`) and an Ask Cuvama
  runtime skill (`src/config/ask_cuvama/skills/`) that the chat agent loads at
  chat time. Not for writing a subagent or a plain CLAUDE.md rule; Step 0 tells
  you when the capability belongs there instead.
argument-hint: "[skill-name] [cc or runtime]"
allowed-tools: Read, Grep, Glob, Write, Edit, AskUserQuestion, Bash(node:*), Bash(npx:*), Bash(git:*), Bash(ls:*), Bash(sed:*), Bash(grep:*), Bash(find:*), Bash(wc:*), Bash(claude:*)
metadata:
  version: 2
---

## Dynamic Context

Skills already installed here (check the new name and description against these
for overlap):
```!
{ ls -1 .claude/skills/ 2>/dev/null | grep -v legacy-do-not-use; ls -1 ~/.claude/skills/ 2>/dev/null | sed 's/$/ (personal)/'; } 2>/dev/null || echo "none found"
```

Is the Ask Cuvama runtime route live from here?
```!
ls -1 src/config/ask_cuvama/skills/ 2>/dev/null || echo "NOT PRESENT - the runtime route needs the agent-config repo; only the cc route applies here"
```

Chat-analysis recommendations (trigger phrases and validation prompts for a
runtime skill):
```!
[ -f analysis/derived/coverage/coverage-map.json ] && node -e "const c=require('./analysis/derived/coverage/coverage-map.json'); console.log(c.recommendations.map(r=>r.name+' (priority '+r.priority+', '+r.volume.chats+' chats)').join('\n'))" 2>/dev/null || echo "none - not an analysis-sourced skill"
```

---

## Your Task

Build or revise a skill named "$0" of type "$1". Infer the type from the
routing table if it was omitted, and ask only if genuinely ambiguous.

**If the request is to fix, improve, or rewrite an existing skill**, stop here
and read [`reference/diagnose-and-revise.md`](reference/diagnose-and-revise.md).
Revision is a different job from authoring: it starts by naming the symptom and
usually ends with a shorter file. Do not rewrite before you can say what is
failing.

---

## Step 0: Should this be a skill at all

Answer before writing anything. Most weak skills were never skill-shaped.

| The capability is | Say so and stop |
| ----------------- | --------------- |
| An always-on preference with no procedure | it belongs in `CLAUDE.md` |
| Fully deterministic, no judgment | it belongs in a script or a CI check |
| Needs its own context and returns a conclusion | a subagent, or a skill with `context: fork` |
| Computation at chat time | a backend tool, not a runtime skill |
| A one-off | just do the task |
| Something the model already does reliably | nothing |

A skill earns its place when it carries knowledge the model lacks, about a class
of tasks that recurs, that the agent currently gets wrong or inconsistent. If
you cannot name what the agent gets wrong today, go to Step 2 and find out
before writing a line.

State the verdict in one sentence. If it fails this gate, recommend the
alternative and stop; do not build it anyway.

---

## Step 1: Route it, then read

**Who runs this: the Ask Cuvama chat agent at chat time, or Claude Code while
working in a repo?**

| Signal | Route |
| ------ | ----- |
| Talks to discovery / value-case / web-search tools; shapes what the deployed agent does for end users | **runtime** |
| Orchestrates scripts, subagents, or git for a human in Claude Code | **cc** |

The formats are not interchangeable; picking wrong means a full rewrite. One
consequence to state up front: **runtime skills cannot use `scripts/`** - there
is no sandbox and the loader ignores the folder. If the capability needs
computation and it is a runtime skill, that logic belongs in a backend tool.

Now read, in this order, before writing:

1. Read [`reference/authoring-principles.md`](reference/authoring-principles.md)
   before authoring anything, on either route. Content rules for both flavours.
2. Read the route's doc in full before writing:
   [`reference/cc-skill-conventions.md`](reference/cc-skill-conventions.md) if
   the route is cc, or
   [`reference/runtime-skill-conventions.md`](reference/runtime-skill-conventions.md)
   if it is runtime.
3. Read [`assets/frontmatter-reference.md`](assets/frontmatter-reference.md)
   before writing the frontmatter. The fields that decide whether a skill is
   efficient (`context: fork`, `disallowed-tools`, `paths`,
   `disable-model-invocation`, `effort`) are the ones authors skip.

---

## Step 2: Get a baseline

Do not skip this. It is what separates a skill that changes behaviour from one
that restates what the model already knows.

1. Run the target task in a **fresh session with the skill absent**
   (`claude -p "<realistic prompt>"`).
2. Write down the specific things the agent got wrong, skipped, or did
   inconsistently. Aim for three to six concrete failures.
3. Keep that list. Every rule and gotcha you write must trace to one of them,
   and it is the benchmark for whether the finished skill helps.

Shortcuts when a live run is not possible: a task the user corrected step by
step, an existing runbook, review comments, real failure cases. For a runtime
skill sourced from chat analysis, pull the matching `recommendations[]` entry
from `analysis/derived/coverage/coverage-map.json` for framing and trigger
phrases, and 2-3 example chats via `exampleChatIds` on the target clusters in
`analysis/derived/clusters/clusters.json` for validation prompts. Those files
are local and gitignored: read them directly, never copy chat IDs or customer
quotes into anything committed.

Also check the Dynamic Context list above: if an installed skill already covers
part of this area, either extend it instead, or write an explicit boundary
sentence into **both** descriptions.

---

## Step 3: Author from the skeleton

Copy the skeleton and fill it in. Do not compose the structure from memory.

- Read [`assets/skeleton-cc.md`](assets/skeleton-cc.md) when the route is cc.
- Read [`assets/skeleton-runtime.md`](assets/skeleton-runtime.md) when the
  route is runtime.

Decide the shape first: a **task** skill (a procedure with steps) or a
**reference** skill (conventions applied throughout a conversation, no steps).
Writing one in the other's form is the commonest authoring error. Delete every
section of the skeleton you do not need, and all of its comments.

Write the `description` last, deliberately, against the baseline list and the
overlap check. Keep `SKILL.md` focused; move long or sometimes-needed material
into `reference/` or `assets/` and give each file an explicit load condition.

---

## Step 4: Validate

Run the mechanical gate after every edit, and keep going until it is clean:

```bash
node .claude/skills/build-skill/validate-skill.cjs <path/to/skill-dir>
```

Then work through
[`reference/validation-tooling.md`](reference/validation-tooling.md): load
check, fresh-session trigger test in both directions, and the with-versus-
without comparison against the Step 2 baseline. Write the cases into
`evals/evals.json` in the new skill's directory as you go, including at least
one near-miss with `should_trigger: false`.

A skill invoked in the session that authored it proves nothing: the file is
already in context, so the model appears to follow instructions the text never
contained.

---

## Step 5: Wire it in

- **cc**: place at `.claude/skills/<name>/` (or `~/.claude/skills/<name>/` for a
  personal skill) and add a row to this repo's `CLAUDE.md` "Available Skills"
  table.
- **runtime**: place at `src/config/ask_cuvama/skills/<name>/`. It syncs to S3
  via `push-test-config.ts` under `CHAT_SKILLS_ENABLED`. A `CLAUDE.md` row is
  optional.

If the new skill supersedes an old one, move the old directory to
`legacy-do-not-use/` with its frontmatter intact rather than deleting it, and
say so in `CLAUDE.md`.

---

## Gotchas

- **A description that only says what the skill does will never fire.** It is
  the only text resident at startup, it is truncated from the end when the
  listing budget is tight, and `description` plus `when_to_use` share a
  1,536-char cap. Trigger phrases go first.
- **Leaving `Edit` out of `allowed-tools` does not make a skill read-only.** It
  only drops the pre-approval. `disallowed-tools` is what removes a tool.
- **Runtime skills fail silently.** A non-allowlisted brace placeholder or bad
  frontmatter means the config push succeeds and the skill is absent from every
  chat, with only an error log. Land any backend allowlist change first.
- **A bundled file with no load condition never gets loaded at the right
  moment.** "See reference/ for details" is not a condition.
- **Gotchas belong in `SKILL.md`, never in a reference file.** The agent will
  not recognise the trigger to load them.
- **Every binary in a Dynamic Context block needs its own `Bash(<bin>:*)`**, and
  every command needs a `2>/dev/null ||` fallback.
- **Runtime bodies must never name another skill.** The agent has not loaded it
  and cannot resolve the pointer. Restate the instruction.
- **When a skill underperforms, cut before you add.** An accumulated body
  dilutes its own signal.

---

## Definition of done

Report against these explicitly. Do not claim success on a partial list.

- [ ] Step 0 verdict stated, and the skill genuinely passes it.
- [ ] `validate-skill.cjs` exits 0 on the new skill.
- [ ] Baseline failures from Step 2 recorded, and every rule in the skill traces
      to one.
- [ ] `evals/evals.json` present, with at least one `should_trigger: false`
      case.
- [ ] Triggering confirmed in a fresh session, in both directions.
- [ ] With-versus-without delta stated in concrete terms.
- [ ] Every bundled file has a load condition.
- [ ] Wired into `CLAUDE.md` (cc) or placed for sync (runtime).
- [ ] If it bundles a script, `test/self-test.cjs` exists and passes.

---

## Reference files

- [`reference/authoring-principles.md`](reference/authoring-principles.md) -
  canonical content rules: the two shapes, description writing, progressive
  disclosure, body quality, high-value patterns. Read before authoring
  anything.
- [`reference/cc-skill-conventions.md`](reference/cc-skill-conventions.md) -
  Claude Code mechanics: locations and precedence, Dynamic Context, tool
  permissions, bundled scripts, wiring. Read when the route is cc.
- [`reference/runtime-skill-conventions.md`](reference/runtime-skill-conventions.md) -
  Ask Cuvama mechanics: how the backend loads a skill, placeholders,
  references/assets, the model-facing rule, propose-then-apply. Read when the
  route is runtime.
- [`reference/validation-tooling.md`](reference/validation-tooling.md) - the
  commands for every validation layer. Read before Step 4.
- [`reference/diagnose-and-revise.md`](reference/diagnose-and-revise.md) -
  symptom-to-fix table for an existing skill. Read first if the request is to
  improve or fix rather than create.
- [`assets/frontmatter-reference.md`](assets/frontmatter-reference.md) - the
  full field surface for both flavours, plus the character caps. Read before
  writing frontmatter.
- [`assets/skeleton-cc.md`](assets/skeleton-cc.md) and
  [`assets/skeleton-runtime.md`](assets/skeleton-runtime.md) - copy the matching
  one at Step 3.
- `validate-skill.cjs` - the mechanical gate. Run it after every edit to any
  skill. `test/self-test.cjs` is its own regression gate; run it after every
  edit to the validator.
