# Runbook — Android release signing

Finly is installed directly from a signed APK (D-017). Every update must be signed with the **same key**; a phone will
refuse an update signed with any other key, and the only way out is uninstalling (which on an online-only app loses
nothing financial, but signs everyone out and resets their unlock settings).

## The key

- Keystore: `%USERPROFILE%\.finly\finly-release.jks` (PKCS12, RSA 4096, alias `finly`, valid 10,000 days), outside the
  repository.
- `app/android/key.properties` (git-ignored) holds its path and a random 32-character password. It was created by
  `python tool/new_release_key.py`, which never shows the password and refuses to replace an existing key.
- Certificate: `CN=Finly, O=Finly, C=IN`, SHA-256 `9ec05297f0a80e003f9dabc303ba10be3ce72ce437eb9cd97616554f9783e994`.
  Use this to check that an APK is genuinely Finly's: `apksigner verify --print-certs app-release.apk`.

## Back it up (owner)

Copy **both** `finly-release.jks` and `key.properties` to two offline places, kept apart from each other (for example
the password manager's file attachment and an encrypted USB drive). Anyone with both files can sign an app that phones
accept as a Finly update, so keep them as carefully as the encryption key.

## Build

```bash
cd app && flutter build apk --release --dart-define=FINLY_API_URL=https://joidjmwfajbeivyffymb.supabase.co/functions/v1/api
```

- Output: `app/build/app/outputs/flutter-apk/app-release.apk` (all CPU types in one file).
- `--split-per-abi` makes smaller per-phone files; most current phones use `app-arm64-v8a-release.apk`.
- R8 shrinking is on. Without `key.properties` the release build stops instead of signing with the debug key.
- The app refuses to run a release build whose API address is not `https://`.

## Install

Copy the APK to the phone and open it (allow "install unknown apps" for the file manager once), or with USB debugging:
`adb install -r app-release.apk`.
