# Wishlist API — Beanstalk deploy

Here’s where we stand, based on what you’ve confirmed.

**Done**

- [x] RDS created; `shareshare` database and tables still need confirmation.
- [x] Database and token secrets created.
- [x] Beanstalk configured to read those secrets.
- [x] Beanstalk role granted secret access.
- [x] S3 bucket `kite-us-west-two` created.
- [x] Beanstalk role granted S3 upload/read access.
- [x] API code updated locally for environment variables and IAM credentials.

**Before deployment**

- [ ] Confirm Beanstalk has these **plain-text settings**:

  | Variable | Value |
  |---|---|
  | `DB_HOST` | Your RDS endpoint |
  | `DB_USER` | `admin` |
  | `DB_NAME` | `shareshare` |
  | `APP_LOCATION` | `local` |
  | `FILE_LOCATION` | `aws` |
  | `AWS_BUCKET_NAME` | `kite-us-west-two` |
  | `AWS_BUCKET_REGION` | `us-west-2` |
  | `PROFILE` | `profile` |
  | `POSTS` | `posts` |
  | `GROUPS` | `groups` |
  | `INSTRUCTIONS_FOLDER` | `instructions` |

- [ ] Confirm `DB_PASSWORD`, `ACCESS_TOKEN_SECRET`, and `REFRESH_TOKEN_SECRET` use **Secrets Manager** as their source.
- [ ] Confirm Beanstalk has **no AWS access keys or `AWS_PROFILE`** configured.
- [ ] Confirm RDS contains `shareshare` and the required tables.
- [ ] Confirm RDS allows the Beanstalk server to connect on port **3306**.
- [ ] Confirm the API start command works and listens on `process.env.PORT`.
- [ ] Commit and push the five API configuration files to `develop`, excluding `.env`.

**Deploy and verify**

- [ ] Change CodePipeline’s source branch from `simple` to `develop`.
- [ ] Run the pipeline and confirm Beanstalk becomes healthy.
- [ ] Test an API endpoint.
- [ ] Test login and a database read.
- [ ] Upload a photo; confirm it appears in S3 and displays in the app.

**Next unfinished step: commit and push the five code changes to `develop`.**
