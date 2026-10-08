// WCAG 2 contrast check for every text/surface, mark/surface and status/soft pair, light and dark.
// Usage: node contrast.js palette.json [all]   (exit code 1 when any pair fails)
const P = JSON.parse(require('fs').readFileSync(process.argv[2], 'utf8'));
const lum = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((a, v, i) => a + v * [.2126, .7152, .0722][i], 0); };
const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };
const grounds = ['surface', 'surface-raised', 'surface-sunken'];
const text = ['ink', 'ink-muted', 'brand', 'money-in', 'money-out', 'transfer', 'pending', 'blocked', 'reversed', 'outstanding', 'reconciled', 'exception'];
const marks = ['line-strong', 'accent', 'brand'];
const status = ['money-in', 'money-out', 'transfer', 'pending', 'blocked', 'reversed', 'outstanding', 'reconciled', 'exception'];
let fails = 0, rows = [];
const check = (fg, bg, min, t) => { const r = cr(P[fg][t], P[bg][t]); const ok = r >= min; if (!ok) fails++; rows.push(`${ok ? 'ok  ' : 'FAIL'} ${['light', 'dark'][t].padEnd(5)} ${fg.padEnd(12)} on ${bg.padEnd(17)} ${r.toFixed(2).padStart(5)} (min ${min})`); };
for (const t of [0, 1]) {
  for (const g of grounds) { for (const f of text) check(f, g, 4.5, t); for (const m of marks) check(m, g, 3, t); }
  for (const s of status) check(s, s + '-soft', 4.5, t);
  check('ink', 'brand-soft', 4.5, t); check('brand', 'brand-soft', 4.5, t);
  check('on-brand', 'brand', 4.5, t); check('on-accent', 'accent', 4.5, t);
  for (const s of status) check('ink', s + '-soft', 4.5, t);
}
console.log(rows.filter(r => process.argv[3] === 'all' || r.startsWith('FAIL')).join('\n') || 'no failures');
console.log(`${rows.length} pairs checked, ${fails} failing`);
// lightness separation of money-in vs money-out (colour-blind safety is via icon+sign+label; report for the record)
for (const t of [0, 1]) console.log(['light', 'dark'][t], 'in vs out', cr(P['money-in'][t], P['money-out'][t]).toFixed(2), '| reconciled vs blocked', cr(P.reconciled[t], P.blocked[t]).toFixed(2));
process.exitCode = fails ? 1 : 0;
