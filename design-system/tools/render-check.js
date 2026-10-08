// Render check for the reference components: runs every preview's own script against bundle.js in Node,
// unit-tests the rupee formatting, and checks that bundle.css only uses tokens that exist.
// Usage: node render-check.js   (exit code 1 on any failure)
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const ROOT = path.join(__dirname, '..', 'project');
const COMP = path.join(ROOT, 'components');
const failures = [];
const fail = (msg) => failures.push(msg);

// 1. bundle safety + load
const bundle = fs.readFileSync(path.join(COMP, 'bundle.js'), 'utf8');
if (/<\/script/i.test(bundle) || bundle.includes('<!--')) fail('bundle.js contains </script or <!--');
const sandbox = { console, React };
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(bundle, sandbox, { filename: 'bundle.js' });
const F = sandbox.Finly;
if (!F) throw new Error('bundle.js did not assign window.Finly');

// 2. header components <-> folders <-> exports
const header = JSON.parse(bundle.match(/@ds-bundle: (\{.*?\}) \*\//)[1]);
const headerNames = header.components.map((c) => c.name);
const folders = fs.readdirSync(COMP).filter((d) => fs.existsSync(path.join(COMP, d, 'preview.html')) && d !== 'Cover');
for (const n of headerNames) {
  if (typeof F[n] !== 'function') fail(`header lists ${n} but window.Finly.${n} is not a function`);
  if (!folders.includes(n)) fail(`header lists ${n} but components/${n}/ has no preview`);
}
for (const d of folders) {
  const marker = fs.readFileSync(path.join(COMP, d, 'preview.html'), 'utf8').split('\n')[0];
  if (!headerNames.includes(d) && !/\bpage\b/.test(marker)) fail(`components/${d} is neither in the bundle header nor marked page`);
  if (!fs.existsSync(path.join(COMP, d, 'README.md'))) fail(`components/${d} has no README.md`);
}

// 3. formatting units
const eq = (got, want, what) => { if (got !== want) fail(`${what}: got "${got}", want "${want}"`); };
const f = F.format;
eq(f.inr(0), '₹0', 'inr 0'); eq(f.inr(100), '₹100', 'inr 100'); eq(f.inr(1000), '₹1,000', 'inr 1000');
eq(f.inr(20000), '₹20,000', 'inr 20000'); eq(f.inr(100000), '₹1,00,000', 'inr 1 lakh'); eq(f.inr(500000), '₹5,00,000', 'inr 5 lakh');
eq(f.inr(10000000), '₹1,00,00,000', 'inr 1 crore'); eq(f.inr(123456789012), '₹1,23,45,67,89,012', 'inr 12 digits');
eq(f.inr(1.5), '', 'inr rejects fractions'); eq(f.inr(NaN), '', 'inr rejects NaN');
eq(f.words(50000), 'fifty thousand', 'words 50000'); eq(f.words(482000), 'four lakh eighty-two thousand', 'words 482000');
eq(f.words(1200000), 'twelve lakh', 'words 12 lakh'); eq(f.words(105), 'one hundred five', 'words 105');
eq(f.words(123456789), 'twelve crore thirty-four lakh fifty-six thousand seven hundred eighty-nine', 'words crore');
eq(f.range(500000), '₹4–5 lakh', 'range 5 lakh'); eq(f.range(450000), '₹4–5 lakh', 'range 4.5 lakh'); eq(f.range(45000), '₹40–50 thousand', 'range 45k');
eq(f.rounded(482000), '≈ ₹5 lakh', 'rounded 482000');
const moneyHtml = (props) => renderToStaticMarkup(React.createElement(F.Money, props));
if (!moneyHtml({ amount: 1.5 }).includes('Amount unavailable')) fail('Money must refuse fractional rupees');
if (!moneyHtml({ amount: -5 }).includes('Amount unavailable')) fail('Money must refuse negative amounts');
if (!moneyHtml({ amount: 50000, direction: 'in' }).includes('plus fifty thousand rupees, money in')) fail('Money aria-label in words');
if (!moneyHtml({ amount: 50000, direction: 'out' }).includes('− ₹50,000')) fail('Money out uses U+2212 and a narrow no-break space');
if (moneyHtml({ amount: 50000, direction: 'out' }).includes('.00')) fail('Money must never show .00');

// 4. every preview renders with its own script
let rendered = 0;
for (const d of folders) {
  const html = fs.readFileSync(path.join(COMP, d, 'preview.html'), 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  let out = null;
  const ctx = Object.assign(Object.create(null), sandbox, {
    ReactDOM: { createRoot: () => ({ render: (el) => { out = renderToStaticMarkup(el); } }) },
    document: { getElementById: () => ({}) },
  });
  ctx.window = sandbox;
  try {
    vm.runInContext(script, vm.createContext(ctx), { filename: d + '/preview.html' });
  } catch (e) { fail(`${d}: preview threw ${e.message}`); continue; }
  if (!out || out.length < 80) { fail(`${d}: preview rendered nothing useful`); continue; }
  const text = out.replace(/<[^>]+>/g, ' ');
  if (/\bNaN\b|\bundefined\b|\[object Object\]/.test(text)) fail(`${d}: rendered NaN, undefined or [object Object]`);
  if (/₹-|\.00\b/.test(text)) fail(`${d}: rendered a hyphen minus or .00 amount`);
  rendered += 1;
}

// 5. bundle.css uses only tokens that exist
const tokens = JSON.parse(fs.readFileSync(path.join(ROOT, 'tokens.json'), 'utf8'));
const known = new Set(Object.keys(tokens.type.families).map((k) => 'font-' + k));
for (const k of Object.keys(tokens)) if (tokens[k] && Array.isArray(tokens[k].tokens)) tokens[k].tokens.forEach((t) => known.add(t.name));
const css = fs.readFileSync(path.join(COMP, 'bundle.css'), 'utf8');
for (const m of css.matchAll(/var\(--([A-Za-z0-9_.-]+)/g)) if (!known.has(m[1])) fail(`bundle.css uses var(--${m[1]}) which is not a token`);
const typeStyles = new Set(tokens.type.groups.flatMap((g) => g.styles.map((s) => s.name)));
for (const m of bundle.matchAll(/className: '([^']+)'/g)) {
  for (const cls of m[1].split(/\s+/)) if (!cls.startsWith('fy-') && !typeStyles.has(cls)) fail(`bundle.js uses class "${cls}" that is neither fy-* nor a type style`);
}

console.log(`previews rendered: ${rendered}/${folders.length}`);
if (failures.length) { console.log('FAILURES:\n- ' + failures.join('\n- ')); process.exitCode = 1; } else console.log('render check passed');
