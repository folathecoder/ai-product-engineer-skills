# Validating a skill

Read this before claiming a skill works. A skill you have just written cannot
be validated in the session that wrote it: the whole file is already in context,
so the model appears to follow instructions that are in fact missing from the
text. Every check below is either mechanical or runs in a fresh session.

## 1. Mechanical gate (always, after every edit)

```bash
node .claude/skills/build-skill/validate-skill.cjs <path/to/skill-dir>
```

Add `--type cc` or `--type runtime` if the path does not make the flavour
obvious, `--json` for machine output, `--strict` to fail on warnings too. It
checks frontmatter shape and field names, the description trigger text and
length caps, the body budget, formatting, broken links, bundled files that are
unreferenced or have no load trigger, script/self-test pairing, eval-set
presence and shape, Dynamic Context permission coverage, and the runtime-only
constraints.

Exit code 1 means do not ship it.

If the skill bundles a script, its own gate must pass too:

```bash
node .claude/skills/<name>/test/self-test.cjs
```

## 2. Does it load at all

```bash
claude plugin validate .claude/skills     # project skills
claude plugin validate ~/.claude/skills   # personal skills
claude --debug                            # prints YAML parse errors
```

A skill with malformed frontmatter is silently absent from every session. This
is the first thing to check when a skill "does nothing".

## 3. Does it trigger (fresh session, both directions)

Triggering is a property of the description, and it must be tested from a clean
context.

```bash
claude -p "<a realistic prompt from evals.json that SHOULD trigger>"
claude -p "<a near-miss prompt that should NOT trigger>"
```

Confirm the skill fired in the positive cases and did not fire in the
near-misses. A skill that fires on everything is as broken as one that never
fires; only the near-miss cases catch the first kind.

## 4. Does it help (with versus without)

```bash
# with the skill available
claude -p "<task prompt>"
# without: set the skill to "off" in .claude/settings.local.json skillOverrides
```

Compare against concrete assertions, not vibes. The delta is what the skill
buys. No delta means either the model already did this, or the body is not
being followed.

## 5. Automate the loop

The `skill-creator` plugin runs 3 and 4 as a suite:

```bash
claude plugin install skill-creator@claude-plugins-official
```

Then: `evaluate my <skill-name> skill with skill-creator`. It reads
`evals/evals.json`, spawns a subagent per case so each run gets a clean context,
grades assertions into `grading.json`, benchmarks with-skill against
without-skill (pass rate, tokens, time), does blind A/B between two versions of
a skill, and tunes the description by measuring hit rate. Use it for anything
you expect to maintain.

Keep `evals/evals.json` in the skill directory. The shape this repo uses:

```json
{
  "cases": [
    {
      "id": "short-slug",
      "prompt": "what a real user would type",
      "should_trigger": true,
      "assertions": [
        "a concrete, checkable statement about the output"
      ]
    },
    {
      "id": "near-miss-slug",
      "prompt": "an adjacent request this skill must NOT claim",
      "should_trigger": false,
      "note": "belongs to <other skill>"
    }
  ]
}
```

At least one `should_trigger: false` case is required; without one,
false-triggering goes undetected. The validator warns when it is missing.

## 6. Cost

```
/context        # what the skill listing actually costs, after budget
/skill-doctor   # per-skill token cost, plus skills never invoked
```

Every installed skill's description is resident in every session. A skill that
has never fired is a permanent tax. Check this after adding a skill, and when
descriptions start getting truncated: `skillListingBudgetFraction` raises the
budget, and `skillOverrides` set to `"name-only"` frees it for low-priority
skills.

## Runtime skills: the equivalents

The mechanical gate applies unchanged. The rest becomes:

```bash
npx tsx src/scripts/push-test-config.ts agents-test-<you>
npx tsx src/scripts/run-chat-agent.ts '<json>' --test-folder agents-test-<you>
```

Use a real prompt paraphrased from an actual chat-analysis cluster
(`exampleChatIds` / `exampleRefs` in `analysis/derived/clusters/clusters.json`);
paraphrase, never paste verbatim customer text into a command. Reuse
`--history <file>` for multi-turn, which is the only way to test
propose-then-apply end to end.

Then read the LangSmith trace and confirm four things:

1. The right tool fired, in the right turn.
2. `load_skill` fired for this skill.
3. `read_skill_file` fired for each bundled file, at the moment the body says.
4. The stop-after-proposal rule held: no mutation in the proposing turn.

Reading the output alone will not show you 2, 3, or 4.
