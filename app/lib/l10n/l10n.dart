// The app's words in the person's language (English, Hindi, Gujarati — ADDON-23 §9). Screens write `context.l10n.x`;
// every string lives in lib/l10n/app_<locale>.arb, never in code.
import 'package:flutter/widgets.dart';

import 'app_localizations.dart';

export 'app_localizations.dart';

extension L10nContext on BuildContext {
  AppLocalizations get l10n => AppLocalizations.of(this);
}

/// The languages Finly offers, in the order the language picker shows them.
const supportedLanguageCodes = ['en', 'hi', 'gu'];
