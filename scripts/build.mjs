#!/usr/bin/env node
// Idempotent build: renders every campaigns/*.json into out/ when it is pending.
//   node scripts/build.mjs          build pending campaigns, update out/.manifest.json and out/index.html
//   node scripts/build.mjs --check  build nothing; exit 1 if anything is pending or fails
// A campaign is pending when an output file is missing or its source hash, the facet
// library hash, or the emails tool commit differs from out/.manifest.json.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';

const check = process.argv.includes('--check');
const tool = resolve(process.env.EMAILS_DIR || '../emails');
const sha = (s) => createHash('sha256').update(s).digest('hex');
const run = (script, file) =>
  execFileSync('node', [`${tool}/render/${script}`, file], { encoding: 'utf8', maxBuffer: 1 << 26 });

const facetsText = readFileSync('iterable/facets.json', 'utf8');
const facets = {};
for (const [cat, names] of Object.entries(JSON.parse(facetsText)))
  for (const [name, f] of Object.entries(names)) facets[`${cat}.${name}`] = f;
const toolCommit = execFileSync('git', ['-C', tool, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();

// Facet condition -> [open tag, close tag, negate]
function cond(id) {
  const f = facets[id];
  if (!f || !f.approved) throw new Error(`facet ${id} is missing or not approved`);
  const test = f.condition.test;
  return { test, helper: test.split(' ')[0], negate: !!f.condition.negate };
}

// Convert one audience chain into Handlebars; `cases` = [{ruleset|null, content}]
function convertChain(cases) {
  const go = (i) => {
    if (i >= cases.length) return '';
    const { ruleset, content } = cases[i];
    if (ruleset === null) return content; // else
    const no = go(i + 1);
    const wrap = (ids) => {
      if (!ids.length) return content;
      const c = cond(ids[0]);
      const inner = wrap(ids.slice(1));
      const [yes, other] = c.negate ? [no, inner] : [inner, no];
      return `{{#${c.test}}}${yes}${other ? `{{else}}${other}` : ''}{{/${c.helper}}}`;
    };
    return wrap(ruleset.split(' + ').map((s) => s.trim()));
  };
  return go(0);
}

function toIterable(html) {
  const re = /<!--audience (?:if|elseif|else|end)(?:="[^"]*")?-->/g;
  const out = [];
  let last = 0, cases = null, cur = null;
  for (const m of html.matchAll(re)) {
    const seg = html.slice(last, m.index);
    const kind = m[0].match(/audience (\w+)/)[1];
    const rs = m[0].match(/="([^"]*)"/)?.[1] ?? null;
    if (cur) cur.content = seg; else out.push(seg);
    if (kind === 'end') { out.push(convertChain(cases)); cases = null; cur = null; }
    else {
      if (kind === 'if') cases = [];
      cur = { ruleset: kind === 'else' ? null : rs, content: '' };
      cases.push(cur);
    }
    last = m.index + m[0].length;
  }
  out.push(html.slice(last));
  const res = out.join('');
  const opens = (res.match(/\{\{#/g) || []).length, closes = (res.match(/\{\{\//g) || []).length;
  if (res.includes('<!--audience') || opens !== closes) throw new Error('unbalanced audience/handlebars markers');
  return res;
}

const manifestPath = 'out/.manifest.json';
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};
const pending = [], failed = [];

for (const file of readdirSync('campaigns').filter((f) => f.endsWith('.json')).sort()) {
  const name = basename(file, '.json');
  const src = readFileSync(`campaigns/${file}`, 'utf8');
  const want = { source_sha256: sha(src), facets_sha256: sha(facetsText), tool_commit: toolCommit };
  const have = manifest[name];
  const outputs = [`out/${name}.html`, `out/${name}.iterable.html`];
  if (have && Object.entries(want).every(([k, v]) => have[k] === v) && outputs.every(existsSync)) continue;
  pending.push(name);
  if (check) continue;
  try {
    const issues = JSON.parse(run('check.js', `campaigns/${file}`).trim() || '[]');
    const errors = issues.filter((i) => i.severity === 'error');
    if (errors.length) throw new Error('check.js errors: ' + JSON.stringify(errors));
    const html = run('email.js', `campaigns/${file}`);
    const unsettled = issues.filter((i) => i.code === 'ruleset_unsettled');
    if (unsettled.length) throw new Error(`unsettled rulesets in blocks ${unsettled.map((i) => i.block).join(', ')}`);
    const iterable = toIterable(html);
    mkdirSync('out', { recursive: true });
    writeFileSync(outputs[0], html);
    writeFileSync(outputs[1], iterable);
    manifest[name] = want;
    const used = [...new Set([...html.matchAll(/="([^"]*)"-->/g)].flatMap((m) => m[1].split(' + ')))];
    console.log(`built ${name} (facets: ${used.join(', ') || 'none'})`);
    addToIndex(name, JSON.parse(src).name);
  } catch (e) {
    failed.push(name);
    console.error(`FAILED ${name}: ${e.message}`);
  }
}

function addToIndex(name, title) {
  const p = 'out/index.html';
  let idx = existsSync(p) ? readFileSync(p, 'utf8') : null;
  if (!idx) return;
  if (idx.includes(`href="${name}.html"`)) return;
  const h = title.replace(/\s*\(example\)\s*$/, '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const sec = `<h2>${h} <small>(${name})</small></h2>\n<ul>\n` +
    `  <li><a href="${name}.html">Email HTML</a> <small>with audience markers</small></li>\n` +
    `  <li><a href="${name}.iterable.html">Iterable HTML</a> <small>paste into Iterable</small></li>\n</ul>\n`;
  writeFileSync(p, idx.replace('</body>', sec + '</body>'));
}

if (!check) writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
if (check && pending.length) console.error(`stale or unbuilt: ${pending.join(', ')}`);
if (!pending.length) console.log('nothing pending');
process.exit(failed.length || (check && pending.length) ? 1 : 0);
