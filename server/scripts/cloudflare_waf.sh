#!/usr/bin/env bash
set -euo pipefail

# Requires: CF_API_TOKEN (edit rules), CF_ZONE_ID, APP_DOMAIN (e.g., nexusai.com)

cf_api() {
  curl -sS -X "$1" \
    -H "Authorization: Bearer ${CF_API_TOKEN}" \
    -H "Content-Type: application/json" \
    "$2" \
    ${3:-}
}

echo "Creating rate limits..."

# Login brute-force protection
cf_api POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/rate_limits" \
  --data '{
  "threshold": 20,
  "period": 60,
  "action": {"mode": "block"},
  "match": {"request": {"methods": ["POST"], "schemes": ["HTTPS","HTTP"], "url": "https://'"${APP_DOMAIN}""/api/auth/login/gmail"}, "response": {}},
  "description": "Login rate limit"
}'

# Phone verification limit
cf_api POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/rate_limits" \
  --data '{
  "threshold": 5,
  "period": 60,
  "action": {"mode": "block"},
  "match": {"request": {"methods": ["POST"], "schemes": ["HTTPS","HTTP"], "url": "https://'"${APP_DOMAIN}""/api/auth/send-verification"}, "response": {}},
  "description": "Phone verification rate limit"
}'

# Darkroom flood control
cf_api POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/rate_limits" \
  --data '{
  "threshold": 60,
  "period": 60,
  "action": {"mode": "challenge"},
  "match": {"request": {"methods": ["POST"], "schemes": ["HTTPS","HTTP"], "url": "https://'"${APP_DOMAIN}""/api/v1/darkroom/*"}},
  "description": "Darkroom rate limit"
}'

echo "Creating WAF custom rules..."

# Block missing UA on POST
cf_api POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/filters" \
  --data '[{"expression":"(http.request.method eq \"POST\" and not http.user_agent contains \"/\")","paused":false,"description":"Block POST without UA"}]'

echo "Done."


