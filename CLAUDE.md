# ai-product-engineer-skills

A repo of agent skills. Each skill lives in its own directory with a `SKILL.md`
and, where it earns them, `reference/`, `assets/`, `evals/`, and a bundled
script with a self-test.

## Available Skills

| Skill | When to use | Example |
| ----- | ----------- | ------- |
| `/build-skill` | Author or revise a skill, or diagnose one that is not triggering | `/build-skill migration-runner cc` |

## Conventions

- Every skill must pass the mechanical gate before it ships:
  `node .claude/skills/build-skill/validate-skill.cjs <skill-dir>`
- Skill markdown contains no em dashes and no smart quotes.
- A skill that bundles a script also bundles `test/self-test.cjs`, run after
  every edit to the script.
- A skill carries `evals/evals.json` with at least one near-miss case
  (`should_trigger: false`), so triggering can be measured rather than assumed.
- A superseded skill moves to `.claude/skills/legacy-do-not-use/` with valid
  frontmatter rather than being deleted.
