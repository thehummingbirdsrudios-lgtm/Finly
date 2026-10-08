// Research prototype for the Accounting Model Record, decision A8 (split remainder rule).
// Not product code: the backend and the app's domain layer implement this rule at M7, with property tests.
// Run: node docs/research/controlled-rounding.js   (prints the Angadiya split and a 50,000-case property check)
// Controlled rounding with exact row and column sums, deterministic.
// 1) floor every share r_i*c_j/T; 2) greedy +1 by largest remainder (ties: earlier row, then column);
// 3) if any rupee is still unplaced, deterministic augmenting paths (BFS in row/column order) move +1s between cells
//    that had a fractional part, which always completes (a margin-preserving floor/ceil rounding always exists).
function controlledRound(rows, cols) {
  const T = rows.reduce((a, b) => a + b, 0);
  if (T !== cols.reduce((a, b) => a + b, 0)) throw new Error('totals differ');
  const R = rows.length, C = cols.length;
  const base = [], rem = [], up = [];
  for (let i = 0; i < R; i++) { base.push([]); rem.push([]); up.push([]); for (let j = 0; j < C; j++) {
    const n = rows[i] * cols[j]; const f = Math.floor(n / T); base[i].push(f); rem[i].push(n - f * T); up[i].push(0); } }
  const rowNeed = rows.map((r, i) => r - base[i].reduce((a, b) => a + b, 0));
  const colNeed = cols.map((c, j) => c - base.reduce((a, row) => a + row[j], 0));
  const order = [];
  for (let i = 0; i < R; i++) for (let j = 0; j < C; j++) if (rem[i][j] > 0) order.push([i, j]);
  order.sort((a, b) => rem[b[0]][b[1]] - rem[a[0]][a[1]] || a[0] - b[0] || a[1] - b[1]);
  for (const [i, j] of order) if (rowNeed[i] > 0 && colNeed[j] > 0) { up[i][j] = 1; rowNeed[i]--; colNeed[j]--; }
  // augmenting paths: row(i) -> col(j) if rem>0 and up=0 ; col(j) -> row(k) if up[k][j]=1
  for (let i0 = 0; i0 < R; i0++) {
    while (rowNeed[i0] > 0) {
      const prevCol = new Array(C).fill(-1), prevRow = new Array(R).fill(-2); prevRow[i0] = -1;
      const queue = [i0]; let end = -1;
      for (let q = 0; q < queue.length && end < 0; q++) {
        const i = queue[q];
        for (let j = 0; j < C && end < 0; j++) {
          if (rem[i][j] === 0 || up[i][j] === 1 || prevCol[j] !== -1) continue;
          prevCol[j] = i;
          if (colNeed[j] > 0) { end = j; break; }
          for (let k = 0; k < R; k++) if (up[k][j] === 1 && prevRow[k] === -2) { prevRow[k] = j; queue.push(k); }
        }
      }
      if (end < 0) throw new Error('no augmenting path (cannot happen for valid input)');
      let j = end;
      while (true) { const i = prevCol[j]; up[i][j] = 1; const jPrev = prevRow[i]; if (jPrev === -1) break; up[i][jPrev] = 0; j = jPrev; }
      rowNeed[i0]--; colNeed[end]--;
    }
  }
  return base.map((row, i) => row.map((v, j) => v + up[i][j]));
}
module.exports = controlledRound;
if (require.main === module) {
  const m = controlledRound([10000, 12000, 5000, 3000, 8000, 7000], [30000, 5000, 10000]);
  console.log(JSON.stringify(m));
  let ok = 0, n = 0;
  for (let t = 0; t < 50000; t++) {
    const Rv = Array.from({ length: 1 + (t % 9) }, () => Math.floor(Math.random() * 200000));
    const T = Rv.reduce((a, b) => a + b, 0); if (T === 0) continue;
    const k = 1 + (t % 5); let left = T; const Cv = [];
    for (let j = 0; j < k - 1; j++) { const v = Math.floor(Math.random() * (left + 1)); Cv.push(v); left -= v; } Cv.push(left);
    n++;
    const M = controlledRound(Rv, Cv);
    const exact = M.every((row, i) => row.reduce((a, b) => a + b, 0) === Rv[i]) && Cv.every((c, j) => M.reduce((a, r) => a + r[j], 0) === c);
    const floorCeil = M.every((row, i) => row.every((v, j) => { const x = Rv[i] * Cv[j] / T; return v === Math.floor(x) || v === Math.ceil(x); }));
    const same = JSON.stringify(controlledRound(Rv, Cv)) === JSON.stringify(M);
    if (exact && floorCeil && same) ok++;
  }
  console.log('random cases exact, floor-or-ceil, deterministic:', ok, '/', n);
}
