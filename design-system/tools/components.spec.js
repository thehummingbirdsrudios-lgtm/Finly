// Source for every components/<Name>/README.md and preview.html. Edit here, then run make-components.js.
// Demo data uses only the build spec's F3 seed examples (Mint, JSK, Tijori, Krish Patel, Father, Sujal, Savan...).
// `code` is the body of the preview script: F = window.Finely, h = React.createElement.

const TX_IN = "{ id: 'TX-20261008-001245', from: 'Mint', to: 'Tijori', amount: 5000, direction: 'in', reason: 'Cash received from Mint', date: '08 Oct 2026', day: 'Thursday', time: '10:15 AM', handler: 'Krish Patel', fund: 'Mint Fund' }";

module.exports = [
  {
    name: 'Icon', group: 'Foundations', height: 380,
    readme: `Every glyph the system uses, drawn on a 24px grid with a 1.8px rounded stroke in \`currentColor\`.

These are reference stand-ins. The app uses Flutter's built-in Material icons, Rounded style, mapped name by name in the brand book's Iconography section. Pass \`label\` only when the icon is the whole control's meaning (an icon-only button already has its own label); otherwise icons are hidden from screen readers because the text beside them carries the meaning.

- Provide: \`name\` (see the grid), optional \`size\` (default 24, badges 16, dense rows 20), optional \`label\`.
- Never colour an icon to carry meaning on its own: financial icons always sit next to a word, a sign or both.`,
    code: "h('div', { className: 'fy-icon-grid' }, F.iconNames.map(function (n) { return h('figure', { key: n, className: 'fy-icon-cell' }, h(F.Icon, { name: n }), h('figcaption', { className: 'caption fy-muted' }, n)); }))",
  },
  {
    name: 'Money', group: 'Money', height: 300,
    readme: `The amount, always the strongest element on its screen: whole rupees, Indian grouping, a sign and a colour that both say the direction.

- Provide: \`amount\` (a whole-rupee integer from the server), \`direction\` (\`in\`, \`out\`, \`transfer\`, or none for a plain balance), \`size\` (\`hero\`, \`lg\`, \`md\`, \`sm\`), \`visibility\` (\`full\`, \`rounded\`, \`range\`, \`hidden\`, \`existence\`), \`struck\` for a reversed original.
- \`+ ₹50,000\` is money into the place being viewed (Avak); \`− ₹50,000\` is money out (Javak); a transfer has no sign. The sign and the arrow beside the amount carry the meaning; colour only repeats it.
- Never show paise, \`.00\`, a hyphen as the minus, or a negative balance as \`-₹\`. Values that are not whole rupees render "Amount unavailable".
- Masked modes are rendered from text the server sends (\`display\`). The client never receives the full amount for a field the viewer may not see, so the rounded and range helpers here exist only for previews.
- Screen readers hear the amount in words: "plus fifty thousand rupees, money in".`,
    code: "h('div', { className: 'fy-stack' }, h('div', { className: 'fy-demo' }, h(F.Money, { amount: 50000, direction: 'in', size: 'lg' }), h(F.Money, { amount: 50000, direction: 'out', size: 'lg' }), h(F.Money, { amount: 500000, direction: 'transfer', size: 'lg' }), h(F.Money, { amount: 5000, direction: 'in', size: 'lg', struck: true })), h('div', { className: 'fy-spec' }, [['Full', 'full'], ['Rounded', 'rounded'], ['Range', 'range'], ['Hidden', 'hidden'], ['Existence only', 'existence']].map(function (m) { return h('div', { key: m[1], className: 'fy-spec-row' }, h('span', { className: 'label fy-muted' }, m[0]), h(F.Money, { amount: 482000, visibility: m[1], size: 'md' })); })))",
  },
  {
    name: 'StatusBadge', group: 'Money', height: 200,
    readme: `One word and one icon for where a transaction is in its life, or which way money moved.

- Provide: \`status\` — \`money-in\`, \`money-out\`, \`transfer\`, \`draft\`, \`pending\`, \`posting\`, \`posted\`, \`rejected\`, \`blocked\`, \`reversed\`, \`corrected\`, \`outstanding\`, \`settled\`, \`reconciled\`, \`exception\`, \`overdue\`, \`queued\`, \`syncing\`, \`sync-failed\`; optional \`label\` to apply a custom display label (Avak, Javak) without changing the meaning.
- The same badge appears in lists, details, reports, proof cards and PDFs.
- Rows show a badge for every state except Posted; detail screens show all states.`,
    code: "h('div', { className: 'fy-demo' }, ['money-in', 'money-out', 'transfer', 'draft', 'pending', 'posting', 'posted', 'rejected', 'blocked', 'reversed', 'corrected', 'outstanding', 'settled', 'reconciled', 'exception', 'overdue', 'queued', 'syncing', 'sync-failed'].map(function (s) { return h(F.StatusBadge, { key: s, status: s }); }), h(F.StatusBadge, { status: 'money-in', label: 'Avak' }), h(F.StatusBadge, { status: 'money-out', label: 'Javak' }))",
  },
  {
    name: 'PrivacyBadge', group: 'Money', height: 170,
    readme: `Tells the viewer who can see an item and why, without revealing anything they cannot see.

- Provide: \`level\` — \`private\`, \`family\`, \`business\`, \`restricted\`, \`shared\` — an optional custom \`label\` (the owner may rename confidentiality levels), and an optional \`reason\` line.
- Reasons explain the rule, never the hidden content: "Only you can see this." / "You can see that this exists, not its details."
- Personal finance shows Private by default (BUILD_PROMPT A4).`,
    code: "h('div', { className: 'fy-demo' }, h(F.PrivacyBadge, { level: 'private' }), h(F.PrivacyBadge, { level: 'family' }), h(F.PrivacyBadge, { level: 'business' }), h(F.PrivacyBadge, { level: 'restricted' }), h(F.PrivacyBadge, { level: 'shared' }), h(F.PrivacyBadge, { level: 'private', reason: 'Only you can see this. You set it to Owner-only.' }), h(F.PrivacyBadge, { level: 'restricted', reason: 'You can see that this exists, not its details.' }))",
  },
  {
    name: 'Button', group: 'Actions', height: 150,
    readme: `Actions. One primary button per screen or sheet, in the same place every time: the bottom, in thumb reach.

- Provide: \`children\` (a verb: "Save", "Confirm & post", "Verify & share"), \`variant\` (\`primary\`, \`secondary\`, \`quiet\`, \`danger\`), optional \`icon\`, \`loading\` + \`loadingLabel\` ("Posting…"), \`disabled\`, \`block\` to fill the row, \`size="sm"\` inside cards.
- \`danger\` only for reversing, revoking or discarding — never for ordinary saves.
- A disabled button the user knows about always has a reason nearby ("Choose where the money is going").
- Minimum height 48px. Pressing scales to 97% for 90ms.`,
    code: "h('div', { className: 'fy-demo' }, h(F.Button, { variant: 'primary', icon: 'check' }, 'Save'), h(F.Button, null, 'Edit'), h(F.Button, { variant: 'quiet' }, 'Cancel'), h(F.Button, { variant: 'danger', icon: 'undo' }, 'Reverse'), h(F.Button, { variant: 'primary', loading: true, loadingLabel: 'Posting…' }, 'Confirm & post'), h(F.Button, { variant: 'primary', disabled: true }, 'Save'), h(F.Button, { variant: 'primary', size: 'sm' }, 'Settle'))",
  },
  {
    name: 'AddButton', group: 'Actions', height: 110,
    readme: `The add button: the one way into every new entry, always bottom-right above the navigation.

- Provide: \`onClick\` (opens the AddSheet), optional \`extended\` with a \`label\` on the Home screen only.
- Hidden on screens where adding makes no sense (review, share, settings) instead of disabled.`,
    code: "h('div', { className: 'fy-demo' }, h(F.AddButton, null), h(F.AddButton, { extended: true, label: 'Add entry' }))",
  },
  {
    name: 'TextField', group: 'Input', height: 250,
    readme: `Text input with a visible label, inline help and inline errors; validates while typing.

- Provide: \`label\`, \`value\`/\`onChange\` (or \`defaultValue\`), optional \`helper\`, \`error\`, \`required\`, \`icon\`, \`multiline\`, \`inputMode\`, \`autoComplete\`.
- Labels sit above the field and never disappear; placeholders are examples, not labels.
- Errors say what to do: "Please write why the money moved."
- Reasons autocomplete from the user's own history (deterministic recency, no AI).`,
    code: "h('div', { className: 'fy-col' }, h(F.TextField, { label: 'Reason', required: true, defaultValue: 'Cash received from Mint', helper: 'Shown on the proof and in reports.' }), h(F.TextField, { label: 'Reference', icon: 'receipt', placeholder: 'Bill or cheque number' }), h(F.TextField, { label: 'Reason', required: true, error: 'Please write why the money moved.' }))",
  },
  {
    name: 'AmountInput', group: 'Input', height: 560,
    readme: `The amount keypad: whole rupees only, Indian grouping as you type, the available balance beside it when the viewer may see it.

- Provide: \`value\`/\`onChange\` (an integer or null), optional \`available\` (only when the viewer may see that balance), \`availableLabel\` ("Available in Tijori"), \`approvalAbove\` (the configured approval threshold), \`error\` from the server.
- No decimal key, no minus key: negative and fractional amounts cannot be typed. A \`000\` key speeds up lakhs.
- Inline messages while typing: "Enter an amount", "More than the available balance.", "Above ₹1,00,000 — this entry will need approval."
- The server rechecks the balance at commit; the number shown here is guidance, never the authority.`,
    code: "h(F.AmountInput, { defaultValue: 45000, available: 482000, availableLabel: 'Available in Tijori', approvalAbove: 100000 })",
  },
  {
    name: 'SearchBar', group: 'Input', height: 150,
    readme: `Global search, one tap from every screen, with combinable filter chips.

- Provide: \`value\`/\`onChange\`, \`filters\` (\`[{id, label, selected}]\`), \`onToggleFilter\`, optional \`placeholder\`.
- Understands multi-term queries by rule: \`45000 Angadiya\`, \`Mint Tijori Oct\`, \`TX-20261008\`, \`5000-10000\`, \`last week\`.
- Results, counts, suggestions and recent searches are permission-filtered on the server before they reach the phone.`,
    code: "h(F.SearchBar, { defaultValue: '45000 Angadiya', filters: [{ id: 'oct', label: 'Oct 2026', selected: true }, { id: 'mint', label: 'Mint', selected: true }, { id: 'tijori', label: 'Tijori' }, { id: 'out', label: 'Money out' }, { id: 'pending', label: 'Pending' }] })",
  },
  {
    name: 'Chip', group: 'Input', height: 90,
    readme: `A filter or quick choice that toggles on and off.

- Provide: \`label\`, \`selected\`, \`onClick\`, optional \`icon\` or \`count\`.
- A selected chip shows a check, not only a fill.`,
    code: "h('div', { className: 'fy-demo' }, h(F.Chip, { label: 'Mint', selected: true }), h(F.Chip, { label: 'JSK' }), h(F.Chip, { label: 'Pending', count: 3 }), h(F.Chip, { label: 'This month', icon: 'calendar' }))",
  },
  {
    name: 'Selector', group: 'Input', height: 420,
    readme: `A searchable picker for accounts, funds, people, firms, categories and dates.

- Provide: \`label\`, \`options\` (\`[{id, title, subtitle, icon, disabled, reason}]\`), \`value\`/\`onSelect\`, optional \`recentLabel\`, \`error\`.
- Lists only valid, active choices the user may use. The place already chosen as From appears disabled in To with its reason, so a transfer to itself cannot be picked.
- Recents and frequent pairs come first.`,
    code: "h('div', { className: 'fy-demo' }, h('div', { className: 'fy-col' }, h(F.Selector, { label: 'From', defaultValue: 'mint-bank', options: [{ id: 'mint-bank', title: 'Savan Bank', subtitle: 'Mint', icon: 'business' }] })), h('div', { className: 'fy-col' }, h(F.Selector, { label: 'To', defaultOpen: true, recentLabel: 'RECENT', options: [{ id: 'tijori', title: 'Tijori', subtitle: 'Mint · Cash', icon: 'vault' }, { id: 'wallet', title: 'JSK Wallet', subtitle: 'JSK · Wallet', icon: 'wallet' }, { id: 'office', title: 'Office drawer', subtitle: 'Mint · Cash', icon: 'vault' }, { id: 'mint-bank', title: 'Savan Bank', subtitle: 'Mint', icon: 'business', disabled: true, reason: 'Already chosen as From' }] })))",
  },
  {
    name: 'Tabs', group: 'Input', height: 90,
    readme: `Switches between views of the same list; never between unrelated screens.

- Provide: \`tabs\` (\`[{id, label, count}]\`), \`value\`/\`onChange\`.
- Swipe left and right moves between tabs; the indicator slides in 150ms.`,
    code: "h('div', { className: 'fy-col' }, h(F.Tabs, { tabs: [{ id: 'all', label: 'All' }, { id: 'exp', label: 'Expenses', count: 12 }, { id: 'inc', label: 'Income' }, { id: 'hand', label: 'Handovers', count: 2 }] }))",
  },
  {
    name: 'TopBar', group: 'Navigation', height: 160,
    readme: `The top of every screen: back, a title, and the path that says where you are.

- Provide: \`title\`, \`path\` (\`['Money', 'Mint']\`), \`onBack\` (pass \`null\` on top-level tabs), \`actions\` (\`[{icon, label, onClick}]\`, at most two; the rest go in the overflow).
- System back does the same as the back arrow. Leaving unsaved input keeps an encrypted draft and says so.`,
    code: "h('div', { className: 'fy-stack' }, h('div', { className: 'fy-phone' }, h(F.TopBar, { title: 'Tijori', path: ['Money', 'Mint'], actions: [{ icon: 'search', label: 'Search' }, { icon: 'more', label: 'More options' }] })), h('div', { className: 'fy-phone' }, h(F.TopBar, { title: 'Activity', onBack: null, actions: [{ icon: 'search', label: 'Search' }] })))",
  },
  {
    name: 'BottomNav', group: 'Navigation', height: 200,
    readme: `The same five destinations on every screen — Home, Money, Activity, Outstanding, More — with the add button above.

- Provide: \`value\`/\`onChange\`, \`onAdd\`, optional \`items\` (workers get the reduced set from BUILD_PROMPT L13: Add entry, My entries, Assigned, Pending, Notifications).
- Role-shaped: users see only destinations they can use, never a row of disabled items.
- Switching tabs fades through in 220ms; the active pill grows from the icon.`,
    code: "h('div', { className: 'fy-phone', style: { paddingTop: '96px' } }, h(F.BottomNav, { onAdd: function () {}, items: [{ id: 'home', label: 'Home', icon: 'home' }, { id: 'money', label: 'Money', icon: 'wallet' }, { id: 'activity', label: 'Activity', icon: 'list' }, { id: 'outstanding', label: 'Outstanding', icon: 'hourglass', badge: 2 }, { id: 'more', label: 'More', icon: 'more' }] }))",
  },
  {
    name: 'AddSheet', group: 'Navigation', height: 560,
    readme: `What the add button opens: the entry types the user may create, with "Repeat last" on top.

- Provide: \`onPick\`, optional \`types\` (already permission-filtered), \`repeat\` (a one-line description of the last entry) with \`onRepeat\`, \`onClose\`.
- Each tile leads to a form that shows only the fields its type needs (progressive disclosure).`,
    code: "h('div', { className: 'fy-phone fy-scrim' }, h(F.AddSheet, { repeat: 'Mint → Tijori · ₹5,000 · Cash received from Mint' }))",
  },
  {
    name: 'ListRow', group: 'Lists & cards', height: 260,
    readme: `A tappable row for settings, people, places and menu items.

- Provide: \`title\`, optional \`subtitle\`, \`icon\`, \`trailing\` (a Money, badge or switch), \`onClick\`, \`disabled\` with \`reason\`.
- Rows are at least 48px tall; long names wrap to two lines then truncate, and the full name is in the detail.`,
    code: "h('div', { className: 'fy-phone' }, h(F.ListRow, { icon: 'vault', title: 'Tijori', subtitle: 'Mint, JSK, Krish, Father', trailing: h(F.Money, { amount: 1000000, size: 'sm' }), onClick: function () {} }), h(F.ListRow, { icon: 'business', title: 'Savan Bank', subtitle: 'Mint · Current account ••4521', trailing: h(F.Money, { amount: 500000, size: 'sm' }), onClick: function () {} }), h(F.ListRow, { icon: 'lock', title: 'Wardrobe', reason: 'Owner-only. Ask Krish Patel for access.', disabled: true, onClick: function () {} }))",
  },
  {
    name: 'TransactionCard', group: 'Lists & cards', height: 560,
    readme: `One money movement, readable months later: from → to, amount, reason, when, who, and its state.

- Provide: \`tx\` — \`{id, from, to, amount, direction, reason, date, time, handler, status, privacy, visibility, display}\` — and \`onClick\` to open the detail.
- The route reads as a sentence: "Mint → Tijori". The amount is right-aligned and is the strongest element.
- Reversed entries keep their amount, struck through, with a Reversed badge; the reversal is its own card.
- A worker's blind entry shows "Amount hidden" for amounts they may not see.`,
    code: "h('div', { className: 'fy-stack' }, h(F.TransactionCard, { tx: " + TX_IN + ", onClick: function () {} }), h(F.TransactionCard, { tx: { from: 'Tijori', to: 'Savan Bank', amount: 50000, direction: 'out', reason: 'Deposit of Mint cash', date: '08 Oct 2026', time: '11:40 AM', handler: 'Sujal', status: 'pending' } }), h(F.TransactionCard, { tx: { from: 'JSK', to: 'Mint', amount: 50000, direction: 'transfer', reason: 'Loan from JSK to Mint', date: '07 Oct 2026', time: '4:05 PM', handler: 'Krish Patel', status: 'reversed' } }), h(F.TransactionCard, { tx: { from: 'Krish Patel', to: 'Angadiya visit', amount: 45000, direction: 'out', reason: 'Travel, hotel, food, firm charges', date: '06 Oct 2026', time: '9:30 PM', handler: 'Krish Patel', status: 'exception', privacy: 'private' } }), h(F.TransactionCard, { tx: { from: 'Mint', to: 'Tijori', amount: 20000, direction: 'in', visibility: 'hidden', reason: 'Cash deposit', date: 'Today', time: '9:05 AM', handler: 'Sujal', status: 'queued' } }))",
  },
  {
    name: 'BalanceCard', group: 'Lists & cards', height: 420,
    readme: `A total and where it sits, built only from what the viewer may see.

- Provide: \`title\`, optional \`path\`, \`amount\` (the authorised total from the server), \`parts\` (\`[{label, amount}]\`, authorised parts only), \`privacy\`, \`updated\`, \`stale\`.
- The server aggregates the viewer's authorised data and then sends the total. Never draw a remainder, an "Other" segment or a gap that hints at hidden money. In the three cards below, the same Mint money is seen by Krish (₹12,00,000), Father (₹8,00,000) and a worker (₹3,00,000) — BUILD_PROMPT L12.
- The bar is decoration; the legend carries every value in words.`,
    code: "h('div', { className: 'fy-demo' }, h(F.BalanceCard, { title: 'Mint · as Krish', path: 'Money › Mint', amount: 1200000, privacy: 'business', parts: [{ label: 'Savan Bank', amount: 500000 }, { label: 'Wardrobe (owner fund)', amount: 400000 }, { label: 'Tijori', amount: 300000 }], updated: 'Updated just now' }), h(F.BalanceCard, { title: 'Mint · as Father', path: 'Money › Mint', amount: 800000, privacy: 'business', parts: [{ label: 'Savan Bank', amount: 500000 }, { label: 'Tijori', amount: 300000 }], updated: 'Updated just now' }), h(F.BalanceCard, { title: 'Mint · as Sujal (worker)', amount: 300000, parts: [{ label: 'Tijori', amount: 300000 }], updated: 'Showing balances from 2 hours ago', stale: true }))",
  },
  {
    name: 'FundCard', group: 'Lists & cards', height: 330,
    readme: `A fund (Hissa): how much it owns, and how much of that is free to use.

- Provide: \`name\`, \`owner\`, \`total\`, \`states\` (\`{available, reserved, allocated, outstanding, locked}\`), \`privacy\`.
- Available leads; the bar and legend break down the rest. Moving money between places never changes these numbers — only spending, receiving or an allocation adjustment does.`,
    code: "h(F.FundCard, { name: 'Mint Operating Fund', owner: 'Mint', total: 1000000, privacy: 'business', states: { available: 600000, reserved: 200000, outstanding: 100000, allocated: 100000 } })",
  },
  {
    name: 'OutstandingCard', group: 'Lists & cards', height: 300,
    readme: `Who owes whom, how much is left, and the one action that settles it.

- Provide: \`title\` ("Mint owes Krish"), \`subtitle\` (what it came from), \`original\`, \`settled\`, \`due\`, \`overdue\` (days), \`onSettle\`.
- The remaining amount is derived from settlements, never typed. Settling opens a review that links back to the original entry.`,
    code: "h('div', { className: 'fy-demo' }, h(F.OutstandingCard, { title: 'Mint owes Krish', subtitle: 'Reimbursement · Angadiya visit', original: 30000, settled: 0, due: '15 Oct 2026', onSettle: function () {} }), h(F.OutstandingCard, { title: 'JSK owes Krish', subtitle: 'Reimbursement · Angadiya visit', original: 5000, settled: 2000, due: '15 Oct 2026', onSettle: function () {} }), h(F.OutstandingCard, { title: 'Krish holds Mint advance', subtitle: 'Advance for Rajkot trip · spent ₹42,000', original: 8000, settled: 0, overdue: 32, onSettle: function () {} }))",
  },
  {
    name: 'ExplainBalance', group: 'Accounting', height: 360,
    readme: `Answers "why is this the balance?": opening, every movement, closing — and proves they add up.

- Provide: \`title\`, \`from\`/\`to\` dates, \`opening\`, \`movements\` (\`[{label, ref, amount, direction}]\`), \`closing\` — all from the server, within the viewer's permissions.
- If opening + movements ≠ closing the card says so and the integrity check is alerted; nothing is ever adjusted to make it fit.
- Every row opens its transaction.`,
    code: "h(F.ExplainBalance, { title: 'Tijori · Mint Fund · October 2026', from: '1 Oct', to: '8 Oct', opening: 400000, closing: 482000, movements: [{ label: 'Cash received from Mint', ref: 'TX-20261008-001245', amount: 5000, direction: 'in' }, { label: 'Deposited to Savan Bank', ref: 'TX-20261008-001250', amount: 50000, direction: 'out' }, { label: 'Handover from Sujal', ref: 'TX-20261008-001262', amount: 127000, direction: 'in' }] })",
  },
  {
    name: 'JournalLines', group: 'Accounting', height: 300,
    readme: `The accounting view of an entry: its balanced journal lines, for finance roles only (BUILD_PROMPT AC16).

- Provide: \`entity\`, \`journalId\`, \`lines\` (\`[{account, side: 'Dr' | 'Cr', amount, dims}]\`).
- Normal users never see Dr and Cr; they see Money in and Money out. This view exists to prove every posting balances.
- An unbalanced journal is shown as blocked and can never be posted.`,
    code: "h('div', { className: 'fy-demo' }, h(F.JournalLines, { entity: 'Krish Patel (personal)', journalId: 'JE-20261006-000318', lines: [{ account: 'Personal expenses', side: 'Dr', amount: 10000, dims: 'Fund: Personal · Event: Angadiya visit' }, { account: 'Reimbursement receivable – Mint', side: 'Dr', amount: 30000 }, { account: 'Reimbursement receivable – JSK', side: 'Dr', amount: 5000 }, { account: 'Bank – Savan (Krish)', side: 'Cr', amount: 45000 }] }), h(F.JournalLines, { entity: 'Mint', journalId: 'JE-20261006-000319', lines: [{ account: 'Expenses – Travel, Hotel, Food', side: 'Dr', amount: 30000, dims: 'Fund: Mint Operating' }, { account: 'Reimbursement payable – Krish', side: 'Cr', amount: 30000 }] }))",
  },
  {
    name: 'DataTable', group: 'Accounting', height: 340,
    readme: `Rows of figures for reports and statements: right-aligned rupees, tabular digits, a totals row.

- Provide: \`columns\` (\`[{key, label, align, money, figure}]\`), \`rows\`, optional \`totals\`, \`caption\`.
- On phones prefer cards; use tables only in reports, statements, PDFs and the accounting view, scrolling sideways inside their box.`,
    code: "h('div', { className: 'fy-col', style: { width: '420px' } }, h(F.DataTable, { caption: 'Angadiya visit · 6 Oct 2026', columns: [{ key: 'cat', label: 'Category' }, { key: 'mint', label: 'Mint', align: 'end', money: true }, { key: 'jsk', label: 'JSK', align: 'end', money: true }, { key: 'krish', label: 'Personal', align: 'end', money: true }], rows: [{ cat: 'Travel', mint: 7000, jsk: 1000, krish: 2000 }, { cat: 'Hotel', mint: 8000, jsk: 1000, krish: 3000 }, { cat: 'Food', mint: 3000, jsk: 500, krish: 1500 }, { cat: 'Local', mint: 2000, jsk: 500, krish: 500 }, { cat: 'Firm charges', mint: 6000, jsk: 2000, krish: 0 }, { cat: 'Other', mint: 4000, jsk: 0, krish: 3000 }], totals: { cat: 'Total ₹45,000', mint: 30000, jsk: 5000, krish: 10000 } }))",
  },
  {
    name: 'FindingCard', group: 'Accounting', height: 330,
    readme: `A finding from the rule-based exception engine: problem, possible reason, affected records, suggested action.

- Provide: \`problem\`, \`reason\`, \`affected\` (only records the viewer may see), \`action\`, \`severity\` (\`review\` or \`critical\`), \`when\`, \`onReview\`, \`onDismiss\`.
- Findings warn and suggest. They never change a record; corrections go through their own reviewed flow.`,
    code: "h(F.FindingCard, { problem: 'Possible duplicate: ₹5,000 Mint → Tijori entered twice', reason: 'Same amount, places and handler at 10:15 and 10:18.', affected: ['TX-20261008-001245', 'TX-20261008-001246'], action: 'Open both. Reverse the duplicate, or mark them as two separate deposits.', when: 'Today, 10:20 AM' })",
  },
  {
    name: 'BottomSheet', group: 'Overlays', height: 300,
    readme: `The default container for choices, reviews and confirmations: it rises from the bottom, within thumb reach.

- Provide: \`title\`, \`children\`, optional \`actions\` (buttons pinned at the bottom), \`onClose\` (pass \`null\` when closing would lose required verification).
- Enters in 320ms with a decelerating curve; drag down or tap the scrim to close when nothing would be lost.`,
    code: "h('div', { className: 'fy-phone fy-scrim' }, h(F.BottomSheet, { title: 'When did it happen?' }, h(F.ListRow, { icon: 'calendar', title: 'Now', subtitle: 'Today, 10:15 AM', onClick: function () {} }), h(F.ListRow, { icon: 'calendar', title: 'Earlier today', onClick: function () {} }), h(F.ListRow, { icon: 'calendar', title: 'Pick a date and time', onClick: function () {} })))",
  },
  {
    name: 'Dialog', group: 'Overlays', height: 260,
    readme: `A short interruption for an irreversible or risky decision. Everything else uses a bottom sheet.

- Provide: \`title\` (a question), \`body\` (the consequence), \`actions\` (the safe choice first, the risky one last), optional \`tone="danger"\` and \`icon\`.
- No "Are you sure?" chains: one dialog, then done.`,
    code: "h('div', { className: 'fy-demo' }, h(F.Dialog, { title: 'Leave without saving?', icon: 'info', body: 'Your draft is kept, encrypted, on this phone.', actions: [h(F.Button, { key: 'k', variant: 'quiet' }, 'Keep editing'), h(F.Button, { key: 'l' }, 'Leave')] }), h(F.Dialog, { title: 'Reverse this entry?', tone: 'danger', icon: 'undo', body: 'A mirror entry will cancel ₹5,000 Mint → Tijori. The original stays in history.', actions: [h(F.Button, { key: 'k', variant: 'quiet' }, 'Keep'), h(F.Button, { key: 'r', variant: 'danger' }, 'Reverse')] }))",
  },
  {
    name: 'ImpactPreview', group: 'Overlays', height: 230,
    readme: `Before an important change: "This change will affect N areas", each with before → after.

- Provide: \`items\` (\`[{area, before, after}]\`, only areas the viewer may see) and \`hiddenCount\` when other affected areas are hidden.
- Hidden areas are counted as "another area you cannot see" and sent for review — never named or valued.`,
    code: "h('div', { className: 'fy-col' }, h(F.ImpactPreview, { items: [{ area: 'JSK · Bank', before: 400000, after: 350000 }, { area: 'Mint · Bank', before: 200000, after: 250000 }, { area: 'JSK · Due from Mint', before: 0, after: 50000 }, { area: 'Mint · Due to JSK', before: 0, after: 50000 }], hiddenCount: 1 }))",
  },
  {
    name: 'ReviewSheet', group: 'Overlays', height: 640,
    readme: `The single review before money posts: amount, route, classification, impact, warnings, and one confirm button.

- Provide: \`amount\`, \`direction\`, \`rows\` (\`[{label, value}]\`), optional \`impact\`, \`hiddenImpact\`, \`warnings\`, \`stepUp\`, \`posting\`, \`onConfirm\`, \`onEdit\`.
- Replaces chains of dialogs. If step-up is required, confirming opens the fingerprint prompt inline.
- Nothing is shown as posted until the server confirms; the button reads "Posting…" meanwhile.`,
    code: "h('div', { className: 'fy-phone fy-scrim' }, h(F.ReviewSheet, { title: 'Review transfer', amount: 50000, direction: 'transfer', rows: [{ label: 'From', value: 'JSK · HDFC current' }, { label: 'To', value: 'Mint · Savan Bank' }, { label: 'Counts as', value: 'Loan from JSK to Mint' }, { label: 'Reason', value: 'Stock purchase for Mint' }, { label: 'When', value: 'Today, 10:15 AM' }, { label: 'Handled by', value: 'Krish Patel' }], impact: [{ area: 'JSK · Bank', before: 400000, after: 350000 }, { area: 'Mint · Bank', before: 200000, after: 250000 }, { area: 'Mint owes JSK', before: 0, after: 50000 }], stepUp: true }))",
  },
  {
    name: 'ConflictMessage', group: 'Overlays', height: 340,
    readme: `When a change is refused: what conflicts, where, why, what it would affect, and how to fix it. Nothing is partly saved.

- Provide: \`title\`, \`what\`, \`where\`, \`why\`, \`impact\`, \`resolutions\` (\`[{label, onClick}]\`, the best path first), optional \`note\`.
- Say only what the viewer is allowed to know; never name hidden records or amounts.`,
    code: "h(F.ConflictMessage, { title: 'Cannot change this transaction.', what: 'Moving ₹50,000 of this entry from Mint Fund to JSK Fund.', where: 'Tijori · TX-20261008-001245', why: 'This change would create an inconsistency between the fund balance and the account balance.', impact: 'Two settlements already use this entry.', note: 'Nothing was saved.', resolutions: [{ label: 'Start a correction' }, { label: 'Undo the settlements first' }, { label: 'Cancel' }] })",
  },
  {
    name: 'Snackbar', group: 'Feedback & states', height: 150,
    readme: `A brief confirmation at the bottom after something finished, with at most one action.

- Provide: \`message\`, optional \`icon\`, \`actionLabel\`, \`onAction\`.
- After posting: "Posted. TX-…" with "Share proof". Errors that need a decision use a Banner or ConflictMessage instead.`,
    code: "h('div', { className: 'fy-stack' }, h(F.Snackbar, { icon: 'check', message: 'Posted. TX-20261008-001245', actionLabel: 'Share proof' }), h(F.Snackbar, { icon: 'cloud-off', message: 'Saved offline. It will post when you are online.' }))",
  },
  {
    name: 'Banner', group: 'Feedback & states', height: 420,
    readme: `A persistent line at the top of a screen for a condition that lasts: offline, syncing, failed sync, stale, read-only, locked, session expired, timeout, partly loaded.

- Provide: \`kind\`, \`text\`, optional \`actionLabel\` and \`onAction\`.
- Every banner says what still works and offers the next step.`,
    code: "h('div', { className: 'fy-stack' }, h(F.Banner, { kind: 'offline', text: 'You are offline. 2 entries are queued and will post when you are back online.' }), h(F.Banner, { kind: 'syncing', text: 'Syncing 2 queued entries…' }), h(F.Banner, { kind: 'sync-failed', text: '1 queued entry was rejected: the Tijori balance changed.', actionLabel: 'Fix' }), h(F.Banner, { kind: 'stale', text: 'Showing balances from 2 hours ago.', actionLabel: 'Refresh' }), h(F.Banner, { kind: 'read-only', text: 'October 2026 is closed. Changes go through a correction.' }), h(F.Banner, { kind: 'locked', text: 'Financial entries are paused by the administrator.' }))",
  },
  {
    name: 'Skeleton', group: 'Feedback & states', height: 200,
    readme: `Placeholder shapes while a list or card loads, so the layout never jumps.

- Provide: optional \`rows\`, \`label\`.
- Pulses gently; still under reduced motion. Never show a fake amount while loading.`,
    code: "h(F.Skeleton, { rows: 3 })",
  },
  {
    name: 'EmptyState', group: 'Feedback & states', height: 300,
    readme: `What fills a screen with nothing in it: what is missing and the next action.

- Provide: \`title\`, optional \`body\`, \`icon\`, \`actionLabel\`, \`onAction\`.
- Use the spec's sentences: "No transactions yet. Add your first money movement.", "No outstanding amount.", "No bank accounts added yet."`,
    code: "h('div', { className: 'fy-demo' }, h(F.EmptyState, { title: 'No transactions yet.', body: 'Add your first money movement.', actionLabel: 'Add entry' }), h(F.EmptyState, { icon: 'hourglass', title: 'No outstanding amount.', body: 'Nobody owes anything right now.' }))",
  },
  {
    name: 'AccessState', group: 'Feedback & states', height: 300,
    readme: `When the viewer may not open something: a short reason and a way forward, nothing more.

- Provide: \`kind\` (\`denied\`, \`forbidden\`, \`unauthorized\`), optional \`title\`, \`body\`, \`actionLabel\`.
- Never reveal what is behind the door — no names, counts or amounts.`,
    code: "h('div', { className: 'fy-demo' }, h(F.AccessState, { kind: 'denied', actionLabel: 'Request access' }), h(F.AccessState, { kind: 'forbidden' }), h(F.AccessState, { kind: 'unauthorized', actionLabel: 'Unlock' }))",
  },
  {
    name: 'StatesBoard', group: 'Feedback & states', height: 1600, page: true,
    readme: `Every state a screen must support (BUILD_PROMPT K3), each drawn with the system's own parts.

A review page, not a component the app ships. Every screen in the app is checked against this list before it is called done.`,
    code: "h(F.StatesBoard)",
  },
  {
    name: 'PinPad', group: 'Security', height: 520,
    readme: `M-PIN entry: unlocks this phone only, never replaces the password.

- Provide: \`length\` (4 or 6, by policy), \`onComplete\`, optional \`onBiometric\`, \`onForgot\`, \`error\`, \`lockedFor\`.
- Digits are never shown, logged or read aloud; screen readers hear "2 of 4 digits entered".
- Wrong M-PIN shakes once (still under reduced motion) and says attempts left; after the limit it locks with a countdown and offers the password.`,
    code: "h('div', { className: 'fy-demo' }, h(F.PinPad, { onBiometric: function () {}, onForgot: function () {} }), h(F.PinPad, { error: 'Wrong M-PIN. 2 attempts left.', onBiometric: function () {} }), h(F.PinPad, { lockedFor: '30 seconds' }))",
  },
  {
    name: 'OtpInput', group: 'Security', height: 140,
    readme: `A one-time code for MFA and new-device checks.

- Provide: \`value\`/\`onChange\`, optional \`length\`, \`label\`, \`helper\`, \`error\`.
- Accepts paste and Android SMS autofill (\`one-time-code\`).`,
    code: "h('div', { className: 'fy-demo' }, h(F.OtpInput, { label: 'Code from your authenticator app', helper: 'Expires in 30 seconds.' }), h(F.OtpInput, { label: 'Code from your authenticator app', error: 'That code has expired. Enter the new one.' }))",
  },
  {
    name: 'UnlockScreen', group: 'Security', height: 520,
    readme: `What a returning user sees: welcome back, fingerprint first, M-PIN and password as fallbacks.

- Provide: \`name\`, \`method\` (\`biometric\` or \`pin\`), \`onBiometric\`, \`onForgot\`, \`onPassword\`.
- Uses Android's own biometric prompt; the app never sees fingerprint data. A change in enrolled biometrics forces the password.`,
    code: "h('div', { className: 'fy-phone' }, h(F.UnlockScreen, { name: 'Krish' }))",
  },
  {
    name: 'StepUpSheet', group: 'Security', height: 340,
    readme: `One inline check before a sensitive action: large transfer, confidential share, permission change.

- Provide: \`action\` (exactly what will happen), \`reason\` (why the check is needed), \`onVerify\`, \`onCancel\`, \`onUsePin\`, \`failed\`.
- If the check fails, nothing happens and the sheet says so.`,
    code: "h('div', { className: 'fy-demo' }, h(F.StepUpSheet, { action: 'Share the Mint October statement with Father as a Confidential PDF.', reason: 'a confidential document' }), h(F.StepUpSheet, { action: 'Transfer ₹6,00,000 from JSK to Mint.', reason: 'above the ₹5,00,000 approval limit', failed: true }))",
  },
  {
    name: 'SecurityBuilder', group: 'Sharing & proof', height: 720,
    readme: `Document security for a share: presets plus each control on its own, honouring OFF / DEFAULT ON / MANDATORY policy.

- Provide: \`policy\` (\`{password: 'default', encryption: 'mandatory', print: 'blocked', …}\`; anything unset is optional), optional \`expiry\`.
- Mandatory controls are on and locked ("Required by policy — cannot turn off"); blocked ones are off and locked. The stricter policy always wins.
- Any change invalidates the preview and verification, and says so.
- The preview shows the Q8 example policy: Password default on, Encryption mandatory, Watermark default on, Expiry 24 hours, Secure Viewer optional, Revocation default on, Download allowed, Print not allowed.`,
    code: "h(F.SecurityBuilder, { policy: { password: 'default', encryption: 'mandatory', watermark: 'default', expiry: 'default', revocable: 'default', download: 'default', print: 'blocked' } })",
  },
  {
    name: 'MessagePreview', group: 'Sharing & proof', height: 260,
    readme: `The exact text that will be sent: what the user approves is what leaves.

- Provide: \`text\` (generated from authorised fields, never typed).
- Same layout every time; templates are admin-configured.`,
    code: "h(F.MessagePreview, { text: 'PAYMENT RECEIVED / CREDIT / AVAK\\nFrom: Mint · To: Tijori · Amount: ₹5,000\\nDate: 08-10-2026 · Day: Thursday · Time: 10:15 AM\\nReason: Cash received · Handled By: Krish Patel\\nFund: Mint Fund · Reference: TX-001245' })",
  },
  {
    name: 'ShareConfirm', group: 'Sharing & proof', height: 600,
    readme: `The last step before anything leaves the app: recipient, channel, format, security and content, then Verify & share.

- Provide: \`recipient\` (\`{name, contact, verified}\`), \`channel\`, \`format\`, \`security\` (list of applied controls), \`content\`, \`invalidated\`, \`onVerify\`, \`onCancel\`, \`onReview\`.
- If anything changed after the preview, the button is disabled until the user reviews again.
- "Sent" is shown only when the channel confirms delivery; a WhatsApp hand-off is shown as "Handed to WhatsApp".`,
    code: "h('div', { className: 'fy-demo' }, h(F.ShareConfirm, { recipient: { name: 'Sujal', contact: '+91 98••• ••210', verified: true }, channel: 'WhatsApp', format: 'PDF', security: ['Password', 'Encryption', 'Watermark', 'Expiry 24h'], content: '₹50,000 · Mint → Tijori · TX-20261008-001245' }), h(F.ShareConfirm, { recipient: { name: 'Savan', contact: '+91 99••• ••034', verified: false }, channel: 'WhatsApp', format: 'Message', security: ['None'], content: '₹20,000 · JSK → Mint', invalidated: true }))",
  },
  {
    name: 'ProofCard', group: 'Sharing & proof', height: 560,
    readme: `The generated Photo Proof: an image made from the posted record, never a screenshot.

- Provide: \`tx\` (authorised fields only), \`firm\`, \`classification\`, \`watermark\` (recipient-specific), \`verifyCode\`.
- Always rendered in the light theme so archived proofs look the same.
- The footer states it was generated from the posted record; the verify code checks it against the server.`,
    code: "h(F.ProofCard, { tx: " + TX_IN + ", firm: 'Mint', classification: 'Business', watermark: 'Shared with Sujal · 08 Oct 2026', verifyCode: 'FNL-7Q2K-91XD' })",
  },
  {
    name: 'PdfPage', group: 'Sharing & proof', height: 720,
    readme: `A statement page as the PDF will print it: header, summary, detail table, footer with page, document ID, time and classification.

- Provide: \`title\`, \`entity\`, \`period\`, \`summary\` (\`{opening, credits, debits, closing}\`), \`rows\`, \`totals\`, \`page\`, \`pages\`, \`docId\`, \`generated\`, \`classification\`, \`watermark\`.
- Generated on the server from authorised data, with real encryption when the policy asks for it. Light theme only.`,
    code: "h(F.PdfPage, { title: 'Tijori statement', entity: 'Mint', period: '1–31 October 2026', summary: { opening: 400000, credits: 132000, debits: 50000, closing: 482000 }, rows: [{ date: '08-10', id: 'TX-001245', detail: 'Cash received from Mint', avak: 5000, javak: '' }, { date: '08-10', id: 'TX-001250', detail: 'Deposited to Savan Bank', avak: '', javak: 50000 }, { date: '08-10', id: 'TX-001262', detail: 'Handover from Sujal', avak: 127000, javak: '' }], totals: { date: 'Total', avak: 132000, javak: 50000 }, docId: 'DOC-20261031-0042', generated: '31 Oct 2026, 6:05 PM', classification: 'Confidential', watermark: 'CONFIDENTIAL · Father' })",
  },
];
