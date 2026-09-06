#!/usr/bin/env node
'use strict';

/**
 * Regression gate for validate-skill.cjs. Builds throwaway skill directories in
 * a temp folder, runs the validator, and asserts on finding codes.
 *
 * Run after every edit to validate-skill.cjs:
 *   node .claude/skills/build-skill/test/self-test.cjs
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { validate, parseFrontmatter, binariesIn, allowedBashBinaries } = require('../validate-skill.cjs');

let passed = 0;
const failures = [];

function check(label, condition, detail) {
  if (condition) { passed++; return; }
  failures.push(`${label}${detail ? ` - ${detail}` : ''}`);
}

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'build-skill-selftest-'));

/** Materialise a skill dir under a fake .claude/skills or ask_cuvama/skills path. */
function makeSkill(type, name, files) {
  const base = type === 'cc'
    ? path.join(root, name, '.claude', 'skills', name)
    : path.join(root, name, 'src', 'config', 'ask_cuvama', 'skills', name);
  fs.mkdirSync(base, { recursive: true });
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(base, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  return base;
}

function codes(findings, severity) {
  return findings.filter((f) => !severity || f.severity === severity).map((f) => f.code);
}

function run(dir, opts) {
  return validate(dir, opts || {});
}

// ------------------------------------------------------------------ unit bits

check('parseFrontmatter reads a folded description',
  (() => {
    const p = parseFrontmatter('---\nname: x\ndescription: >\n  one\n  two\n---\nbody\n');
    return p.ok && p.data.description === 'one two';
  })());

check('parseFrontmatter reads a block sequence',
  (() => {
    const p = parseFrontmatter('---\nname: x\ntools:\n  - a\n  - b\n---\nbody\n');
    return p.ok && Array.isArray(p.data.tools) && p.data.tools.join(',') === 'a,b';
  })());

check('parseFrontmatter reads a nested map',
  (() => {
    const p = parseFrontmatter('---\nname: x\nmetadata:\n  version: 2\n---\nbody\n');
    return p.ok && p.data.metadata && p.data.metadata.version === '2';
  })());

check('parseFrontmatter rejects a missing close fence',
  parseFrontmatter('---\nname: x\nbody with no close\n').ok === false);

check('binariesIn finds piped and chained binaries',
  (() => {
    const b = binariesIn(['ls -1 foo | grep -v bar', 'git status --short']);
    return b.has('ls') && b.has('grep') && b.has('git');
  })());

check('binariesIn skips shell builtins',
  binariesIn(['echo hello']).size === 0);

check('binariesIn ignores code inside a quoted interpreter argument',
  (() => {
    const b = binariesIn(['node -e "const c=require(\'./x.json\'); console.log(c.a)"']);
    return b.has('node') && !b.has('console.log') && !b.has('require');
  })());

check('allowedBashBinaries parses scoped entries',
  (() => {
    const { bins, unscoped } = allowedBashBinaries('Read, Bash(node:*), Bash(git:*)');
    return bins.has('node') && bins.has('git') && !unscoped;
  })());

check('allowedBashBinaries detects unscoped Bash',
  allowedBashBinaries('Read, Bash').unscoped === true);

// ------------------------------------------------------------------ identity

{
  const dir = makeSkill('cc', 'good-skill', {
    'SKILL.md': `---
name: good-skill
description: >
  Does one clear thing. Use when the user says "do the clear thing" or asks to
  clear things up.
allowed-tools: Read, Grep
---

## Your Task

Do the thing.
`,
    'evals/evals.json': JSON.stringify({
      cases: [
        { prompt: 'do the clear thing', should_trigger: true },
        { prompt: 'what is the weather', should_trigger: false },
      ],
    }),
  });
  const f = run(dir);
  check('clean cc skill has no errors', codes(f, 'error').length === 0, JSON.stringify(f, null, 1));
}

{
  const dir = makeSkill('cc', 'mismatch-dir', {
    'SKILL.md': `---
name: something-else
description: Use when the user asks for it.
---
body
`,
  });
  check('name/directory mismatch is an error', codes(run(dir)).includes('NAME_DIR_MISMATCH'));
}

{
  const dir = makeSkill('cc', 'bad-name', {
    'SKILL.md': `---
name: Bad_Name
description: Use when the user asks for it.
---
body
`,
  });
  check('non-kebab name is an error', codes(run(dir)).includes('NAME_FORMAT'));
}

// --------------------------------------------------------------- description

{
  const dir = makeSkill('cc', 'no-trigger', {
    'SKILL.md': `---
name: no-trigger
description: Helps with PDFs.
---
body
`,
  });
  check('description with no when-to-use is an error', codes(run(dir)).includes('DESC_NO_TRIGGER'));
}

{
  const dir = makeSkill('cc', 'long-desc', {
    'SKILL.md': `---
name: long-desc
description: >
  ${'Use when the user needs this. '.repeat(60)}
---
body
`,
  });
  check('description over the 1536-char cap is an error', codes(run(dir)).includes('DESC_TOO_LONG'));
}

{
  const dir = makeSkill('cc', 'no-desc', {
    'SKILL.md': `---
name: no-desc
---
body
`,
  });
  check('missing description is an error', codes(run(dir)).includes('DESC_MISSING'));
}

// ---------------------------------------------------------------- formatting

{
  const dir = makeSkill('cc', 'em-dash', {
    'SKILL.md': `---
name: em-dash
description: Use when the user asks for it.
---

This body has an em dash — which the repo rule forbids.
`,
  });
  check('em dash is an error', codes(run(dir)).includes('EM_DASH'));
}

{
  const dir = makeSkill('cc', 'smart-quote', {
    'SKILL.md': `---
name: smart-quote
description: Use when the user asks for it.
---

This body has a “smart quote” which the repo rule forbids.
`,
  });
  check('smart quote is an error', codes(run(dir)).includes('SMART_QUOTE'));
}

// -------------------------------------------------------------- bundled files

{
  const dir = makeSkill('cc', 'orphan-file', {
    'SKILL.md': `---
name: orphan-file
description: Use when the user asks for it.
---

Nothing here points at the bundled doc.
`,
    'reference/never-mentioned.md': '# orphan\n',
  });
  check('bundled file nobody mentions is an error', codes(run(dir)).includes('UNREFERENCED_FILE'));
}

{
  const dir = makeSkill('cc', 'no-when', {
    'SKILL.md': `---
name: no-when
description: Use when the user asks for it.
---

See reference/details.md for details.
`,
    'reference/details.md': '# details\n',
  });
  check('referenced file with no WHEN trigger warns', codes(run(dir), 'warn').includes('NO_LOAD_TRIGGER'));
}

{
  const dir = makeSkill('cc', 'good-when', {
    'SKILL.md': `---
name: good-when
description: Use when the user asks for it.
---

Read reference/details.md before your first edit.
`,
    'reference/details.md': '# details\n',
  });
  check('referenced file with a WHEN trigger does not warn',
    !codes(run(dir), 'warn').includes('NO_LOAD_TRIGGER'));
}

{
  const dir = makeSkill('cc', 'broken-link', {
    'SKILL.md': `---
name: broken-link
description: Use when the user asks for it.
---

Read [gone](reference/gone.md) when you need it.
`,
  });
  check('broken relative link is an error', codes(run(dir)).includes('BROKEN_LINK'));
}

{
  const dir = makeSkill('cc', 'script-no-test', {
    'SKILL.md': `---
name: script-no-test
description: Use when the user asks for it.
---

Run scripts/do-it.cjs when the user confirms.
`,
    'scripts/do-it.cjs': 'console.log(1);\n',
  });
  check('bundled script without a self-test is an error', codes(run(dir)).includes('SCRIPT_NO_SELFTEST'));
}

// ---------------------------------------------------------------- budget

{
  const dir = makeSkill('cc', 'too-long', {
    'SKILL.md': `---
name: too-long
description: Use when the user asks for it.
---

${'filler line\n'.repeat(520)}`,
  });
  check('SKILL.md over 500 lines is an error', codes(run(dir)).includes('BODY_TOO_LONG'));
}

// ---------------------------------------------------------------- evals

{
  const dir = makeSkill('cc', 'no-evals', {
    'SKILL.md': `---
name: no-evals
description: Use when the user asks for it.
---
body
`,
  });
  check('missing eval set warns', codes(run(dir), 'warn').includes('EVALS_MISSING'));
}

{
  const dir = makeSkill('cc', 'no-negative', {
    'SKILL.md': `---
name: no-negative
description: Use when the user asks for it.
---
body
`,
    'evals/evals.json': JSON.stringify({ cases: [{ prompt: 'go', should_trigger: true }] }),
  });
  check('eval set with no near-miss warns', codes(run(dir), 'warn').includes('EVALS_NO_NEGATIVE'));
}

{
  const dir = makeSkill('cc', 'bad-evals', {
    'SKILL.md': `---
name: bad-evals
description: Use when the user asks for it.
---
body
`,
    'evals/evals.json': '{ not json',
  });
  check('malformed eval JSON is an error', codes(run(dir)).includes('EVALS_SHAPE'));
}

// ------------------------------------------------------- dynamic context (cc)

{
  const dir = makeSkill('cc', 'dyn-perms', {
    'SKILL.md': `---
name: dyn-perms
description: Use when the user asks for it.
allowed-tools: Read, Bash(git:*)
---

## Dynamic Context

\`\`\`!
ls -1 some/dir 2>/dev/null || echo none
\`\`\`
`,
  });
  const f = run(dir);
  check('Dynamic Context binary missing from allowed-tools warns',
    codes(f, 'warn').includes('BASH_NOT_ALLOWED'), JSON.stringify(codes(f)));
  check('guarded Dynamic Context block does not warn about guards',
    !codes(f, 'warn').includes('DYNCTX_UNGUARDED'));
}

{
  const dir = makeSkill('cc', 'dyn-unguarded', {
    'SKILL.md': `---
name: dyn-unguarded
description: Use when the user asks for it.
allowed-tools: Read, Bash(git:*)
---

## Dynamic Context

\`\`\`!
git status --short
\`\`\`
`,
  });
  const f = run(dir);
  check('unguarded Dynamic Context block warns', codes(f, 'warn').includes('DYNCTX_UNGUARDED'));
  check('allowed binary does not warn', !codes(f, 'warn').includes('BASH_NOT_ALLOWED'));
}

{
  const dir = makeSkill('cc', 'args-no-hint', {
    'SKILL.md': `---
name: args-no-hint
description: Use when the user asks for it.
---

Do the thing to "$0".
`,
  });
  check('positional arg without argument-hint warns', codes(run(dir), 'warn').includes('ARGS_NO_HINT'));
}

// ---------------------------------------------------------------- runtime

{
  const dir = makeSkill('runtime', 'rt-scripts', {
    'SKILL.md': `---
name: rt-scripts
description: Use when the user asks for it.
applicability: always
---

Read references/thing.md when you need it.
`,
    'references/thing.md': '# thing\n',
    'scripts/nope.cjs': 'console.log(1);\n',
  });
  const f = run(dir);
  check('runtime scripts/ is an error', codes(f).includes('RUNTIME_SCRIPTS_FORBIDDEN'), JSON.stringify(codes(f)));
}

{
  const dir = makeSkill('runtime', 'rt-wrong-subdir', {
    'SKILL.md': `---
name: rt-wrong-subdir
description: Use when the user asks for it.
applicability: always
---

Read reference/thing.md when you need it.
`,
    'reference/thing.md': '# thing\n',
  });
  check('runtime singular reference/ is an error', codes(run(dir)).includes('RUNTIME_WRONG_SUBDIR'));
}

{
  const dir = makeSkill('runtime', 'rt-cc-field', {
    'SKILL.md': `---
name: rt-cc-field
description: Use when the user asks for it.
applicability: always
allowed-tools: Read
---
body
`,
  });
  check('cc-only field on a runtime skill is an error', codes(run(dir)).includes('RUNTIME_CC_FIELD'));
}

{
  const dir = makeSkill('runtime', 'rt-placeholder', {
    'SKILL.md': `---
name: rt-placeholder
description: Use when the user asks for it.
applicability: always
---

Today is {{currentDate}} and the widget is {{notAllowlisted}}.
`,
  });
  const f = run(dir);
  check('non-allowlisted placeholder is an error', codes(f).includes('RUNTIME_BAD_PLACEHOLDER'));
  check('allowlisted placeholder is accepted',
    !f.some((x) => x.code === 'RUNTIME_BAD_PLACEHOLDER' && x.message.includes('currentDate')));
}

{
  // two sibling runtime skills: the body of one names the other
  const base = path.join(root, 'rt-siblings', 'src', 'config', 'ask_cuvama', 'skills');
  fs.mkdirSync(path.join(base, 'value-case-management'), { recursive: true });
  fs.writeFileSync(path.join(base, 'value-case-management', 'SKILL.md'), '---\nname: value-case-management\ndescription: Use when asked.\n---\nx\n');
  const dir = path.join(base, 'talker');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'SKILL.md'), `---
name: talker
description: Use when the user asks for it.
applicability: always
---

For metrics, see the value-case-management skill.
`);
  check('runtime body naming a sibling skill is an error', codes(run(dir)).includes('RUNTIME_CROSS_SKILL_REF'));
}

{
  const dir = makeSkill('cc', 'desc-use-for', {
    'SKILL.md': `---
name: desc-use-for
description: >
  Search the public web. Use for recent news, market data, and company
  websites.
---
body
`,
  });
  check('"Use for ..." counts as a when-to-use signal',
    !codes(run(dir)).includes('DESC_NO_TRIGGER'));
}

{
  const dir = makeSkill('cc', 'fenced-link', {
    'SKILL.md': `---
name: fenced-link
description: Use when the user asks for it.
---

Cite sources in this shape:

\`\`\`markdown
[Source title, date](url)
\`\`\`
`,
  });
  check('placeholder link inside a fenced block is not a broken link',
    !codes(run(dir)).includes('BROKEN_LINK'));
}

{
  const dir = makeSkill('runtime', 'rt-readonly', {
    'SKILL.md': `---
name: rt-readonly
description: Use for public web lookups.
applicability: always
tools:
  - perplexity_search
---

Call the perplexity_search tool. Never claim you can update or delete a record.
`,
  });
  check('read-only runtime skill is not flagged for propose-then-apply',
    !codes(run(dir)).includes('RUNTIME_MUTATION_NO_PROPOSE'),
    JSON.stringify(codes(run(dir))));
}

{
  const dir = makeSkill('runtime', 'rt-mcp', {
    'SKILL.md': `---
name: rt-mcp
description: Use when the user asks about a value case.
applicability: always
mcp_servers:
  - value_case
---

Answer questions about the value case.
`,
  });
  check('mcp_servers with no enumerable tools yields info, not an error',
    codes(run(dir), 'info').includes('CHECK_MCP_MUTATION')
      && !codes(run(dir), 'error').includes('RUNTIME_MUTATION_NO_PROPOSE'),
    JSON.stringify(codes(run(dir))));
}

{
  const dir = makeSkill('runtime', 'rt-mutation', {
    'SKILL.md': `---
name: rt-mutation
description: Use when the user asks for it.
applicability: always
tools:
  - update_outcome
---

Call the update_outcome tool to update the record.
`,
  });
  const f = run(dir);
  check('mutating runtime skill without propose-then-apply is an error',
    codes(f).includes('RUNTIME_MUTATION_NO_PROPOSE'), JSON.stringify(codes(f)));
}

// ---------------------------------------------------------------- type gating

{
  const dir = path.join(root, 'loose', 'somewhere', 'my-skill');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'SKILL.md'), '---\nname: my-skill\ndescription: Use when asked.\n---\nbody\n');
  check('unknown path with no --type is an error', codes(run(dir)).includes('TYPE_UNKNOWN'));
  check('explicit --type resolves it', !codes(run(dir, { type: 'cc' })).includes('TYPE_UNKNOWN'));
}

{
  check('missing SKILL.md is an error',
    codes(run(path.join(root, 'nope'), { type: 'cc' })).includes('SKILL_MD_MISSING'));
}

// ------------------------------------------------------- build-skill validates

{
  const selfDir = path.resolve(__dirname, '..');
  const f = run(selfDir);
  const errs = f.filter((x) => x.severity === 'error');
  check('build-skill itself passes its own validator', errs.length === 0,
    errs.map((e) => `${e.code} ${e.where || ''} ${e.message}`).join(' | '));
}

// ---------------------------------------------------------------- report

fs.rmSync(root, { recursive: true, force: true });

if (failures.length) {
  process.stdout.write(`\nFAIL - ${passed} passed, ${failures.length} failed\n`);
  for (const f of failures) process.stdout.write(`  x ${f}\n`);
  process.exit(1);
}
process.stdout.write(`\nPASS - ${passed} assertions\n`);
