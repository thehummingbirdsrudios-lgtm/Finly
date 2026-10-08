/* @ds-bundle: {"format":4,"namespace":"Finly","components":[{"name":"Logo"},{"name":"Icon"},{"name":"Money"},{"name":"StatusBadge"},{"name":"PrivacyBadge"},{"name":"Button"},{"name":"AddButton"},{"name":"TextField"},{"name":"AmountInput"},{"name":"SearchBar"},{"name":"Chip"},{"name":"Selector"},{"name":"Tabs"},{"name":"TopBar"},{"name":"BottomNav"},{"name":"AddSheet"},{"name":"ListRow"},{"name":"TransactionCard"},{"name":"BalanceCard"},{"name":"FundCard"},{"name":"OutstandingCard"},{"name":"ExplainBalance"},{"name":"JournalLines"},{"name":"DataTable"},{"name":"FindingCard"},{"name":"BottomSheet"},{"name":"Dialog"},{"name":"ImpactPreview"},{"name":"ReviewSheet"},{"name":"ConflictMessage"},{"name":"Snackbar"},{"name":"Banner"},{"name":"Skeleton"},{"name":"EmptyState"},{"name":"AccessState"},{"name":"PinPad"},{"name":"OtpInput"},{"name":"UnlockScreen"},{"name":"StepUpSheet"},{"name":"SecurityBuilder"},{"name":"MessagePreview"},{"name":"ShareConfirm"},{"name":"ProofCard"},{"name":"PdfPage"}]} */
(function () {
  'use strict';
  var React = window.React;
  var h = React.createElement;
  var Fragment = React.Fragment;
  var useState = React.useState;

  // Brand: the one place the reference components read the product name from (mirrors project/brand.json).
  var BRAND = { name: 'Finly', tagline: 'Every rupee, explained.' };

  /* ---------- money formatting (whole rupees only) ---------- */
  var RUPEE = '₹';
  var MINUS = '−';
  var NNBSP = ' ';
  var ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
    'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  var TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  var LAKH = 100000;
  var CRORE = 10000000;

  function isRupees(n) { return typeof n === 'number' && Number.isSafeInteger(n); }

  function groupIndian(n) {
    var s = String(Math.abs(n));
    if (s.length <= 3) return s;
    var head = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    return head + ',' + s.slice(-3);
  }

  function formatINR(n) { return isRupees(n) ? RUPEE + groupIndian(n) : ''; }

  function twoDigits(n) { return n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : ''); }
  function threeDigits(n) {
    var hundreds = Math.floor(n / 100), rest = n % 100;
    return (hundreds ? ONES[hundreds] + ' hundred' : '') + (rest ? (hundreds ? ' ' : '') + twoDigits(rest) : '');
  }
  function amountWords(n) {
    n = Math.abs(n);
    if (n === 0) return 'zero';
    var parts = [];
    var crore = Math.floor(n / CRORE); n %= CRORE;
    var lakh = Math.floor(n / LAKH); n %= LAKH;
    var thousand = Math.floor(n / 1000); n %= 1000;
    if (crore) parts.push(amountWords(crore) + ' crore');
    if (lakh) parts.push(twoDigits(lakh) + ' lakh');
    if (thousand) parts.push(twoDigits(thousand) + ' thousand');
    if (n) parts.push(threeDigits(n));
    return parts.join(' ');
  }

  // Preview-only helpers. In the app the server sends the masked text; the client never receives the full amount.
  function bandOf(n) {
    if (n >= CRORE) return { unit: CRORE, word: 'crore', step: 1 };
    if (n >= LAKH) return { unit: LAKH, word: 'lakh', step: 1 };
    return { unit: 1000, word: 'thousand', step: 10 };
  }
  function roundedText(n) { var b = bandOf(n); return '≈ ' + RUPEE + Math.max(1, Math.round(n / b.unit)) + ' ' + b.word; }
  function rangeText(n) {
    var b = bandOf(n), size = b.unit * b.step, hi = Math.max(1, Math.ceil(n / size));
    return RUPEE + (hi - 1) * b.step + '–' + hi * b.step + ' ' + b.word;
  }

  /* ---------- small utilities ---------- */
  function cx() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) if (arguments[i]) out.push(arguments[i]);
    return out.join(' ');
  }
  function sum(list, key) { return list.reduce(function (a, x) { return a + (key ? x[key] : x); }, 0); }
  function useMaybeControlled(value, initial, onChange) {
    var st = useState(initial);
    var controlled = value !== undefined;
    return [controlled ? value : st[0], function (v) { if (!controlled) st[1](v); if (onChange) onChange(v); }];
  }

  /* ---------- icons: stand-in line glyphs (production uses Material Symbols Rounded) ---------- */
  var ICONS = {
    'in': 'M17 7 7 17|M16 17H7V8',
    'out': 'M7 17 17 7|M8 7h9v9',
    transfer: 'M4 8h15|M15 4l4 4-4 4|M20 16H5|M9 12l-4 4 4 4',
    clock: 'C12,12,9|M12 7v5l3 2',
    sync: 'M20 11a8 8 0 0 0-14.6-4.5L4 8|M4 4v4h4|M4 13a8 8 0 0 0 14.6 4.5L20 16|M20 20v-4h-4',
    check: 'M5 12.5l4.5 4.5L19 7.5',
    'check-double': 'M2 12.5l4.5 4.5L16 7.5|M11 16l1 1 9.5-9.5',
    x: 'M6 6l12 12|M18 6 6 18',
    ban: 'C12,12,9|M5.6 5.6l12.8 12.8',
    undo: 'M3 12a9 9 0 1 0 3-6.7L3 8|M3 3v5h5',
    hourglass: 'M7 3h10|M7 21h10|M8 3v3.5l4 5 4-5V3|M8 21v-3.5l4-5 4 5V21',
    alert: 'M12 3.5 2.5 20h19L12 3.5z|M12 10v4|M12 17h.01',
    'alert-circle': 'C12,12,9|M12 7.5v5.5|M12 16.5h.01',
    info: 'C12,12,9|M12 11v5.5|M12 7.5h.01',
    lock: 'M7 11h10a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z|M8.5 11V8a3.5 3.5 0 0 1 7 0v3',
    family: 'C9,8,3|M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5|M16 5.2a3 3 0 0 1 0 5.6|M18 14.8c1.8.7 3 2.6 3 5.2',
    business: 'M4 21V6l8-3v18|M12 9h8v12|M3 21h18|M8 8v.01|M8 12v.01|M8 16v.01|M16 13v.01|M16 17v.01',
    'shield-alert': 'M12 3l8 3v6c0 4.8-3.4 8-8 9-4.6-1-8-4.2-8-9V6l8-3z|M12 8v5|M12 16h.01',
    shield: 'M12 3l8 3v6c0 4.8-3.4 8-8 9-4.6-1-8-4.2-8-9V6l8-3z|M9 12l2 2 4-4',
    share: 'M12 15V3|M8 7l4-4 4 4|M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7',
    home: 'M3 11.5 12 4l9 7.5|M5.5 9.5V20h5v-6h3v6h5V9.5',
    wallet: 'M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z|M4 7l2.5-3H16|M16 13.5h1.5',
    list: 'M9 6h12|M9 12h12|M9 18h12|M4 6h.01|M4 12h.01|M4 18h.01',
    receipt: 'M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2V3z|M9 8h6|M9 12h6|M9 16h3',
    more: 'F5,12,1.6|F12,12,1.6|F19,12,1.6',
    plus: 'M12 5v14|M5 12h14',
    search: 'C11,11,7|M20 20l-4-4',
    back: 'M15 5l-7 7 7 7',
    chevron: 'M9 6l6 6-6 6',
    'arrow-right': 'M5 12h14|M13 6l6 6-6 6',
    'eye-off': 'M3 3l18 18|M10.6 10.6a2 2 0 0 0 2.8 2.8|M9.9 5.2A9.6 9.6 0 0 1 12 5c5 0 8.5 4.3 9.5 7a12 12 0 0 1-2.4 3.5|M6.6 6.6C4.4 8 2.9 10.1 2.5 12c1 2.7 4.5 7 9.5 7a9.6 9.6 0 0 0 4.4-1.1',
    fingerprint: 'M12 11v3c0 3.2-.8 5.4-2 7|M8.5 9.5A4 4 0 0 1 16 11.5v2c0 2.6-.4 4.8-1.3 6.8|M5.2 9.5a7.5 7.5 0 0 1 13.5-2.4|M19.6 11c.1.6.1 1.3.1 2v1.2|M4.6 13.5v-1.8',
    backspace: 'M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z|M12 9l6 6|M18 9l-6 6',
    'cloud-off': 'M3 3l18 18|M17.5 17.5H7a4 4 0 0 1-1.3-7.8|M9.7 5.4A6 6 0 0 1 17.8 9a4 4 0 0 1 2.8 7',
    message: 'M4 5h16v11H9l-5 4V5z',
    photo: 'M4 5h16v14H4z|M4 16l5-5 4 4 2-2 5 5|M15.5 9h.01',
    document: 'M7 3h7l5 5v13H7V3z|M14 3v5h5|M10 13h6|M10 17h6',
    key: 'C8,15,4|M11 12l9-9|M16.5 6.5l3 3',
    timer: 'C12,13,8|M12 9v4l2.5 2|M10 2h4',
    calendar: 'M4 6h16v15H4z|M4 10h16|M8 3v4|M16 3v4',
    user: 'C12,8,4|M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5',
    download: 'M12 4v12|M7 11l5 5 5-5|M5 20h14',
    edit: 'M4 20h4L19 9l-4-4L4 16v4z|M13.5 6.5l4 4',
    watermark: 'M4 20 20 4|M4 13 13 4|M11 20l9-9',
    print: 'M7 9V3h10v6|M7 17H4v-7h16v7h-3|M7 14h10v7H7z',
    copy: 'M8 8h12v12H8z|M4 16V4h12',
    phone: 'M7 2h10v20H7z|M11 18h2',
    vault: 'M4 4h16v16H4z|C12,12,4|M12 8v1.5|M12 14.5V16|M8 12h1.5|M14.5 12H16|M6 20v1|M18 20v1'
  };
  var ICON_NAMES = Object.keys(ICONS);

  function circlePath(spec) {
    var p = spec.slice(1).split(',').map(Number), x = p[0], y = p[1], r = p[2];
    return 'M' + (x - r) + ' ' + y + 'a' + r + ' ' + r + ' 0 1 0 ' + 2 * r + ' 0a' + r + ' ' + r + ' 0 1 0 ' + -2 * r + ' 0';
  }

  function Icon(p) {
    var spec = ICONS[p.name] || ICONS.info;
    var size = p.size || 24;
    var parts = spec.split('|').map(function (d, i) {
      if (d.charAt(0) === 'F') return h('path', { key: i, d: circlePath(d), fill: 'currentColor', stroke: 'none' });
      return h('path', { key: i, d: d.charAt(0) === 'C' ? circlePath(d) : d });
    });
    return h('svg', {
      className: cx('fy-icon', p.className), viewBox: '0 0 24 24', width: size, height: size, fill: 'none',
      stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round',
      role: p.label ? 'img' : undefined, 'aria-label': p.label || undefined, 'aria-hidden': p.label ? undefined : true, focusable: 'false'
    }, parts);
  }

  /* ---------- Logo (the mark: an F whose two bars echo the rupee sign, and a brass coin) ---------- */
  var MARK_GLYPH = 'M16 13V35M16 13H32M16 23.5H27';
  var WORDMARK = 'M6 10V40M6 10H28M6 24.3H21M38 24V40M49 40V24M49 31a7 7 0 0 1 14 0V40M74 8V40M85 24V33a7 7 0 0 0 14 0M99 24V45a6 6 0 0 1-6 6H88';

  function Mark(size) {
    return h('svg', { className: 'fy-logo-mark', viewBox: '0 0 48 48', width: size, height: size, 'aria-hidden': true, focusable: 'false' },
      h('rect', { className: 'fy-logo-tile', width: 48, height: 48, rx: 12 }),
      h('path', { className: 'fy-logo-glyph', d: MARK_GLYPH }),
      h('circle', { className: 'fy-logo-coin', cx: 31, cy: 34, r: 3.75 }));
  }
  function Wordmark(height) {
    return h('svg', { className: 'fy-logo-word', viewBox: '0 0 105 56', height: height, width: Math.round(height * 105 / 56), 'aria-hidden': true, focusable: 'false' },
      h('path', { className: 'fy-logo-ink', d: WORDMARK }),
      h('circle', { className: 'fy-logo-dot', cx: 38, cy: 13, r: 3.75 }));
  }
  function Logo(p) {
    var variant = p.variant || 'mark';
    var size = p.size || 48;
    var art = variant === 'wordmark' ? Wordmark(size) : variant === 'lockup' ? h(Fragment, null, Mark(size), Wordmark(Math.round(size * 0.9))) : Mark(size);
    return h('span', { className: cx('fy-logo', variant === 'lockup' && 'fy-lockup', p.className), role: 'img', 'aria-label': BRAND.name }, art);
  }

  /* ---------- Money ---------- */
  var DIRECTIONS = {
    'in': { sign: '+', words: 'money in', tone: 'money-in', icon: 'in' },
    out: { sign: MINUS, words: 'money out', tone: 'money-out', icon: 'out' },
    transfer: { sign: '', words: 'transfer', tone: 'transfer', icon: 'transfer' },
    none: { sign: '', words: '', tone: 'none', icon: null }
  };
  var SIZES = { hero: 'amount-hero', lg: 'amount-lg', md: 'amount', sm: 'amount-sm' };

  function Money(p) {
    var dir = DIRECTIONS[p.direction || 'none'] || DIRECTIONS.none;
    var visibility = p.visibility || 'full';
    var sizeClass = SIZES[p.size || 'md'];
    if (visibility === 'hidden' || visibility === 'existence') {
      var text = visibility === 'hidden' ? 'Amount hidden' : 'Restricted entry';
      return h('span', { className: cx('fy-money fy-money--masked body-sm', p.className) }, h(Icon, { name: 'eye-off', size: 18 }), text);
    }
    if (visibility === 'rounded' || visibility === 'range') {
      var masked = p.display || (isRupees(p.amount) ? (visibility === 'rounded' ? roundedText(p.amount) : rangeText(p.amount)) : '');
      return h('span', { className: cx('fy-money', 'fy-tone-text-' + dir.tone, sizeClass, p.className), 'aria-label': masked.replace('≈', 'about') + (dir.words ? ', ' + dir.words : '') }, masked);
    }
    if (!isRupees(p.amount) || p.amount < 0) {
      return h('span', { className: cx('fy-money fy-money--masked body-sm', p.className) }, h(Icon, { name: 'alert-circle', size: 18 }), 'Amount unavailable');
    }
    var spoken = (dir.sign === '+' ? 'plus ' : dir.sign === MINUS ? 'minus ' : '') + amountWords(p.amount) + ' rupees' + (dir.words ? ', ' + dir.words : '') + (p.struck ? ', reversed' : '');
    return h('span', {
      className: cx('fy-money', 'fy-tone-text-' + (p.struck ? 'reversed' : dir.tone), sizeClass, p.struck && 'fy-money--struck', p.className),
      'aria-label': spoken
    }, h('span', { 'aria-hidden': true }, (dir.sign ? dir.sign + NNBSP : '') + formatINR(p.amount)));
  }

  /* ---------- badges ---------- */
  var STATUSES = {
    'money-in': ['Money in', 'in', 'money-in'], 'money-out': ['Money out', 'out', 'money-out'], transfer: ['Transfer', 'transfer', 'transfer'],
    draft: ['Draft', 'edit', 'transfer'], pending: ['Pending approval', 'clock', 'pending'], posting: ['Posting…', 'sync', 'pending'],
    posted: ['Posted', 'check', 'reconciled'], rejected: ['Rejected', 'x', 'blocked'], blocked: ['Blocked', 'ban', 'blocked'],
    reversed: ['Reversed', 'undo', 'reversed'], corrected: ['Corrected', 'undo', 'reversed'], outstanding: ['Outstanding', 'hourglass', 'outstanding'],
    settled: ['Settled', 'check', 'reconciled'], reconciled: ['Reconciled', 'check-double', 'reconciled'], exception: ['Needs review', 'alert', 'exception'],
    queued: ['Queued offline', 'cloud-off', 'transfer'], syncing: ['Syncing', 'sync', 'transfer'], 'sync-failed': ['Sync failed', 'alert-circle', 'blocked'],
    overdue: ['Overdue', 'alert', 'exception']
  };

  function StatusBadge(p) {
    var s = STATUSES[p.status] || STATUSES.draft;
    return h('span', { className: cx('fy-badge label', 'fy-tone-' + s[2], p.className) }, h(Icon, { name: s[1], size: 16 }), p.label || s[0]);
  }

  var PRIVACY = {
    'private': ['Private', 'lock', 'owner'], family: ['Family', 'family', 'neutral'], business: ['Business', 'business', 'neutral'],
    restricted: ['Restricted', 'shield-alert', 'exception'], shared: ['Shared', 'share', 'reconciled']
  };

  function PrivacyBadge(p) {
    var s = PRIVACY[p.level] || PRIVACY['private'];
    var badge = h('span', { className: cx('fy-privacy label', 'fy-privacy--' + s[2]) }, h(Icon, { name: s[1], size: 16 }), p.label || s[0]);
    if (!p.reason) return badge;
    return h('span', { className: 'fy-privacy-wrap' }, badge, h('span', { className: 'caption fy-muted' }, p.reason));
  }

  /* ---------- buttons ---------- */
  function Button(p) {
    var variant = p.variant || 'secondary';
    var busy = !!p.loading;
    return h('button', {
      type: p.type || 'button', className: cx('fy-btn button', 'fy-btn--' + variant, p.block && 'fy-btn--block', p.size === 'sm' && 'fy-btn--sm', p.className),
      disabled: p.disabled || busy, 'aria-busy': busy || undefined, onClick: p.onClick, 'aria-label': p['aria-label']
    }, busy ? h('span', { className: 'fy-spinner', 'aria-hidden': true }) : p.icon ? h(Icon, { name: p.icon, size: 20 }) : null,
      h('span', null, busy && p.loadingLabel ? p.loadingLabel : p.children));
  }

  function AddButton(p) {
    return h('button', { type: 'button', className: cx('fy-fab', p.extended && 'fy-fab--extended button', p.className), onClick: p.onClick, 'aria-label': p.extended ? undefined : (p.label || 'Add entry') },
      h(Icon, { name: 'plus', size: 26 }), p.extended ? h('span', null, p.label || 'Add') : null);
  }

  /* ---------- inputs ---------- */
  var fieldSeq = 0;
  function useId(prefix) { var st = useState(function () { fieldSeq += 1; return prefix + fieldSeq; }); return st[0]; }

  function FieldMessage(p) {
    if (p.error) return h('p', { id: p.id, className: 'fy-field-msg fy-field-msg--error caption', role: 'alert' }, h(Icon, { name: 'alert-circle', size: 16 }), p.error);
    if (p.helper) return h('p', { id: p.id, className: 'fy-field-msg caption fy-muted' }, p.helper);
    return null;
  }

  function TextField(p) {
    var id = useId('fy-tf-');
    var v = useMaybeControlled(p.value, p.defaultValue || '', p.onChange);
    var msgId = id + '-msg';
    return h('div', { className: cx('fy-field', p.error && 'fy-field--error', p.className) },
      h('label', { htmlFor: id, className: 'label fy-field-label' }, p.label, p.required ? h('span', { className: 'fy-req', 'aria-hidden': true }, ' *') : null),
      h('div', { className: 'fy-input-wrap' },
        p.icon ? h(Icon, { name: p.icon, size: 20, className: 'fy-input-icon' }) : null,
        h(p.multiline ? 'textarea' : 'input', {
          id: id, className: 'fy-input body', value: v[0], placeholder: p.placeholder, readOnly: p.readOnly, required: p.required,
          type: p.multiline ? undefined : p.type || 'text', inputMode: p.inputMode, autoComplete: p.autoComplete,
          'aria-invalid': p.error ? true : undefined, 'aria-describedby': p.error || p.helper ? msgId : undefined,
          rows: p.multiline ? 2 : undefined, onChange: function (e) { v[1](e.target.value); }
        })),
      h(FieldMessage, { id: msgId, error: p.error, helper: p.helper }));
  }

  var MAX_DIGITS = 12; // ₹99,99,99,99,999 — far above any configured limit, well inside safe integers.

  function AmountInput(p) {
    var v = useMaybeControlled(p.value, p.defaultValue == null ? null : p.defaultValue, p.onChange);
    var amount = v[0];
    var touchedState = useState(false);
    function press(key) {
      touchedState[1](true);
      var digits = amount == null ? '' : String(amount);
      if (key === 'del') digits = digits.slice(0, -1);
      else digits = (digits === '0' ? '' : digits) + key;
      if (digits.length > MAX_DIGITS) return;
      v[1](digits === '' ? null : Number(digits));
    }
    var error = p.error || null;
    if (!error && touchedState[0] && (amount === null || amount === 0)) error = 'Enter an amount';
    if (!error && isRupees(p.available) && amount > p.available) error = 'More than the available balance.';
    var warning = !error && isRupees(p.approvalAbove) && amount > p.approvalAbove ? 'Above ' + formatINR(p.approvalAbove) + ' — this entry will need approval.' : null;
    var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'del'];
    var spoken = amount == null ? 'No amount entered' : amountWords(amount) + ' rupees';
    return h('div', { className: cx('fy-amount-input', p.className) },
      h('div', { className: 'fy-amount-display', role: 'status', 'aria-live': 'polite', 'aria-label': (p.label || 'Amount') + ': ' + spoken },
        h('span', { className: 'label fy-muted' }, p.label || 'Amount'),
        h('div', { className: cx('amount-hero fy-amount-value', amount == null && 'fy-muted') }, RUPEE + (amount == null ? '0' : groupIndian(amount))),
        isRupees(p.available) ? h('span', { className: 'body-sm fy-muted' }, (p.availableLabel || 'Available') + ': ' + formatINR(p.available)) : null,
        error ? h('span', { className: 'fy-field-msg fy-field-msg--error caption', role: 'alert' }, h(Icon, { name: 'alert-circle', size: 16 }), error) : null,
        warning ? h('span', { className: 'fy-field-msg fy-field-msg--warn caption' }, h(Icon, { name: 'alert', size: 16 }), warning) : null),
      h('div', { className: 'fy-keypad', role: 'group', 'aria-label': 'Amount keypad, whole rupees' }, keys.map(function (k) {
        return h('button', { key: k, type: 'button', className: cx('fy-key', k === 'del' ? 'fy-key--fn' : 'amount'), onClick: function () { press(k); }, 'aria-label': k === 'del' ? 'Delete last digit' : k === '000' ? 'Three zeros' : undefined },
          k === 'del' ? h(Icon, { name: 'backspace', size: 24 }) : k);
      })));
  }

  function Chip(p) {
    return h('button', { type: 'button', className: cx('fy-chip label', p.selected && 'fy-chip--on', p.className), 'aria-pressed': !!p.selected, onClick: p.onClick },
      p.selected ? h(Icon, { name: 'check', size: 16 }) : p.icon ? h(Icon, { name: p.icon, size: 16 }) : null, p.label,
      p.count != null ? h('span', { className: 'fy-chip-count' }, p.count) : null);
  }

  function SearchBar(p) {
    var v = useMaybeControlled(p.value, p.defaultValue || '', p.onChange);
    var filters = p.filters || [];
    return h('div', { className: cx('fy-search', p.className), role: 'search' },
      h('div', { className: 'fy-search-box' },
        h(Icon, { name: 'search', size: 22 }),
        h('input', { className: 'fy-search-input body', type: 'search', value: v[0], placeholder: p.placeholder || 'Search amount, person, place, TX-…', 'aria-label': 'Search', onChange: function (e) { v[1](e.target.value); } }),
        v[0] ? h('button', { type: 'button', className: 'fy-icon-btn', 'aria-label': 'Clear search', onClick: function () { v[1](''); } }, h(Icon, { name: 'x', size: 20 })) : null),
      filters.length ? h('div', { className: 'fy-chip-row' }, filters.map(function (f) {
        return h(Chip, { key: f.id, label: f.label, selected: f.selected, icon: f.icon, onClick: function () { if (p.onToggleFilter) p.onToggleFilter(f.id); } });
      })) : null);
  }

  function Selector(p) {
    var open = useMaybeControlled(p.open, !!p.defaultOpen, p.onOpenChange);
    var q = useState('');
    var picked = useMaybeControlled(p.value, p.defaultValue || null, p.onSelect);
    var options = p.options || [];
    var query = q[0].trim().toLowerCase();
    var shown = options.filter(function (o) { return !query || (o.title + ' ' + (o.subtitle || '')).toLowerCase().indexOf(query) >= 0; });
    var current = options.filter(function (o) { return o.id === picked[0]; })[0];
    var field = h('button', { type: 'button', className: cx('fy-selector', p.error && 'fy-selector--error'), 'aria-haspopup': 'dialog', 'aria-expanded': open[0], onClick: function () { open[1](!open[0]); } },
      h('span', { className: 'label fy-muted' }, p.label),
      h('span', { className: cx('body', !current && 'fy-muted') }, current ? current.title : (p.placeholder || 'Choose')),
      current && current.subtitle ? h('span', { className: 'caption fy-muted' }, current.subtitle) : null,
      h(Icon, { name: 'chevron', size: 20, className: 'fy-selector-chev' }));
    if (!open[0]) return h('div', { className: p.className }, field, h(FieldMessage, { error: p.error }));
    return h('div', { className: p.className }, field,
      h('div', { className: 'fy-selector-sheet', role: 'dialog', 'aria-label': p.label },
        h('div', { className: 'fy-search-box' }, h(Icon, { name: 'search', size: 20 }),
          h('input', { className: 'fy-search-input body', type: 'search', value: q[0], placeholder: 'Search ' + (p.label || '').toLowerCase(), 'aria-label': 'Search ' + (p.label || ''), onChange: function (e) { q[1](e.target.value); } })),
        p.recentLabel ? h('p', { className: 'label fy-muted fy-sheet-sub' }, p.recentLabel) : null,
        h('ul', { className: 'fy-option-list', role: 'listbox' }, shown.length ? shown.map(function (o) {
          return h('li', { key: o.id, role: 'option', 'aria-selected': o.id === picked[0], 'aria-disabled': o.disabled || undefined },
            h('button', { type: 'button', className: cx('fy-option', o.disabled && 'fy-option--off'), disabled: o.disabled, onClick: function () { picked[1](o.id); open[1](false); } },
              o.icon ? h('span', { className: 'fy-option-icon' }, h(Icon, { name: o.icon, size: 20 })) : null,
              h('span', { className: 'fy-option-text' }, h('span', { className: 'body' }, o.title),
                o.disabled && o.reason ? h('span', { className: 'caption fy-muted' }, o.reason) : o.subtitle ? h('span', { className: 'caption fy-muted' }, o.subtitle) : null),
              o.id === picked[0] ? h(Icon, { name: 'check', size: 20, className: 'fy-brand-text' }) : null));
        }) : h('li', { className: 'body-sm fy-muted fy-option-empty' }, 'No match. Try a shorter name.'))));
  }

  function Tabs(p) {
    var v = useMaybeControlled(p.value, p.defaultValue || (p.tabs[0] && p.tabs[0].id), p.onChange);
    return h('div', { className: cx('fy-tabs', p.className), role: 'tablist' }, p.tabs.map(function (t) {
      var on = t.id === v[0];
      return h('button', { key: t.id, type: 'button', role: 'tab', 'aria-selected': on, className: cx('fy-tab button', on && 'fy-tab--on'), onClick: function () { v[1](t.id); } },
        t.label, t.count != null ? h('span', { className: 'fy-chip-count' }, t.count) : null);
    }));
  }

  /* ---------- navigation ---------- */
  function TopBar(p) {
    var path = p.path || [];
    return h('header', { className: cx('fy-topbar', p.className) },
      p.onBack !== null ? h('button', { type: 'button', className: 'fy-icon-btn', 'aria-label': 'Back', onClick: p.onBack }, h(Icon, { name: 'back' })) : null,
      h('div', { className: 'fy-topbar-text' },
        path.length ? h('nav', { 'aria-label': 'You are here', className: 'caption fy-muted fy-crumbs' }, path.join(' › ')) : null,
        h('h1', { className: 'title fy-topbar-title' }, p.title)),
      h('div', { className: 'fy-topbar-actions' }, (p.actions || []).map(function (a) {
        return h('button', { key: a.label, type: 'button', className: 'fy-icon-btn', 'aria-label': a.label, onClick: a.onClick }, h(Icon, { name: a.icon }));
      })));
  }

  var NAV_ITEMS = [{ id: 'home', label: 'Home', icon: 'home' }, { id: 'money', label: 'Money', icon: 'wallet' }, { id: 'activity', label: 'Activity', icon: 'list' },
    { id: 'outstanding', label: 'Outstanding', icon: 'hourglass' }, { id: 'more', label: 'More', icon: 'more' }];

  function BottomNav(p) {
    var items = p.items || NAV_ITEMS;
    var v = useMaybeControlled(p.value, p.defaultValue || items[0].id, p.onChange);
    return h('nav', { className: cx('fy-bottomnav', p.className), 'aria-label': 'Main' },
      p.onAdd ? h(AddButton, { onClick: p.onAdd, className: 'fy-bottomnav-fab' }) : null,
      items.map(function (it) {
        var on = it.id === v[0];
        return h('button', { key: it.id, type: 'button', className: cx('fy-navitem', on && 'fy-navitem--on'), 'aria-current': on ? 'page' : undefined, onClick: function () { v[1](it.id); } },
          h('span', { className: 'fy-navpill' }, h(Icon, { name: it.icon }), it.badge ? h('span', { className: 'fy-navdot', 'aria-label': it.badge + ' need attention' }) : null),
          h('span', { className: 'label' }, it.label));
      }));
  }

  var ADD_TYPES = [
    { id: 'transfer', title: 'Transfer', subtitle: 'Move money between places', icon: 'transfer' },
    { id: 'expense', title: 'Expense', subtitle: 'Money spent, with splits', icon: 'out' },
    { id: 'income', title: 'Income', subtitle: 'Money earned', icon: 'in' },
    { id: 'receive', title: 'Receive', subtitle: 'Money received from someone', icon: 'download' },
    { id: 'handover', title: 'Handover', subtitle: 'Cash passed person to person', icon: 'family' },
    { id: 'reimbursement', title: 'Reimbursement', subtitle: 'Paid for someone else', icon: 'receipt' },
    { id: 'advance', title: 'Advance', subtitle: 'Money given to account for later', icon: 'hourglass' },
    { id: 'adjustment', title: 'Adjustment', subtitle: 'Approved correction of a difference', icon: 'edit' }
  ];

  function AddSheet(p) {
    var types = p.types || ADD_TYPES;
    return h(BottomSheet, { title: 'Add', onClose: p.onClose },
      p.repeat ? h('button', { type: 'button', className: 'fy-repeat', onClick: p.onRepeat },
        h(Icon, { name: 'undo', size: 20 }), h('span', { className: 'fy-option-text' }, h('span', { className: 'subhead' }, 'Repeat last'), h('span', { className: 'body-sm fy-muted' }, p.repeat))) : null,
      h('div', { className: 'fy-add-grid' }, types.map(function (t) {
        return h('button', { key: t.id, type: 'button', className: 'fy-add-tile', onClick: function () { if (p.onPick) p.onPick(t.id); } },
          h('span', { className: 'fy-option-icon' }, h(Icon, { name: t.icon, size: 22 })), h('span', { className: 'subhead' }, t.title), h('span', { className: 'caption fy-muted' }, t.subtitle));
      })));
  }

  /* ---------- lists and cards ---------- */
  function ListRow(p) {
    var inner = [
      p.icon ? h('span', { key: 'i', className: 'fy-option-icon' }, h(Icon, { name: p.icon, size: 22 })) : null,
      h('span', { key: 't', className: 'fy-option-text' }, h('span', { className: 'body' }, p.title),
        p.reason ? h('span', { className: 'caption fy-muted' }, p.reason) : p.subtitle ? h('span', { className: 'body-sm fy-muted' }, p.subtitle) : null),
      p.trailing ? h('span', { key: 'r', className: 'fy-row-trail' }, p.trailing) : null,
      p.onClick && !p.disabled ? h(Icon, { key: 'c', name: 'chevron', size: 20, className: 'fy-muted' }) : null
    ];
    if (p.onClick) return h('button', { type: 'button', className: cx('fy-row', p.disabled && 'fy-option--off', p.className), disabled: p.disabled, onClick: p.onClick }, inner);
    return h('div', { className: cx('fy-row', p.className) }, inner);
  }

  function Card(p) { return h(p.as || 'section', { className: cx('fy-card', p.className), 'aria-label': p.label }, p.children); }

  function TransactionCard(p) {
    var tx = p.tx;
    var dir = DIRECTIONS[tx.direction] || DIRECTIONS.transfer;
    var reversed = tx.status === 'reversed' || tx.status === 'corrected';
    var showBadge = tx.status && tx.status !== 'posted';
    var body = [
      h('span', { key: 'g', className: cx('fy-tx-glyph', 'fy-tone-' + dir.tone) }, h(Icon, { name: dir.icon, size: 20 })),
      h('span', { key: 'm', className: 'fy-tx-main' },
        h('span', { className: 'fy-tx-line' },
          h('span', { className: 'body fy-tx-route' }, tx.from, h(Icon, { name: 'arrow-right', size: 16, className: 'fy-muted' }), tx.to),
          h(Money, { amount: tx.amount, direction: tx.direction, visibility: tx.visibility, display: tx.display, struck: reversed, size: 'md' })),
        tx.reason ? h('span', { className: 'body-sm fy-muted fy-ellipsis' }, tx.reason) : null,
        h('span', { className: 'fy-tx-meta caption fy-muted' }, [tx.date, tx.time, tx.handler ? 'by ' + tx.handler : null].filter(Boolean).join(' · '),
          showBadge ? h(StatusBadge, { status: tx.status }) : null,
          tx.privacy ? h(PrivacyBadge, { level: tx.privacy }) : null))
    ];
    if (p.onClick) return h('button', { type: 'button', className: cx('fy-card fy-tx', p.className), onClick: p.onClick }, body);
    return h('article', { className: cx('fy-card fy-tx', p.className) }, body);
  }

  function Breakdown(p) {
    var parts = p.parts || [];
    var total = sum(parts.filter(function (x) { return isRupees(x.amount); }), 'amount');
    return h('div', { className: 'fy-breakdown' },
      total > 0 ? h('div', { className: 'fy-bar', 'aria-hidden': true }, parts.map(function (x, i) {
        return isRupees(x.amount) ? h('span', { key: i, className: cx('fy-seg', x.tone ? 'fy-seg--' + x.tone : 'fy-seg--n' + (i % 5)), style: { flexGrow: x.amount } }) : null;
      })) : null,
      h('ul', { className: 'fy-legend' }, parts.map(function (x, i) {
        return h('li', { key: i, className: 'fy-legend-row' },
          h('span', { className: cx('fy-legend-mark', x.tone ? 'fy-seg--' + x.tone : 'fy-seg--n' + (i % 5)), 'aria-hidden': true }),
          h('span', { className: 'body-sm fy-legend-label' }, x.label),
          h(Money, { amount: x.amount, visibility: x.visibility, display: x.display, size: 'sm' }));
      })));
  }

  function BalanceCard(p) {
    return h(Card, { label: p.title, className: p.className },
      h('div', { className: 'fy-card-head' },
        h('div', null, h('h2', { className: 'subhead' }, p.title), p.path ? h('p', { className: 'caption fy-muted' }, p.path) : null),
        p.privacy ? h(PrivacyBadge, { level: p.privacy }) : null),
      h(Money, { amount: p.amount, visibility: p.visibility, display: p.display, size: 'lg' }),
      p.parts ? h(Breakdown, { parts: p.parts }) : null,
      p.updated ? h('p', { className: cx('caption', p.stale ? 'fy-tone-text-exception' : 'fy-muted') }, p.stale ? h(Icon, { name: 'alert', size: 14 }) : null, ' ', p.updated) : null);
  }

  var FUND_STATES = [['available', 'Available', 'brand'], ['reserved', 'Reserved', 'pending'], ['allocated', 'Allocated', 'transfer'],
    ['outstanding', 'Outstanding', 'outstanding'], ['locked', 'Locked', 'reversed']];

  function FundCard(p) {
    var s = p.states || {};
    var parts = FUND_STATES.filter(function (f) { return isRupees(s[f[0]]) && s[f[0]] > 0; }).map(function (f) { return { label: f[1], amount: s[f[0]], tone: f[2] }; });
    return h(Card, { label: p.name, className: p.className },
      h('div', { className: 'fy-card-head' },
        h('div', null, h('h2', { className: 'subhead' }, p.name), p.owner ? h('p', { className: 'caption fy-muted' }, 'Owner: ' + p.owner) : null),
        p.privacy ? h(PrivacyBadge, { level: p.privacy }) : null),
      h('div', { className: 'fy-fund-figs' },
        h('div', null, h('p', { className: 'label fy-muted' }, 'Available'), h(Money, { amount: s.available, size: 'lg' })),
        h('div', null, h('p', { className: 'label fy-muted' }, 'Total'), h(Money, { amount: p.total, size: 'md' }))),
      h(Breakdown, { parts: parts }));
  }

  function OutstandingCard(p) {
    var remaining = isRupees(p.original) && isRupees(p.settled) ? p.original - p.settled : null;
    var pct = remaining != null && p.original > 0 ? Math.round((p.settled / p.original) * 100) : 0;
    return h(Card, { label: p.title, className: p.className },
      h('div', { className: 'fy-card-head' },
        h('div', null, h('h2', { className: 'subhead' }, p.title), p.subtitle ? h('p', { className: 'caption fy-muted' }, p.subtitle) : null),
        h(StatusBadge, { status: p.overdue ? 'overdue' : remaining === 0 ? 'settled' : 'outstanding', label: p.overdue ? 'Overdue ' + p.overdue + ' days' : undefined })),
      h('div', { className: 'fy-tone-text-outstanding' }, h(Money, { amount: remaining, size: 'lg', className: 'fy-tone-text-outstanding' })),
      h('div', { className: 'fy-progress', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': pct, 'aria-label': 'Settled ' + pct + ' percent' }, h('span', { style: { width: pct + '%' } })),
      h('p', { className: 'body-sm fy-muted' }, formatINR(p.settled) + ' of ' + formatINR(p.original) + ' settled' + (p.due ? ' · Due ' + p.due : '')),
      p.onSettle && remaining > 0 ? h(Button, { variant: 'primary', icon: 'check', onClick: p.onSettle }, 'Settle') : null);
  }

  function ExplainBalance(p) {
    var moves = p.movements || [];
    var net = moves.reduce(function (a, m) { return a + (m.direction === 'out' ? -m.amount : m.amount); }, 0);
    var adds = p.opening + net === p.closing;
    return h(Card, { label: 'Explain balance: ' + p.title, className: p.className },
      h('h2', { className: 'subhead' }, 'Explain balance'), h('p', { className: 'caption fy-muted' }, p.title),
      h('ol', { className: 'fy-explain' },
        h('li', { className: 'fy-explain-row' }, h('span', { className: 'body-sm' }, 'Opening ' + (p.from || '')), h(Money, { amount: p.opening, size: 'sm' })),
        moves.map(function (m, i) {
          return h('li', { key: i, className: 'fy-explain-row' }, h('span', { className: 'body-sm' }, m.label, m.ref ? h('span', { className: 'figure fy-muted' }, ' ' + m.ref) : null),
            h(Money, { amount: m.amount, direction: m.direction, size: 'sm' }));
        }),
        h('li', { className: 'fy-explain-row fy-explain-total' }, h('span', { className: 'subhead' }, 'Closing ' + (p.to || '')), h(Money, { amount: p.closing, size: 'md' }))),
      adds ? h('p', { className: 'caption fy-tone-text-reconciled fy-inline' }, h(Icon, { name: 'check', size: 16 }), 'Opening + movements = closing')
        : h('p', { className: 'caption fy-tone-text-exception fy-inline', role: 'alert' }, h(Icon, { name: 'alert', size: 16 }), 'Does not add up. Reported to the integrity check; nothing was changed.'));
  }

  function JournalLines(p) {
    var lines = p.lines || [];
    var dr = sum(lines.filter(function (l) { return l.side === 'Dr'; }), 'amount');
    var cr = sum(lines.filter(function (l) { return l.side === 'Cr'; }), 'amount');
    var balanced = dr === cr && dr > 0;
    return h(Card, { label: 'Journal lines, ' + p.entity, className: cx('fy-journal', p.className) },
      h('div', { className: 'fy-card-head' }, h('h2', { className: 'subhead' }, p.entity), h('span', { className: 'caption fy-muted' }, p.journalId)),
      h('table', { className: 'fy-table' },
        h('thead', null, h('tr', null, h('th', { className: 'label' }, 'Ledger account'), h('th', { className: 'label fy-num' }, 'Dr'), h('th', { className: 'label fy-num' }, 'Cr'))),
        h('tbody', null, lines.map(function (l, i) {
          return h('tr', { key: i }, h('td', { className: 'body-sm' }, l.account, l.dims ? h('span', { className: 'caption fy-muted fy-block' }, l.dims) : null),
            h('td', { className: 'amount-sm fy-num' }, l.side === 'Dr' ? groupIndian(l.amount) : ''), h('td', { className: 'amount-sm fy-num' }, l.side === 'Cr' ? groupIndian(l.amount) : ''));
        })),
        h('tfoot', null, h('tr', null, h('td', { className: 'subhead' }, 'Total'), h('td', { className: 'amount-sm fy-num' }, groupIndian(dr)), h('td', { className: 'amount-sm fy-num' }, groupIndian(cr))))),
      balanced ? h('p', { className: 'caption fy-tone-text-reconciled fy-inline' }, h(Icon, { name: 'check', size: 16 }), 'Balanced: debits equal credits')
        : h('p', { className: 'caption fy-tone-text-blocked fy-inline', role: 'alert' }, h(Icon, { name: 'ban', size: 16 }), 'Unbalanced. This journal cannot be posted.'));
  }

  function DataTable(p) {
    var cols = p.columns || [];
    return h('div', { className: cx('fy-table-wrap', p.className) },
      h('table', { className: 'fy-table' },
        p.caption ? h('caption', { className: 'subhead' }, p.caption) : null,
        h('thead', null, h('tr', null, cols.map(function (c) { return h('th', { key: c.key, className: cx('label', c.align === 'end' && 'fy-num') }, c.label); }))),
        h('tbody', null, (p.rows || []).map(function (r, i) {
          return h('tr', { key: i }, cols.map(function (c) {
            var val = r[c.key];
            var isMoney = c.money && isRupees(val);
            return h('td', { key: c.key, className: cx(isMoney ? 'amount-sm' : c.figure ? 'figure' : 'body-sm', c.align === 'end' && 'fy-num') }, isMoney ? formatINR(val) : val);
          }));
        })),
        p.totals ? h('tfoot', null, h('tr', null, cols.map(function (c, i) {
          var val = p.totals[c.key];
          return h('td', { key: c.key, className: cx(i === 0 ? 'subhead' : 'amount-sm', c.align === 'end' && 'fy-num') }, c.money && isRupees(val) ? formatINR(val) : val || '');
        }))) : null));
  }

  function FindingCard(p) {
    return h(Card, { label: p.problem, className: cx('fy-finding', p.className) },
      h('div', { className: 'fy-card-head' }, h(StatusBadge, { status: p.severity === 'critical' ? 'blocked' : 'exception', label: p.severity === 'critical' ? 'Critical' : 'Needs review' }),
        p.when ? h('span', { className: 'caption fy-muted' }, p.when) : null),
      h('h3', { className: 'subhead' }, p.problem),
      h('dl', { className: 'fy-dl' },
        h('dt', { className: 'label fy-muted' }, 'Possible reason'), h('dd', { className: 'body-sm' }, p.reason),
        h('dt', { className: 'label fy-muted' }, 'Affected'), h('dd', { className: 'body-sm' }, (p.affected || []).join(' · ')),
        h('dt', { className: 'label fy-muted' }, 'Suggested action'), h('dd', { className: 'body-sm' }, p.action)),
      h('div', { className: 'fy-actions' }, h(Button, { variant: 'primary', size: 'sm', onClick: p.onReview }, 'Review'), h(Button, { variant: 'quiet', size: 'sm', onClick: p.onDismiss }, 'Mark as explained')));
  }

  /* ---------- overlays and feedback ---------- */
  function BottomSheet(p) {
    return h('div', { className: cx('fy-sheet', p.className), role: 'dialog', 'aria-modal': p.modal ? true : undefined, 'aria-label': p.title },
      h('span', { className: 'fy-sheet-handle', 'aria-hidden': true }),
      p.title ? h('div', { className: 'fy-sheet-head' }, h('h2', { className: 'title' }, p.title),
        p.onClose !== null ? h('button', { type: 'button', className: 'fy-icon-btn', 'aria-label': 'Close', onClick: p.onClose }, h(Icon, { name: 'x' })) : null) : null,
      h('div', { className: 'fy-sheet-body' }, p.children),
      p.actions ? h('div', { className: 'fy-sheet-actions' }, p.actions) : null);
  }

  function Dialog(p) {
    return h('div', { className: cx('fy-dialog', p.tone === 'danger' && 'fy-dialog--danger', p.className), role: 'alertdialog', 'aria-label': p.title },
      p.icon ? h('span', { className: cx('fy-dialog-icon', p.tone === 'danger' ? 'fy-tone-text-blocked' : 'fy-brand-text') }, h(Icon, { name: p.icon })) : null,
      h('h2', { className: 'title' }, p.title), p.body ? h('p', { className: 'body fy-muted' }, p.body) : null, p.children,
      h('div', { className: 'fy-dialog-actions' }, p.actions));
  }

  function ImpactPreview(p) {
    var items = p.items || [];
    var total = items.length + (p.hiddenCount ? 1 : 0);
    return h('section', { className: cx('fy-impact', p.className), 'aria-label': 'Impact preview' },
      h('p', { className: 'subhead' }, 'This change will affect ' + total + (total === 1 ? ' area' : ' areas')),
      h('ul', { className: 'fy-impact-list' }, items.map(function (it, i) {
        return h('li', { key: i, className: 'fy-impact-row' },
          h('span', { className: 'body-sm' }, it.area),
          h('span', { className: 'fy-impact-change' },
            it.before != null ? h('span', { className: 'amount-sm fy-muted' }, typeof it.before === 'number' ? formatINR(it.before) : it.before) : null,
            it.before != null ? h(Icon, { name: 'arrow-right', size: 14, className: 'fy-muted' }) : null,
            h('span', { className: 'amount-sm' }, typeof it.after === 'number' ? formatINR(it.after) : it.after)));
      }), p.hiddenCount ? h('li', { className: 'fy-impact-row fy-impact-hidden' }, h(Icon, { name: 'lock', size: 16 }),
        h('span', { className: 'body-sm' }, 'Another area you cannot see is affected. Someone with access will review it.')) : null));
  }

  function SummaryRows(p) {
    return h('dl', { className: 'fy-summary' }, (p.rows || []).map(function (r) {
      return h(Fragment, { key: r.label }, h('dt', { className: 'label fy-muted' }, r.label), h('dd', { className: 'body' }, r.value));
    }));
  }

  function ReviewSheet(p) {
    var warnings = p.warnings || [];
    return h(BottomSheet, { title: p.title || 'Review', onClose: p.onClose, className: p.className,
      actions: [h(Button, { key: 'e', variant: 'quiet', onClick: p.onEdit }, 'Edit'),
        h(Button, { key: 'c', variant: 'primary', icon: p.stepUp ? 'fingerprint' : 'check', loading: p.posting, loadingLabel: 'Posting…', onClick: p.onConfirm, block: true }, p.confirmLabel || 'Confirm & post')] },
      h('div', { className: 'fy-review-amount' }, h(Money, { amount: p.amount, direction: p.direction, size: 'lg' }), p.direction ? h(StatusBadge, { status: p.direction === 'in' ? 'money-in' : p.direction === 'out' ? 'money-out' : 'transfer', label: p.directionLabel }) : null),
      h(SummaryRows, { rows: p.rows }),
      warnings.map(function (w, i) { return h('p', { key: i, className: 'fy-warnrow body-sm' }, h(Icon, { name: 'alert', size: 18 }), w); }),
      p.impact ? h(ImpactPreview, { items: p.impact, hiddenCount: p.hiddenImpact }) : null,
      p.stepUp ? h('p', { className: 'caption fy-muted fy-inline' }, h(Icon, { name: 'shield', size: 16 }), 'You will confirm with your fingerprint.') : null);
  }

  function ConflictMessage(p) {
    return h('section', { className: cx('fy-conflict', p.className), role: 'alert' },
      h('div', { className: 'fy-conflict-head' }, h(Icon, { name: 'ban' }), h('h2', { className: 'subhead' }, p.title)),
      h('dl', { className: 'fy-dl' }, [['What conflicts', p.what], ['Where', p.where], ['Why it is blocked', p.why], ['What it would affect', p.impact]]
        .filter(function (x) { return x[1]; }).map(function (x) { return h(Fragment, { key: x[0] }, h('dt', { className: 'label' }, x[0]), h('dd', { className: 'body-sm' }, x[1])); })),
      p.note ? h('p', { className: 'caption' }, p.note) : null,
      h('div', { className: 'fy-actions' }, (p.resolutions || []).map(function (r, i) {
        return h(Button, { key: r.label, variant: i === 0 ? 'primary' : 'quiet', size: 'sm', onClick: r.onClick }, r.label);
      })));
  }

  function Snackbar(p) {
    return h('div', { className: cx('fy-snackbar', p.className), role: 'status', 'aria-live': 'polite' },
      p.icon ? h(Icon, { name: p.icon, size: 20 }) : null, h('span', { className: 'body-sm' }, p.message),
      p.actionLabel ? h('button', { type: 'button', className: 'fy-snackbar-action button', onClick: p.onAction }, p.actionLabel) : null);
  }

  var BANNERS = {
    offline: ['cloud-off', 'transfer'], syncing: ['sync', 'transfer'], 'sync-failed': ['alert-circle', 'blocked'], stale: ['clock', 'pending'],
    'read-only': ['lock', 'reversed'], locked: ['ban', 'blocked'], session: ['shield', 'pending'], timeout: ['timer', 'exception'], partial: ['info', 'pending']
  };
  function Banner(p) {
    var b = BANNERS[p.kind] || BANNERS.offline;
    return h('div', { className: cx('fy-banner', 'fy-tone-' + b[1], p.className), role: p.kind === 'sync-failed' || p.kind === 'locked' ? 'alert' : 'status' },
      h(Icon, { name: b[0], size: 20 }), h('span', { className: 'body-sm fy-banner-text' }, p.text),
      p.actionLabel ? h('button', { type: 'button', className: 'fy-banner-action label', onClick: p.onAction }, p.actionLabel) : null);
  }

  function Skeleton(p) {
    var n = p.rows || 3;
    var rows = [];
    for (var i = 0; i < n; i++) rows.push(h('div', { key: i, className: 'fy-skel-row' }, h('span', { className: 'fy-skel fy-skel-dot' }), h('span', { className: 'fy-skel-lines' }, h('span', { className: 'fy-skel fy-skel-l1' }), h('span', { className: 'fy-skel fy-skel-l2' })), h('span', { className: 'fy-skel fy-skel-amt' })));
    return h('div', { className: cx('fy-skeleton', p.className), role: 'status', 'aria-label': p.label || 'Loading' }, rows);
  }

  function EmptyState(p) {
    return h('div', { className: cx('fy-empty', p.className) },
      h('span', { className: 'fy-empty-icon' }, h(Icon, { name: p.icon || 'list', size: 28 })),
      h('h2', { className: 'section' }, p.title), p.body ? h('p', { className: 'body-sm fy-muted' }, p.body) : null,
      p.actionLabel ? h(Button, { variant: 'primary', icon: p.actionIcon || 'plus', onClick: p.onAction }, p.actionLabel) : null);
  }

  var ACCESS = {
    denied: ['lock', 'You do not have permission to view this account.', 'The owner controls who can see it. Ask them for access.'],
    forbidden: ['ban', 'This action is not available to your role.', 'Your entry was not changed.'],
    unauthorized: ['shield', 'Sign in again to continue.', 'For your security, your session ended. Your draft is saved on this phone, encrypted.']
  };
  function AccessState(p) {
    var a = ACCESS[p.kind] || ACCESS.denied;
    return h('div', { className: cx('fy-empty', p.className) },
      h('span', { className: 'fy-empty-icon' }, h(Icon, { name: a[0], size: 28 })),
      h('h2', { className: 'section' }, p.title || a[1]), h('p', { className: 'body-sm fy-muted' }, p.body || a[2]),
      p.actionLabel ? h(Button, { variant: 'secondary', onClick: p.onAction }, p.actionLabel) : null);
  }

  /* ---------- authentication ---------- */
  function PinPad(p) {
    var length = p.length || 4;
    var st = useState('');
    var entered = st[0];
    function press(k) {
      if (p.lockedFor) return;
      var next = k === 'del' ? entered.slice(0, -1) : (entered + k).slice(0, length);
      st[1](next);
      if (next.length === length && p.onComplete) { p.onComplete(next); st[1](''); }
    }
    var dots = [];
    for (var i = 0; i < length; i++) dots.push(h('span', { key: i, className: cx('fy-pin-dot', i < entered.length && 'fy-pin-dot--on') }));
    var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', p.onBiometric ? 'bio' : '', '0', 'del'];
    return h('div', { className: cx('fy-pin', p.className) },
      h('p', { className: 'title' }, p.title || 'Enter M-PIN'),
      h('div', { className: cx('fy-pin-dots', p.error && 'fy-pin-dots--error'), role: 'status', 'aria-label': entered.length + ' of ' + length + ' digits entered' }, dots),
      p.lockedFor ? h('p', { className: 'fy-field-msg fy-field-msg--error caption', role: 'alert' }, h(Icon, { name: 'timer', size: 16 }), 'Too many attempts. Try again in ' + p.lockedFor + ', or use your password.')
        : p.error ? h('p', { className: 'fy-field-msg fy-field-msg--error caption', role: 'alert' }, h(Icon, { name: 'alert-circle', size: 16 }), p.error) : h('p', { className: 'caption fy-muted' }, p.hint || 'Your M-PIN unlocks this phone only. It is not your password.'),
      h('div', { className: 'fy-keypad fy-keypad--pin' }, keys.map(function (k, idx) {
        if (!k) return h('span', { key: 'e' + idx });
        if (k === 'bio') return h('button', { key: k, type: 'button', className: 'fy-key fy-key--fn', 'aria-label': 'Use fingerprint', onClick: p.onBiometric }, h(Icon, { name: 'fingerprint', size: 26 }));
        return h('button', { key: k, type: 'button', className: cx('fy-key', k === 'del' ? 'fy-key--fn' : 'amount'), disabled: !!p.lockedFor, 'aria-label': k === 'del' ? 'Delete last digit' : undefined, onClick: function () { press(k); } },
          k === 'del' ? h(Icon, { name: 'backspace' }) : k);
      })),
      p.onForgot ? h('button', { type: 'button', className: 'fy-link button', onClick: p.onForgot }, 'Forgot M-PIN?') : null);
  }

  function OtpInput(p) {
    var length = p.length || 6;
    var v = useMaybeControlled(p.value, '', p.onChange);
    var id = useId('fy-otp-');
    var boxes = [];
    for (var i = 0; i < length; i++) boxes.push(h('span', { key: i, className: cx('fy-otp-box amount', i === v[0].length && 'fy-otp-box--cur') }, v[0][i] || ''));
    return h('div', { className: cx('fy-otp', p.className) },
      h('label', { htmlFor: id, className: 'label fy-muted' }, p.label || 'Code sent to your authenticator'),
      h('div', { className: cx('fy-otp-boxes', p.error && 'fy-pin-dots--error') }, boxes,
        h('input', { id: id, className: 'fy-otp-input', inputMode: 'numeric', autoComplete: 'one-time-code', maxLength: length, value: v[0], 'aria-invalid': p.error ? true : undefined,
          onChange: function (e) { v[1](e.target.value.replace(/\D/g, '').slice(0, length)); } })),
      h(FieldMessage, { error: p.error, helper: p.helper }));
  }

  function UnlockScreen(p) {
    var mode = useState(p.method || 'biometric');
    return h('div', { className: cx('fy-unlock', p.className) },
      h('p', { className: 'caption fy-muted' }, BRAND.name + ' is locked'),
      h('h1', { className: 'display' }, 'Welcome back, ' + (p.name || 'Krish')),
      mode[0] === 'biometric'
        ? h('div', { className: 'fy-unlock-bio' },
          h('button', { type: 'button', className: 'fy-bio-btn', onClick: p.onBiometric, 'aria-label': 'Unlock with fingerprint' }, h(Icon, { name: 'fingerprint', size: 44 })),
          h('p', { className: 'body' }, 'Touch the sensor to unlock'),
          h('button', { type: 'button', className: 'fy-link button', onClick: function () { mode[1]('pin'); } }, 'Use M-PIN instead'))
        : h(PinPad, { onBiometric: function () { mode[1]('biometric'); }, onForgot: p.onForgot, error: p.error }),
      h('button', { type: 'button', className: 'fy-link body-sm', onClick: p.onPassword }, 'Sign in with password'));
  }

  function StepUpSheet(p) {
    return h(BottomSheet, { title: 'Confirm it is you', onClose: p.onCancel, className: p.className,
      actions: [h(Button, { key: 'c', variant: 'quiet', onClick: p.onCancel }, 'Cancel'), h(Button, { key: 'v', variant: 'primary', icon: 'fingerprint', onClick: p.onVerify, block: true }, 'Use fingerprint')] },
      h('p', { className: 'body' }, p.action),
      p.failed ? h('p', { className: 'fy-field-msg fy-field-msg--error caption', role: 'alert' }, h(Icon, { name: 'alert-circle', size: 16 }), 'Not recognised. Nothing was shared. Try again or use your M-PIN.')
        : h('p', { className: 'caption fy-muted' }, 'Needed because this is ' + (p.reason || 'a high-value action') + '.'),
      h('button', { type: 'button', className: 'fy-link button', onClick: p.onUsePin }, 'Use M-PIN instead'));
  }

  /* ---------- sharing and proof ---------- */
  var PRESETS = {
    Standard: [], Protected: ['password'], Secure: ['password', 'encryption'], Confidential: ['password', 'encryption', 'watermark', 'expiry'],
    'Combined Secure': ['password', 'encryption', 'watermark', 'expiry', 'viewer', 'revocable'],
    'Owner Secure': ['password', 'encryption', 'watermark', 'expiry', 'viewer', 'revocable', 'identity', 'verify', 'stepup']
  };
  var CONTROLS = [['password', 'Password protection', 'key'], ['encryption', 'Encryption', 'lock'], ['watermark', 'Watermark', 'watermark'], ['expiry', 'Expiry', 'timer'],
    ['viewer', 'Secure Viewer', 'shield'], ['revocable', 'Revocable access', 'undo'], ['identity', 'Recipient identity marking', 'user'], ['download', 'Download allowed', 'download'],
    ['print', 'Print allowed', 'print'], ['verify', 'Require user verification', 'check'], ['stepup', 'Require step-up authentication', 'fingerprint']];
  var EXPIRY = ['1 hour', '6 hours', '24 hours', '3 days', '7 days'];

  function SecurityBuilder(p) {
    var policy = p.policy || {};
    var initial = {};
    CONTROLS.forEach(function (c) { var pol = policy[c[0]] || 'optional'; initial[c[0]] = pol === 'mandatory' || pol === 'default'; });
    var st = useState(initial);
    var expiry = useState(p.expiry || '24 hours');
    var changed = useState(false);
    var on = st[0];
    function set(id, val) { var next = Object.assign({}, on); next[id] = val; st[1](next); changed[1](true); }
    function applyPreset(name) {
      var next = {};
      CONTROLS.forEach(function (c) {
        var pol = policy[c[0]] || 'optional';
        next[c[0]] = pol === 'mandatory' ? true : pol === 'blocked' ? false : PRESETS[name].indexOf(c[0]) >= 0 || (c[0] === 'download' && name === 'Standard');
      });
      st[1](next); changed[1](true);
    }
    return h('section', { className: cx('fy-secbuilder', p.className), 'aria-label': 'Document security' },
      h('p', { className: 'label fy-muted' }, 'Preset'),
      h('div', { className: 'fy-chip-row' }, Object.keys(PRESETS).map(function (name) { return h(Chip, { key: name, label: name, onClick: function () { applyPreset(name); } }); })),
      h('ul', { className: 'fy-controls' }, CONTROLS.map(function (c) {
        var pol = policy[c[0]] || 'optional';
        var locked = pol === 'mandatory' || pol === 'blocked';
        var id = 'fy-sec-' + c[0];
        return h('li', { key: c[0], className: cx('fy-control', locked && 'fy-control--locked') },
          h('input', { type: 'checkbox', id: id, className: 'fy-check', checked: !!on[c[0]], disabled: locked, onChange: function (e) { set(c[0], e.target.checked); } }),
          h('label', { htmlFor: id, className: 'fy-control-label' }, h(Icon, { name: c[2], size: 20 }),
            h('span', { className: 'fy-option-text' }, h('span', { className: 'body' }, c[1]),
              pol === 'mandatory' ? h('span', { className: 'caption fy-muted fy-inline' }, h(Icon, { name: 'lock', size: 14 }), 'Required by policy — cannot turn off')
                : pol === 'blocked' ? h('span', { className: 'caption fy-muted fy-inline' }, h(Icon, { name: 'ban', size: 14 }), 'Not allowed by policy')
                  : pol === 'default' ? h('span', { className: 'caption fy-muted' }, 'On by default') : null)),
          c[0] === 'expiry' && on.expiry ? h('select', { className: 'fy-select body-sm', value: expiry[0], 'aria-label': 'Expiry', onChange: function (e) { expiry[1](e.target.value); changed[1](true); } },
            EXPIRY.map(function (x) { return h('option', { key: x, value: x }, x); })) : null);
      })),
      changed[0] ? h('p', { className: 'fy-warnrow body-sm' }, h(Icon, { name: 'info', size: 18 }), 'Settings changed. The preview and verification will be redone before sharing.') : null);
  }

  function MessagePreview(p) {
    return h('section', { className: cx('fy-msgprev', p.className), 'aria-label': 'Exact message preview' },
      h('p', { className: 'label fy-muted fy-inline' }, h(Icon, { name: 'message', size: 16 }), 'This exact text will be shared'),
      h('pre', { className: 'fy-msgbody body-sm' }, p.text));
  }

  function ShareConfirm(p) {
    var r = p.recipient || {};
    return h(BottomSheet, { title: 'Send this proof?', onClose: p.onCancel, className: p.className,
      actions: [h(Button, { key: 'c', variant: 'quiet', onClick: p.onCancel }, 'Cancel'),
        h(Button, { key: 'v', variant: 'primary', icon: 'shield', disabled: p.invalidated, onClick: p.onVerify, block: true }, 'Verify & share')] },
      p.invalidated ? h(Banner, { kind: 'stale', text: 'The content changed after you reviewed it. Review the new preview first.', actionLabel: 'Review', onAction: p.onReview }) : null,
      h(SummaryRows, { rows: [
        { label: 'Recipient', value: h('span', { className: 'fy-inline' }, r.name, r.verified ? h(StatusBadge, { status: 'settled', label: 'Verified' }) : h(StatusBadge, { status: 'exception', label: 'Not verified' })) },
        { label: 'Contact', value: r.contact },
        { label: 'Channel', value: p.channel },
        { label: 'Format', value: p.format },
        { label: 'Security', value: h('span', { className: 'fy-sec-list' }, (p.security || []).map(function (s) { return h('span', { key: s, className: 'fy-inline body-sm' }, h(Icon, { name: 'check', size: 14, className: 'fy-tone-text-reconciled' }), s); })) },
        { label: 'Content', value: p.content }
      ] }),
      h('p', { className: 'caption fy-muted' }, 'After it leaves Finly, a downloaded copy cannot be recalled. Prefer Secure Viewer for highly confidential proof.'));
  }

  function ProofRow(label, value) { return h(Fragment, { key: label }, h('dt', { className: 'label' }, label), h('dd', { className: 'body-sm' }, value)); }

  function ProofCard(p) {
    var tx = p.tx;
    var dir = DIRECTIONS[tx.direction] || DIRECTIONS.transfer;
    var heading = { 'in': 'PAYMENT RECEIVED · CREDIT · AVAK', out: 'PAYMENT MADE · DEBIT · JAVAK', transfer: 'TRANSFER' }[tx.direction] || 'TRANSFER';
    return h('figure', { className: cx('fy-proof', p.className), 'data-theme': 'light', 'aria-label': 'Generated proof for ' + tx.id },
      p.watermark ? h('span', { className: 'fy-watermark', 'aria-hidden': true }, p.watermark) : null,
      h('div', { className: 'fy-proof-head' }, h('span', { className: 'subhead' }, p.firm || BRAND.name), p.classification ? h(PrivacyBadge, { level: 'restricted', label: p.classification }) : null),
      h('p', { className: cx('label', 'fy-tone-text-' + dir.tone) }, heading),
      h(Money, { amount: tx.amount, direction: tx.direction, size: 'lg' }),
      h('dl', { className: 'fy-proof-rows' }, [ProofRow('From', tx.from), ProofRow('To', tx.to), ProofRow('Date', tx.date + (tx.day ? ' · ' + tx.day : '')), ProofRow('Time', tx.time),
        ProofRow('Reason', tx.reason), ProofRow('Handled by', tx.handler), tx.fund ? ProofRow('Fund', tx.fund) : null, ProofRow('Reference', tx.id)]),
      h('figcaption', { className: 'caption fy-muted fy-proof-foot' }, 'Generated by ' + BRAND.name + ' from the posted record, not a screenshot.', p.verifyCode ? h('span', { className: 'figure fy-block' }, 'Verify: ' + p.verifyCode) : null));
  }

  function PdfPage(p) {
    var s = p.summary || {};
    return h('article', { className: cx('fy-pdf', p.className), 'data-theme': 'light', 'aria-label': 'PDF page preview' },
      p.watermark ? h('span', { className: 'fy-watermark fy-watermark--pdf', 'aria-hidden': true }, p.watermark) : null,
      h('header', { className: 'fy-pdf-head' },
        h('div', null, h('p', { className: 'title' }, p.title), h('p', { className: 'body-sm fy-muted' }, p.entity + ' · ' + p.period)),
        h('span', { className: 'label fy-muted' }, BRAND.name)),
      h('div', { className: 'fy-pdf-summary' }, [['Opening', s.opening, 'none'], ['Credits', s.credits, 'in'], ['Debits', s.debits, 'out'], ['Closing', s.closing, 'none']].map(function (x) {
        return h('div', { key: x[0], className: 'fy-pdf-fig' }, h('p', { className: 'label fy-muted' }, x[0]), h(Money, { amount: x[1], direction: x[2], size: 'sm' }));
      })),
      h(DataTable, { columns: [{ key: 'date', label: 'Date', figure: true }, { key: 'id', label: 'Reference', figure: true }, { key: 'detail', label: 'Detail' },
        { key: 'avak', label: 'Avak (in)', align: 'end', money: true }, { key: 'javak', label: 'Javak (out)', align: 'end', money: true }], rows: p.rows, totals: p.totals }),
      h('footer', { className: 'fy-pdf-foot caption fy-muted' },
        h('span', null, 'Page ' + (p.page || 1) + ' of ' + (p.pages || 1)), h('span', { className: 'figure' }, p.docId),
        h('span', null, 'Generated ' + p.generated), h('span', null, p.classification || 'Internal')));
  }

  /* ---------- the K3 states board (a page, not an app component) ---------- */
  function StateTile(p) { return h('div', { className: 'fy-state-tile' }, h('p', { className: 'label fy-muted' }, p.name), h('div', { className: 'fy-state-body' }, p.children)); }

  function StatesBoard() {
    var tx = { from: 'Mint', to: 'Tijori', amount: 5000, direction: 'in', reason: 'Cash received from Mint', date: '08 Oct', time: '10:15 AM', handler: 'Krish' };
    return h('div', { className: 'fy-states' },
      h(StateTile, { name: 'Loading' }, h(Skeleton, { rows: 2 })),
      h(StateTile, { name: 'Empty' }, h(EmptyState, { icon: 'list', title: 'No transactions yet.', body: 'Add your first money movement.', actionLabel: 'Add entry' })),
      h(StateTile, { name: 'Success' }, h(Snackbar, { icon: 'check', message: 'Posted. TX-20261008-001245', actionLabel: 'Share proof' })),
      h(StateTile, { name: 'Error' }, h(Banner, { kind: 'sync-failed', text: 'Transaction could not be saved. Check your internet connection and try again.', actionLabel: 'Retry' })),
      h(StateTile, { name: 'Unauthorized' }, h(AccessState, { kind: 'unauthorized', actionLabel: 'Unlock' })),
      h(StateTile, { name: 'Permission denied' }, h(AccessState, { kind: 'denied' })),
      h(StateTile, { name: 'Forbidden' }, h(AccessState, { kind: 'forbidden' })),
      h(StateTile, { name: 'Offline' }, h(Banner, { kind: 'offline', text: 'You are offline. 2 entries are queued and will post when you are back online.' })),
      h(StateTile, { name: 'Syncing' }, h(Banner, { kind: 'syncing', text: 'Syncing 2 queued entries…' })),
      h(StateTile, { name: 'Sync failed' }, h(Banner, { kind: 'sync-failed', text: '1 queued entry was rejected: the Tijori balance changed.', actionLabel: 'Fix' })),
      h(StateTile, { name: 'Conflict' }, h(ConflictMessage, { title: 'Someone else changed this draft.', why: 'Sujal saved a new version 2 minutes ago.', resolutions: [{ label: 'Compare' }, { label: 'Reload' }] })),
      h(StateTile, { name: 'Validation error' }, h(TextField, { label: 'Reason', defaultValue: '', error: 'Please write why the money moved.' })),
      h(StateTile, { name: 'Confirmation' }, h(ImpactPreview, { items: [{ area: 'Tijori · Mint Fund', before: 482000, after: 487000 }, { area: 'Mint · Available', before: 600000, after: 605000 }] })),
      h(StateTile, { name: 'Destructive action' }, h(Dialog, { title: 'Reverse this entry?', tone: 'danger', icon: 'undo', body: 'A mirror entry will cancel ₹5,000. The original stays in history.', actions: [h(Button, { key: 'c', variant: 'quiet' }, 'Keep'), h(Button, { key: 'r', variant: 'danger' }, 'Reverse')] })),
      h(StateTile, { name: 'Locked' }, h(Banner, { kind: 'locked', text: 'Financial entries are paused by the administrator. You can still view.' })),
      h(StateTile, { name: 'Session expired' }, h(Banner, { kind: 'session', text: 'Session expired. Unlock to continue — your draft is saved.', actionLabel: 'Unlock' })),
      h(StateTile, { name: 'Security re-authentication' }, h(StepUpSheet, { action: 'Share the Mint October report as a Confidential PDF.', reason: 'a confidential document' })),
      h(StateTile, { name: 'No search results' }, h(EmptyState, { icon: 'search', title: 'Nothing matches “45000 Angadya”.', body: 'Check the spelling or remove a filter.' })),
      h(StateTile, { name: 'Timeout' }, h(Banner, { kind: 'timeout', text: 'Still checking whether your entry was posted. We will not post it twice.', actionLabel: 'Check again' })),
      h(StateTile, { name: 'Read-only' }, h(Banner, { kind: 'read-only', text: 'October 2026 is closed. Changes go through a correction.', actionLabel: 'Correct' })),
      h(StateTile, { name: 'Stale data' }, h(Banner, { kind: 'stale', text: 'Showing balances from 2 hours ago. Pull to refresh.' })),
      h(StateTile, { name: 'Partially loaded' }, h(Fragment, null, h(TransactionCard, { tx: tx }), h(Banner, { kind: 'partial', text: 'Some entries did not load.', actionLabel: 'Load rest' }))),
      h(StateTile, { name: 'Large list' }, h(Fragment, null, h('p', { className: 'subhead fy-sticky' }, 'Today · 128 entries'), h(TransactionCard, { tx: tx }), h('p', { className: 'caption fy-muted' }, 'Loads 50 at a time · Jump to date'))),
      h(StateTile, { name: 'Recovery' }, h(EmptyState, { icon: 'undo', title: 'Your entry was not posted.', body: 'Nothing changed. Your draft is kept so you can try again.', actionLabel: 'Open draft', actionIcon: 'edit' })));
  }

  window.Finly = Object.assign(window.Finly || {}, {
    Logo: Logo, Icon: Icon, Money: Money, StatusBadge: StatusBadge, PrivacyBadge: PrivacyBadge, Button: Button, AddButton: AddButton, TextField: TextField,
    AmountInput: AmountInput, SearchBar: SearchBar, Chip: Chip, Selector: Selector, Tabs: Tabs, TopBar: TopBar, BottomNav: BottomNav, AddSheet: AddSheet,
    ListRow: ListRow, TransactionCard: TransactionCard, BalanceCard: BalanceCard, FundCard: FundCard, OutstandingCard: OutstandingCard,
    ExplainBalance: ExplainBalance, JournalLines: JournalLines, DataTable: DataTable, FindingCard: FindingCard, BottomSheet: BottomSheet, Dialog: Dialog,
    ImpactPreview: ImpactPreview, ReviewSheet: ReviewSheet, ConflictMessage: ConflictMessage, Snackbar: Snackbar, Banner: Banner, Skeleton: Skeleton,
    EmptyState: EmptyState, AccessState: AccessState, PinPad: PinPad, OtpInput: OtpInput, UnlockScreen: UnlockScreen, StepUpSheet: StepUpSheet,
    SecurityBuilder: SecurityBuilder, MessagePreview: MessagePreview, ShareConfirm: ShareConfirm, ProofCard: ProofCard, PdfPage: PdfPage, StatesBoard: StatesBoard,
    format: { inr: formatINR, group: groupIndian, words: amountWords, rounded: roundedText, range: rangeText },
    iconNames: ICON_NAMES,
    brand: BRAND
  });
})();
