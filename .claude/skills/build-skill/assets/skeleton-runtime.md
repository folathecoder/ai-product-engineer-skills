<!--
Skeleton for an Ask Cuvama runtime skill. Copy the block below into
src/config/ask_cuvama/skills/<name>/SKILL.md, fill every angle bracket, and
DELETE every section you do not need plus all of these comments.

Three rules this skeleton exists to enforce:
  1. The body is MODEL-facing. The agent has loaded this skill and nothing else.
     Never name another skill; restate the instruction instead.
  2. No scripts/. There is no shell. Computation belongs in a backend tool.
  3. Anything that mutates state uses propose-then-apply, across two turns.
-->

---
name: <kebab-case, identical to the directory name>
description: >-
  <What it does, in plain prose.> Use when the user <asks for X>, <says
  "literal phrase">, or <situation where they will not name the domain>.
applicability: always                 # or: { requires: value_case }
tools:
  - <exact_backend_tool_name>
# mcp_servers:
#   - value_case
license: Proprietary. Cuvama internal use only.
metadata:
  version: 1
---

# <Title>

<One short paragraph: what source of truth this skill owns, and what it does not
touch. This is where the agent decides whether it is in the right place.>

## Tool routing

<!-- The most load-bearing section. The agent uses this table to pick the tool.
     One row per request shape, in the user's words, mapped to an exact tool
     name. -->

| User request | Tool |
| ------------ | ---- |
| <"phrase a user would actually say"> | `<exact_tool_name>` |
| <...> | `<...>` |

## <Capability one>

<Numbered procedure. One worked example in a blockquote showing the EXACT text
the agent should produce - a procedure that reads as underspecified almost
always needs an example rather than more prose.>

1. <step>
2. <step>

> <Verbatim example of the agent's output.>

## <Capability two: a mutation, if the skill has one>

<!-- Mandatory two-turn pattern. Delete this section only if the skill is
     strictly read-only. -->

**Turn 1 - propose, then stop.**

1. Read the current state, including metadata, so the proposal is grounded.
2. Draft the exact change: field, current value, proposed value.
3. Ask one direct confirmation question.
4. END the message. Do not call a mutating tool in this turn.

> <Verbatim example of the proposal and the question.>

**Turn 2 - apply only on unambiguous confirmation.**

Confirmation is: <"yes">, <"do it">, <"confirmed">, <other literal phrases>.
NOT confirmation: silence, a repeat of the original request, a question, an
unrelated reply, or a partial answer. If it is not on the list, re-ask.

After the mutation, re-read the record and verify before reporting success.
Never trust the mutating tool's own response. Treat a write error as "may have
succeeded anyway" and re-read.

## Disallowed operations

<!-- Only if an adjacent tool could technically do something this skill must
     refuse. Name the literal tool and say where the user should go. -->

- Never call `<exact_tool_name>` to <operation>. Tell the user <where to go>.

## Reference material

<!-- Only if the skill bundles files. references/ and assets/ only - never
     scripts/. Each line needs the CONDITION that triggers the load. -->

Load one with the read_skill_file tool only when a task needs it:

- `references/<name>.md`: <purpose>. Load before <condition>.
- `assets/<name>.json`: <purpose>. Load when <condition>.

## Reliability rules

<!-- Closing hard negative constraints. This is where hallucination and
     overreach guardrails live. -->

- Never <invent a value the tools did not return>.
- Never <act outside the scope named in the framing paragraph>.
- Always <verify by re-reading before claiming success>.
- If <ambiguous input>, ask rather than guess.
