#!/bin/sh
set -euo pipefail

HTPASSWD_PATH="/etc/nginx/.htpasswd"

if [ -z "${BASIC_AUTH_USERNAME:-}" ] || [ -z "${BASIC_AUTH_PASSWORD:-}" ]; then
  echo "[entrypoint] BASIC_AUTH_USERNAME または BASIC_AUTH_PASSWORD が設定されていません" >&2
  exit 1
fi

echo "[entrypoint] Generating htpasswd entry for user '$BASIC_AUTH_USERNAME'"
ENCRYPTED_PASSWORD=$(printf "%s" "$BASIC_AUTH_PASSWORD" | openssl passwd -apr1 -stdin)
printf '%s:%s\n' "$BASIC_AUTH_USERNAME" "$ENCRYPTED_PASSWORD" > "$HTPASSWD_PATH"
chown root:nginx "$HTPASSWD_PATH"
chmod 640 "$HTPASSWD_PATH"

exec "$@"
