# AWS Deployment Plan — Node.js API (shareshare)

This plan covers deploying your Express + MySQL + S3 API to AWS: stack summary, required code changes, architecture, deployment options, RDS, S3/IAM, CI/CD, and checklist.

---

## 1. Stack summary

| Component | Technology |
|-----------|------------|
| Runtime | Node.js (Express) |
| Database | MySQL (`mysql2`, database: `shareshare`) |
| Auth | JWT (access + refresh tokens) |
| File storage | AWS S3 (posts, profile, groups, images) |
| Config | `dotenv` |

**Environment variables in use:**  
`PORT`, `AWS_BUCKET_NAME`, `AWS_BUCKET_REGION`, `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `APP_LOCATION`, `FILE_LOCATION`, `POSTS`, `GROUPS`, `PROFILE`, `AWS_GROUPS_BUCKET_NAME` (optional).

---

## 2. Required code changes (before deployment)

- **Database connection:** Move DB config out of hardcoded values into env vars (e.g. `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) so production can point to RDS.
- **CORS:** Allow production frontend origin via env (e.g. `CORS_ORIGIN` or `CORS_ORIGINS` comma-separated) instead of only localhost.
- **Secrets:** No hardcoded secrets; use env or AWS Secrets Manager / SSM Parameter Store for DB password and JWT secrets.

---

## 3. Architecture sketch

```
                    Internet
                        │
                        ▼
              ┌─────────────────┐
              │  Route 53 (DNS) │  (optional)
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │  Application    │  Elastic Beanstalk / ECS / EC2
              │  Load Balancer  │
              └────────┬────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   ┌────▼────┐   ┌─────▼─────┐   ┌────▼────┐
   │ Node.js │   │  Node.js  │   │ Node.js │  (1+ instances)
   │  app    │   │    app    │   │   app   │
   └────┬────┘   └─────┬─────┘   └────┬────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   ┌────▼────┐   ┌─────▼─────┐   ┌────▼────┐
   │   RDS   │   │    S3     │   │ Secrets │
   │ (MySQL) │   │ (existing)│   │ Manager │
   └─────────┘   └───────────┘   └─────────┘
```

- **Compute:** Elastic Beanstalk (easiest), ECS Fargate, or EC2.
- **Database:** RDS for MySQL (schema from `doc/database/api.sql`).
- **Storage:** Existing S3 bucket; IAM allows app read/write.
- **Secrets:** DB password and JWT secrets in Secrets Manager or Parameter Store; inject via env.

---

## 4. Deployment paths

### Option A — Elastic Beanstalk (recommended)

- **Pros:** Managed platform, auto-scaling, load balancer, env config, Node.js supported.
- **Cons:** Less control than ECS/EC2.

**Steps (summary):**  
Install EB CLI → `eb init` (region, app name, Node.js) → `eb create api-production` → set env vars (including RDS) in EB Configuration → create RDS and run schema → `eb deploy` or connect GitHub for CodePipeline.

---

### Option B — ECS Fargate

- **Pros:** Container-based, scalable, no server management.
- **Cons:** Need a Dockerfile and more AWS setup.

**Steps (summary):**  
Add Dockerfile → build/push to ECR → ECS cluster, task definition, service behind ALB → secrets in Secrets Manager/Parameter Store → RDS + run migrations, set `DB_*` in task env.

---

### Option C — EC2 + PM2

- **Pros:** Full control, simple if you prefer VMs.
- **Cons:** You manage OS, Node, PM2, scaling.

**Steps (summary):**  
Launch EC2 → install Node, clone repo, `npm install --production` → PM2 start app → env from Parameter Store or `.env` → Nginx in front for SSL and proxy → RDS + schema, set `DB_*` in env.

---

## 5. RDS (MySQL) setup

1. Create RDS instance: MySQL 8.x (or match local), in a private subnet if possible.
2. Security group: Allow MySQL (3306) only from app (EB/ECS/EC2) security group.
3. Create database `shareshare` (or name from `DB_NAME`).
4. Run `doc/database/api.sql` for schema (skip one-off dev queries).
5. Set `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` in app env.

---

## 6. S3 and IAM

- Reuse existing S3 bucket; set bucket policy/CORS as needed for app (and frontend if required).
- Prefer **IAM roles** for the app (EB environment, ECS task role, EC2 instance profile) over long-lived access keys.
- Required S3 permissions: `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` on the bucket/prefixes used (posts, profile, groups, images).

---

## 7. CI/CD (optional)

- **GitHub Actions:** On push to `main`, run tests, build Docker (if used), push to ECR, deploy to EB/ECS.
- **AWS CodePipeline:** Source from GitHub, build with CodeBuild (`npm ci && npm test`), deploy to EB or ECS.

---

## 8. Pre-deployment checklist

- [ ] DB connection uses env vars (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).
- [ ] CORS uses env for production origin(s).
- [ ] No hardcoded secrets; use env or Secrets Manager/Parameter Store.
- [ ] `NODE_ENV=production` and `PORT` set in production.
- [ ] RDS created and schema applied; app env points to RDS.
- [ ] S3 bucket accessible by app (IAM role or env credentials).
- [ ] Health check endpoint (e.g. `GET /` or `GET /hiya`) for ALB/EB.

---

## 9. Quick start (Elastic Beanstalk)

1. Apply required code changes (DB env, CORS).
2. Install EB CLI; run `eb init` and `eb create`.
3. Create RDS MySQL, run `doc/database/api.sql`, add `DB_*` and other vars to EB configuration.
4. Deploy with `eb deploy`.
5. Set `CORS_ORIGIN` to your frontend URL and test.
