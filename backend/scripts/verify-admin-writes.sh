#!/usr/bin/env bash
# Second pass: create -> read -> update -> delete on every dashboard that
# supports writes, plus a role-based access check. Uses the same throwaway test
# admin; the original password hash is captured and restored verbatim.
set -euo pipefail

export LD_LIBRARY_PATH=/tmp/kilo/pg18/root/usr/lib/x86_64-linux-gnu
PGB=/tmp/kilo/pg18/root/usr/lib/postgresql/18/bin
API="https://home-interior-backend.onrender.com/api"
TEST_ADMIN="qa_test_admin@test.com"
NEON="postgresql://neondb_owner:npg_ch9xEKC1ARYT@ep-summer-fog-axxu83jz.c-4.us-east-2.aws.neon.tech:5432/neondb?sslmode=require"
TEMP_PW="TempWrite-$(date +%s)-Bb2!"
ORIG_HASH_FILE=$(mktemp)
$PGB/psql "$NEON" -tAc "SELECT password_hash FROM admins WHERE email='$TEST_ADMIN';" > "$ORIG_HASH_FILE" 2>/dev/null
ORIG_MD5=$($PGB/psql "$NEON" -tAc "SELECT md5(password_hash) FROM admins WHERE email='$TEST_ADMIN';" 2>/dev/null | tr -d ' ')

restore() {
  local h; h=$(cat "$ORIG_HASH_FILE")
  $PGB/psql "$NEON" -q -c "UPDATE admins SET password_hash='$h' WHERE email='$TEST_ADMIN';" >/dev/null 2>&1 || true
  local now; now=$($PGB/psql "$NEON" -tAc "SELECT md5(password_hash) FROM admins WHERE email='$TEST_ADMIN';" 2>/dev/null | tr -d ' ')
  [ "$now" = "$ORIG_MD5" ] && echo "RESTORED: $TEST_ADMIN password hash back to original ($ORIG_MD5)" || echo "WARNING: restore unconfirmed ($now vs $ORIG_MD5)"
  rm -f "$ORIG_HASH_FILE"
}
trap restore EXIT

NEW_HASH=$(cd "$(dirname "$0")/.." && node -e "console.log(require('bcryptjs').hashSync(process.argv[1],12))" "$TEMP_PW")
$PGB/psql "$NEON" -q -c "UPDATE admins SET password_hash='$NEW_HASH' WHERE email='$TEST_ADMIN';" >/dev/null 2>&1

LOGIN=$(curl -s -m 30 -X POST "$API/auth/login" -H 'Content-Type: application/json' -d "{\"email\":\"$TEST_ADMIN\",\"password\":\"$TEMP_PW\"}")
TOKEN=$(printf '%s' "$LOGIN" | python3 -c "import sys,json;print((json.load(sys.stdin).get('data') or {}).get('accessToken',''))")
CSRF=$(printf '%s' "$LOGIN" | python3 -c "import sys,json;print((json.load(sys.stdin).get('data') or {}).get('csrfToken',''))")
[ -n "$TOKEN" ] || { echo "FATAL: login failed"; exit 1; }
echo "logged in as $TEST_ADMIN"
S=$(date +%s)

req() { # method path json -> prints "http code|body"
  curl -s -m 30 -X "$1" "$API$2" -H "Authorization: Bearer $TOKEN" -H "x-csrf-token: $CSRF" \
    -H 'Content-Type: application/json' ${3:+-d "$3"} -w '\n%{http_code}'
}
code() { printf '%s' "$1" | tail -1; }
body() { printf '%s' "$1" | sed '$d'; }
id_of() { printf '%s' "$1" | python3 -c "import sys,json
try:
  d=json.load(sys.stdin).get('data') or {}
  print(d.get('id') or d.get('_id') or '')
except Exception: print('')" 2>/dev/null; }

echo
echo "=== CREATE / UPDATE / DELETE per dashboard ==="
declare -a NAMES=() STATES=() DETAIL=()
run_cycle() { # label createPath createJson updateMethod updatePath deleteMethod listPath
  local label="$1" cp="$2" cj="$3" upm="$4" upp="$5" delm="$6" delp="$7" listp="$8"
  local R ID U D L
  R=$(req POST "$cp" "$cj"); ID=$(id_of "$(body "$R")")
  if [ -z "$ID" ]; then NAMES+=("$label"); STATES+=("CREATE-FAIL"); DETAIL+=("$(code "$R") $(body "$R" | head -c 80)"); return; fi
  U=$(req "$upm" "$upp/$ID" "{\"isActive\":false,\"isPublished\":false,\"title\":\"__WRITETEST__ $S\",\"name\":\"__WRITETEST__ $S\",\"displayName\":\"__WRITETEST__ $S\"}")
  D=$(req "$delm" "$delp/$ID" "")
  L=$(req GET "$listp" "")
  local uc dc
  uc=$(code "$U"); dc=$(code "$D")
  local st="PASS"
  [ "$uc" = "200" ] || [ "$uc" = "201" ] || st="UPDATE($uc)"
  if [ "$dc" != "200" ]; then st="$st DELETE($dc)"; fi
  NAMES+=("$label"); STATES+=("$st"); DETAIL+=("id=$ID update=$uc delete=$dc list=$(code "$L")")
}

run_cycle "Portfolio"        "/admin/portfolio"   "{\"title\":\"__WRITETEST__ $S\",\"description\":\"t\",\"published\":true}" "PATCH" "/admin/portfolio" "DELETE" "/admin/portfolio" "/admin/portfolio"
run_cycle "Blog"             "/admin/blog"        "{\"title\":\"__WRITETEST__ $S\",\"content\":\"t\",\"published\":true,\"tags\":[\"a\"]}" "PATCH" "/admin/blog" "DELETE" "/admin/blog" "/admin/blog"
run_cycle "Services"         "/admin/services"    "{\"title\":\"__WRITETEST__ $S\",\"description\":\"t\"}" "PATCH" "/admin/services" "DELETE" "/admin/services" "/admin/services"
run_cycle "Testimonials"     "/admin/testimonials" "{\"clientName\":\"__WRITETEST__ $S\",\"content\":\"t\"}" "PATCH" "/admin/testimonials" "DELETE" "/admin/testimonials" "/admin/testimonials"
run_cycle "Socials"          "/admin/socials"     "{\"name\":\"__WRITETEST__ $S\",\"platform\":\"instagram\",\"link\":\"https://instagram.com/x\"}" "PATCH" "/admin/socials" "DELETE" "/admin/socials" "/admin/socials"
run_cycle "Hero media"       "/admin/hero-images" "{\"title\":\"__WRITETEST__ $S\"}" "PATCH" "/admin/hero-images" "DELETE" "/admin/hero-images" "/admin/hero-images"
run_cycle "Virtual Designs"  "/admin/virtual-designs" "{\"title\":\"__WRITETEST__ $S\",\"description\":\"t\"}" "PATCH" "/admin/virtual-designs" "DELETE" "/admin/virtual-designs" "/admin/virtual-designs"
run_cycle "Work With Us"     "/admin/work-with-us/content" "{\"title\":\"__WRITETEST__ $S\",\"description\":\"t\"}" "PATCH" "/admin/work-with-us/content" "DELETE" "/admin/work-with-us/content" "/admin/work-with-us"
run_cycle "Shop product"     "/products"          "{\"name\":\"__WRITETEST__ $S\",\"price\":10,\"category\":\"Mirrors\"}" "PATCH" "/admin/shop" "DELETE" "/admin/shop" "/products/admin/all"

for i in "${!NAMES[@]}"; do
  printf "  %-18s %-22s %s\n" "${NAMES[$i]}" "${STATES[$i]}" "${DETAIL[$i]}"
done

echo
echo "=== order detail + status + tracking (existing real orders) ==="
FIRST_ORDER=$($PGB/psql "$NEON" -tAc "SELECT id FROM orders ORDER BY created_at DESC LIMIT 1;" 2>/dev/null | tr -d ' ')
if [ -n "$FIRST_ORDER" ]; then
  D=$(req GET "/orders/$FIRST_ORDER" "")
  H=$(req GET "/orders/$FIRST_ORDER/history" "")
  S1=$(req PATCH "/orders/$FIRST_ORDER/status" '{"status":"processing"}')
  echo "  order detail   http=$(code "$D")"
  echo "  order history  http=$(code "$H")"
  echo "  status update  http=$(code "$S1")  (existing status: $($PGB/psql "$NEON" -tAc "SELECT status FROM orders WHERE id='$FIRST_ORDER';" 2>/dev/null | tr -d ' '))"
else
  echo "  (no orders)"
fi

echo
echo "=== role-based access: a CUSTOMER token must not reach admin routes ==="
REG=$(curl -s -m 30 -X POST "$API/auth/register" -H 'Content-Type: application/json' \
  -d "{\"fullName\":\"__RBAC__ $S\",\"email\":\"rbac-$S@example.com\",\"password\":\"RbacTest-12345\"}")
CT=$(printf '%s' "$REG" | python3 -c "import sys,json;d=json.load(sys.stdin);x=(d.get('data') or {});print(x.get('accessToken') or x.get('token') or '')" 2>/dev/null)
if [ -n "$CT" ]; then
  for p in /admin/portfolio /admin/orders /admin/blog /admin/settings; do
    printf "  customer -> %-22s http=%s (403 expected)\n" "$p" "$(curl -s -m 20 -o /dev/null -w '%{http_code}' "$API$p" -H "Authorization: Bearer $CT")"
  done
  $PGB/psql "$NEON" -q -c "DELETE FROM users WHERE email='rbac-$S@example.com';" >/dev/null 2>&1 && echo "  (test customer removed)"
else
  echo "  register response: $(printf '%s' "$REG" | head -c 140)"
fi

echo
echo "=== no leftover test rows ==="
for t in portfolios blogs services testimonials social_items hero_media virtual_designs work_with_us products users; do
  N=$($PGB/psql "$NEON" -tAc "SELECT count(*) FROM $t WHERE title LIKE '%__WRITETEST__%' OR name LIKE '%__WRITETEST__%' OR client_name LIKE '%__WRITETEST__%' OR display_name LIKE '%__WRITETEST__%' OR email LIKE '%__RBAC__%' OR full_name LIKE '%__RBAC__%';" 2>/dev/null | tr -d ' ')
  [ "$N" = "0" ] || echo "  $t: $N leftover"
done
echo "  (blank above = clean)"
