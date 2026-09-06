# Diagnose and revise an existing skill

Read this when the request is to improve, fix, or rewrite a skill rather than
create one. Work the symptom first: the same complaint ("the skill isn't
working") has five different causes with five different fixes, and guessing
wastes a rewrite.

## Step 1: name the symptom

Ask the user, or reproduce it, until you can put the failure in exactly one of
these rows. Do not start editing before you can.

| Symptom | Cause | Fix |
| ------- | ----- | --- |
| Never fires, even on an obvious request | The description does not contain the words the user actually uses, or it describes the implementation rather than the request | Rewrite the description with literal user phrasing. Check `/context` and `/skill-doctor` in case the listing is budget-truncated and the trigger text is being cut off the end |
| Fires on the wrong requests | No negative boundary; description overlaps an adjacent skill | Add "Not for X; that is Y" to BOTH skills. Narrow the shared keywords, do not just add words to one side |
| Fires, then the agent ignores half the instructions | The instruction is buried in a reference file, or phrased as description instead of command | Move it into the body. Make it imperative. If it is an assumption-defying fact, it belongs in Gotchas |
| Fires and follows the steps, but does the wrong thing | The body encodes what you meant, not what the agent needs. Usually a missing worked example | Add one worked example showing the exact output. A procedure that reads as underspecified needs an example, not more prose |
| Right steps, wrong order, or skips a step | Order was not marked as load-bearing | Be prescriptive for that section: "run exactly this", numbered, with a verify step after |
| Works, but burns context or is slow | Everything is in the body; or a read-heavy skill runs inline | Move rarely-needed material to `reference/` with a load trigger. Consider `context: fork` so the reading happens in an isolated subagent |
| A bundled reference file is never read | No WHEN trigger on the pointer | State the condition: "Read X before your first edit", "if the API returns non-200" |
| Output drifts between runs on a fixed procedure | Prose is doing a script's job | Replace those steps with a bundled script plus a self-test |
| Was good, has degraded over time | Accumulated edge cases diluted the signal | Cut. See the deletion pass below |
| Silently absent from every session | Frontmatter does not parse | `claude plugin validate <dir>`, or `claude --debug`. For a runtime skill, check the placeholder allowlist |

## Step 2: measure before you edit

Never revise on a report alone. Reproduce with the eval set:

- No `evals/evals.json` yet: build one now from the complaint. The failing
  prompt becomes a case. This is the point at which the skill becomes
  improvable rather than guessable.
- Triggering symptoms: run the positive and near-miss cases and record the hit
  rate. That number is the thing you are trying to move.
- Output symptoms: run the failing prompt with and without the skill in fresh
  sessions. If the outputs are the same, the skill is not the problem.

See [`validation-tooling.md`](validation-tooling.md) for the commands.

## Step 3: the deletion pass

Before adding anything, remove:

- Any rule that cannot be traced to an observed failure.
- Anything the model already does reliably without being told.
- Edge cases that have never occurred.
- Restatements of the same rule in more than one place.
- Reference files nothing loads, and reference files whose content is needed on
  every run (fold those back into the body).
- Sections the agent demonstrably ignores. Either promote them to the body as
  imperatives or drop them; a rule the agent skips is worse than absent because
  it costs tokens and creates false confidence.

Most revisions should end with a shorter file. If yours got longer, be sure you
can point at the failure each addition fixes.

## Step 4: the one rule for tuning descriptions

When a description under-triggers, do **not** paste the failing query's keywords
in verbatim. That overfits to one phrasing and starves the others. Name the
general concept the query was an instance of, in the user's register.

## Step 5: re-measure and record

Re-run the eval set. Report the before and after hit rate, and the with-skill
versus without-skill delta on the output cases. Add the case that exposed the
bug to `evals/evals.json` permanently, so the regression cannot come back.

Bump `metadata.version` and run the validator.
