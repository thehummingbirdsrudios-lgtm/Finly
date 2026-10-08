// Builds project/tokens.json from palette.json + usage notes, so every colour value has one source.
const fs = require('fs');
const [paletteFile, outFile] = process.argv.slice(2);
const P = JSON.parse(fs.readFileSync(paletteFile, 'utf8'));
const c = (name, usage) => ({ name, value: { light: P[name][0], dark: P[name][1] }, usage });
const alias = (name, of, usage) => ({ name, value: `{${of}}`, usage });
const color = [
  c('surface', 'Page background behind every screen.'),
  c('surface-raised', 'Cards, bottom sheets, dialogs, the app bar and the bottom navigation.'),
  c('surface-sunken', 'Input fills, keypad keys, inactive segments and skeleton blocks.'),
  c('line', 'Decorative hairlines between list rows and inside cards. Never the only boundary of a control.'),
  c('line-strong', 'Input, checkbox and outlined-button borders: at least 3:1 on surface, surface-raised and surface-sunken in both themes.'),
  c('ink', 'Primary text and icons on surface, surface-raised, surface-sunken, brand-soft and every *-soft status fill.'),
  c('ink-muted', 'Secondary text (dates, handler, path crumbs, helper text) on surface, surface-raised and surface-sunken.'),
  c('brand', 'Ledger green. Primary buttons, the add button, active navigation, selected controls and links; as text on surface, surface-raised, surface-sunken and brand-soft.'),
  c('brand-soft', 'Selected chip and navigation-indicator fill behind ink or brand text.'),
  c('on-brand', 'Text and icons on a brand fill (the primary button label, the add button glyph).'),
  c('accent', 'Brass. Non-state highlights only: the cover, onboarding progress, the selected period marker. Never a money direction or a status. 3:1 as a mark on all surfaces.'),
  c('on-accent', 'Text on an accent fill.'),
  alias('focus', 'brand', 'Keyboard and switch-access focus ring: 2px gap in the ground colour, then a solid 2px ring. At least 3:1 on every surface.'),
  { name: 'scrim', value: { light: 'rgba(9,14,11,0.56)', dark: 'rgba(0,0,0,0.64)' }, usage: 'Dim layer behind bottom sheets and dialogs.' },
  c('money-in', 'Money In / Credit / Avak amounts and the in-arrow glyph, on surface, surface-raised, surface-sunken and money-in-soft. Always with a + sign and the in-arrow.'),
  c('money-in-soft', 'Fill behind the Money In tag.'),
  c('money-out', 'Money Out / Debit / Javak amounts and the out-arrow glyph, on surface, surface-raised, surface-sunken and money-out-soft. Always with a minus sign and the out-arrow.'),
  c('money-out-soft', 'Fill behind the Money Out tag.'),
  c('transfer', 'Transfer amounts (same owner, different place) and the swap glyph; no sign. On surface, surface-raised, surface-sunken and transfer-soft.'),
  c('transfer-soft', 'Fill behind the Transfer tag, and the Draft and Queued badges.'),
  c('pending', 'Pending approval and Posting text and the clock glyph, on the surfaces and pending-soft.'),
  c('pending-soft', 'Fill behind the Pending badge and the reserved segment of a fund bar.'),
  c('blocked', 'Blocked, Rejected, failed and destructive: text, glyph and the danger button, on the surfaces and blocked-soft.'),
  c('blocked-soft', 'Fill behind the Blocked badge and the conflict block.'),
  c('reversed', 'Reversed and Corrected: text, the undo glyph and the strike-through on the original amount, on the surfaces and reversed-soft.'),
  c('reversed-soft', 'Fill behind the Reversed badge.'),
  c('outstanding', 'Outstanding, receivable, payable, advance and reimbursement due: text and the hourglass glyph, on the surfaces and outstanding-soft.'),
  c('outstanding-soft', 'Fill behind the Outstanding badge and the outstanding segment of a fund bar.'),
  c('reconciled', 'Posted, Reconciled, Settled and Verified: text and the check glyph, on the surfaces and reconciled-soft. Teal, so it never relies on a red-green split against blocked.'),
  c('reconciled-soft', 'Fill behind the Posted and Reconciled badges.'),
  c('exception', 'Exception-engine findings and inline warnings (possible duplicate, unusual amount, missing receipt): text and the warning glyph, on the surfaces and exception-soft.'),
  c('exception-soft', 'Fill behind the Exception badge and warning rows.'),
  alias('success', 'reconciled', 'Generic success (saved, verified); an alias of reconciled.'),
  alias('success-soft', 'reconciled-soft', 'Fill behind success messages.'),
  alias('error', 'blocked', 'Validation and system errors; an alias of blocked.'),
  alias('error-soft', 'blocked-soft', 'Fill behind error messages.'),
  alias('warning', 'exception', 'Warnings that need review before saving; an alias of exception.'),
  alias('warning-soft', 'exception-soft', 'Fill behind warnings.'),
  alias('security-standard', 'ink-muted', 'Share and document security level Standard / Internal (no protection).'),
  alias('security-protected', 'money-in', 'Security level Protected / Secure (password, encryption).'),
  alias('security-confidential', 'outstanding', 'Security level Confidential / Restricted (adds watermark, expiry).'),
  alias('security-owner', 'ink', 'Security level Owner Secure / Owner-only / Private (everything mandatory).'),
];
const fam = 'sans';
const st = (name, fontSize, lineHeight, fontWeight, sample, usage, extra = {}) => ({ name, fontSize, lineHeight, fontWeight, sample, usage, ...extra });
const tokens = {
  name: 'Finely', version: 1,
  color: { themes: [{ id: 'light', name: 'Light' }, { id: 'dark', name: 'Dark' }], tokens: color },
  type: {
    fonts: [],
    families: { sans: '"Mukta", "Mukta Vaani", "Noto Sans Devanagari", "Noto Sans Gujarati", system-ui, sans-serif' },
    groups: [
      { name: 'Headings', family: fam, styles: [
        st('display', '32px', '38px', 700, 'Where is our money?', 'Home greeting and setup screens only; one per screen.'),
        st('title-lg', '24px', '30px', 600, 'Mint › Tijori', 'Detail-screen titles (account, fund, person, firm).'),
        st('title', '20px', '26px', 600, 'Review transfer', 'App-bar titles, sheet and dialog titles.'),
        st('section', '17px', '24px', 600, 'Recent activity', 'Section headings inside a screen.'),
        st('subhead', '15px', '20px', 600, 'Today · 3 entries', 'Sticky date headers, card titles, group labels.') ] },
      { name: 'Text', family: fam, styles: [
        st('body', '16px', '24px', 400, 'Cash received from Mint, placed in the Tijori.', 'Default reading text, reasons, messages.'),
        st('body-sm', '14px', '20px', 400, 'Handled by Krish Patel · 10:15 AM', 'Secondary lines in rows and cards.'),
        st('caption', '12px', '16px', 400, 'Last updated 2 min ago', 'Timestamps, helper text, chart legends. Never for amounts.'),
        st('label', '13px', '18px', 600, 'FROM', 'Field labels, badge and tag text.', { letterSpacing: '0.02em' }),
        st('button', '16px', '20px', 600, 'Save', 'Button and tab labels.') ] },
      { name: 'Money', family: fam, styles: [
        st('amount-hero', '40px', '46px', 700, '₹12,00,000', 'The one total a screen is about (home total, the amount being entered).'),
        st('amount-lg', '28px', '34px', 700, '+ ₹50,000', 'Card balances and the amount on detail, review and proof screens.'),
        st('amount', '18px', '24px', 600, '− ₹5,000', 'Amounts in transaction rows and lists.'),
        st('amount-sm', '15px', '20px', 600, '₹45,000', 'Amounts inside breakdowns, tables and legends.'),
        st('figure', '13px', '18px', 500, 'TX-20261008-001245', 'Transaction IDs, references and dates in tables (tabular figures).') ] },
    ],
  },
  spacing: { tokens: [
    { name: 'space-1', value: '4px', usage: 'Icon-to-label gap, badge padding.' },
    { name: 'space-2', value: '8px', usage: 'Gap between related items: chips, sign and amount, row lines.' },
    { name: 'space-3', value: '12px', usage: 'Inner padding of chips and compact rows; gap between cards in a grid.' },
    { name: 'space-4', value: '16px', usage: 'Screen side gutter, card padding, list-row padding.' },
    { name: 'space-5', value: '20px', usage: 'Bottom-sheet padding.' },
    { name: 'space-6', value: '24px', usage: 'Gap between sections.' },
    { name: 'space-8', value: '32px', usage: 'Gap above a screen primary action; empty-state padding.' },
    { name: 'space-10', value: '40px', usage: 'Top inset of full-screen states (unlock, empty, denied).' },
    { name: 'space-12', value: '48px', usage: 'Minimum touch target (same as size touch-min).' },
    { name: 'space-16', value: '64px', usage: 'Large separations on setup screens.' } ] },
  radius: { tokens: [
    { name: 'radius-xs', value: '4px', usage: 'Bar segments and small marks.' },
    { name: 'radius-sm', value: '8px', usage: 'Badges, tags, chips.' },
    { name: 'radius-md', value: '12px', usage: 'Buttons, inputs, keypad keys, banners.' },
    { name: 'radius-lg', value: '16px', usage: 'Cards and proof cards.' },
    { name: 'radius-xl', value: '28px', usage: 'Top corners of bottom sheets; dialogs.' },
    { name: 'radius-full', value: '9999px', usage: 'Pills, the add button, avatars. In SVG use half the short side instead.' } ] },
  shadow: { tokens: [
    { name: 'elevation-1', value: { light: '0 1px 2px rgba(19,28,23,0.08), 0 1px 3px rgba(19,28,23,0.06)', dark: '0 1px 2px rgba(0,0,0,0.6)' }, usage: 'Cards resting on surface.' },
    { name: 'elevation-2', value: { light: '0 -2px 16px rgba(19,28,23,0.12)', dark: '0 -2px 16px rgba(0,0,0,0.7)' }, usage: 'Bottom sheets and the bottom navigation.' },
    { name: 'elevation-3', value: { light: '0 6px 20px rgba(19,28,23,0.18)', dark: '0 6px 20px rgba(0,0,0,0.75)' }, usage: 'The add button, dialogs and snackbars.' } ] },
  size: { tokens: [
    { name: 'touch-min', value: '48px', usage: 'Minimum width and height of anything tappable.' },
    { name: 'icon-md', value: '24px', usage: 'Default icon size.' },
    { name: 'icon-sm', value: '20px', usage: 'Icons inside badges, chips and dense rows.' },
    { name: 'field-height', value: '56px', usage: 'Text fields and selectors.' },
    { name: 'key-height', value: '56px', usage: 'Amount keypad and M-PIN keys.' },
    { name: 'app-bar', value: '64px', usage: 'Top app bar height (title plus context path).' },
    { name: 'nav-bar', value: '72px', usage: 'Bottom navigation height.' },
    { name: 'fab', value: '56px', usage: 'The add button.' } ] },
  opacity: { tokens: [
    { name: 'opacity-disabled', value: '0.38', usage: 'Disabled controls, always with a reason line when the user knows the control exists.' },
    { name: 'opacity-pressed', value: '0.12', usage: 'Pressed state layer over a control.' },
    { name: 'opacity-hover', value: '0.08', usage: 'Focus or drag state layer.' } ] },
  duration: { tokens: [
    { name: 'duration-instant', value: '90ms', usage: 'Press feedback.' },
    { name: 'duration-fast', value: '150ms', usage: 'Chips, toggles, badges changing.' },
    { name: 'duration-base', value: '220ms', usage: 'Screen-level fades, snackbar in and out.' },
    { name: 'duration-slow', value: '320ms', usage: 'Bottom sheets and dialogs entering. All motion drops to 0 when the system asks for reduced motion.' } ] },
};
fs.writeFileSync(outFile, JSON.stringify(tokens, null, 2) + '\n');
console.log('colors', color.length, 'styles', tokens.type.groups.reduce((a, g) => a + g.styles.length, 0));
