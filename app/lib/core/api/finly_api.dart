// Typed calls for every screen. Each method is one API request; nothing is cached on the phone beyond the life of a
// screen's state, so what a person sees is always what the server says now.
import 'api_client.dart';
import 'models.dart';

class FinlyApi {
  FinlyApi(this.client);

  final ApiClient client;

  Future<Me> me() async => Me.fromJson(await client.get('/v1/me'));

  Future<Lookups> lookups() async =>
      Lookups.fromJson(await client.get('/v1/lookups'));

  Future<List<Book>> books() async {
    final j = await client.get('/v1/books');
    return (j['items'] as List)
        .map((e) => Book.fromJson((e as Map).cast<String, dynamic>()))
        .toList();
  }

  Future<String> createBook({
    required String name,
    required String typeKey,
    required String openingDate,
    required bool creatorIsOwner,
    double? sharePercent,
  }) async {
    final j = await client.post('/v1/books', {
      'name': name,
      'typeKey': typeKey,
      'openingDate': openingDate,
      'creatorIsOwner': creatorIsOwner,
      'sharePercent': ?sharePercent,
    });
    return j['id'] as String;
  }

  Future<BookSummary> summary(String bookId) async =>
      BookSummary.fromJson(await client.get('/v1/books/$bookId/summary'));

  Future<List<Place>> places(String bookId) async {
    final j = await client.get('/v1/books/$bookId/places');
    return (j['items'] as List)
        .map((e) => Place.fromJson((e as Map).cast<String, dynamic>()))
        .toList();
  }

  Future<String> addPlace(String bookId, Map<String, Object?> body) async {
    final j = await client.post('/v1/books/$bookId/places', body);
    return j['id'] as String;
  }

  Future<List<Party>> parties(String bookId) async {
    final j = await client.get('/v1/books/$bookId/parties');
    return (j['items'] as List)
        .map((e) => Party.fromJson((e as Map).cast<String, dynamic>()))
        .toList();
  }

  Future<String> addParty(
    String bookId, {
    required String name,
    required String typeKey,
  }) async {
    final j = await client.post('/v1/books/$bookId/parties', {
      'name': name,
      'typeKey': typeKey,
    });
    return j['id'] as String;
  }

  Future<List<OpenItem>> openItems(String bookId, {bool all = false}) async {
    final j = await client.get(
      '/v1/books/$bookId/open-items',
      query: all ? {'all': '1'} : null,
    );
    return (j['items'] as List)
        .map((e) => OpenItem.fromJson((e as Map).cast<String, dynamic>()))
        .toList();
  }

  Future<EntryPage> entries(
    String bookId, {
    String? cursor,
    int limit = 30,
  }) async => EntryPage.fromJson(
    await client.get(
      '/v1/books/$bookId/entries',
      query: {'limit': '$limit', 'cursor': ?cursor},
    ),
  );

  Future<EntryDetail> entry(String txnId) async =>
      EntryDetail.fromJson(await client.get('/v1/entries/$txnId'));

  /// Records an entry. `key` is created once per form and reused on every retry, so a double tap or a lost answer
  /// never posts twice.
  Future<PostingResult> submit({
    required String key,
    required String typeKey,
    required String bookId,
    required String valueDate,
    required Map<String, Object?> intent,
    String? reason,
  }) async => PostingResult.fromJson(
    await client.post('/v1/entries', {
      'typeKey': typeKey,
      'bookId': bookId,
      'valueDate': valueDate,
      'reason': ?reason,
      'intent': intent,
    }, idempotencyKey: key),
  );

  Future<PostingResult> acknowledge(String txnId, {String? note}) async =>
      PostingResult.fromJson(
        await client.post('/v1/entries/$txnId/acknowledge', {'note': ?note}),
      );

  Future<PostingResult> reject(String txnId, {String? note}) async =>
      PostingResult.fromJson(
        await client.post('/v1/entries/$txnId/reject', {'note': ?note}),
      );

  Future<List<WaitingAnswer>> waiting() async {
    final j = await client.get('/v1/acknowledgements');
    return (j['items'] as List)
        .map((e) => WaitingAnswer.fromJson((e as Map).cast<String, dynamic>()))
        .toList();
  }

  Future<List<SessionInfo>> sessions() async {
    final j = await client.get('/v1/auth/sessions');
    return (j['items'] as List)
        .map((e) => SessionInfo.fromJson((e as Map).cast<String, dynamic>()))
        .toList();
  }

  Future<void> revokeSession(String id) async =>
      client.delete('/v1/auth/sessions/$id');
}
