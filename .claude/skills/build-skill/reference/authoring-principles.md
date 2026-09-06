# Authoring principles

The canonical rules for skill content, shared by both flavours in this repo.
Every rule here is judgment-level: if it could be checked by a machine it lives
in `validate-skill.cjs` instead. Read this once before writing.

The frontmatter field surface is in
[`../assets/frontmatter-reference.md`](../assets/frontmatter-reference.md); the
per-flavour mechanics are in
[`cc-skill-conventions.md`](cc-skill-conventions.md) and
[`runtime-skill-conventions.md`](runtime-skill-conventions.md).

## Should this be a skill at all

Most weak skills are things that were never skill-shaped. Check before writing:

| The capability is | It belongs in |
| ----------------- | ------------- |
| An always-on preference with no procedure | a `CLAUDE.md` line |
| Deterministic, no judgment needed | a script, a make target, a CI check |
| Needing its own context window and returning a conclusion | a subagent, or a skill with `context: fork` |
| Computation at chat time | a backend tool, not a runtime skill |
| A one-off | just do the task |
| A rule the model already follows | nothing |

A skill earns its place when it carries **knowledge the model does not have**
about a **class of tasks** that **recurs**, and the agent gets it **wrong or
inconsistently** without it. If you cannot name what the agent currently gets
wrong, you are not ready to write the skill. Go get a baseline first.

## The two shapes

Skills come in two shapes and the commonest authoring error is writing one in
the other's form.

**Task skills** are procedures: steps, order, branches, a done condition. They
answer "how do I do X here". They often want `disable-model-invocation: true`
when they have side effects, and `context: fork` when they read a lot.

**Reference skills** are knowledge: conventions, domain context, patterns,
gotchas, applied throughout a conversation rather than executed once. They
answer "what is true here". They have no steps. A reference skill written as a
numbered procedure reads as bureaucracy and gets ignored; a task skill written
as loose prose gets half-followed.

Decide the shape before you write a line, and pick the matching skeleton.

## The description is the trigger

At startup the agent sees each skill's `name` and `description` only. That text
alone decides whether the skill activates, so it carries the entire triggering
burden.

- **Say what it does AND when to use it.** Match what the user asks for, not
  how the skill works inside.
- **Lead with the use case.** The skill listing competes for a context budget
  and descriptions are truncated from the end when it is tight. Trigger phrases
  first, elaboration second.
- **Use literal phrases a real request would contain**, in the user's words. Be
  pushy about listing contexts, including ones where the user will not name the
  domain ("even if they do not say CSV or analysis").
- **Include a negative boundary** when an adjacent skill exists: "Not for X;
  that is Y's job." Overlapping descriptions are the main cause of the wrong
  skill firing, and with dozens of skills installed the overlap is real.
- **Watch the caps.** `description` and `when_to_use` share 1,536 chars in
  Claude Code, 1,024 in the open spec. Descriptions grow during tuning.

```
# Poor
description: Helps with PDFs.

# Good
description: >-
  Extract text and tables from PDFs, fill forms, and merge files. Use when the
  user works with PDF documents or mentions PDFs, forms, or document
  extraction, even if they do not say "PDF" and only name a filename ending
  .pdf. Not for scanned-image OCR; that is ocr-extract.
```

## Progressive disclosure

Three levels, each earning the next load:

1. **Metadata** (~100 tokens): `name` + `description`, always resident for every
   installed skill. This is a permanent tax on every session, which is why an
   unused skill is not free.
2. **Instructions**: the body, loaded on activation. Under 500 lines, under
   about 5,000 tokens.
3. **Resources**: `reference/` and `assets/` files, loaded only when the body
   says so.

The load-bearing habit is **stating WHEN to load each file**. "Read
`reference/api-errors.md` if the API returns a non-200" works; "see reference/
for details" does not, and the validator flags it. Use relative paths from the
skill root, one level deep, and no nested reference chains.

Split content out when the body grows long or when material is needed only in
some runs: a large lookup table, a rarely-hit edge-case guide, a template used
by one branch. Keep in the body anything needed on every run, and anything the
agent would not recognise the trigger to load. Gotchas always stay in the body
for exactly that reason.

## Writing the body

Once activated, the body competes for attention with the whole conversation.

- **Add what the agent lacks; omit what it knows.** Skip explaining what a PDF
  or an HTTP request is. Of each line ask: "would the agent get this wrong
  without it?" If no, cut it.
- **Aim for moderate detail.** Concise stepwise guidance plus one worked example
  beats exhaustive documentation. Covering every edge case dilutes the signal
  and sends the agent down paths that do not apply.
- **Provide a default, not a menu.** Pick one approach; mention alternatives
  briefly as an escape hatch.
- **Favour procedures over declarations.** Teach how to approach a class of
  problems, not the answer to one instance.
- **Match specificity to fragility.** Give freedom, and say why, where many
  approaches are valid. Be prescriptive ("run exactly this") where order matters
  or the operation is fragile. Most skills mix both; calibrate per section.
- **Ship code for anything deterministic.** Prose telling the model to perform a
  fixed procedure drifts between runs; a script does not. Conversely, do not
  script what needs judgment. Getting this line wrong in either direction is the
  most common structural mistake in a mature skill.
- **One skill, one job.** If the description needs "and" between two unrelated
  capabilities, it is two skills. If two skills keep needing each other's
  context, they are one skill with a routing table.

## High-value patterns

- **Gotchas.** Environment-specific facts that defy a reasonable assumption
  ("the `users` table uses soft deletes; queries must include
  `WHERE deleted_at IS NULL`"). Usually the highest-value content in the whole
  file. Keep them in the body. Every correction you make during testing becomes
  a gotcha.
- **Output templates.** When output must follow a shape, paste the shape. The
  agent pattern-matches structure far better than it follows prose describing
  it. Long or branch-specific templates go in `assets/` with a load trigger.
- **Checklists and verify loops.** For multi-step or fragile work, give an
  explicit checklist or a do-then-verify loop: make the change, check it against
  a reference or a re-read, fix, repeat until it passes.
- **A definition of done.** State what the agent must be able to assert before
  reporting success, in verifiable terms. Without it, skills report success on
  partial work.

## Ground it in real failures, not in generic knowledge

A skill written from the model's generic knowledge produces generic advice
("handle errors appropriately"), which changes nothing. Good skills come from
real material: a task you corrected step by step, existing runbooks and style
guides, review comments, real failure cases. The single most reliable method:

1. Run the target task in a fresh session **without** the skill.
2. Write down the specific things the agent got wrong or did inconsistently.
3. Write the skill against that list. Every rule and gotcha should trace to an
   observed failure.
4. Anything you cannot trace to a failure is a candidate for deletion.

This is also what makes the skill's value measurable later: the delta between
with-skill and without-skill runs on those same tasks.

## Revising beats adding

When a skill underperforms, the fix is more often deletion than addition. A body
that has accumulated edge cases dilutes its own signal. See
[`diagnose-and-revise.md`](diagnose-and-revise.md) for the symptom-to-fix table.

## Repo formatting rule

Skill files in this repo contain **no em dashes and no smart quotes**: plain
hyphens and straight quotes only. This keeps deployed prompts and downstream
rendering clean. `validate-skill.cjs` enforces it.
