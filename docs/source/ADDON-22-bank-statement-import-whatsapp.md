# ADDON-22 — Bank statement PDF import, extraction, reconciliation and WhatsApp sharing

Received 2026-10-09 as the file `# FINLY ADD-ON — BANK STATEMENT PDF.txt` (moved here unchanged). Recorded verbatim below the line.

---

# FINLY ADD-ON — BANK STATEMENT PDF IMPORT, AUTOMATIC ENTRY EXTRACTION, RECONCILIATION AND WHATSAPP SHARING

## 1. Objective

Implement an easy bank statement import feature in the existing Finly application.

**The user should be able to upload a bank statement PDF, let Finly read it, view every extracted transaction in a spreadsheet-style grid, correct or categorize entries, import the confirmed entries into the correct account and ledger, reconcile balances, and share the resulting records or reports through WhatsApp.**

Integrate this feature with existing Finly modules, including:

- Personal finance and expenses.
- Business accounting and firm expenses.
- Bank accounts and cash management.
- Customizable Excel/Google Sheets-style ledgers.
- Main Hisab Workspace.
- People, parties and entities.
- Custom categories and formulas.
- Assets, loans, investments and liabilities.
- Pending and outstanding balances.
- Reconciliation, receipts and settlements.
- Reports, PDF exports and controlled sharing.

Do not create a separate, disconnected statement-reader application.

## 2. Upload bank statement PDF

Add an easy-to-find **Import Bank Statement** action wherever appropriate in the bank account, transaction, ledger and reconciliation screens.

The user should be able to:

1. Select the bank account or entity to which the statement belongs, or identify it during review.
2. Upload a PDF from their device.
3. See the selected filename and statement period, where detected.
4. Start extraction.
5. Review all detected transactions before importing them.
6. Correct any inaccurate or incomplete extraction.
7. Map the transactions to the appropriate Finly account, entity, ledger and categories.
8. Confirm the import.
9. Reconcile the imported entries against existing records and statement balances.

Support text-based PDFs and scanned/image-based PDFs where technically feasible. Use reliable PDF text extraction first and OCR when required.

Handle multi-page statements, repeating headers and footers, wrapped descriptions, different date formats, various debit/credit layouts and different banks' statement formats.

Do not assume every bank uses the same statement design.

For password-protected PDFs, provide an appropriate secure password-entry workflow if supported. Do not store the document password or expose it in logs.

## 3. Extract every relevant transaction

For each detected transaction, extract the available fields, including:

- Transaction date.
- Value date, if provided.
- Transaction description or particulars.
- Debit amount.
- Credit amount.
- Transaction amount and direction.
- Running balance, if provided.
- Reference number, cheque number or transaction identifier, if provided.
- Payment method or channel, if identifiable.
- Counterparty or beneficiary, if identifiable.
- Statement page and source location where practical.
- Extraction confidence or review status.

Preserve the bank's original description alongside any cleaned or categorized description. Do not discard reference numbers or rewrite the source record in a way that makes it impossible to audit.

Where the PDF provides opening balance, closing balance, statement period, account-holder name, account identifier or currency, extract those details as well.

Mask sensitive account information in ordinary views and shared documents unless disclosure is authorized and necessary.

**Never invent missing transaction data.** If a date, amount, debit/credit direction or balance cannot be reliably extracted, flag the field for manual correction.

## 4. Show all entries in a spreadsheet-style review window

After reading the PDF, display the extracted transactions in a grid that feels like Excel or Google Sheets.

The user must be able to inspect all detected entries before importing.

Provide columns such as:

| Date | Particulars | Debit | Credit | Balance | Category | Status |
|---|---|---:|---:|---:|---|---|
| Extracted date | Original bank description | Amount | Amount | Statement balance | Select/edit | Review state |

The actual columns should adapt to the statement and the user's chosen ledger template.

Allow the user to:

- Edit extracted dates and descriptions.
- Correct debit and credit values.
- Confirm or correct transaction direction.
- Add or change categories.
- Link transactions to existing parties.
- Identify transfers, expenses, receipts, loan repayments, investments, asset purchases, bank charges and other supported transaction types.
- Add notes.
- Configure additional columns using the existing custom-ledger system.
- Filter and search all extracted entries.
- Select or deselect individual transactions.
- Select all valid entries.
- Exclude statement rows that are not actual transactions.
- Attach the source PDF to the import batch and retain appropriate source references.
- Save the import as a draft and return later.
- Import only selected, reviewed entries.
- Correct mistakes before final posting.

Highlight low-confidence fields, ambiguous transaction directions, missing values, possible duplicates and entries needing categorization.

Make bulk review and correction efficient. Users should not have to open a separate form for each row.

## 5. Identify the correct bank account

Before importing, identify the actual bank, account holder, destination Finly entity and relevant account.

Where information is available, extract the bank name, account-holder name, masked account number, statement period and currency from the PDF.

Let the user confirm the destination account.

Distinguish:

- The bank issuing the statement.
- The actual account represented by the statement.
- The account holder.
- The Finly entity or personal book that records the account.
- The person importing the statement.
- The source statement and import batch.

Do not assume that the logged-in user's personal account owns the statement or that a firm's current context is necessarily the account's correct owner.

If the account cannot be matched confidently, ask the user to select or create the appropriate account record before importing.

Never create a duplicate bank account simply because the same statement was uploaded again.

## 6. Smart category suggestions without unsafe automatic accounting

Finly may suggest a category or transaction type based on the statement description, previous user-confirmed mappings, amount, linked account, counterparty and available transaction history.

For example, it may suggest:

- Bank charges.
- Rent.
- Utility payment.
- Supplier payment.
- Customer receipt.
- Personal expense.
- Business expense.
- Transfer between the user's own accounts.
- Loan repayment.
- Interest received or paid.
- Investment transaction.
- Asset purchase or sale.
- Refund.
- Unclassified transaction.

However, a description alone may not establish the correct accounting treatment.

A bank credit is not always income. A bank debit is not always an expense. A loan received, transfer between owned accounts, investment purchase, asset sale, reimbursement or return of principal must be classified according to its real economic purpose.

Use the existing Finly classification and validation engine. Ambiguous transactions must remain unclassified or awaiting confirmation rather than being silently posted to an unsupported category.

Allow users to save optional transaction-description-to-category rules for future imports. These rules must be scoped appropriately, editable, auditable and subject to validation.

## 7. Detect duplicate imports and match existing transactions

Duplicate prevention is mandatory.

The same statement could be downloaded and uploaded multiple times, or an entry may already exist because the user recorded it manually before importing the statement.

Finly should compare relevant fields, such as:

- Bank account.
- Transaction date or value date.
- Amount and direction.
- Bank reference number.
- Normalized description.
- Existing transaction links.
- Statement/import source identity.

Use the most reliable available identifiers. Similar amounts or descriptions alone are not sufficient proof that two transactions are duplicates.

For every likely match, present a review option such as:

- Match to existing entry.
- Import as a new entry.
- Exclude from import.
- Investigate possible duplicate.

Matching a statement entry to an existing transaction must not create a second financial posting.

Support safe re-imports, interrupted imports and retries without duplicating confirmed entries.

Record the import batch, source statement reference, import status and any relevant audit events.

## 8. Reconcile statement balances automatically

Where the PDF contains opening and closing balances and transaction balances, verify the extracted figures.

For a statement whose debit and credit convention supports the standard calculation:

**Expected closing balance = Opening balance + Total credits − Total debits**

Adapt the calculation if the statement's currency, balance direction or accounting convention requires it.

Compare the calculated result with the statement's actual closing balance.

Report:

- Opening balance.
- Total credits.
- Total debits.
- Net movement.
- Expected closing balance.
- Statement closing balance.
- Difference or reconciliation mismatch.
- Transactions with missing or uncertain values.
- Possible duplicate or excluded rows.

Do not invent adjustments to force the balances to match.

If the running balance is available, validate individual transitions where feasible. Flag discrepancies for review.

Once imported entries have been mapped, compare them with existing Finly records to identify matched, unmatched, missing or potentially duplicated movements.

The statement should become supporting evidence for reconciliation, not an excuse to overwrite correct posted financial history.

## 9. Import without changing accounting incorrectly

The import process must have explicit stages:

1. File selected.
2. Extraction in progress.
3. Extraction complete.
4. Review required.
5. Transactions validated.
6. Existing records matched or duplicates resolved.
7. Ready to import.
8. Imported as unposted/reviewable records where appropriate.
9. Posted or otherwise finalized using the existing financial workflow.
10. Reconciled.

Use the appropriate stages for the existing architecture rather than forcing every bank transaction through unnecessary states.

Support both simple and detailed workflows. A user with a small personal account should not need to complete a complicated manual review for every clean statement, but the system must preserve safeguards for uncertain data and material accounting decisions.

Do not post transactions merely because PDF extraction succeeded.

Where possible, create draft or pending ledger entries first, validate them, and use the existing authorization and posting process. If the architecture supports a controlled bulk-posting operation, it must remain atomic and prevent duplicate effects.

Ensure statement rows can be linked to individual ledger entries and the parent import batch.

## 10. Preserve bank statements as evidence

Store the original uploaded PDF securely when retention is permitted and appropriate.

Each imported entry should retain sufficient provenance to identify its source statement and source transaction.

Maintain relevant details such as:

- Original filename.
- Import date.
- Importing user.
- Linked bank account.
- Statement period.
- Extraction/import status.
- Source-page reference where practical.
- Original description and reference.
- Matching/reconciliation status.
- Corrections and audit history.

Apply entity permissions to the statement file and its extracted contents.

Do not expose entire statements to unauthorized members merely because they have permission to see a limited transaction.

Provide suitable controls for deleting or retaining source files under the application's document-retention policy, while preserving required accounting/audit records.

## 11. Support statement import into custom ledgers

Integrate the extracted entries with the existing Excel/Google Sheets-style ledger builder.

Let the user map extracted bank fields to their own configured columns.

For example:

- Statement date → Date.
- Transaction details → Particulars.
- Debit → Expense/paid/debit field appropriate to the selected template.
- Credit → Received/credit field appropriate to the selected template.
- Bank balance → Statement balance.
- Bank reference → Reference column.
- Suggested category → Configured category dropdown.
- Counterparty → Linked party field.

These are mapping examples, not mandatory meanings for every ledger.

Allow reusable import-mapping templates for frequently used bank formats. Users may customize and save mappings within their authorized scope.

Do not map a bank's debit field directly into a business expense account without checking the transaction type. The correct ledger field and accounting effect must reflect the user's actual template and the real nature of the transaction.

Custom columns and formulas may calculate totals and summaries after import, but they must not bypass accounting validation.

## 12. Support other statement formats where feasible

Design an extensible import framework so that later versions can support compatible formats such as:

- CSV bank statements.
- Excel bank statements.
- Other structured financial exports.

Prioritize PDF bank statements as the required initial feature.

Reuse the same review, account identification, duplicate detection, field mapping, reconciliation, security and import pipeline where technically appropriate.

Do not claim support for every bank or PDF format until tested.

Provide clear errors and recovery options for unsupported, corrupted, incomplete or unreadable documents.

## 13. WhatsApp sharing must be integrated throughout Finly

Make relevant Finly information shareable from the screens where the user works.

Where permitted, support sharing:

- Personal expense summaries.
- Business expense reports.
- Daily hisab summaries.
- Custom ledgers.
- Bank statement import summaries.
- Selected bank transactions.
- Deposit and payment receipts.
- Outstanding and pending reports.
- Loan statements.
- Settlement confirmations.
- Asset transaction summaries.
- Financial reports and account statements.
- Relevant transaction evidence.
- Other authorized documents produced by the application.

The user should not have to export a report manually and then search for the file elsewhere just to share it.

Provide a clear **Share** action in appropriate screens, and integrate with the device's supported sharing workflow so the user can choose WhatsApp when available.

## 14. WhatsApp sharing workflow

For each share operation:

1. Select the record, report or authorized group of entries.
2. Select the applicable date range or filters.
3. Select the recipient or sharing destination when the workflow supports it.
4. Choose which authorized information should be included.
5. Preview the generated document or message.
6. Review any sensitive account information.
7. Confirm sharing.
8. Open the supported WhatsApp/device sharing flow.
9. Preserve a record of the generated document and sharing action where appropriate.

The system must not silently send confidential financial documents or share every transaction simply because the user selected one report.

Use appropriate permission checks for the actual user, entity and document.

Never send passwords, PINs, card security credentials, access tokens or encryption keys.

## 15. WhatsApp message and document options

Where supported by the device and implementation, offer useful formats:

- A concise text summary.
- PDF report.
- CSV export.
- Excel-compatible export where supported.
- Selected receipt or attachment.
- A detailed ledger/history document.
- A filtered transaction summary.

For a bank statement import, a WhatsApp-friendly summary could contain:

- Bank/account nickname with safe masking.
- Statement period.
- Number of extracted transactions.
- Total debits.
- Total credits.
- Opening and closing balance where available.
- Number of imported entries.
- Number of matched entries.
- Number of pending/unmatched entries.
- Reconciliation difference where applicable.

Allow the user to share only selected transactions or a specific report when full detail is unnecessary.

Do not automatically forward the original bank statement PDF to another person. Make the original file an explicit, permission-checked sharing choice.

If the device or integration does not support direct programmatic sending, generate the file and use the supported share sheet or WhatsApp handoff. Never claim that a message was delivered merely because the share window opened.

## 16. Security and privacy of uploaded statements

Bank statements contain highly sensitive financial information.

Implement:

- Authenticated uploads.
- Permission checks against the selected entity and bank account.
- Secure transport.
- Secure document storage.
- Restricted file access.
- Appropriate retention and deletion controls.
- Safe handling of temporary extracted text.
- No sensitive full statement contents in ordinary diagnostic logs.
- Access-controlled previews, downloads and shares.
- Safe handling of password-protected PDFs.
- Protection against malicious or malformed uploaded files.
- Resource limits for large files and expensive OCR processing.
- Validation of file type and processing status.

Do not expose the uploaded statement or extracted data to unrelated entities, users, reports, functions or WhatsApp recipients.

Use the existing Finly authorization model and preserve D-038: platform administration alone must not grant access to a firm's private financial books.

## 17. User experience: make it easy

The primary workflow should be:

**Open Bank Account → Import Statement → Upload PDF → Review All Entries → Correct/Map → Detect Duplicates → Import → Reconcile → View Ledger → Share via WhatsApp.**

Include clear loading, success, warning and error states.

Allow the user to save a review in progress and continue later if the import is interrupted.

Users should be able to understand how many rows were detected, how many were imported, which were skipped or matched, and which still need review.

Do not force users to manually re-enter data that Finly extracted confidently. Do not silently accept uncertain extraction.

Support accessible UI, responsive layouts, efficient bulk review and searchable transaction grids.

## 18. Required tests

Implement and execute tests for:

- Text-based PDF extraction.
- Scanned-PDF OCR where supported.
- Multi-page statements.
- Repeated headers and footers.
- Debit/credit extraction.
- Running-balance validation.
- Opening/closing-balance reconciliation.
- Ambiguous extraction and manual correction.
- Statements from different supported formats.
- Incorrect or incomplete account identification.
- Duplicate statement upload.
- Existing-entry matching.
- Interrupted and repeated imports.
- Custom-column mapping.
- Safe import/posting behaviour.
- Correct classification of transfers, loans, expenses and income.
- Authorization and entity isolation.
- Secure statement and attachment access.
- WhatsApp-sharing permissions and document filtering.
- Sensitive-information masking.
- Handling of malformed and oversized PDFs.
- Idempotency, concurrency and atomic posting where applicable.

Never claim support for an untested bank statement layout or OCR pathway.

## 19. Implementation instructions

Inspect the current Finly repository and identify the appropriate existing account, document, ledger, attachment and sharing modules.

Implement the feature directly in the current application:

1. File selection and secure upload.
2. PDF text extraction and OCR fallback where needed.
3. Structured transaction extraction.
4. Review and correction grid.
5. Bank account identification.
6. Duplicate matching.
7. Custom ledger field mapping.
8. Import and posting safeguards.
9. Reconciliation.
10. WhatsApp/device sharing.
11. Secure document handling.
12. Automated tests, Flutter integration and documentation.

Reuse existing services where possible. Do not create a parallel financial ledger or bypass existing posting rules.

Run available tests, diagnose and fix failures, and rerun the affected tests. Build and verify the Flutter application where the environment allows it.

Update the repository's implementation checklist. Report exactly what is implemented and tested, what remains incomplete, and which statement formats or device-sharing paths have not yet been verified.

**Final objective:** a user uploads a PDF bank statement, Finly reads and displays every reliably extracted entry in an editable grid, the user confirms the correct account and categories, imports and reconciles the entries without duplicates, and shares the authorized resulting ledger or summary through WhatsApp in a few straightforward actions.