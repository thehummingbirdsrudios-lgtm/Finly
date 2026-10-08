# Owner answers to flags F1–F7 and the additional expense rule

> Received from the product owner on 2026-10-08 (session 3) with the three rulebooks (`RULEBOOK-01..03`). Verbatim
> (the GitHub repository URL and the instructions to continue are recorded in `docs/DECISIONS.md`, D-020 onwards).
> How each answer is applied is in `docs/DECISIONS.md`, "Accounting Model Record — revision 3".

---

Answers to F1–F7
1. Angadiya-Type Expenses
The system should not force everything into one common expense account.
Personal Expense
If the expense is personal, it is recorded as a personal expense.
Example:
Personal Expense = ₹2,000
It does not reduce any firm's amount.
Firm Expense
If the expense belongs to one firm, select that firm.
Example:
Expense = ₹10,000
Type = Firm Expense
Firm = ABC Jewellers
So ₹10,000 is deducted from ABC Jewellers' share/fund.
Common Expense
If one expense is related to multiple firms/entities, select Common Expense.
The user manually decides how much should be deducted from each firm/entity.
Example:
Total Expense: ₹10,000

* Firm A → ₹5,500 deducted
* Firm B → ₹2,000 deducted
* Firm C → ₹2,500 deducted

There is no automatic equal split or automatic calculation of each firm's share.
The expense can be divided in any proportion the user wants.
Simple Rule

* Personal Expense → No firm deduction
* Firm Expense → Select one firm and enter the deduction amount
* Common Expense → Select multiple firms/entities and manually enter the exact deduction amount for each

2. Handovers
For handovers, confirmation will not be required by default.
Simply record the handover/transfer:
Person A → transfers ₹50,000 → Person B
No confirmation from Person B is required.
However, keep receiver confirmation as an optional feature so it can be enabled later if required.
For the main workflow:
Confirmation = OFF
3. Personal Expense Paid From Firm Money
We will ask the owner every time.
Do not set a default per owner.
This question applies only when money/expense is being given to a non-owner.
The owner will choose:
1. How is the money given?

* Directly from Firm
* Through Owner

2. What is it treated as?

* Own / Personal
* Expense

Based on the selection, the ledger will record the transaction accordingly.
For example, if it is Through Owner, there will be two ledger entries:
Firm → Owner
Owner → Non-owner
If it is Directly from Firm, there is no owner entry.
Also, Own / Personal is still deducted immediately as an entry, but it can be settled back later.
Expense is a final expense entry and does not create a settlement.
4. Three Default Accounting Rules
Yes, apply all three by default:

1. Bills are recorded when they arrive, even if they have not been paid yet.
2. Every entry should balance within its fund, so every money movement has a clear source and destination.
3. Each month should close separately with closing entries, and the closing balance should carry forward as the next month's opening balance.

No changes needed to these three rules.
5. Control of Locations
This should be flexible and configurable for every cash/storage location, such as:
Tijori, Wardrobe, Office Drawer, Locker, etc.
For each location, we should be able to assign one or multiple separate individuals who have access/control.
Example:
Wardrobe
Type: Personal
Access: Krish only
Personal Locker
Type: Personal
Access: Krish only
Tijori
Type: Private / Shared
Access: Krish
Access: Father
Krish and Father are two separate individual entities, both having their own access to the same Tijori.
The system should also separately track who currently holds the actual key/control.
Example:
Owner A gives the Tijori key/control to Owner B
Then:
Tijori
Current Holder: Owner B
The people who have access and the person currently holding the key/control are separate.
Example:
Authorized Access: Krish + Father
Current Holder: Father
Later, Father gives the key/control to Krish:
Authorized Access: Krish + Father
Current Holder: Krish
Changing Access
There are two situations:
1. Add a new person
Current:
Tijori Access: Krish + Father
Add Person C:
Tijori Access: Krish + Father + Person C
Krish and Father keep their access.
2. Replace existing access
Current:
Tijori Access: Krish + Father
Krish gives his access to Person C and no longer has access:
Tijori Access: Father + Person C
So the system must distinguish between:
Add Access → Existing access remains
Replace Access → Existing person's access is removed and new person's access is added
A location can also have no specific person assigned, such as Cash-in-Hand / Unassigned.
The system should therefore separately track:
Who owns it
Who has access
Who currently holds the key/control
Additional Expense Rule
Yes. The system should use common-sense accounting for every individual expense.
For every expense, the user must first select:
1. Who does this expense belong to?
It can belong to:

* Personal
* A Firm
* Any other Entity registered in the system

For example, an entity could be an owner, worker, partner, another business, or any other account/entity created in the system.
2. If it belongs to a Firm, which Firm?
Firm A
Firm B
Firm C
etc.
The same logic applies to any other entity: the user selects the exact entity the expense belongs to.
The expense owner and the source of the money can be different.
Examples
1. Firm A money → Firm A expense
Money Source: Firm A
Expense Belongs To: Firm A
Expense: ₹10,000
Normal Firm A expense.
2. Firm B money → Firm A expense
Money Source: Firm B
Expense Belongs To: Firm A
Expense: ₹10,000
Firm B paid for an expense belonging to Firm A.
The system records the expense under Firm A and tracks the amount between Firm A and Firm B for settlement.
3. Firm A money → Firm B expense
Money Source: Firm A
Expense Belongs To: Firm B
Expense: ₹10,000
The expense belongs to Firm B, even though Firm A's money was used.
The amount can therefore be settled between Firm A and Firm B.
4. Firm money → Personal expense
Money Source: Firm A
Expense Belongs To: Personal
Expense: ₹5,000
The firm's money was used for a personal expense, so the system handles the required withdrawal/settlement logic.
5. One expense → Multiple Entities
If one expense belongs to multiple firms/entities, the user manually decides the exact amount for each.
Example:
Total Expense = ₹45,000
Firm A → ₹30,000
Firm B → ₹5,000
Personal → ₹10,000
The amounts are custom, not automatically divided.
Main Rule
For every expense, the system should record two separate things:
Who actually paid / whose money was used?
Who does the expense belong to?
The expense can belong to Personal, any Firm, or any other Entity registered in the system.
The system should never assume that the money source = expense owner.
If they are different, the system should record the expense under the correct owner and create the appropriate owed/settlement relationship between the entities.
Continue Building Finly
I have attached the Edge Case Scenarios and the Finance/Accounting MD rules for you. Read and understand them carefully before implementation and use them as the basis for the financial/accounting system.
Also use the private GitHub repository:
https://github.com/thehummingbirdsrudios-lgtm/Finly
Now continue building the mobile app.
I am going to sleep. The phone may be disconnected. If it is disconnected, continue working on everything that does not require the physical phone.
I will connect the phone later for device testing.
Continue with:
Flutter app + backend + database + finance/accounting logic + UI/UX + edge cases + security + documentation + Git + testing + deployment preparation
Do not stop unnecessarily because the phone is disconnected.
Use the connected phone later for:
Build → Install → Test → Debug → Profile → Fix → Retest
Continue working toward the fully complete, working, production-grade Finly mobile app.
Maintain the Git tree and documentation throughout development, and keep every change properly recorded and committed after successful testing.
Start building now and continue progressing while I am away.
