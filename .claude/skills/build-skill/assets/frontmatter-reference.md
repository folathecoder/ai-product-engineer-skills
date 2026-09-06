# Frontmatter reference

Load this when writing or auditing a skill's frontmatter. It is the full field
surface for both flavours; the fields most people miss are in the second half of
the Claude Code table.

## Claude Code skills

Only `name` and `description` really matter for a skill to work. The rest are
the levers that make a skill efficient rather than merely functional.

### The basics

| Field | Type | Notes |
| ----- | ---- | ----- |
| `name` | string | Display name; defaults to the directory name. Keep it identical to the directory. |
| `description` | string | What it does AND when to use it. This is the trigger. |
| `when_to_use` | string | Extra trigger context: phrases, example requests. Shares the char cap with `description`. |
| `argument-hint` | string | Autocomplete hint, e.g. `"[skill-name] [cc or runtime]"`. |
| `arguments` | string or list | Named positional args, so the body can use `$name` instead of `$0`. |
| `metadata` | map | Free-form data for your own tooling (`version`, `author`, `tags`). |
| `license` | string | Open-spec field. |
| `compatibility` | string | Environment requirements, up to 500 chars. |

### The effectiveness levers

| Field | Type | Use it when |
| ----- | ---- | ----------- |
| `context: fork` | string | The skill reads a lot and reports a conclusion. Runs in an isolated subagent so its intermediate reading never enters the main context. The largest single win for audit, review, and survey skills. |
| `agent` | string | With `context: fork`, which subagent type to fork into. |
| `background` | boolean | With `context: fork`, set `false` to wait for the result in the invoking turn. Default `true`. |
| `allowed-tools` | string or list | Pre-approved for the invoking turn. Scope Bash tightly: `Bash(node:*)`, not `Bash`. |
| `disallowed-tools` | string or list | Actually REMOVES tools from the pool. This is how you make a read-only skill read-only; leaving `Edit` out of `allowed-tools` only drops the pre-approval, it does not take the tool away. |
| `disable-model-invocation` | boolean | The skill must never self-trigger: deploys, commits, anything with a side effect the user should choose. Still available as `/name`. |
| `user-invocable` | boolean | Set `false` when only Claude should reach it and a slash command would confuse. |
| `paths` | string or list | Glob-scope activation, e.g. `"src/**/*.tsx"`. Replaces prose like "only use this in the frontend". |
| `model` | string | Pin a model when the task needs one. Accepts `/model` values or `inherit`. |
| `effort` | string | `low`, `medium`, `high`, `xhigh`, `max`. Raise it for judgment-heavy skills, lower it for mechanical ones. |
| `hooks` | map | Hooks registered while the skill is active. |
| `shell` | string | `bash` (default) or `powershell`; `0` turns command execution off. |

Booleans accept `yes`/`no`/`on`/`off`/`1`/`0`/`true`/`false`, any case.

### Character caps that actually bind

- `description` + `when_to_use` are capped **together** at 1,536 chars
  (`skillListingMaxDescChars`).
- The whole skill listing also competes for a context budget
  (`skillListingBudgetFraction`). When the budget is tight, descriptions get
  **truncated from the end**, which is why the trigger phrases go first.
- The open Agent Skills spec caps `description` at 1,024 chars. Stay under that
  if the skill may ever be distributed outside Claude Code.
- `/context` shows the real listed size. `/skill-doctor` shows per-skill cost.

### Argument placeholders

Positional arguments are **0-based**: `$0` is the first, `$1` the second.
`$ARGUMENTS` is everything; `$ARGUMENTS[0]` is the long form of `$0`. Declare
`arguments` in frontmatter to use `$name` instead.

### Command execution in the body

Inline: `` !`git status --short` `` - the `!` must start a line or follow
whitespace. Multi-line: a ` ```! ` fenced block. Output replaces the placeholder
before the body reaches the model and is not rescanned for further
placeholders.

## Ask Cuvama runtime skills

| Field | Required | Notes |
| ----- | -------- | ----- |
| `name` | yes | Kebab-case, matches the directory. |
| `description` | yes | The index text the agent matches against. |
| `applicability` | yes | `always`, or `{ requires: <flag> }` such as `value_case`. |
| `tools` | no | Exact backend tool names the skill may call. |
| `mcp_servers` | no | Only when the skill needs a whole MCP surface. |
| `license` | no | Accepted and ignored. |
| `compatibility` | no | Accepted and ignored. |
| `metadata` | no | Accepted and ignored. |

Every Claude Code field is meaningless here and the validator rejects the
common ones: there is no shell, no tool-permission layer, and no argument
substitution in a chat turn.
