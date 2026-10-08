# Owner response to Gates 1 and 2

> Received from the product owner on 2026-10-08 (session 2), in reply to the Stack Decision Record and the Accounting
> Model Record in `docs/DECISIONS.md`. Verbatim. How each point is applied is recorded in `docs/DECISIONS.md`
> (D-013 onwards and "Accounting Model Record — revision 2").

---

Gate 1:

1. Supabase: Approved as the first choice. Use the free plan for now. Design Finly so we are not unnecessarily locked into Supabase and can migrate later if required.
2. Android: Target Android 7.0+ for now and maintain compatibility with older/lower-end supported devices wherever practical. I do not currently have the exact oldest device details.
3. Backups: Cloudflare account is already created, R2 is already created, and Cloudflare is already connected to Claude through MCP/tools. Use this existing Cloudflare R2 setup for Finly's encrypted backup system. Do not ask me to create or connect Cloudflare again. Configure and use it securely through the available MCP connection.
4. Error reporting: Use our own secure error/diagnostic system initially if appropriate. Never store passwords, keys, sensitive financial information, or decrypted private data in error logs. If Sentry provides a significant advantage, explain it before adding it.
5. Installation: Approved — use a signed APK installed directly on the phones for now.

Gate 2:
Do not treat all A1–A9 as automatically approved yet.
The accounting model must follow the complete Finly requirements and proper accounting principles.
Important correction: custody/holder must NOT be only a simple tag. Finly needs proper historical tracking of who physically holds/controls money, handovers, locations and changes over time. Example:
Mint owns money → Krish holds it → Krish hands it to Sujal → Sujal puts it in Tijori.
Ownership, fund, account/location, holder/custodian and handler are separate concepts.
For the ₹45,000 Angadiya example, do not change or invent a rule yet. The intended allocation is:
Total expense ₹45,000 = Mint ₹30,000 + JSK ₹5,000 + Personal ₹10,000.
If you believe there is an accounting inconsistency, explain the exact issue and your proposed model with concrete ledger entries before implementing it.
For the remaining accounting decisions, use professional double-entry/accounting principles while preserving Finly's required ownership, fund, custody, outstanding, reimbursement, inter-company and money-flow model.
Before implementing any accounting assumption that could materially change financial behaviour, flag it clearly rather than silently deciding it.
You may continue with everything that does not require my external action.
When you actually reach the stage requiring:

* Android SDK licence acceptance
* USB debugging/device connection
* Docker installation
* Supabase project/account creation
* Any additional external service/account
* GitHub repository creation/push

stop at that specific requirement and give me the exact step-by-step action I need to take.
Cloudflare/R2 setup and MCP connection are already completed — do not ask me to repeat those steps.
Continue development until you genuinely reach one of those blockers.
