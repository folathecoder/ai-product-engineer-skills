<!--
Skeleton for a Claude Code skill. Copy the block below into
<location>/skills/<name>/SKILL.md, fill every angle bracket, and DELETE every
section you do not need plus all of these comments. An empty section is worse
than a missing one - it teaches the agent a shape with no content.

Choose the shape first:
  TASK skill      - a procedure with steps. Keep the numbered steps.
                    Consider disable-model-invocation for side effects.
  REFERENCE skill - conventions and context applied throughout a conversation.
                    Delete the steps and Dynamic Context. Keep Gotchas and
                    Output shape. These are the highest-value skills and the
                    ones most often written in the wrong shape.
-->

---
name: <kebab-case, identical to the directory name>
description: >
  <One sentence: what it does.> Use when the user says "<literal phrase>",
  "<literal phrase>", asks to <task in their words>, or <situation where they
  will not name the domain>. Not for <adjacent case>; that is <other thing>.
when_to_use: >
  <Optional. More trigger phrases and example requests. Shares the 1536-char cap
  with description. Delete if description already carries the load.>
argument-hint: "[<arg0>] [<arg1>]"
allowed-tools: Read, Grep, Glob, Bash(<binary>:*)
# disallowed-tools: Edit, Write, NotebookEdit   # for a genuinely read-only skill
# disable-model-invocation: true                # side effects: deploy, commit, publish
# context: fork                                 # heavy reading, reports a conclusion
# paths: "src/**/*.ts"                          # only relevant in some of the tree
# effort: high                                  # judgment-heavy
metadata:
  version: 1
---

## Dynamic Context

<!-- Only if live repo state changes what the agent should do. Delete otherwise:
     a block that prints the same thing every run is pure token cost. Every
     command needs a guard so a missing prerequisite degrades to a message. -->

<state this block shows>:
```!
<command> 2>/dev/null || echo "<what it means when this is empty>"
```

---

## Your Task

<One line. Reference args as "$0" / "$1" (0-based) or "$ARGUMENTS".>

<If an argument is omitted, say what to do: route it, infer it, or ask. Never
silently default.>

---

## Step 0: <the gate>

<!-- Cheapest check that can stop the work: a prerequisite, a routing decision,
     or a reason not to proceed at all. Put it first so it costs nothing when it
     fires. Delete only if there is genuinely nothing to check. -->

---

## Step 1: <verb the first real action>

<Numbered or imperative. Be prescriptive where order matters or the operation is
fragile ("run exactly this"); give freedom and say why where many approaches
work.>

### If <condition>:

<Branch. Keep branches shallow.>

---

## Step 2: <verb>

<...>

---

## Gotchas

<!-- The highest-value section in most skills. Environment facts that defy a
     reasonable assumption, and that the agent cannot discover cheaply. Keep
     them HERE, never in a reference file: the agent will not know to load
     them. Every time you correct the agent during testing, the correction
     lands here. -->

- <fact that would otherwise cause a wrong assumption, and its consequence>
- <...>

## Output shape

<!-- If the output must follow a shape, paste the shape. The agent pattern-
     matches structure far better than it follows prose describing it. Long or
     branch-specific templates go in assets/ with a load trigger. -->

```
<template>
```

## Definition of done

<!-- What the agent must be able to assert before reporting success. Verifiable
     claims only. -->

- [ ] <verifiable condition>
- [ ] <verifiable condition>

## Reference files

<!-- Complex skills only. Each line: path, one-line purpose, and the CONDITION
     that should make the agent load it. A file with no condition never gets
     loaded at the right moment, and the validator flags it. -->

- `reference/<name>.md` - <purpose>. Read <before/when/if <condition>>.
- `assets/<name>.md` - <purpose>. Load <when <condition>>.
