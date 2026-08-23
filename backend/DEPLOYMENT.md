# Deploying the backend to AWS EC2

A step-by-step runbook for putting the RevAudit backend on self-managed AWS
compute — required by the project's own spec, which explicitly rules out
PaaS platforms that hide the server (Vercel, Render, Firebase). Everything
below uses the AWS CLI so each step is a command you can read, not a click
you have to remember.

Placeholders to fill in as you go, shown like this throughout:

| Placeholder | Meaning | Example |
|---|---|---|
| `<REGION>` | AWS region | `us-east-1` |
| `<KEY_NAME>` | EC2 key pair name | `revaudit-deploy` |
| `<YOUR_IP>` | Your own public IP, for SSH access | `203.0.113.7/32` |
| `<ELASTIC_IP>` | The Elastic IP you allocate in step 1 | `54.210.11.4` |
| `<API_DOMAIN>` | The subdomain the backend will live at | `api.revaudit.example.com` |
| `<FRONTEND_ORIGIN>` | Wherever the frontend is actually served from | `https://revaudit.example.com` |

## Prerequisites

- An AWS account and the AWS CLI configured locally (`aws configure`) with
  a user that has EC2/IAM permissions.
- A domain you control (for `<API_DOMAIN>` and HTTPS). Without one, skip
  straight to using the Elastic IP over plain HTTP — every step notes this.
- This repository pushed to GitHub (it already is:
  `https://github.com/adityaraj868/ArchCoders_RevAudit`).

---

## 1. Create the EC2 instance

Find a current Ubuntu 22.04 LTS AMI for your region and launch a
`t3.small` (the free-tier `t2.micro`/`t3.micro` is undersized once Postgres,
Node, and Nginx all run on the same box):

```bash
AMI_ID=$(aws ec2 describe-images \
  --owners 099720109477 \
  --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" \
  --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
  --region <REGION> --output text)

aws ec2 create-key-pair --key-name <KEY_NAME> --region <REGION> \
  --query 'KeyMaterial' --output text > <KEY_NAME>.pem
chmod 400 <KEY_NAME>.pem
```

Security group comes next (step 2) — create the instance after that so it
can be attached at launch:

```bash
aws ec2 run-instances \
  --image-id "$AMI_ID" \
  --instance-type t3.small \
  --key-name <KEY_NAME> \
  --security-group-ids <SECURITY_GROUP_ID> \
  --block-device-mappings 'DeviceName=/dev/sda1,Ebs={VolumeSize=20,VolumeType=gp3}' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=revaudit-backend}]' \
  --region <REGION>
```

Allocate and attach an **Elastic IP** — without this, the public IP changes
every time the instance stops/starts, which breaks DNS and SSH muscle
memory:

```bash
ALLOC_ID=$(aws ec2 allocate-address --domain vpc --region <REGION> --query AllocationId --output text)
aws ec2 associate-address --instance-id <INSTANCE_ID> --allocation-id "$ALLOC_ID" --region <REGION>
aws ec2 describe-addresses --allocation-ids "$ALLOC_ID" --region <REGION> --query 'Addresses[0].PublicIp'
```

That output is your `<ELASTIC_IP>`.

## 2. Configure the security group

Only three ports, each scoped as tightly as possible — nothing else is
reachable from the internet:

```bash
SG_ID=$(aws ec2 create-security-group \
  --group-name revaudit-backend-sg \
  --description "RevAudit backend: SSH, HTTP, HTTPS" \
  --region <REGION> --query GroupId --output text)

# SSH — your IP only, never 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id "$SG_ID" \
  --protocol tcp --port 22 --cidr <YOUR_IP> --region <REGION>

# HTTP/HTTPS — public, needed for Let's Encrypt's HTTP-01 challenge and normal traffic
aws ec2 authorize-security-group-ingress --group-id "$SG_ID" \
  --protocol tcp --port 80 --cidr 0.0.0.0/0 --region <REGION>
aws ec2 authorize-security-group-ingress --group-id "$SG_ID" \
  --protocol tcp --port 443 --cidr 0.0.0.0/0 --region <REGION>
```

Notably **not opened**: 4000 (the Node process — only Nginx should reach it,
via `localhost`) and 5432 (Postgres — self-hosted on this same box, so it
never needs to accept connections from outside it at all).

## 3. Connect and install Node.js

```bash
ssh -i <KEY_NAME>.pem ubuntu@<ELASTIC_IP>
```

Node 20 LTS via NodeSource (matches what this repo was built/tested against):

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version   # v20.x
```

## 4. Clone the repository

```bash
sudo apt-get update && sudo apt-get install -y git
git clone https://github.com/adityaraj868/ArchCoders_RevAudit.git
cd ArchCoders_RevAudit/backend
```

## 5. Install PostgreSQL and create the database

Self-hosted on the same instance — fewer moving parts than RDS, and this is
what's already been tested against in development:

```bash
sudo apt-get install -y postgresql
sudo -u postgres psql -c "CREATE ROLE revaudit WITH LOGIN PASSWORD '<DB_PASSWORD>';"
sudo -u postgres psql -c "CREATE DATABASE revaudit OWNER revaudit;"
```

Pick `<DB_PASSWORD>` with `openssl rand -hex 24` — don't reuse the local dev
default of `postgres`/`postgres`.

## 6. Configure environment variables

```bash
cp .env.example .env
nano .env   # or vim/your editor of choice
```

Production values (see [`.env.example`](.env.example) for the full list):

```bash
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://revaudit:<DB_PASSWORD>@localhost:5432/revaudit
CORS_ORIGIN=<FRONTEND_ORIGIN>
JWT_SECRET=<run: openssl rand -hex 32>
STORAGE_DRIVER=s3
AWS_ACCESS_KEY=<IAM user's access key — see the IAM note below>
AWS_SECRET_KEY=<IAM user's secret key>
AWS_REGION=<REGION>
AWS_BUCKET_NAME=<your bucket>
```

**On the IAM user**: create one scoped to exactly this bucket — this is the
"IAM-safe access" the S3 integration was built around
(`backend/README.md` has the exact policy JSON). Never use root account
keys here.

`env.js` enforces `DATABASE_URL`, `CORS_ORIGIN`, and `JWT_SECRET` as
required whenever `NODE_ENV=production` — the process refuses to start
without them rather than silently falling back to an insecure default.

## 7. Install dependencies and run migrations

```bash
npm ci --omit=dev
npm run migrate
ADMIN_NAME="Dr. Sukhpal Singh" ADMIN_EMAIL="admin@<API_DOMAIN>" ADMIN_PASSWORD="<a-strong-password>" npm run create-admin
```

## 8. Run the backend once, directly, to confirm it works

```bash
node src/server.js
```

You should see `Database connection verified`. In a second SSH session:

```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api/health/db
```

Both `200`. Stop it (`Ctrl+C`) — pm2 takes over from here.

## 9. Configure PM2

```bash
sudo npm install -g pm2
pm2 start src/server.js --name revaudit-backend
pm2 status
pm2 logs revaudit-backend --lines 50
```

## 10. Enable restart after reboot

Two commands, in this order — the first prints a `sudo ...` command that
you then have to actually run (it varies per system, which is why pm2
generates rather than just running it):

```bash
pm2 startup systemd
# copy-paste and run the sudo command it prints, then:
pm2 save
```

`pm2 save` snapshots the *current* process list (`revaudit-backend`) as
what gets restored on boot — re-run it any time after starting/stopping
processes, or the reboot won't pick up the change.

Verify without actually waiting for a real reboot:

```bash
sudo reboot
# wait ~30s, then:
ssh -i <KEY_NAME>.pem ubuntu@<ELASTIC_IP>
pm2 status   # revaudit-backend should already be "online"
```

## 11. Nginx: reverse proxy + production CORS + API domain

```bash
sudo apt-get install -y nginx
sudo tee /etc/nginx/sites-available/revaudit-backend > /dev/null <<'EOF'
server {
    listen 80;
    server_name <API_DOMAIN>;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/revaudit-backend /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

**Production CORS** is not an Nginx concern — it's the `CORS_ORIGIN` value
set in step 6. Whatever origin the frontend actually gets served from
(`<FRONTEND_ORIGIN>`) must match exactly, including the scheme
(`https://`, not `http://`) once HTTPS is on. Changing it means editing
`.env` and restarting the process:

```bash
pm2 restart revaudit-backend
```

**API domain**: point DNS at the Elastic IP. In Route 53:

```bash
aws route53 change-resource-record-sets --hosted-zone-id <ZONE_ID> \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "<API_DOMAIN>",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "<ELASTIC_IP>"}]
      }
    }]
  }'
```

Using a different registrar: create the same thing (an `A` record,
`<API_DOMAIN>` → `<ELASTIC_IP>`) in whatever DNS console you use, and wait
for propagation (`dig <API_DOMAIN>` should return the Elastic IP) before
step 12.

## 12. HTTPS

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d <API_DOMAIN>
```

Certbot edits the Nginx config to add the TLS listener and redirect
80→443, and installs a systemd timer that renews automatically — no cron
job to remember. Confirm the timer exists:

```bash
systemctl list-timers | grep certbot
```

No domain yet? Skip this step and use `http://<ELASTIC_IP>` — everything
else in this guide still works, just without TLS. Add HTTPS later without
redoing anything above once a domain is available.

---

## Verify the full chain: Frontend → Backend → Database → S3

Each hop, checked independently rather than assumed:

**Backend is reachable and CORS is correct:**
```bash
curl -i https://<API_DOMAIN>/api/health
# 200, and from a browser console at <FRONTEND_ORIGIN>:
#   fetch('https://<API_DOMAIN>/api/health').then(r => r.json()).then(console.log)
# — no CORS error means CORS_ORIGIN is set correctly.
```

**Backend → Database:**
```bash
curl https://<API_DOMAIN>/api/health/db
# {"database":"connected"}
```

**Full write path (proves Database *and* auth together):**
```bash
curl -X POST https://<API_DOMAIN>/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@<API_DOMAIN>","password":"<a-strong-password>"}'
# 200 with a token — confirms the app can read/write real rows in Postgres.
```

**Backend → S3** (using the token from the previous step):
```bash
TOKEN=<paste the token>
PRES_ID=$(curl -s -X POST https://<API_DOMAIN>/api/presentations \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"Deploy Check","version":"1.0","date":"2026-01-01","authors":["Deploy Script"]}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['presentation']['id'])")

curl -X POST https://<API_DOMAIN>/api/files/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "presentationId=$PRES_ID" \
  -F "files=@/etc/hostname;type=text/plain"
# 201, and the response's "url" field is a signed S3 URL that returns the
# file's contents when opened.

# Independently, from anywhere with the AWS CLI configured for this account:
aws s3 ls s3://<your bucket> --recursive
```

**Frontend → Backend**, end to end: point the deployed (or local) frontend's
`VITE_API_URL` at `https://<API_DOMAIN>/api`, rebuild, and confirm the
Presentation Archive page loads real data and admin login works — the same
flow already verified locally, now against the deployed API.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Nginx returns `502 Bad Gateway` | The Node process isn't running — check `pm2 status` and `pm2 logs revaudit-backend` |
| `pm2 status` is empty after a reboot | `pm2 save` was never run after `pm2 startup`, or was run before starting the process |
| `certbot` fails with a domain-validation error | DNS hasn't propagated yet — `dig <API_DOMAIN>` should return `<ELASTIC_IP>` before retrying |
| Browser console shows a CORS error | `CORS_ORIGIN` in `.env` doesn't exactly match the frontend's origin (scheme + host + port) — restart pm2 after fixing it |
| `/api/health/db` returns `503` | Check `DATABASE_URL`, and that `postgresql` is running: `sudo systemctl status postgresql` |
| File upload succeeds but the returned URL 403s | The S3 credentials/bucket in `.env` don't match where you're checking, or the IAM policy is missing `s3:GetObject` |
