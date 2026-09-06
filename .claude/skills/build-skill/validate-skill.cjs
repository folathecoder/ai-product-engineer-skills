#!/usr/bin/env node
'use strict';

/**
 * validate-skill.cjs - mechanical gate for every rule in build-skill that can
 * be checked by a machine. Judgment-level guidance lives in
 * reference/authoring-principles.md; anything checkable lives here.
 *
 * Usage:
 *   node validate-skill.cjs <skill-dir> [--type cc|runtime] [--json] [--strict]
 *
 * Exit codes: 0 = no errors, 1 = at least one error (or a warning with --strict).
 */

const fs = require('fs');
const path = require('path');

const KNOWN_CC_FIELDS = new Set([
  'name', 'description', 'when_to_use', 'argument-hint', 'arguments',
  'disable-model-invocation', 'user-invocable', 'allowed-tools',
  'disallowed-tools', 'model', 'effort', 'context', 'agent', 'background',
  'hooks', 'paths', 'shell', 'metadata', 'license', 'compatibility',
]);

const KNOWN_RUNTIME_FIELDS = new Set([
  'name', 'description', 'applicability', 'tools', 'mcp_servers',
  'license', 'compatibility', 'metadata',
]);

const RUNTIME_TEXT_EXT = new Set([
  '.md', '.markdown', '.txt', '.json', '.csv', '.tsv', '.xml', '.html', '.svg',
]);

const SHELL_BUILTINS = new Set([
  'echo', 'cd', 'test', 'true', 'false', 'set', 'export', 'read', 'if', 'then',
  'else', 'elif', 'fi', 'for', 'while', 'until', 'do', 'done', 'case', 'esac',
  'function', 'return', 'exit', 'local', 'printf', 'eval', 'source', '.',
  '[', '[[', ']', ']]', '{', '}', 'time', 'trap', 'wait',
]);

const MAX_BODY_LINES = 500;
const WARN_BODY_LINES = 350;
const WARN_BODY_TOKENS = 5000;
const DESC_HARD_CAP = 1536;   // Claude Code: description + when_to_use share this
const DESC_SPEC_CAP = 1024;   // open Agent Skills spec cap
const RUNTIME_FILE_CAP = 256 * 1024;

// ---------------------------------------------------------------- findings

function makeReporter() {
  const findings = [];
  const add = (severity) => (code, message, where) =>
    findings.push({ severity, code, message, where: where || null });
  return { findings, error: add('error'), warn: add('warn'), info: add('info') };
}

// ---------------------------------------------------------------- yaml-lite

/**
 * Minimal frontmatter parser. Handles what skill frontmatter actually uses:
 * scalars, quoted scalars, folded/literal block scalars, block sequences,
 * one level of nested mapping, and inline flow maps (kept as raw strings).
 */
function parseFrontmatter(text) {
  if (!text.startsWith('---')) return { ok: false, reason: 'file does not open with ---' };
  const afterOpen = text.indexOf('\n', 3);
  if (afterOpen === -1) return { ok: false, reason: 'unterminated frontmatter' };
  const closeRe = /\n---[ \t]*(\n|$)/;
  const rest = text.slice(afterOpen);
  const m = closeRe.exec(rest);
  if (!m) return { ok: false, reason: 'no closing --- for frontmatter' };
  const raw = rest.slice(0, m.index);
  const body = rest.slice(m.index + m[0].length);
  const fmStartLine = 2; // 1-indexed: line 1 is ---, so keys start at line 2
  const bodyStartLine = text.slice(0, afterOpen + m.index + m[0].length).split('\n').length;

  const lines = raw.split('\n');
  const data = {};
  const lineOf = {};
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || /^\s*#/.test(line)) { i++; continue; }
    const top = /^([A-Za-z0-9_-]+):[ \t]*(.*)$/.exec(line);
    if (!top) { i++; continue; }
    const key = top[1];
    let value = top[2].replace(/[ \t]+#.*$/, '').trim();
    lineOf[key] = fmStartLine + i;

    if (/^[>|][-+]?$/.test(value)) {
      const folded = value[0] === '>';
      const collected = [];
      i++;
      while (i < lines.length && (/^\s+\S/.test(lines[i]) || !lines[i].trim())) {
        collected.push(lines[i].replace(/^ {1,4}/, ''));
        i++;
      }
      while (collected.length && !collected[collected.length - 1].trim()) collected.pop();
      data[key] = folded
        ? collected.join(' ').replace(/\s+/g, ' ').trim()
        : collected.join('\n').trim();
      continue;
    }

    if (value === '') {
      const seq = [];
      const map = {};
      let sawSeq = false;
      let sawMap = false;
      i++;
      while (i < lines.length) {
        const nxt = lines[i];
        if (!nxt.trim()) { i++; continue; }
        if (!/^\s+\S/.test(nxt)) break;
        const item = /^\s+-[ \t]+(.*)$/.exec(nxt);
        const sub = /^\s+([A-Za-z0-9_-]+):[ \t]*(.*)$/.exec(nxt);
        if (item) { sawSeq = true; seq.push(unquote(item[1].trim())); }
        else if (sub) { sawMap = true; map[sub[1]] = unquote(sub[2].trim()); }
        i++;
      }
      if (sawSeq) data[key] = seq;
      else if (sawMap) data[key] = map;
      else data[key] = '';
      continue;
    }

    data[key] = unquote(value);
    i++;
  }
  return { ok: true, data, lineOf, body, bodyStartLine, raw };
}

function unquote(s) {
  if (s.length >= 2 && ((s[0] === '"' && s.endsWith('"')) || (s[0] === "'" && s.endsWith("'")))) {
    return s.slice(1, -1);
  }
  return s;
}

function asList(v) {
  if (v == null || v === '') return [];
  if (Array.isArray(v)) return v;
  return String(v).split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
}

// ---------------------------------------------------------------- helpers

/** Blank out fenced code blocks while preserving line numbering. */
function stripFences(text) {
  let inFence = false;
  return text
    .split('\n')
    .map((line) => {
      if (/^\s*```/.test(line)) { inFence = !inFence; return ''; }
      return inFence ? '' : line;
    })
    .join('\n');
}

function walk(dir, out) {
  out = out || [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function inferType(skillDir, explicit) {
  if (explicit) return explicit;
  const norm = skillDir.split(path.sep).join('/');
  if (/\/ask_cuvama\/skills\//.test(norm + '/')) return 'runtime';
  if (/(^|\/)\.claude\/skills\//.test(norm + '/')) return 'cc';
  if (/(^|\/)skills\//.test(norm + '/') && /plugin/.test(norm)) return 'cc';
  return null;
}

/** Extract ```! fenced blocks and !`cmd` inline commands with line numbers. */
function extractDynamicContext(body, bodyStartLine) {
  const out = [];
  const lines = body.split('\n');
  let inBlock = false;
  let block = null;
  lines.forEach((line, idx) => {
    const lineNo = bodyStartLine + idx;
    if (!inBlock && /^```!\s*$/.test(line.trim())) {
      inBlock = true;
      block = { line: lineNo, commands: [] };
      return;
    }
    if (inBlock) {
      if (/^```\s*$/.test(line.trim())) {
        inBlock = false;
        out.push(block);
        block = null;
      } else if (line.trim()) {
        block.commands.push(line);
      }
      return;
    }
    const inline = /(^|\s)!`([^`]+)`/.exec(line);
    if (inline) out.push({ line: lineNo, commands: [inline[2]] });
  });
  if (inBlock && block) out.push(block);
  return out;
}

function binariesIn(commandLines) {
  const found = new Set();
  // Strip quoted spans first so code passed to an interpreter (node -e "...")
  // is not mistaken for a chain of shell commands.
  const text = commandLines
    .join('\n')
    .replace(/'[^'\n]*'/g, ' ')
    .replace(/"[^"\n]*"/g, ' ');
  const segments = text.split(/\n|\|\||&&|\||;|\$\(|`/);
  for (const seg of segments) {
    const trimmed = seg.replace(/^[\s(){}]+/, '');
    const tok = /^([A-Za-z_][A-Za-z0-9_.\-/]*)/.exec(trimmed);
    if (!tok) continue;
    const bin = path.basename(tok[1]);
    if (SHELL_BUILTINS.has(bin)) continue;
    if (/^[A-Z_]+=/.test(trimmed)) continue;
    found.add(bin);
  }
  return found;
}

function allowedBashBinaries(allowedTools) {
  const entries = Array.isArray(allowedTools)
    ? allowedTools
    : String(allowedTools || '').split(',').map((s) => s.trim()).filter(Boolean);
  const bins = new Set();
  let unscoped = false;
  for (const e of entries) {
    const m = /^Bash\(([^:)]+)(?::[^)]*)?\)$/.exec(e.trim());
    if (m) { bins.add(path.basename(m[1].trim())); continue; }
    if (/^Bash$/.test(e.trim()) || /^Bash\(\*\)$/.test(e.trim())) unscoped = true;
  }
  return { bins, unscoped };
}

// ---------------------------------------------------------------- checks

function validate(skillDir, opts) {
  const r = makeReporter();
  const dirName = path.basename(path.resolve(skillDir));
  const skillMd = path.join(skillDir, 'SKILL.md');

  if (!fs.existsSync(skillMd)) {
    r.error('SKILL_MD_MISSING', `no SKILL.md in ${skillDir}`, 'SKILL.md');
    return r.findings;
  }

  const text = fs.readFileSync(skillMd, 'utf8');
  const fm = parseFrontmatter(text);
  if (!fm.ok) {
    r.error('FRONTMATTER_PARSE', `frontmatter did not parse: ${fm.reason}`, 'SKILL.md:1');
    return r.findings;
  }

  const type = inferType(path.resolve(skillDir), opts.type);
  if (!type) {
    r.error('TYPE_UNKNOWN', 'cannot infer skill type from path; pass --type cc|runtime');
  }

  checkIdentity(r, fm, dirName);
  checkDescription(r, fm);
  checkFields(r, fm, type);
  checkBudget(r, fm, text);
  checkFormatting(r, skillDir);
  checkBundledFiles(r, skillDir, fm, type);
  checkEvals(r, skillDir);
  if (type === 'cc') checkCc(r, skillDir, fm);
  if (type === 'runtime') checkRuntime(r, skillDir, fm);

  return r.findings;
}

function checkIdentity(r, fm, dirName) {
  const name = fm.data.name;
  const at = fm.lineOf.name ? `SKILL.md:${fm.lineOf.name}` : 'SKILL.md';
  if (!name) { r.error('NAME_MISSING', 'frontmatter has no name', 'SKILL.md'); return; }
  if (name.length > 64) r.error('NAME_FORMAT', `name is ${name.length} chars, cap is 64`, at);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
    r.error('NAME_FORMAT', `name "${name}" must be lowercase a-z0-9 with single internal hyphens`, at);
  }
  if (name !== dirName) {
    r.error('NAME_DIR_MISMATCH', `name "${name}" does not match directory "${dirName}"`, at);
  }
}

function checkDescription(r, fm) {
  const desc = fm.data.description;
  const when = fm.data.when_to_use || '';
  const at = fm.lineOf.description ? `SKILL.md:${fm.lineOf.description}` : 'SKILL.md';
  if (!desc || !String(desc).trim()) {
    r.error('DESC_MISSING', 'frontmatter has no description - nothing will trigger this skill', 'SKILL.md');
    return;
  }
  const combined = String(desc).length + String(when).length;
  if (combined > DESC_HARD_CAP) {
    r.error('DESC_TOO_LONG',
      `description + when_to_use is ${combined} chars; Claude Code truncates past ${DESC_HARD_CAP}`, at);
  } else if (combined > DESC_SPEC_CAP) {
    r.warn('DESC_OVER_SPEC_CAP',
      `description + when_to_use is ${combined} chars; over the ${DESC_SPEC_CAP}-char open-spec cap (fine for Claude Code only)`, at);
  }
  const triggerText = `${desc} ${when}`.toLowerCase();
  if (!/(use when|use for|use it when|use it for|use this when|use this for|when the user|when you|trigger)/.test(triggerText)) {
    r.error('DESC_NO_TRIGGER',
      'description states what it does but never when to use it; add "Use when..." with concrete trigger phrases', at);
  }
  const firstSentence = String(desc).split(/(?<=[.!?])\s/)[0] || '';
  if (firstSentence.length > 240) {
    r.warn('DESC_FRONT_LOADED',
      `first sentence is ${firstSentence.length} chars; lead with the use case since the tail can be budget-truncated`, at);
  }
}

function checkFields(r, fm, type) {
  if (!type) return;
  const known = type === 'cc' ? KNOWN_CC_FIELDS : KNOWN_RUNTIME_FIELDS;
  for (const key of Object.keys(fm.data)) {
    if (!known.has(key)) {
      r.warn('UNKNOWN_FIELD',
        `"${key}" is not a recognised ${type} frontmatter field (see assets/frontmatter-reference.md)`,
        `SKILL.md:${fm.lineOf[key] || 1}`);
    }
  }
  if (type === 'runtime') {
    for (const ccOnly of ['argument-hint', 'allowed-tools', 'context', 'model', 'effort', 'paths', 'hooks']) {
      if (fm.data[ccOnly] != null) {
        r.error('RUNTIME_CC_FIELD',
          `"${ccOnly}" is a Claude Code field; the Ask Cuvama runtime ignores it`,
          `SKILL.md:${fm.lineOf[ccOnly] || 1}`);
      }
    }
  }
}

function checkBudget(r, fm, text) {
  const totalLines = text.split('\n').length;
  const words = fm.body.split(/\s+/).filter(Boolean).length;
  const approxTokens = Math.round(words * 1.35);
  if (totalLines > MAX_BODY_LINES) {
    r.error('BODY_TOO_LONG',
      `SKILL.md is ${totalLines} lines; cap is ${MAX_BODY_LINES}. Move detail into reference/ with a load trigger`);
  } else if (totalLines > WARN_BODY_LINES) {
    r.warn('BODY_LONG', `SKILL.md is ${totalLines} lines; approaching the ${MAX_BODY_LINES}-line cap`);
  }
  if (approxTokens > WARN_BODY_TOKENS) {
    r.warn('BODY_TOKENS_HIGH',
      `body is roughly ${approxTokens} tokens (${words} words); target is under ${WARN_BODY_TOKENS}`);
  }
}

function checkFormatting(r, skillDir) {
  for (const file of walk(skillDir)) {
    if (!/\.(md|markdown)$/i.test(file)) continue;
    const rel = path.relative(skillDir, file);
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, idx) => {
      if (/[—–]/.test(line)) {
        r.error('EM_DASH', 'em dash or en dash found; use a plain hyphen', `${rel}:${idx + 1}`);
      }
      if (/[‘’“”]/.test(line)) {
        r.error('SMART_QUOTE', 'smart quote found; use straight quotes', `${rel}:${idx + 1}`);
      }
    });
  }
}

function checkBundledFiles(r, skillDir, fm, type) {
  const mdFiles = walk(skillDir).filter((f) => /\.(md|markdown)$/i.test(f));
  const allProse = mdFiles.map((f) => ({ rel: path.relative(skillDir, f), text: fs.readFileSync(f, 'utf8') }));

  // 1. every relative link target must exist (outside fenced code blocks, which
  //    legitimately hold placeholder links inside output templates)
  for (const { rel, text: rawText } of allProse) {
    const text = stripFences(rawText);
    const dir = path.dirname(path.join(skillDir, rel));
    const linkRe = /\[[^\]]*\]\(([^)#\s]+)(?:#[^)]*)?\)/g;
    let m;
    while ((m = linkRe.exec(text)) !== null) {
      const target = m[1];
      if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('/')) continue;
      const resolved = path.resolve(dir, target.replace(/^`|`$/g, ''));
      if (!fs.existsSync(resolved)) {
        const lineNo = text.slice(0, m.index).split('\n').length;
        r.error('BROKEN_LINK', `link target "${target}" does not exist`, `${rel}:${lineNo}`);
      }
    }
  }

  // 2. every bundled support file must be mentioned, with a WHEN trigger
  const supportDirs = ['reference', 'references', 'assets', 'scripts'];
  const skillMdText = fs.readFileSync(path.join(skillDir, 'SKILL.md'), 'utf8');
  for (const sub of supportDirs) {
    const dir = path.join(skillDir, sub);
    if (!fs.existsSync(dir)) continue;
    for (const file of walk(dir)) {
      const rel = path.relative(skillDir, file).split(path.sep).join('/');
      const base = path.basename(file);
      const mentionedAnywhere = allProse.some(
        (p) => p.rel.split(path.sep).join('/') !== rel && (p.text.includes(rel) || p.text.includes(base)),
      );
      if (!mentionedAnywhere) {
        r.error('UNREFERENCED_FILE',
          `${rel} is bundled but no prose file mentions it; the agent will never load it`, rel);
        continue;
      }
      if (!skillMdText.includes(rel) && !skillMdText.includes(base)) continue; // referenced from a reference doc
      const hit = skillMdText.split('\n').findIndex((l) => l.includes(rel) || l.includes(base));
      const window = skillMdText.split('\n').slice(Math.max(0, hit - 1), hit + 2).join(' ');
      if (!/\b(load|read|open|before|when|if|after|until)\b/i.test(window)) {
        r.warn('NO_LOAD_TRIGGER',
          `${rel} is referenced without a WHEN trigger; say what condition should make the agent load it`,
          `SKILL.md:${hit + 1}`);
      }
    }
  }

  // 3. scripts imply a self-test gate (per the repo rule)
  if (type === 'cc') {
    const scripts = walk(skillDir).filter(
      (f) => /\.(cjs|mjs|js|ts|sh|py)$/i.test(f) && !/[/\\]test[/\\]/.test(f),
    );
    if (scripts.length && !fs.existsSync(path.join(skillDir, 'test', 'self-test.cjs'))) {
      r.error('SCRIPT_NO_SELFTEST',
        `skill bundles ${scripts.length} script(s) but has no test/self-test.cjs regression gate`);
    }
  }
}

function checkEvals(r, skillDir) {
  const file = path.join(skillDir, 'evals', 'evals.json');
  if (!fs.existsSync(file)) {
    r.warn('EVALS_MISSING',
      'no evals/evals.json; triggering and output quality cannot be measured or defended against regression',
      'evals/evals.json');
    return;
  }
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    r.error('EVALS_SHAPE', `evals/evals.json is not valid JSON: ${err.message}`, 'evals/evals.json');
    return;
  }
  const cases = Array.isArray(parsed) ? parsed : parsed.cases;
  if (!Array.isArray(cases) || cases.length === 0) {
    r.error('EVALS_SHAPE', 'evals/evals.json has no cases array', 'evals/evals.json');
    return;
  }
  cases.forEach((c, idx) => {
    if (!c || typeof c.prompt !== 'string' || !c.prompt.trim()) {
      r.error('EVALS_SHAPE', `case ${idx} has no prompt`, 'evals/evals.json');
    }
    if (c && c.should_trigger === undefined) {
      r.warn('EVALS_SHAPE', `case ${idx} does not declare should_trigger`, 'evals/evals.json');
    }
  });
  const negatives = cases.filter((c) => c && c.should_trigger === false).length;
  if (negatives === 0) {
    r.warn('EVALS_NO_NEGATIVE',
      'no near-miss case with should_trigger false; false-triggering will go undetected',
      'evals/evals.json');
  }
}

function checkCc(r, skillDir, fm) {
  const blocks = extractDynamicContext(fm.body, fm.bodyStartLine);
  const { bins, unscoped } = allowedBashBinaries(fm.data['allowed-tools']);
  for (const block of blocks) {
    const used = binariesIn(block.commands);
    if (!unscoped) {
      for (const bin of used) {
        if (!bins.has(bin)) {
          r.warn('BASH_NOT_ALLOWED',
            `Dynamic Context runs "${bin}" but allowed-tools has no Bash(${bin}:*)`,
            `SKILL.md:${block.line}`);
        }
      }
    }
    const joined = block.commands.join('\n');
    if (!/2>\/dev\/null|\|\||2>&1/.test(joined)) {
      r.warn('DYNCTX_UNGUARDED',
        'Dynamic Context block has no 2>/dev/null or || fallback; a missing prerequisite will leak a raw error',
        `SKILL.md:${block.line}`);
    }
  }
  if (/\$(ARGUMENTS|[0-9])/.test(fm.body) && fm.data['argument-hint'] == null && fm.data.arguments == null) {
    r.warn('ARGS_NO_HINT',
      'body uses $ARGUMENTS or a positional but frontmatter declares neither argument-hint nor arguments');
  }
  const readOnly = !/\b(Edit|Write|NotebookEdit)\b/.test(String(fm.data['allowed-tools'] || ''));
  const mutatesProse = /\b(write|edit|create the file|apply the change)\b/i.test(fm.body);
  if (readOnly && mutatesProse && fm.data['disallowed-tools'] == null) {
    r.info('CONSIDER_DISALLOWED_TOOLS',
      'skill reads as read-only but Edit/Write remain in the pool; disallowed-tools actually removes them');
  }
}

function checkRuntime(r, skillDir, fm) {
  if (fs.existsSync(path.join(skillDir, 'scripts'))) {
    r.error('RUNTIME_SCRIPTS_FORBIDDEN',
      'runtime skills cannot execute anything; the loader ignores scripts/. Move computation into a backend tool',
      'scripts/');
  }
  for (const sub of ['references', 'assets']) {
    const dir = path.join(skillDir, sub);
    if (!fs.existsSync(dir)) continue;
    for (const file of walk(dir)) {
      const rel = path.relative(skillDir, file);
      const ext = path.extname(file).toLowerCase();
      if (!RUNTIME_TEXT_EXT.has(ext)) {
        r.warn('RUNTIME_BINARY_ASSET',
          `${rel} is not a readable text type; it can be listed but never read into the model`, rel);
      }
      const size = fs.statSync(file).size;
      if (size > RUNTIME_FILE_CAP) {
        r.error('FILE_TOO_LARGE',
          `${rel} is ${Math.round(size / 1024)} KB; the per-file cap is 256 KB`, rel);
      }
    }
  }
  if (fs.existsSync(path.join(skillDir, 'reference'))) {
    r.error('RUNTIME_WRONG_SUBDIR',
      'runtime skills use references/ (plural); the loader does not enumerate reference/', 'reference/');
  }

  const siblings = fs.existsSync(path.join(skillDir, '..'))
    ? fs.readdirSync(path.join(skillDir, '..'), { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .filter((n) => n !== path.basename(path.resolve(skillDir)))
    : [];
  const bodyLines = fm.body.split('\n');
  for (const sib of siblings) {
    bodyLines.forEach((line, idx) => {
      if (line.includes(sib)) {
        r.error('RUNTIME_CROSS_SKILL_REF',
          `body names another skill ("${sib}"); the agent has not loaded it and cannot resolve the pointer. Restate the instruction`,
          `SKILL.md:${fm.bodyStartLine + idx}`);
      }
    });
  }

  // Mutation is decided by the DECLARED tools, not by prose: a read-only skill
  // may legitimately discuss updating a record without being able to do it.
  const MUTATION_TOOL = /^(create|update|delete|add|remove|set|patch|post|put|save|edit|write|upsert|assign|link|unlink|archive|move|rename)[_-]/i;
  const declaredTools = asList(fm.data.tools);
  const mutatingTools = declaredTools.filter((t) => MUTATION_TOOL.test(t));
  const hasPropose = /propose/i.test(fm.body);
  if (mutatingTools.length && !hasPropose) {
    r.error('RUNTIME_MUTATION_NO_PROPOSE',
      `declares mutating tool(s) ${mutatingTools.join(', ')} but the body never describes the propose-then-apply pattern`);
  }
  if (mutatingTools.length && !/reliability rules/i.test(fm.body)) {
    r.warn('RUNTIME_NO_RELIABILITY_RULES',
      'mutating runtime skill has no "## Reliability rules" section for its hard negative constraints');
  }
  if (!mutatingTools.length && asList(fm.data.mcp_servers).length && !hasPropose) {
    r.info('CHECK_MCP_MUTATION',
      `declares mcp_servers (${asList(fm.data.mcp_servers).join(', ')}) whose tool names are not enumerable here; if any of them mutate state, the body needs propose-then-apply`);
  }
  const braces = fm.body.match(/\{\{?([a-zA-Z][a-zA-Z0-9_]*)\}?\}/g) || [];
  const allowed = new Set(['{{currentDate}}', '{{currentYear}}', '{valueCaseContext}', '{webSearchTool}']);
  for (const b of braces) {
    if (!allowed.has(b)) {
      r.error('RUNTIME_BAD_PLACEHOLDER',
        `"${b}" is not an allowlisted placeholder; the backend rejects the skill at parse time and it is absent from every chat`);
    }
  }
}

// ---------------------------------------------------------------- cli

function main(argv) {
  const args = argv.slice(2);
  const opts = { json: false, strict: false, type: null, dirs: [] };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--json') opts.json = true;
    else if (a === '--strict') opts.strict = true;
    else if (a === '--type') opts.type = args[++i];
    else if (a === '--help' || a === '-h') { usage(); return 0; }
    else opts.dirs.push(a);
  }
  if (opts.dirs.length === 0) { usage(); return 2; }
  if (opts.type && !['cc', 'runtime'].includes(opts.type)) {
    process.stderr.write(`unknown --type "${opts.type}" (expected cc or runtime)\n`);
    return 2;
  }

  const results = opts.dirs.map((dir) => ({
    skill: dir,
    findings: fs.existsSync(dir)
      ? validate(dir, opts)
      : [{ severity: 'error', code: 'DIR_MISSING', message: `no such directory: ${dir}`, where: null }],
  }));

  if (opts.json) {
    process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
  } else {
    for (const { skill, findings } of results) {
      const errors = findings.filter((f) => f.severity === 'error');
      const warns = findings.filter((f) => f.severity === 'warn');
      const infos = findings.filter((f) => f.severity === 'info');
      process.stdout.write(`\n${skill}\n`);
      if (!findings.length) process.stdout.write('  PASS - no findings\n');
      for (const f of [...errors, ...warns, ...infos]) {
        const tag = f.severity === 'error' ? 'ERROR' : f.severity === 'warn' ? 'WARN ' : 'INFO ';
        const where = f.where ? ` [${f.where}]` : '';
        process.stdout.write(`  ${tag} ${f.code}${where}\n         ${f.message}\n`);
      }
      process.stdout.write(`  ${errors.length} error(s), ${warns.length} warning(s), ${infos.length} info\n`);
    }
  }

  const all = results.flatMap((x) => x.findings);
  const hasError = all.some((f) => f.severity === 'error');
  const hasWarn = all.some((f) => f.severity === 'warn');
  return hasError || (opts.strict && hasWarn) ? 1 : 0;
}

function usage() {
  process.stdout.write(`Usage: node validate-skill.cjs <skill-dir>... [--type cc|runtime] [--json] [--strict]

Checks every mechanical rule in build-skill: frontmatter shape and field names,
description trigger text and length caps, body budget, formatting, broken links,
unreferenced or trigger-less bundled files, script/self-test pairing, eval set
presence, Dynamic Context permission coverage, and the runtime-only constraints
(no scripts, references/ naming, no cross-skill pointers, placeholder allowlist,
propose-then-apply for mutations).

Exit 1 on any error, or on any warning with --strict.
`);
}

if (require.main === module) process.exit(main(process.argv));
module.exports = { validate, parseFrontmatter, extractDynamicContext, binariesIn, allowedBashBinaries };
