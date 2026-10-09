"""Creates Finly's Android release signing key once, without the password ever being shown.

- keystore: %USERPROFILE%/.finly/finly-release.jks (outside the repository)
- android/key.properties (git-ignored) points Gradle at it, with a random 32-character password
- passwords reach keytool through environment variables, never on a command line or in output

Run from app/:  python tool/new_release_key.py
Refuses to overwrite an existing keystore: losing or replacing it means installed apps can no longer be updated.
Back up the keystore and key.properties together (docs/operations/release-signing.md).
"""
import os
import secrets
import string
import subprocess
import sys

home = os.path.expanduser('~')
store = os.path.join(home, '.finly', 'finly-release.jks')
props = os.path.join('android', 'key.properties')

if os.path.exists(store) or os.path.exists(props):
    sys.exit(f'A release key already exists ({store} or {props}); refusing to replace it.')

os.makedirs(os.path.dirname(store), exist_ok=True)
alphabet = string.ascii_letters + string.digits
password = ''.join(secrets.choice(alphabet) for _ in range(32))
keytool = os.path.join(os.environ.get('JAVA_HOME', r'C:\Program Files\Java\jdk-21'), 'bin', 'keytool')
env = dict(os.environ, FINLY_STORE_PASS=password)
subprocess.run(
    [keytool, '-genkeypair', '-keystore', store, '-storetype', 'PKCS12', '-alias', 'finly', '-keyalg', 'RSA',
     '-keysize', '4096', '-validity', '10000', '-dname', 'CN=Finly, O=Finly, C=IN',
     '-storepass:env', 'FINLY_STORE_PASS', '-keypass:env', 'FINLY_STORE_PASS'],
    env=env, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE,
)
with open(props, 'w', encoding='utf-8', newline='\n') as f:
    f.write('# Finly release signing (git-ignored). Back up together with the keystore; never commit.\n')
    f.write(f'storeFile={store.replace(os.sep, "/")}\n')
    f.write('keyAlias=finly\n')
    f.write(f'storePassword={password}\n')
    f.write(f'keyPassword={password}\n')
print(f'created {store} and {props} (git-ignored); back up both')
