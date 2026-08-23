# Deploying the frontend to AWS

A step-by-step runbook for putting the static frontend build on AWS —
preferred approach is **S3 + CloudFront**, with a documented fallback for
the one real obstacle you're likely to hit: new/free-tier AWS accounts
often can't create CloudFront distributions until AWS manually verifies
the account.

See [`backend/DEPLOYMENT.md`](backend/DEPLOYMENT.md) for deploying the API
this frontend talks to — do that first, since the API's public
URL/domain is one of the inputs below.

Placeholders used throughout:

| Placeholder | Meaning | Example |
|---|---|---|
| `<REGION>` | AWS region | `ap-south-1` |
| `<FRONTEND_BUCKET>` | S3 bucket for the built frontend | `revaudit-frontend-<account-id>` |
| `<API_ORIGIN>` | Wherever the backend is reachable | `https://api.example.com` or `http://<elastic-ip>` |

---

## 1. Production build

```bash
npm ci
npm run build     # runs `tsc -b && vite build` — output lands in dist/
```

## 2. Environment variables / API URL configuration

The frontend reads `VITE_API_URL` **at build time** — Vite inlines it into
the compiled JS, it is not a runtime-configurable server env var like the
backend's. Which value to use depends on which hosting path below you take:

- **CloudFront path (preferred)**: set it to a **relative** path, `/api`.
  CloudFront serves the frontend and proxies `/api/*` to the backend on the
  same distribution, so the browser only ever talks to one HTTPS origin —
  no CORS, no mixed-content warnings.
- **S3-website-hosting fallback**: set it to the backend's **full URL**,
  e.g. `<API_ORIGIN>/api`. The frontend and backend are then genuinely
  different origins, so the backend's `CORS_ORIGIN` must be set to this
  bucket's website endpoint (see `backend/.env` /
  `backend/DEPLOYMENT.md`).

```bash
VITE_API_URL="/api" npm run build                        # CloudFront path
# or
VITE_API_URL="<API_ORIGIN>/api" npm run build             # S3-website fallback
```

Verify what actually got embedded before uploading anything:

```bash
grep -o '"/api"\|"http[^"]*"' dist/assets/index-*.js | head -1
```

## 3. Create the S3 bucket and upload the build

```bash
aws s3api create-bucket --bucket <FRONTEND_BUCKET> --region <REGION> \
  --create-bucket-configuration LocationConstraint=<REGION>

aws s3 sync dist/ "s3://<FRONTEND_BUCKET>/" --region <REGION> --delete
```

Re-run the `sync` command after every future build — `--delete` keeps the
bucket from accumulating stale hashed asset files from old builds.

## 4. Configure public access

**Never make the bucket itself public if you're using CloudFront.** The
correct pattern is a private bucket read only by CloudFront via an Origin
Access Control (OAC):

```bash
aws s3api put-public-access-block --bucket <FRONTEND_BUCKET> \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

aws cloudfront create-origin-access-control --origin-access-control-config '{
  "Name": "revaudit-frontend-oac",
  "OriginAccessControlOriginType": "s3",
  "SigningBehavior": "always",
  "SigningProtocol": "sigv4"
}'
```

Then create the distribution (step 5) referencing this OAC's `Id` — the
bucket policy granting CloudFront read access gets attached automatically
when you do that through the console, or explicitly via
`put-bucket-policy` if scripting it end to end.

### If CloudFront is blocked pending account verification

You'll see this exact error on `create-distribution`:

> Your account must be verified before you can add new CloudFront
> resources.

This is an AWS anti-fraud gate on newer accounts — file a case at
[AWS Support](https://console.aws.amazon.com/support/home#/) referencing
that message; it's typically cleared within a business day, no cost. In
the meantime, fall back to **S3 static website hosting** so the site is
public today:

```bash
aws s3 website "s3://<FRONTEND_BUCKET>/" --index-document index.html --error-document index.html

# Website-hosting endpoints don't support OAC — the bucket has to allow
# public reads. This is fine: the bucket holds only public static assets,
# nothing sensitive (contrast with the uploads bucket in backend/README.md,
# which must stay private).
aws s3api put-public-access-block --bucket <FRONTEND_BUCKET> \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=false,RestrictPublicBuckets=false

cat > /tmp/frontend-bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadForWebsite",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::<FRONTEND_BUCKET>/*"
  }]
}
EOF
aws s3api put-bucket-policy --bucket <FRONTEND_BUCKET> --policy file:///tmp/frontend-bucket-policy.json
```

The site is now live at
`http://<FRONTEND_BUCKET>.s3-website.<REGION>.amazonaws.com`. Remember:
this path is **HTTP only** and does **not** proxy `/api/*` — the frontend
build must have been built with the backend's full URL (step 2, second
form), and the backend's `CORS_ORIGIN` must match this exact website
endpoint.

Switch to CloudFront later without touching S3 at all: once verified,
create the distribution as in step 5, rebuild with `VITE_API_URL=/api`,
re-sync, and re-lock the bucket to OAC-only (undo the public bucket policy
above).

## 5. CloudFront distribution (once available)

Two origins on one distribution — the S3 bucket for everything, and the
backend for `/api/*` — so the browser only ever sees one HTTPS origin:

```bash
aws cloudfront create-distribution --distribution-config file://distribution-config.json
```

Key points the config needs to get right:

- **S3 origin**: `OriginAccessControlId` set to the OAC from step 4, empty
  `S3OriginConfig.OriginAccessIdentity`.
- **API origin**: a `CustomOriginConfig` pointing at `<API_ORIGIN>`'s
  hostname. **CloudFront custom origins require a DNS hostname, not a bare
  IP address.** If the backend has a real domain, use it. If it's still a
  bare Elastic IP with no domain yet, a wildcard-DNS service like
  [nip.io](https://nip.io) resolves `<ip-with-dots>.nip.io` straight to
  that IP — e.g. `203.0.113.5.nip.io` — which satisfies CloudFront's
  hostname requirement as a stand-in until a real domain exists.
- **`/api/*` cache behavior**: `CachePolicyId` = the AWS managed
  `CachingDisabled` policy (`4135ea2d-6df8-44a3-9df3-4b5a84be39ad`) — API
  responses are per-request and must never be cached — and
  `OriginRequestPolicyId` = the managed `AllViewer` policy
  (`216adef6-5c7f-47e4-b989-5492eafa07d3`) so the `Authorization` header
  actually reaches the backend (CloudFront strips it by default).
  `AllowedMethods` must include `POST`/`PUT`/`PATCH`/`DELETE`, not just
  `GET`/`HEAD` — the API needs all of them.
- **Do not** add a distribution-wide `CustomErrorResponses` rule that
  rewrites 403/404 to `index.html` as a SPA-routing fix. This app uses
  *hash*-based routing (`#/project`, not `/project`), so the server never
  sees path-based routes and doesn't need that trick — and adding it would
  silently rewrite genuine API 404s (e.g. "presentation not found") into
  the frontend's HTML, breaking error handling.

Wait for it to finish deploying before testing:

```bash
DIST_ID=<from the create-distribution output>
aws cloudfront wait distribution-deployed --id "$DIST_ID"
```

## 6. Connect a domain/subdomain

No domain yet? Use the distribution's default `*.cloudfront.net` domain
(or the S3 website endpoint, on the fallback path) — everything above
still works.

With a domain:

```bash
# ACM certificate MUST be requested in us-east-1 regardless of which
# region everything else is in — CloudFront only accepts certs from there.
aws acm request-certificate --domain-name <YOUR_DOMAIN> \
  --validation-method DNS --region us-east-1
# add the DNS validation record ACM gives you, wait for it to issue, then
# attach the cert's ARN to the distribution's ViewerCertificate and add
# <YOUR_DOMAIN> to Aliases.

aws route53 change-resource-record-sets --hosted-zone-id <ZONE_ID> \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "<YOUR_DOMAIN>",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "<distribution-domain>.cloudfront.net",
          "EvaluateTargetHealth": false
        }
      }
    }]
  }'
```

(`Z2FDTNDATAQYW2` is CloudFront's fixed alias hosted-zone ID — the same for
every distribution, not specific to your account.)

---

## Verify: public website loads, all pages work

Every route in this app is client-side (hash-based), so a single
`index.html` load is genuinely sufficient — there's no path-based routing
for the server to get wrong. Check each one loads real content:

```bash
SITE=<your CloudFront domain or S3 website endpoint>
curl -s -o /dev/null -w "%{http_code}\n" "http://$SITE/"   # 200
```

Then in a browser: Home, Project, Team, Presentations (should show real
data fetched from the backend, not placeholders), a deep link straight to
`#/presentations/planning-v1`, Architecture, and Admin — log in and
confirm the dashboard loads (proves the `/api/*` path, CORS, and the
backend are all correctly wired from this specific deployment, not just
independently working).

## Not implemented yet

No CDN/domain in front of the backend itself yet if you took the
S3-website fallback path — see `backend/DEPLOYMENT.md` for adding HTTPS
there once a domain exists. Cache invalidation on redeploy
(`aws cloudfront create-invalidation --distribution-id <id> --paths "/*"`)
isn't automated — run it by hand after each `s3 sync` if you're on the
CloudFront path and don't want to wait out the cache TTL.
