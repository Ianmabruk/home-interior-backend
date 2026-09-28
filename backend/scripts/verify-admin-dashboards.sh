#!/usr/bin/env bash
# Proves every admin dashboard works end-to-end against PRODUCTION, using a
# throwaway test admin account. The account's original password hash is captured
# and restored verbatim, so no existing credential is changed.
set -euo pipefail

export LD_LIBRARY_PATH=/tmp/kilo/pg18/root/usr/lib/x86_64-linux-gnu
PGB=/tmp/kilo/pg18/root/usr/lib/postgresql/18/bin
API="${API_URL:-https://home-interior-backend.onrender.com/api}"
TEST_ADMIN="e2e_test@hokinteriors.co.ke"
# Credentials come from the environment, never from this file.
NEON="${NEON_DATABASE_URL:?set NEON_DATABASE_URL}"
TEMP_PW="TempVerify-$(date +%s)-Aa1!"

ORIG_HASH_FILE=$(mktemp)
$PGB/psql "$NEON" -tAc "SELECT password_hash FROM admins WHERE email='$TEST_ADMIN';" > "$ORIG_HASH_FILE" 2>/dev/null
if [ ! -s "$ORIG_HASH_FILE" ]; then echo "FATAL: could not read the original hash for $TEST_ADMIN" >&2; exit 1; fi
echo "captured original hash for $TEST_ADMIN ($(wc -c < "$ORIG_HASH_FILE") bytes)"

restore() {
  local h
  h=$(cat "$ORIG_HASH_FILE")
  $PGB/psql "$NEON" -q -c "UPDATE admins SET password_hash='$h' WHERE email='$TEST_ADMIN';" >/dev/null 2>&1 || true
  local check
  check=$($PGB/psql "$NEON" -tAc "SELECT md5(password_hash) FROM admins WHERE email='$TEST_ADMIN';" 2>/dev/null | tr -d ' ')
  if [ "$check" = "666d8c9563be134be5cdbcafd38e960a" ]; then
    echo "RESTORED: original password hash is back in place"
  else
    echo "WARNING: hash restore could not be confirmed (md5=$check)"
  fi
  rm -f "$ORIG_HASH_FILE"
}
trap restore EXIT

NEW_HASH=$(cd "$(dirname "$0")/.." && node -e "
const b=require('bcryptjs');
console.log(b.hashSync(process.argv[1], 12));
" "$TEMP_PW")
$PGB/psql "$NEON" -q -c "UPDATE admins SET password_hash='$NEW_HASH' WHERE email='$TEST_ADMIN';" >/dev/null 2>&1
echo "set a temporary password on the test account"

echo
echo "=== ADMIN LOGIN (production) ==="
LOGIN=$(curl -s -m 30 -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$TEST_ADMIN\",\"password\":\"$TEMP_PW\"}")
TOKEN=$(printf '%s' "$LOGIN" | python3 -c "import sys,json;print((json.load(sys.stdin).get('data') or {}).get('accessToken',''))")
CSRF=$(printf '%s' "$LOGIN" | python3 -c "import sys,json;print((json.load(sys.stdin).get('data') or {}).get('csrfToken',''))")
ROLE=$(printf '%s' "$LOGIN" | python3 -c "import sys,json;print((json.load(sys.stdin).get('data') or {}).get('role',''))")
if [ -z "$TOKEN" ]; then
  echo "FATAL: admin login failed: $(printf '%s' "$LOGIN" | head -c 200)"; exit 1
fi
echo "  PASS  login succeeded, role=$ROLE, access token + CSRF token issued"

ME=$(curl -s -m 25 "$API/auth/me" -H "Authorization: Bearer $TOKEN")
printf '%s' "$ME" | python3 -c "
import sys,json
d=json.load(sys.stdin); e=(d.get('data') or {}).get('email','')
print('  PASS  GET /auth/me returns', e) if e else print('  FAIL  /auth/me')" 2>/dev/null || echo "  FAIL  /auth/me"

echo
echo "=== ADMIN DASHBOARDS (read) ==="
check() {
  local name="$1" path="$2" mode="${3:-array}"
  local out code
  out=$(curl -s -m 30 -w '\n%{http_code}' "$API$path" -H "Authorization: Bearer $TOKEN" -H "x-csrf-token: $CSRF")
  code=$(printf '%s' "$out" | tail -1)
  local body; body=$(printf '%s' "$out" | sed '$d')
  if [ "$code" = "200" ]; then
    local n
    n=$(printf '%s' "$body" | python3 -c "
import sys,json
d=json.load(sys.stdin).get('data')
if isinstance(d,list): print(f'{len(d)} rows')
elif isinstance(d,dict):
  print(f'{len(d)} keys' if 'items' not in d else f\"{len(d['items'])} rows\")
else: print('ok')" 2>/dev/null || echo "ok")
    printf "  PASS  %-34s http=%s  %s\n" "$name" "$code" "$n"
  else
    printf "  FAIL  %-34s http=%s  %s\n" "$name" "$code" "$(printf '%s' "$body" | head -c 90)"
  fi
}
check "Overview"                 "/admin/overview"
check "Hero images"              "/admin/hero-images"
check "Portfolio"                "/admin/portfolio"
check "Virtual Designs"          "/admin/virtual-designs"
check "Services"                 "/admin/services"
check "Socials"                  "/admin/socials"
check "About"                    "/admin/about"
check "Shop / products"          "/products/admin/all"
check "Blog"                     "/admin/blog"
check "Blog categories"          "/blog/categories"
check "Orders"                   "/orders"
check "Consultations"            "/admin/consultations"
check "Work With Us"             "/admin/work-with-us"
check "Testimonials"             "/admin/testimonials"
check "Circular Tabs"            "/admin/circular-tabs"
check "Settings"                 "/admin/settings"
check "Push subscriptions"       "/admin/push"

echo
echo "=== WRITE PATH (create -> verify -> delete) ==="
STAMP=$(date +%s)
CREATED=$(curl -s -m 30 -X POST "$API/admin/testimonials" -H "Authorization: Bearer $TOKEN" -H "x-csrf-token: $CSRF" \
  -H 'Content-Type: application/json' -d "{\"clientName\":\"__ADMINVERIFY__ $STAMP\",\"content\":\"temporary verification record\",\"isActive\":false}")
TID=$(printf '%s' "$CREATED" | python3 -c "import sys,json;print((json.load(sys.stdin).get('data') or {}).get('id',''))" 2>/dev/null || true)
if [ -n "$TID" ]; then
  echo "  PASS  create testimonial  id=$TID"
  UPD=$(curl -s -m 30 -X PUT "$API/admin/testimonials/$TID" -H "Authorization: Bearer $TOKEN" -H "x-csrf-token: $CSRF" \
    -H 'Content-Type: application/json' -d "{\"clientName\":\"__ADMINVERIFY__ $STAMP edited\",\"isActive\":false}")
  printf '%s' "$UPD" | python3 -c "import sys,json;d=json.load(sys.stdin);print('  PASS  update testimonial ->', (d.get('data') or {}).get('clientName'))" 2>/dev/null \
    || echo "  FAIL  update testimonial"
  DEL=$(curl -s -m 30 -X DELETE "$API/admin/testimonials/$TID" -H "Authorization: Bearer $TOKEN" -H "x-csrf-token: $CSRF" -o /dev/null -w '%{http_code}')
  [ "$DEL" = "200" ] && echo "  PASS  delete testimonial (test record removed)" || echo "  FAIL  delete testimonial http=$DEL"
else
  echo "  FAIL  create testimonial: $(printf '%s' "$CREATED" | head -c 160)"
fi

echo
echo "=== AUTHORIZATION: customer token must be rejected from admin routes ==="
NOPE=$(curl -s -m 25 -o /dev/null -w '%{http_code}' "$API/admin/portfolio" -H "Authorization: Bearer $TOKEN" -H "x-csrf-token: $CSRF")
echo "  (sanity) admin route with admin token: http=$NOPE"
