// Writes project/components/<Name>/README.md and preview.html from components.spec.js.
// Usage: node design-system/tools/make-components.js
const fs = require('fs');
const path = require('path');
const specs = require('./components.spec.js');

const OUT = path.join(__dirname, '..', 'project', 'components');

// The Flutter widget each reference component becomes, and what it builds on (Flutter built-ins first).
const FLUTTER = {
  Icon: ['FyIcon', 'Icon with Icons.*_rounded'],
  Money: ['FyMoney', 'Text with the amount text styles + Semantics(label: words)'],
  StatusBadge: ['FyStatusBadge', 'a DecoratedBox + Icon + Text'],
  PrivacyBadge: ['FyPrivacyBadge', 'a DecoratedBox + Icon + Text'],
  Button: ['FyButton', 'FilledButton / OutlinedButton / TextButton themed by FyTheme'],
  AddButton: ['FyAddButton', 'FloatingActionButton / FloatingActionButton.extended'],
  TextField: ['FyTextField', 'TextFormField with InputDecoration from FyTheme'],
  AmountInput: ['FyAmountInput', 'a custom keypad (GridView of InkWell keys), no system keyboard'],
  SearchBar: ['FySearchBar', 'SearchBar + SearchAnchor'],
  Chip: ['FyChip', 'FilterChip'],
  Selector: ['FySelector', 'showModalBottomSheet with a searchable ListView'],
  Tabs: ['FyTabs', 'TabBar + TabBarView'],
  TopBar: ['FyTopBar', 'AppBar (title + path) / SliverAppBar on long screens'],
  BottomNav: ['FyBottomNav', 'NavigationBar'],
  AddSheet: ['FyAddSheet', 'showModalBottomSheet'],
  ListRow: ['FyListRow', 'ListTile'],
  TransactionCard: ['FyTransactionCard', 'a Card + InkWell, Hero on the amount into the detail screen'],
  BalanceCard: ['FyBalanceCard', 'Card + a custom allocation bar (Row of Flexible)'],
  FundCard: ['FyFundCard', 'Card + the same allocation bar'],
  OutstandingCard: ['FyOutstandingCard', 'Card + LinearProgressIndicator'],
  ExplainBalance: ['FyExplainBalance', 'Card + a ListView of rows'],
  JournalLines: ['FyJournalLines', 'Table'],
  DataTable: ['FyDataTable', 'DataTable inside a horizontal SingleChildScrollView'],
  FindingCard: ['FyFindingCard', 'Card'],
  BottomSheet: ['FyBottomSheet', 'showModalBottomSheet with drag handle'],
  Dialog: ['FyDialog', 'AlertDialog'],
  ImpactPreview: ['FyImpactPreview', 'a Column of rows'],
  ReviewSheet: ['FyReviewSheet', 'showModalBottomSheet (isScrollControlled)'],
  ConflictMessage: ['FyConflictMessage', 'a DecoratedBox block'],
  Snackbar: ['FySnackbar', 'SnackBar via ScaffoldMessenger'],
  Banner: ['FyBanner', 'MaterialBanner-style inline widget'],
  Skeleton: ['FySkeleton', 'a pulsing DecoratedBox (AnimatedOpacity), no shimmer package'],
  EmptyState: ['FyEmptyState', 'a centred Column'],
  AccessState: ['FyAccessState', 'a centred Column'],
  StatesBoard: ['(review page)', 'widget tests and golden tests per state'],
  PinPad: ['FyPinPad', 'a custom keypad; digits never in a TextField'],
  OtpInput: ['FyOtpInput', 'one TextField with autofillHints: oneTimeCode, drawn as boxes'],
  UnlockScreen: ['UnlockPage', 'local_auth (BiometricPrompt) + FyPinPad'],
  StepUpSheet: ['FyStepUpSheet', 'showModalBottomSheet + local_auth'],
  SecurityBuilder: ['FySecurityBuilder', 'CheckboxListTile rows'],
  MessagePreview: ['FyMessagePreview', 'SelectableText inside a DecoratedBox'],
  ShareConfirm: ['FyShareConfirm', 'showModalBottomSheet'],
  ProofCard: ['FyProofCard', 'rendered off-screen to PNG (RepaintBoundary.toImage) from server-authorised data'],
  PdfPage: ['(server document)', 'generated on the server; previewed in the app'],
};

let written = 0;
for (const s of specs) {
  const dir = path.join(OUT, s.name);
  fs.mkdirSync(dir, { recursive: true });
  const fl = FLUTTER[s.name];
  if (!fl) throw new Error('No Flutter mapping for ' + s.name);
  const readme = `# ${s.name}\n\n${s.readme.trim()}\n\n**In the app:** \`${fl[0]}\` — ${fl[1]}.\n`;
  fs.writeFileSync(path.join(dir, 'README.md'), readme);
  if (s.code.includes('</script') || s.code.includes('<!--')) throw new Error('Unsafe preview code in ' + s.name);
  const marker = `<!-- @dsCard group="${s.group}" height=${s.height}${s.page ? ' page' : ''} -->`;
  const html = `${marker}
<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${s.name} — preview</title></head>
<body>
<div id="root" class="fy-root"></div>
<script>
  var F = window.Finely, h = React.createElement;
  ReactDOM.createRoot(document.getElementById('root')).render(${s.code});
</script>
</body>
</html>
`;
  fs.writeFileSync(path.join(dir, 'preview.html'), html);
  written += 1;
}
console.log('components written:', written);
