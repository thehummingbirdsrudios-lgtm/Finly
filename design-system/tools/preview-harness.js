// Builds local review pages for every preview (and the cover), in light and dark, in design-system/.review/ (ignored).
// It compiles tokens.css the way format.md describes, so previews render as they will on the published page.
// Usage: node preview-harness.js   writes design-system/.review/ (ignored by Git); serve design-system/ over HTTP
// and open /.review/index-light.html or /.review/index-dark.html
const fs = require('fs');
const path = require('path');

const out = path.join(__dirname, '..', '.review');
const ROOT = path.join(__dirname, '..', 'project');
const COMP = path.join(ROOT, 'components');
const tokens = JSON.parse(fs.readFileSync(path.join(ROOT, 'tokens.json'), 'utf8'));

function colorValue(v) { return /^\{.+\}$/.test(v) ? `var(--${v.slice(1, -1)})` : v; }
function compileTokens() {
  const themes = tokens.color.themes.map((t) => t.id);
  const perTheme = Object.fromEntries(themes.map((t) => [t, []]));
  const themed = [...tokens.color.tokens, ...(tokens.shadow ? tokens.shadow.tokens : [])];
  for (const t of themed) {
    for (const th of themes) {
      const raw = typeof t.value === 'string' ? (th === themes[0] ? t.value : null) : t.value[th];
      if (raw != null) perTheme[th].push(`--${t.name}: ${colorValue(raw)};`);
    }
  }
  let css = `:root, [data-theme="${themes[0]}"] { ${perTheme[themes[0]].join(' ')} }\n`;
  for (const th of themes.slice(1)) css += `[data-theme="${th}"] { ${perTheme[th].join(' ')} }\n`;
  const plain = [];
  for (const k of Object.keys(tokens)) {
    if (['color', 'shadow', 'type'].includes(k) || !tokens[k] || !Array.isArray(tokens[k].tokens)) continue;
    for (const t of tokens[k].tokens) plain.push(`--${t.name}: ${t.value};`);
  }
  for (const [k, stack] of Object.entries(tokens.type.families)) plain.push(`--font-${k}: ${stack};`);
  css += `:root { ${plain.join(' ')} }\n`;
  for (const g of tokens.type.groups) {
    for (const s of g.styles) {
      css += `.${s.name} { font-family: var(--font-${s.family || g.family}); font-size: ${s.fontSize}; line-height: ${s.lineHeight}; font-weight: ${s.fontWeight};${s.letterSpacing ? ` letter-spacing: ${s.letterSpacing};` : ''} }\n`;
    }
  }
  return css;
}

const tokensCss = compileTokens();
// Relative to .review/<theme>/<Name>.html when design-system/ is served over HTTP.
const head = () => `<style>${tokensCss}</style>
<link rel="stylesheet" href="../../project/components/bundle.css">
<script src="../../tools/node_modules/react/umd/react.production.min.js"></script>
<script src="../../tools/node_modules/react-dom/umd/react-dom.production.min.js"></script>
<script src="../../project/components/bundle.js"></script>`;

const names = ['Cover', ...fs.readdirSync(COMP).filter((d) => d !== 'Cover' && fs.existsSync(path.join(COMP, d, 'preview.html')))];
for (const theme of ['light', 'dark']) {
  const dir = path.join(out, theme);
  fs.mkdirSync(dir, { recursive: true });
  const frames = [];
  for (const n of names) {
    const src = fs.readFileSync(path.join(COMP, n, 'preview.html'), 'utf8');
    const height = Number((src.split('\n')[0].match(/height=(\d+)/) || [])[1] || 120);
    const page = src.replace('<html', `<html data-theme="${theme}"`).replace('<head>', `<head>${head()}`);
    fs.writeFileSync(path.join(dir, n + '.html'), page);
    frames.push(`<section id="${n}"><h2>${n}</h2><iframe src="${theme}/${n}.html" style="width:960px;height:${height}px;border:1px solid #888"></iframe></section>`);
  }
  fs.writeFileSync(path.join(out, `index-${theme}.html`), `<!doctype html><meta charset="utf-8"><title>Finely previews (${theme})</title>
<style>body{font:14px system-ui;margin:16px;background:${theme === 'dark' ? '#000' : '#fff'};color:${theme === 'dark' ? '#fff' : '#000'}} h2{margin:24px 0 4px}</style>${frames.join('\n')}`);
}
fs.writeFileSync(path.join(out, 'tokens.css'), tokensCss);
console.log(`harness: ${names.length} previews × 2 themes in ${out}`);
