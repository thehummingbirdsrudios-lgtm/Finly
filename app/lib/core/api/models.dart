// The API's answers as typed Dart values. Amounts arrive as strings of whole rupees and become BigInt; nothing is
// computed here that the server did not send.
import '../money.dart';

typedef Json = Map<String, dynamic>;

List<T> _list<T>(Object? raw, T Function(Json) f) => (raw as List? ?? const [])
    .map((e) => f((e as Map).cast<String, dynamic>()))
    .toList();

class Me {
  const Me({
    required this.userId,
    required this.personEntityId,
    required this.displayName,
    required this.mustChangePassword,
  });
  factory Me.fromJson(Json j) => Me(
    userId: j['userId'] as String,
    personEntityId: j['personEntityId'] as String,
    displayName: j['displayName'] as String,
    mustChangePassword: j['mustChangePassword'] as bool,
  );
  final String userId;
  final String personEntityId;
  final String displayName;
  final bool mustChangePassword;
}

class Book {
  const Book({
    required this.id,
    required this.kind,
    required this.name,
    required this.typeLabel,
    required this.personal,
    required this.access,
    required this.canPost,
    required this.canManage,
  });
  factory Book.fromJson(Json j) => Book(
    id: j['id'] as String,
    kind: j['kind'] as String,
    name: j['name'] as String,
    typeLabel: j['typeLabel'] as String,
    personal: j['personal'] as bool,
    access: j['access'] as String,
    canPost: j['canPost'] as bool,
    canManage: j['canManage'] as bool,
  );
  final String id;
  final String kind;
  final String name;
  final String typeLabel;
  final bool personal;
  final String access;
  final bool canPost;
  final bool canManage;
}

class BankInfo {
  const BankInfo({
    this.bankName,
    this.accountHolder,
    this.last4,
    this.accountType,
  });
  factory BankInfo.fromJson(Json j) => BankInfo(
    bankName: j['bankName'] as String?,
    accountHolder: j['accountHolder'] as String?,
    last4: j['last4'] as String?,
    accountType: j['accountType'] as String?,
  );
  final String? bankName;
  final String? accountHolder;
  final String? last4;
  final String? accountType;
}

class Place {
  const Place({
    required this.id,
    required this.name,
    required this.kind,
    required this.typeKey,
    required this.typeLabel,
    required this.balance,
    required this.active,
    this.custodian,
    this.bank,
  });
  factory Place.fromJson(Json j) => Place(
    id: j['id'] as String,
    name: j['name'] as String,
    kind: j['kind'] as String,
    typeKey: j['typeKey'] as String,
    typeLabel: j['typeLabel'] as String,
    custodian: j['custodian'] as String?,
    bank: j['bank'] == null
        ? null
        : BankInfo.fromJson((j['bank'] as Map).cast<String, dynamic>()),
    balance: parseServerAmount(j['balance']),
    active: j['active'] as bool,
  );
  final String id;
  final String name;
  final String kind;
  final String typeKey;
  final String typeLabel;
  final String? custodian;
  final BankInfo? bank;
  final BigInt balance;
  final bool active;
}

class BookSummary {
  const BookSummary({
    required this.money,
    required this.inTransit,
    required this.receivables,
    required this.investments,
    required this.payables,
    required this.unidentified,
    required this.totalAssets,
    required this.totalLiabilities,
    required this.netPosition,
    required this.monthIncome,
    required this.monthExpense,
    this.periodStart,
  });
  factory BookSummary.fromJson(Json j) => BookSummary(
    money: parseServerAmount(j['money']),
    inTransit: parseServerAmount(j['inTransit']),
    receivables: parseServerAmount(j['receivables']),
    investments: parseServerAmount(j['investments']),
    payables: parseServerAmount(j['payables']),
    unidentified: parseServerAmount(j['unidentified']),
    totalAssets: parseServerAmount(j['totalAssets']),
    totalLiabilities: parseServerAmount(j['totalLiabilities']),
    netPosition: parseServerAmount(j['netPosition']),
    monthIncome: parseServerAmount(j['monthIncome']),
    monthExpense: parseServerAmount(j['monthExpense']),
    periodStart: j['periodStart'] as String?,
  );
  final BigInt money;
  final BigInt inTransit;
  final BigInt receivables;
  final BigInt investments;
  final BigInt payables;
  final BigInt unidentified;
  final BigInt totalAssets;
  final BigInt totalLiabilities;
  final BigInt netPosition;
  final BigInt monthIncome;
  final BigInt monthExpense;
  final String? periodStart;
}

class OpenItem {
  const OpenItem({
    required this.id,
    required this.reference,
    required this.kind,
    required this.direction,
    required this.counterpartyId,
    required this.counterparty,
    required this.original,
    required this.remaining,
    required this.status,
    required this.reason,
    required this.originReference,
    required this.originTxnId,
    this.dueDate,
  });
  factory OpenItem.fromJson(Json j) => OpenItem(
    id: j['id'] as String,
    reference: j['reference'] as String,
    kind: j['kind'] as String,
    direction: j['direction'] as String,
    counterpartyId: j['counterpartyId'] as String,
    counterparty: j['counterparty'] as String,
    original: parseServerAmount(j['original']),
    remaining: parseServerAmount(j['remaining']),
    status: j['status'] as String,
    dueDate: j['dueDate'] as String?,
    reason: j['reason'] as String,
    originReference: j['originReference'] as String,
    originTxnId: j['originTxnId'] as String,
  );
  final String id;
  final String reference;
  final String kind;

  /// receivable: someone owes this book; payable: this book owes.
  final String direction;
  final String counterpartyId;
  final String counterparty;
  final BigInt original;
  final BigInt remaining;
  final String status;
  final String? dueDate;
  final String reason;
  final String originReference;
  final String originTxnId;
}

class Party {
  const Party({
    required this.id,
    required this.kind,
    required this.name,
    required this.typeLabel,
    required this.keepsBooks,
    required this.recordedHere,
  });
  factory Party.fromJson(Json j) => Party(
    id: j['id'] as String,
    kind: j['kind'] as String,
    name: j['name'] as String,
    typeLabel: j['typeLabel'] as String,
    keepsBooks: j['keepsBooks'] as bool,
    recordedHere: j['recordedHere'] as bool,
  );
  final String id;
  final String kind;
  final String name;
  final String typeLabel;
  final bool keepsBooks;
  final bool recordedHere;
}

class Category {
  const Category({
    required this.id,
    required this.key,
    required this.name,
    required this.kind,
  });
  factory Category.fromJson(Json j) => Category(
    id: j['id'] as String,
    key: j['key'] as String,
    name: j['name'] as String,
    kind: j['kind'] as String,
  );
  final String id;
  final String key;
  final String name;

  /// expense or income.
  final String kind;
}

class KeyLabel {
  const KeyLabel(this.key, this.label, [this.extra]);
  factory KeyLabel.fromJson(Json j) => KeyLabel(
    j['key'] as String,
    j['label'] as String,
    (j['intentType'] ?? j['kind']) as String?,
  );
  final String key;
  final String label;

  /// intentType for entry types; kind (firm or pool) for business types.
  final String? extra;
}

class Lookups {
  const Lookups({
    required this.categories,
    required this.entryTypes,
    required this.placeTypes,
    required this.partyTypes,
    required this.firmTypes,
  });
  factory Lookups.fromJson(Json j) => Lookups(
    categories: _list(j['categories'], Category.fromJson),
    entryTypes: _list(j['entryTypes'], KeyLabel.fromJson),
    placeTypes: _list(j['placeTypes'], KeyLabel.fromJson),
    partyTypes: _list(j['partyTypes'], KeyLabel.fromJson),
    firmTypes: _list(j['firmTypes'], KeyLabel.fromJson),
  );
  final List<Category> categories;
  final List<KeyLabel> entryTypes;
  final List<KeyLabel> placeTypes;
  final List<KeyLabel> partyTypes;
  final List<KeyLabel> firmTypes;

  List<Category> categoriesOf(String kind) =>
      categories.where((c) => c.kind == kind).toList();
}

class EntryRow {
  const EntryRow({
    required this.id,
    required this.reference,
    required this.typeKey,
    required this.typeLabel,
    required this.status,
    required this.valueDate,
    required this.moneyIn,
    required this.moneyOut,
    required this.total,
    required this.pending,
    this.reason,
    this.createdBy,
  });
  factory EntryRow.fromJson(Json j) => EntryRow(
    id: j['id'] as String,
    reference: j['reference'] as String,
    typeKey: j['typeKey'] as String,
    typeLabel: j['typeLabel'] as String,
    status: j['status'] as String,
    valueDate: j['valueDate'] as String,
    reason: j['reason'] as String?,
    createdBy: j['createdBy'] as String?,
    moneyIn: parseServerAmount(j['moneyIn']),
    moneyOut: parseServerAmount(j['moneyOut']),
    total: parseServerAmount(j['total']),
    pending: j['pending'] as bool,
  );
  final String id;
  final String reference;
  final String typeKey;
  final String typeLabel;
  final String status;
  final String valueDate;
  final String? reason;
  final String? createdBy;
  final BigInt moneyIn;
  final BigInt moneyOut;
  final BigInt total;
  final bool pending;
}

class EntryPage {
  const EntryPage(this.items, this.nextCursor);
  factory EntryPage.fromJson(Json j) => EntryPage(
    _list(j['items'], EntryRow.fromJson),
    j['nextCursor'] as String?,
  );
  final List<EntryRow> items;
  final String? nextCursor;
}

class EntryLine {
  const EntryLine({
    required this.side,
    required this.amount,
    required this.accountCode,
    required this.accountName,
    this.place,
    this.counterparty,
    this.category,
  });
  factory EntryLine.fromJson(Json j) => EntryLine(
    side: j['side'] as String,
    amount: parseServerAmount(j['amount']),
    accountCode: j['accountCode'] as String,
    accountName: j['accountName'] as String,
    place: j['place'] as String?,
    counterparty: j['counterparty'] as String?,
    category: j['category'] as String?,
  );
  final String side;
  final BigInt amount;
  final String accountCode;
  final String accountName;
  final String? place;
  final String? counterparty;
  final String? category;
}

class EntryBook {
  const EntryBook(this.bookId, this.bookName, this.lines, this.legs);
  factory EntryBook.fromJson(Json j) => EntryBook(
    j['bookId'] as String,
    j['bookName'] as String,
    _list(j['lines'], EntryLine.fromJson),
    _list(
      j['legs'],
      (l) => (
        kind: l['kind'] as String,
        amount: parseServerAmount(l['amount']),
        place: l['place'] as String?,
      ),
    ),
  );
  final String bookId;
  final String bookName;
  final List<EntryLine> lines;
  final List<({String kind, BigInt amount, String? place})> legs;
}

class EntryDetail {
  const EntryDetail({
    required this.id,
    required this.reference,
    required this.typeLabel,
    required this.status,
    required this.valueDate,
    required this.pending,
    required this.books,
    required this.acknowledgements,
    required this.links,
    required this.openItems,
    this.reason,
    this.createdBy,
  });
  factory EntryDetail.fromJson(Json j) => EntryDetail(
    id: j['id'] as String,
    reference: j['reference'] as String,
    typeLabel: j['typeLabel'] as String,
    status: j['status'] as String,
    valueDate: j['valueDate'] as String,
    reason: j['reason'] as String?,
    createdBy: j['createdBy'] as String?,
    pending: j['pending'] as bool,
    books: _list(j['books'], EntryBook.fromJson),
    acknowledgements: _list(
      j['acknowledgements'],
      (a) => (
        name: a['name'] as String,
        status: a['status'] as String,
        note: a['note'] as String?,
      ),
    ),
    links: _list(
      j['links'],
      (l) => (
        kind: l['kind'] as String,
        direction: l['direction'] as String,
        txnId: l['txnId'] as String,
        reference: l['reference'] as String?,
      ),
    ),
    openItems: _list(
      j['openItems'],
      (o) => (
        reference: o['reference'] as String,
        remaining: parseServerAmount(o['remaining']),
        status: o['status'] as String,
      ),
    ),
  );
  final String id;
  final String reference;
  final String typeLabel;
  final String status;
  final String valueDate;
  final String? reason;
  final String? createdBy;
  final bool pending;
  final List<EntryBook> books;
  final List<({String name, String status, String? note})> acknowledgements;
  final List<({String kind, String direction, String txnId, String? reference})>
  links;
  final List<({String reference, BigInt remaining, String status})> openItems;
}

class WaitingAnswer {
  const WaitingAnswer({
    required this.txnId,
    required this.reference,
    required this.typeLabel,
    required this.valueDate,
    required this.requestedAt,
    required this.moneyIn,
    required this.moneyOut,
    this.reason,
    this.from,
  });
  factory WaitingAnswer.fromJson(Json j) => WaitingAnswer(
    txnId: j['txnId'] as String,
    reference: j['reference'] as String,
    typeLabel: j['typeLabel'] as String,
    valueDate: j['valueDate'] as String,
    reason: j['reason'] as String?,
    from: j['from'] as String?,
    requestedAt: j['requestedAt'] as String,
    moneyIn: parseServerAmount(j['moneyIn']),
    moneyOut: parseServerAmount(j['moneyOut']),
  );
  final String txnId;
  final String reference;
  final String typeLabel;
  final String valueDate;
  final String? reason;
  final String? from;
  final String requestedAt;
  final BigInt moneyIn;
  final BigInt moneyOut;
}

class SessionInfo {
  const SessionInfo({
    required this.id,
    required this.platform,
    required this.createdAt,
    required this.lastUsedAt,
    required this.current,
    this.model,
    this.deviceLabel,
  });
  factory SessionInfo.fromJson(Json j) => SessionInfo(
    id: j['id'] as String,
    platform: j['platform'] as String,
    model: j['model'] as String?,
    deviceLabel: j['deviceLabel'] as String?,
    createdAt: j['createdAt'] as String,
    lastUsedAt: j['lastUsedAt'] as String,
    current: j['current'] as bool,
  );
  final String id;
  final String platform;
  final String? model;
  final String? deviceLabel;
  final String createdAt;
  final String lastUsedAt;
  final bool current;
}

class PostingResult {
  const PostingResult({
    required this.txnId,
    required this.reference,
    required this.status,
    required this.replayed,
  });
  factory PostingResult.fromJson(Json j) => PostingResult(
    txnId: j['txnId'] as String,
    reference: j['reference'] as String,
    status: j['status'] as String,
    replayed: j['replayed'] as bool,
  );
  final String txnId;
  final String reference;

  /// posted, pending_acknowledgement or rejected.
  final String status;
  final bool replayed;
}
