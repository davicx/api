# Master current

Every note in `api/doc/development/current`, copied into this file. The original notes are unchanged.

This is a reading copy. When a source note changes, update this file from that note.

## Contents

- `api_beanstalk_deploy.md` — Wishlist API — Beanstalk deploy. Done
- `feature_wishlist_new_item.md` — Wishlist — add an item from a photo. Status: Plan. Do not implement from this file until a phase is chosen.
- `feature_aws_traffic.md` — CloudPilot — Security and Traffic. Status: Plan. Do not implement from this file until a phase is chosen.
- `feature_live_aws.md` — CloudPilot — restrict live API access, restore it, and read suspicious traffic. Status: Plan. Do not implement from this file until a phase is chosen.
- `feature_useful_costs.md` — Useful Costs — a dollar amount next to a named resource. Status: Plan. Do not implement from this file until a step is chosen.
- `feature_first_useful_aws_costs.md` — First useful AWS costs — the account bill on the Costs page. Status: Plan. Do not implement from this file until a step is chosen.
- `feature_adding_services.md` — Adding Services — connect an AWS account. Status: Plan. Do not implement from this file until a step is chosen.
- `feature_history.md` — CloudPilot — Resource History. Status: Architecture locked. Do not implement from this file until a step is chosen.
- `feature_mock_aws.md` — CloudPilot — Persistent Mock AWS (Sandbox). Status: Idea only. Not ready to build.
- `feature_core_organization_ideas.md` — CloudPilot — Core Organization Ideas. Status: Ideas only. Not ready to change the product.


---

# Source: `api_beanstalk_deploy.md`

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



---

# Source: `feature_wishlist_new_item.md`

# Wishlist — add an item from a photo

## What this is

A person picks a screenshot or photo of a product. Kite suggests the product name, the price shown in the picture, a real store link, and a clean product photo. The person reviews every field and then saves the item with the existing create-item call.

This is a convenience. It does not need to recognize every product. A person can still add an item by hand if any step fails.

**Status:** Plan. Do not implement from this file until a phase is chosen.  
**Codename:** `feature_wishlist_new_item`

OpenAI only identifies what is in the picture. It does not search the internet, invent product URLs, or generate photos. URL search and image search are separate functions and can be replaced later.

---

## Order

The three functions stay independent. The photo flow calls them in this order, because the image step wants a real product page first:

1. `analyzeProductImage()` — OpenAI reads the upload.
2. `findProductURLs()` — search for real product pages. Prefer the store seen in the picture.
3. `findProductImages()` — read an image from the chosen page. If that fails, search for product images.

Steps 2 and 3 are optional. If either returns nothing, the review form still opens with whatever step 1 found, plus the photo the person already chose.

A later “Find photo” button on a manually typed title can call step 3 alone. It does not need another OpenAI call.

---

## What exists today

Inspected. No code changes in this pass.

### Backend

| Piece | Today |
| --- | --- |
| Routes | `api/application/routes/itemRoutes.js`, mounted in `api/app.js` with no prefix |
| Create item | `POST /post/item` → `postItemLocal` or `postItemLocalAWS` in `api/application/logic/items.js` |
| Edit item | `POST /item/edit/` |
| Home feed | `GET /items` — newest 12 items for everyone. Do not use this for product search |
| Upload | `uploadFunctions.uploadPostPhotoLocal` in `api/application/functions/uploadFunctions.js`. Field name `postImage`. JPEG and PNG only. 40 MB. Writes a file to disk |
| Auth | `middlewares.verifyUser` in `api/application/functions/middlewareFunctions.js`. Cookie `accessToken` or `Authorization` header. `POST /post/item` does not use it today |
| Response shape | `{ data, message, success, statusCode, errors, currentUser }` |
| OpenAI | Package `openai` is already installed. Key is `OPENAI_API_KEY`. Client is `api/application/atlas/providers/openAI/client/openAIClient.js`, and it is built for CloudPilot text chat (`chat.completions`). Lab route `POST /openai/chat` is the same text path. Neither one reads an image |
| HTML | `cheerio` is already installed |
| Search | No SerpApi, no image-search client, no product-page reader |
| Tables | Item rows are created only by `POST /post/item`. This feature adds no tables |

`items.js` already owns create, edit, feed, and purchase. The three helpers do not belong inside those functions.

### iOS (Wishlist)

| Piece | Today |
| --- | --- |
| Chooser | `NewItemViewController.swift` — Paste, Photo, Manual. Photo pushes `AddItemFromPhotoViewController` |
| Photo | `AddItemFromPhotoViewController.swift` — library picker, stores `draft.localImage`, Continue goes straight to review. No network call |
| Manual | `AddItemManuallyViewController.swift` — also pushes review. Leave this path alone |
| Paste | `AddItemFromTextViewController.swift` — leave this path alone |
| Review | `ReviewItemViewController.swift` — title, price, link name, link URL, optional post text, list row, 96×96 photo, Change Photo. This is the only screen that creates the item |
| Draft | `ItemDraft.swift` — `name`, `price`, `postText`, `productURL`, `linkName`, `imageURL`, `localImage`, `storeName`, `groupID` |
| Create | `PostLogic.createItemPost` → `PostsAPI.makeItemPost` → `POST /post/item` multipart, field `postImage` |
| Picker | `UIImagePickerController` photo library. Keep it |

There is no separate “Enter manually” redesign. Review Item is the form.

---

## Product and listing

Keep these apart.

**Product** — name, brand, model or platform, image. Example: The Disney Afternoon Collection, Nintendo Switch.

**Listing** — store, product URL, and the price printed on the screenshot. Example: Target, $29.99.

The screenshot price belongs to the store in the picture. If the person picks Walmart instead, do not leave Target’s price looking like Walmart’s current price. Keep the screenshot price, and leave it labeled as the price from the photo, unless that other page’s own metadata includes a price.

`ItemDraft` already has a place for this: `name` is the product, `linkName` / `productURL` / `price` are the listing.

---

## Backend

Add the routes to `itemRoutes.js`. Put the work in a new logic file, `api/application/logic/itemProduct.js`, with three exported functions. Put the replaceable search client in `api/application/functions/productSearch.js`.

Do not add a new router. Do not call these from CloudPilot.

Each route uses `verifyUser` and the existing response envelope. A partial product is success with empty fields. A missing file, a bad type, or a provider outage is the usual error object.

Suggested paths, matching the slash style of `/item/edit/`:

```text
POST /item/product/analyze/
POST /item/product/find-url/
POST /item/product/find-image/
```

### A — Analyze the image

`analyzeProductImage(file)`

Multipart field: `image`. JPEG, PNG, or WEBP. Cap at 10 MB. Use multer memory storage. Do not use `uploadPostPhotoLocal`. That helper saves a post file and rejects WEBP.

Send the image to OpenAI with the official SDK already in `package.json`. Use a current vision model and Structured Outputs so the JSON shape is fixed. Read `OPENAI_API_KEY` on the server. Reuse `getOpenAIClient()` only for the SDK instance. Do not send this image through CloudPilot chat.

Extract only what is visible for the main product:

- title, brand, model or platform, category
- price and currency, only if a price is actually shown
- retailer, from visible branding
- description, or null
- product URL, only if a full URL is printed in the image

Rules: ignore ads and “you may also like.” Keep edition, color, size, and console in the title or model. Do not invent URLs or specs. Unknown fields are null. Do not write a caption for the person. Do not save the file to S3 and do not insert an item.

```json
{
  "data": {
    "product": {
      "title": "The Disney Afternoon Collection - Nintendo Switch",
      "brand": "Disney",
      "model": "Nintendo Switch",
      "category": "Video Games",
      "price": 29.99,
      "currency": "USD",
      "retailer": "Target",
      "description": null,
      "product_url": null
    }
  },
  "message": "",
  "success": true,
  "statusCode": 200,
  "errors": [],
  "currentUser": "davey"
}
```

The URL is null here because the screenshot does not show one.

### B — Find product URLs

`findProductURLs(product)`

JSON body: `title`, `brand`, `model`, `retailer`. No image.

Build one query from title, model, and retailer. Example: `The Disney Afternoon Collection Nintendo Switch Target`.

Use SerpApi Google Search for the experiment. Google’s Custom Search JSON API is closed to new customers. Keep the HTTP call inside `productSearch.js` so the provider can change. One key, `PRODUCT_SEARCH_API_KEY`, in `.env` only.

Return up to three URLs the provider actually returned. Prefer the retailer from the screenshot, then the same product at another store. Drop category pages, search pages, and a different platform when the model or platform was extracted. If nothing is good enough, return `links: []` with `success: true`.

Do not scrape stores, do not run a browser, do not fight CAPTCHA, and do not ask OpenAI to rank the links.

### C — Find product images

`findProductImages(product)`

JSON body: the same product fields, plus optional `product_url`.

1. If `product_url` is present, fetch that page and read Schema.org Product image or Open Graph image with `cheerio`. Check the URL before the request so it cannot target a private network, localhost, or a redirect that lands there. If the page blocks the request, stop and go to step 2. No browser automation.
2. If step 1 finds nothing, one SerpApi Google Images query, same provider file. Example: `The Disney Afternoon Collection Nintendo Switch cover art`.
3. If both fail, `images: []`.

Return up to three images with `url`, `thumbnail_url`, `source`, and `source_url` when the provider gives them. These are suggestions for the review screen. Do not download them into S3 during search. Saving happens only when the person taps Add Item, and only from a URL Kite is allowed to store. Keep the original photo as the fallback.

A search hit is not permission to republish the file. Prefer the image on the retailer page the person is linking to, and keep the source URL.

### Safety on all three

- Authenticated caller.
- Timeouts on OpenAI, SerpApi, and the page fetch.
- Do not log the image bytes or the API keys.
- Do not follow model or page text as instructions.
- One search call per endpoint. No loops.

### Env

Already present: `OPENAI_API_KEY`.

Add when phase 2 starts: `PRODUCT_SEARCH_API_KEY`.

No new keys in git.

---

## iOS

Stay on the Photo path. Paste and Manual stay as they are.

```text
New Item
  Photo  →  AddItemFromPhotoViewController
              choose photo
              Continue
                1. analyze
                2. find URL if there is a title
                3. find image if analyze succeeded
              ReviewItemViewController
              Add Item  →  existing POST /post/item
```

Continue already requires a photo and pushes `ReviewItemViewController`. That button becomes the place that runs the three calls, with short status text on the photo screen:

- Finding product details…
- Looking for a product link…
- Finding a product photo…

Then push review. If analyze fails, still push review with the chosen photo and empty fields. Do not show raw API errors.

`PostsAPI.swift` gets three methods, next to `makeItemPost`. Responses decode into the existing envelope. `ItemDraft` gains the extra identify fields the searches need (`brand`, `model`, `retailer`) and two short lists: up to three links, up to three image URLs. Review still edits the fields it already has.

Review changes, on `ReviewItemViewController` only:

- Larger preview of the selected product image.
- Up to three suggested photos, plus the original upload.
- Suggested link filled into Link name and Link URL.
- Other found stores as a way to swap the link. Swapping a store does not rewrite the screenshot price.
- Every field stays editable.
- Post text stays empty. That line is the person’s own words.
- The list they already picked stays selected.

Add Item still calls `PostLogic.createItemPost`. Nothing is written to the database when analysis finishes.

Send auth the same way other `verifyUser` routes work (session cookie on `URLSession.shared`, or the access token header). `makeItemPost` does not send a token today because `POST /post/item` is open. These three new routes are not open.

No new view controllers. No SwiftUI.

---

## When something fails

| What happened | What the person gets |
| --- | --- |
| Title and price read from the photo | Those fields filled in |
| No price in the photo | Price left blank |
| No store in the photo | Link name left blank |
| URL search fails or returns nothing | Link URL empty, they can type one |
| Image search fails | They keep or re-pick their photo |
| Wrong product | They edit the fields |
| OpenAI fails | Review opens with their photo |
| They change the title | The form keeps their edit. Do not rerun all three calls |
| They skip the suggestions | Add Item still works |

---

## Phases

Build one endpoint, then try it, before the next.

### Phase 1 — Analyze

`POST /item/product/analyze/` only. Try a Target screenshot and a game-box photo. Confirm stable JSON and nulls where the picture has no price or URL. No search yet.

### Phase 2 — URLs

`POST /item/product/find-url/` with the JSON from phase 1. SerpApi Google Search. Up to three real URLs. Return none when the match is weak, including a different console.

### Phase 3 — Images

`POST /item/product/find-image/`. Page metadata first, SerpApi Google Images second. Up to three candidates. Do not store the files.

### Phase 4 — Photo flow

Wire the three calls into Continue on `AddItemFromPhotoViewController`. Fill `ReviewItemViewController`. Save with the existing create API. Confirm Paste and Manual still open review and save with no analysis.

---

## Checks

- Retailer screenshot: title, price, and Target filled in. URL and image searches run. Review can change them.
- Box photo: product when readable, price blank, searches still allowed.
- Blurry or unrelated photo: no invented title, review still opens.
- Search provider down: extracted fields remain, URL empty.
- Image provider down: original photo remains.
- Same game, other platform: that platform is not auto-selected.
- Enter manually: unchanged.

---

## Do not build

A product catalog, purchases, price watching, generated product photos, multi-product or cart scans, a store crawler, background jobs, a second create-item API, new tables, new feed UI, or SwiftUI.

---

## Files

**Change**

- `api/application/routes/itemRoutes.js` — three routes
- `IOS/Wishlist/Kite/Kite/API/PostsAPI.swift` — three calls
- `IOS/Wishlist/Kite/Kite/App/Main/Code/ItemDraft.swift` — search fields and candidate lists
- `IOS/Wishlist/Kite/Kite/App/Main/Item/ItemActions/AddItem/AddItemFromPhotoViewController.swift` — run the calls on Continue
- `IOS/Wishlist/Kite/Kite/App/Main/Item/ItemActions/AddItem/ReviewItemViewController.swift` — image choices and link choices

**Add**

- `api/application/logic/itemProduct.js` — the three functions
- `api/application/functions/productSearch.js` — SerpApi, so it can be swapped

**Leave alone**

- `api/application/logic/items.js` create, edit, feed, purchase
- `NewItemViewController.swift`, `AddItemManuallyViewController.swift`, `AddItemFromTextViewController.swift`
- `PostLogic.createItemPost`
- CloudPilot OpenAI chat

**Library**

SerpApi is the one new provider, added in phase 2, for both Google results and Google Images. `openai` and `cheerio` are already dependencies. No Custom Search JSON API.



---

# Source: `feature_aws_traffic.md`

# CloudPilot — Security and Traffic

## What this is

CloudPilot can answer whether an application is exposed, who has been reaching it, and what a careful next restriction would be. The person asks in the existing chat. Results land in the existing Findings flow. A change uses the existing preview, confirmation, and history.

**Status:** Plan. Do not implement from this file until a phase is chosen.  
**Codename:** `feature_aws_traffic`  
**Related:** [Live AWS access](feature_live_aws.md) (the written restrict-and-restore procedure, and uploaded Nginx logs) · [Useful Costs](feature_useful_costs.md) · [First useful AWS costs](feature_first_useful_aws_costs.md) · [Resource History](feature_history.md)

Navigation stays as it is. Chat is where a person asks and decides. The dashboard is where they look at what CloudPilot already found. This plan does not add a security chat, a security product, or a new remediation framework.

```text
Chat
  → Understand
  → Investigate with the capability that fits
  → Show the evidence in chat and in Findings
  → Take action only after a preview and a confirmation
  → Record it in history
```

CloudPilot chooses the AWS calls. The person does not have to know whether the answer lives in EC2, S3, a load balancer, WAF, or a log.

---

## Three intentions, one chat

| The person says | CloudPilot does |
| --- | --- |
| “What is AWS WAF?” | Explain it. Do not scan. |
| “Do I have AWS WAF enabled?” | Inspect the resources that can have a web ACL. |
| “Enable AWS WAF for my application.” | Inspect the setup, explain cost and consequences, preview the change, and wait for confirmation. |

A scan and a question stay different. Asking what a service is does not start a scan. Asking to change infrastructure does not apply the change in the same turn as the explanation.

---

## Four capabilities

Build them in order. Each one can ship alone.

| Capability | Question | Phase |
| --- | --- | --- |
| Security inspection | Is this infrastructure exposed, and what protection is already configured? | 1 |
| Traffic monitoring | Who reached the application, using logs that actually exist? | 2 |
| Threat explanation | Which of those requests look like scanning or abuse? | 2 |
| Protection | What is the smallest change that matches how this app is meant to be used? | 3 |

Threat explanation rides on traffic monitoring. It does not get its own scanner. A request for a missing path is evidence. It is not, by itself, proof of a successful break-in.

Cost protection stays in the cost plans. This plan can later point at a missing rate limit or a public write as a way an AWS bill grows. It does not read Cost Explorer and it does not create a budget.

---

## Feeling we want

> I’m developing an app. Only I should be able to reach it.

> I’m inviting a few friends. Keep everyone else out.

> I’m seeing a lot of requests. Is something wrong?

CloudPilot names the resource, the port or path, and the evidence. Then it offers a review. It recommends the least expensive protection that fits the current use. A private development API does not get a load balancer and WAF added as the default answer.

---

## What exists today

| Piece | Today |
| --- | --- |
| EC2 scan | `atlas/app/core/cloud/ec2/scanner.py`. Rules include `ec2_public_ip_attached`, stopped instance, low CPU, legacy type, missing name |
| S3 scan | `atlas/app/core/cloud/s3/scanner.py`. Rules include public access block, public ACL, public bucket policy, encryption, versioning, access logging, lifecycle, missing name |
| Findings | One `Finding` model and `rule_registry.py`. Chat and the dashboard already consume scan results |
| Remediation | Existing confirm-then-apply path. EC2 pause/resume and S3 versioning are examples. No security-group writer yet |
| Kite’s API | Single-instance Beanstalk in `us-west-2`. Nginx in front of Node. No load balancer, so WAF has nothing to attach to. Inbound HTTP on port 80 from the whole internet was the last inspected rule. Saving a “My IP” replacement was not confirmed |
| Logs already seen | Nginx access logs contained automated probes (`/etc/passwd`, WordPress paths, and similar). Those lines are evidence for Phase 2. They are not a traffic product yet |
| `feature_live_aws` | Written procedure for restricting that single-instance environment to one public IPv4, restoring the previous rule, then reading an uploaded Nginx log. Still a plan |

There is no rule yet for security-group ports, SSH on port 22, a load balancer, WAF, VPC flow logs, or application rate limiting.

---

## Phase 1 — Security exposure

Read-only. Extend the existing EC2 and S3 scans. Put new results in Findings. Explain them in the current chat. No new page.

### EC2 and the network in front of it

For each instance in the selected account and region:

- Does it have a public IPv4 address? `ec2_public_ip_attached` already answers this for running instances.
- Which security groups are attached?
- Is port 80 open to `0.0.0.0/0` or `::/0`?
- Is port 443 open to the whole internet?
- Is port 22 open to the whole internet?
- Is the instance registered behind a load balancer?
- Can the instance still be reached directly, past that load balancer?
- Is a WAF web ACL attached to that load balancer or to a CloudFront distribution in front of it?

A direct path to the instance matters more than the mere presence of a load balancer. If the instance security group still accepts application traffic from the whole internet, the load balancer is not the only door.

### S3

The current public-access, public-policy, public-ACL, encryption, versioning, and access-logging rules stay. Phase 1 adds a judgment the rules do not make yet:

- A public read can be intentional, for example images meant for a website.
- Anonymous upload, overwrite, or delete is the finding to treat as urgent.
- Say what the bucket allows. Leave the purpose to the person when CloudPilot cannot tell.

Kite’s image bucket is private and objects are read with signed URLs. A finding that says “this bucket is private” is a result, not a problem to fix.

### Logging availability

Record whether these exist. Do not turn them on in this phase.

- Nginx or application logs already retained for the environment
- Load balancer access logs
- VPC flow logs
- WAF metrics, only when a web ACL exists

If a source is missing, the finding says the traffic question cannot be answered yet. It does not invent counts.

### What Phase 1 can say

> Your EC2 instance is publicly reachable on port 80.
>
> I found two things to review.
>
> The S3 bucket blocks public access.
>
> There is no load balancer, so AWS WAF is not in front of this API.

The person can open the finding and ask for help. Phase 1 stops at the explanation.

### Proposed finding ids

Use the existing Finding shape. Add a rule only when the scan can observe it.

| Id | When it is raised |
| --- | --- |
| `ec2_public_http` | Port 80 open to the whole internet |
| `ec2_public_https` | Port 443 open to the whole internet |
| `ec2_public_ssh` | Port 22 open to the whole internet |
| `ec2_direct_access_beside_load_balancer` | Instance accepts application traffic from a source other than its load balancer |
| `s3_public_write_access` | Anonymous upload, overwrite, or delete |
| `alb_missing_waf` | A load balancer exists and has no web ACL |
| `alb_access_logging_disabled` | A load balancer exists and is not writing access logs |
| `traffic_logging_unavailable` | None of the log sources above are available |

`ec2_public_ip_attached`, `s3_public_access_block_disabled`, `s3_bucket_policy_public`, `s3_public_acl`, `s3_default_encryption_off`, `s3_versioning_disabled`, and `s3_access_logging_disabled` already exist. Do not mint a second id for the same fact.

Do not add `api_rate_limiting_disabled`. Express rate limiting is invisible to these AWS calls. If it matters later, the status is **unknown**.

---

## Phase 2 — Traffic visibility

Answer “who reached the API?” from logs that are already there. For the current Beanstalk app, start with Nginx access logs. `feature_live_aws` Phase 2 is the first version of this: a log the person provides, summarized, with no invented rows.

A summary may include:

- Time window
- Request count
- Unique client addresses
- Response codes
- Paths requested most often
- Requests for paths the application does not have

Show a count only when the log contains it. If the log is missing, say **Not monitored**.

CloudWatch, load balancer access logs, and VPC flow logs can be added after that, and only when they are already enabled. Flow logs can show a connection. They cannot name an Express route. Load balancer logs can name a path, a status, and a client address. Application and Nginx logs are the source that matches this API today.

Suspicious means a repeated pattern such as many requests for sensitive paths that this app does not serve. Say that the pattern matches automated scanning. Do not claim a breach from a 404.

Illustrative numbers in chat examples are documentation. Live replies use the log in hand.

A Traffic page waits until a real summary exists. Until then, the answer stays in chat and the relevant finding stays on the Findings page.

---

## Phase 3 — Protection

One remediation at a time. Each one previews the exact change, asks for confirmation, checks the result, and keeps a way back when that is possible.

The first action is already specified in `feature_live_aws`: restrict inbound HTTP on one single-instance Beanstalk environment to an approved public IPv4 `/32`, and restore the rule that was live immediately before that change. Discover the security group from the environment. Do not hardcode an id. Refuse a change that would drop the person’s only path in without saying so, including a phone that leaves the current network.

Later actions, each its own step:

- Add another approved address, with the same preview
- Enable a log source the person chose
- Attach WAF only after a supported entry point exists and the person accepts the cost
- A temporary WAF IP block, only on that supported entry point, confirmed, and easy to remove
- Application rate limiting inside Express, described separately from WAF, because requests still reach Node before Express rejects them

Security groups do not know who is logged in. For a few friends on changing mobile networks, say that an allowlist is brittle and that an account login is the more stable door. Offer the allowlist when the person still wants it.

Do not create a load balancer or a web ACL as part of making this plan true. Recommend them when the app is meant to be public and the person asks about that step.

---

## Examples

**“How secure is my EC2 instance?”**  
Inspect the instance, its security groups, whether a load balancer sits in front, and whether anything else can bypass that load balancer. Name the open ports. Link the findings. Do not change anything.

**“Are bots hitting my API?”**  
Read the available logs. If they show repeated requests for paths the app does not have, say that. Offer the traffic summary. If logs are missing, say traffic cannot be judged.

**“Should I block this address?”**  
Explain the requests from that address and the option that fits the current entry point. On today’s single-instance API, a WAF block is not available. A security-group change is the option that exists, and it still needs a preview.

**“I only want myself and three friends in.”**  
Inspect the current door. For this Beanstalk environment, describe an address allowlist and its limit when people change networks. Guide the first address through the `feature_live_aws` confirmation. Do not open a new port to make the change.

---

## Decisions

- Keep the current navigation. Chat understands the request. Findings holds the evidence. The existing fix flow applies a change.
- Phase 1 is the next build. It is read-only.
- `feature_live_aws` remains the procedure for the IP change and for an uploaded Nginx log. This plan sets the order: inspect first, then read traffic, then change access.
- A public S3 read is not automatically a defect. Anonymous write is.
- Missing logs produce “not monitored,” not a guessed bot count.
- A private development app is recommended an allowlist and login before WAF.
- History records a protection change the same way it records any other confirmed action. This plan does not design a second undo system.

---

## Done when

Phase 1:

- A scan can explain, for one instance, public address, open world-wide ports, security groups, any load balancer, and whether direct access bypasses that load balancer.
- The same scan can explain S3 public read versus anonymous write, plus whether logging and WAF are present.
- New observations use the finding ids in this plan and the ones that already exist.
- Chat can answer “is this exposed?” from those findings without a new page.

Phase 2:

- An available Nginx log produces a summary with real counts and a clear window.
- A missing log is reported as not monitored.
- Scanner-style paths are described as automated probing.

Phase 3:

- The first confirmed action is the restrict-and-restore flow in `feature_live_aws`.
- The preview names the environment, the port, and the address.
- Restore puts back the rule from immediately before the change.



---

# Source: `feature_live_aws.md`

# CloudPilot — restrict live API access, restore it, and read suspicious traffic

## What this is

CloudPilot can restrict a single-instance Elastic Beanstalk API so only one public IPv4 address can reach it, then put the previous access rules back. A later step can read an Nginx access log and explain whether the traffic looks like probing.

**Status:** Plan. Do not implement from this file until a phase is chosen.  
**Codename:** `feature_live_aws`

Build this into CloudPilot’s existing chat flow, confirmation, execution modes, and action history. Inspect the repository first. Reuse existing components and AWS helpers. Do not assume the file names, tool names, or routes in this plan already exist.

User message → understand → handle → prepare reply → reply.

Prefer extending existing action types and handlers. Do not add a second execution framework, and do not redesign routing, chat UI, or execution architecture.

---

## What we found

The Node/Express API is deployed through Elastic Beanstalk in `us-west-2`. The environment type is **Single instance**. Nginx receives web requests and forwards them to Node on one EC2 instance.

The logs showed automated requests probing paths the API does not have: `/../../etc/passwd`, WordPress plugin paths, Windows files, and other unrelated endpoints.

| Result | What the logs showed |
| --- | --- |
| `400` | Malformed requests such as `/../../etc/passwd` were rejected. |
| `404` | The scanner tried paths the server could not find. |
| `200` with a 5-byte body | Requests to `/` returned the normal `hiya!` greeting. Timestamps lined up with the app logs. |
| Login `200` | A Postman login succeeded. The app logged password validation and token creation. |
| `498` on `/friends/...` | The app rejected a request with no valid access token. That code needs the app’s own meaning. Do not treat it as proof of compromise. |

Those file-access attempts showed no successful file retrieval. A `200` on `/` is the greeting, not evidence that an attack worked.

Separate from this feature: the app prints complete access and refresh tokens in its logs. Removing those values and revoking the exposed refresh token stays its own task.

Beanstalk’s pause feature applies to load-balanced environments. This environment is single instance, so pause is not available.

## What was prepared, and not confirmed

The instance security group `sg-0c7582f2ebd729410` had one inbound rule: HTTP, TCP, port 80, source `0.0.0.0/0`.

The intended change was to replace that source with the current public IPv4 address as `/32`, using **Edit inbound rules → My IP**. Saving that rule was not confirmed, and it was not tested.

Once saved, HTTP is limited to that public address. Outbound rules stay as they are, so the API can still reach the database. The rule restricts a network address. Other devices on that address can connect. Changing networks means updating the rule.

CloudPilot must discover the live configuration. Do not hardcode that security group, instance, account, or rule ID.

---

## Order

1. **Phase 1 — Restrict and restore.** Single-instance Beanstalk only. This ships first.
2. **Phase 2 — Uploaded access-log analysis.** An Nginx log the person provides. Offer the Phase 1 action when it fits.
3. **Phase 3 — Automatic log retrieval.** CloudWatch, only if logs are already streaming. Do not block Phase 1 on this.

Do not add a load balancer or a web application firewall to implement Phase 1.

---

## What the person can ask

| Request | CloudPilot behavior |
| --- | --- |
| “Only allow my IP to access my API” | Find the environment and its security groups, detect the public IP, ask which address to use, preview the exact changes, ask for confirmation, then apply them. |
| “Put access back to normal” / “Restore access to my API” | Restore the rules CloudPilot saved before the restriction. |
| “Undo that” | Reverse the most recent access change from its recorded history. |

“Back to normal” means restore the rule that was in place immediately before CloudPilot’s change. These phrases are not permission to open arbitrary ports to everyone.

A confirmation for this environment could read:

> Restrict HTTP access to your API to your current public IP? Other networks, including your phone on cellular, will lose access. Your server will keep running and billing will continue.

Use the real environment name, region, and address in the live preview. Example shape:

> Restrict HTTP access to `api-dev` in `us-west-2` to your current public IP, `203.0.113.25/32`?
>
> This replaces public HTTP access in one security group. Devices on other networks, including your phone on cellular, will lose access. The server will keep running and billing will continue.
>
> You can restore the previous access settings afterward.

The address above is documentation only.

When the saved state includes public access, say so:

> Restore the previous HTTP rule allowing access from all IPv4 addresses?

If the live rule already matches the chosen IP, say “Already configured.” Do not change AWS, and do not write an Undo entry.

If there is no saved restore record, say the original state is unavailable. Do not invent it. A request to make access public is a separate preview and confirmation.

---

## Phase 1 — Restrict and restore

### Inspect before coding

Find and write down, in the implementation notes, the real pieces:

- Chat intent routing
- AWS account and region selection
- Resource selection and ambiguity handling
- Existing Python AWS tools
- Node API orchestration
- Confirmation handling
- Instructions, CLI, PR, and Automatic modes
- Test and live execution
- Action history and Undo
- Persistent storage
- Account permission configuration
- Logging and error conventions

Name the actual files to change, and anything that is missing, before writing the feature.

### Steps for “only my IP”

1. Resolve the AWS account and region.
2. Resolve the Beanstalk environment. If more than one is plausible, show the names and ask. Never pick the first one silently.
3. Inspect the environment, its type and status, and the EC2 instance, including instance state.
4. Inspect every security group attached to that instance. Their permissions combine. A tight rule does nothing if another attached group still allows the public internet. Where practical, also read the instance network interfaces so the path is complete.
5. Find inbound rules that allow the API’s web ports.
6. Detect the public IPv4 address, then ask which address to use.
7. Prepare a specific change plan.
8. Show the preview and ask for confirmation.
9. Execute only the confirmed plan.
10. Read the rules back and compare them with the plan.
11. Record the result and offer Undo.

Verify that resource IDs belong to the selected account and region.

### The person’s public IP

Phase 1 detects the public IPv4 address with an outbound request to `https://checkip.amazonaws.com`. CloudPilot can do this while it is running on a local machine. It does not need to be publicly hosted. AWS documents this lookup for security-group work.

Then ask: “What IP do you want for yours?” Show the detected address as the default. The person can keep it or type a different one. Manual entry is the fallback when detection fails, or when a VPN returns the wrong address.

The address must be a valid public IPv4 address. Reject private, loopback, link-local, unspecified, and malformed addresses. Store it as `/32`. Show the chosen address in the confirmation before any rule is applied.

If CloudPilot later runs in AWS, that same lookup returns CloudPilot’s server address, not the person’s. User IP detection needs a different approach then. Do not use the backend’s own address as “my IP” in that deployment.

Tell the person:

- “My IP” restricts a public network address.
- Other devices on that address can connect.
- A VPN can change the observed address.
- Switching networks can require an update.

Never change AWS rules just because the detected IP changed.

### Which environments this can change

Phase 1 supports direct public access on a **single-instance** Beanstalk environment.

If the environment is load balanced, or CloudFront or another proxy sits in front:

- Explain that the access path is different.
- Do not apply the single-instance change.
- Do not restrict the instance to the person’s IP when the legitimate source is a load balancer.
- Return the topology that was found.

If a security group is shared with other resources, do not change it automatically. Say which resources would be affected. Do not change unrelated workloads, and do not create replacement infrastructure.

### The access policy

The action means: restrict direct inbound access to this API’s web ports to the selected public IPv4 address.

For the first version, that is HTTP 80 and HTTPS 443 when those ports exist.

Look at every attached group. Rules that matter include exact TCP ports, ranges that contain 80 or 443, all-protocol rules, IPv4 ranges, IPv6 ranges, security-group references, and prefix-list sources.

The first version may automatically change exact web-port rules whose sources are IPv4 or IPv6 CIDRs. To say that only the selected address is allowed, the plan has to account for every other source that still permits those ports, not only `0.0.0.0/0`. Show every source that will be removed or replaced.

If a rule uses a broad port range, all protocols, a prefix list, or a security-group reference:

- Do not delete it blindly.
- Do not claim the API is limited to one IP.
- Explain the conflicting rule.
- Mark automatic execution unsupported until a plan can keep unrelated access intact.

Do not change outbound rules, RDS rules, SSH, IAM roles, or unrelated ports.

If another public application port is open, such as 5000, say that it can bypass the HTTP restriction. Do not claim the API is locked down while that port is still reachable. Either include that port in the reviewed scope, or stop and explain what to do.

### What to save before any change

Save a restore record before the first AWS mutation. Use the project’s existing persistent action storage. Do not keep rollback data only in process memory or in the browser.

Record:

- Action and plan IDs
- User and project ownership
- Account and region
- Environment ID and name
- Instance identity
- Security-group IDs
- Target ports
- Detected or entered IP
- Timestamp
- Original affected rules, including source types, descriptions, and rule IDs
- Planned changes
- Changes that actually completed
- New rule IDs
- Status and failure details

Keep the meaning of each rule. Restoring a deleted rule may produce a new AWS rule ID.

Discovery, previews, restore records, and execution are scoped to the user. One user must not run or restore another user’s plan by guessing an ID.

### Confirmation

Confirmation authorizes one immutable plan.

Before execution:

1. Check that the plan belongs to the requester.
2. Check account, region, environment, and IP.
3. Read the AWS configuration again.
4. Compare it with the preview.

If the rules, attachments, or target IP changed, throw out the old plan, build a new preview, and ask again.

Make confirmation idempotent so a repeated click does not apply the change twice. Serialize competing access changes for the same environment or the same security groups.

“Previous” is the live rule immediately before this change. Save that rule before applying anything. A later change saves whatever is live at that moment, which may be an earlier `/32` rather than the first public rule.

### Applying the change

Security-group updates are not one transaction. Do them in this order:

1. Persist the restore snapshot.
2. Add the selected-IP rule where it is needed.
3. Remove the other reviewed web-access sources.
4. Read the rules again.
5. Compare effective permissions with the planned state.

Track each step that succeeded.

If a step fails:

- Say what changed and what did not.
- Roll back the recorded steps where that is safe.
- Do not undo unrelated changes made at the same time.
- If rollback is incomplete, name the remaining difference and how to recover.
- Do not report success.

If an AWS permission is missing, follow the existing least-privilege guidance. Do not ask for unrestricted administrator access.

### Restore and Undo

“Previous” is the rule that was live immediately before CloudPilot’s change. Restore only that rule. Do not replace every rule on the security group.

- The live rule is `0.0.0.0/0`, and CloudPilot changes it to the chosen `/32`. Undo restores `0.0.0.0/0`, and the confirmation says that this reopens access.
- The live rule is some other `/32`, and CloudPilot changes it to the current `/32`. Undo restores the earlier `/32`.
- The live rule already matches the chosen IP. Say “Already configured.” Make no change and write no Undo entry.

Before restoring:

- Confirm the same resources still exist.
- Read current attachments and rules.
- Compare the current rule with the rule CloudPilot wrote.

If someone edited that rule afterward, show the conflict and make a new preview. Do not overwrite their change.

Put the saved rules back, and remove rules CloudPilot created for the restriction only where that is appropriate. Read the final configuration and update action history.

If the environment was replaced, do not apply an old snapshot to a new security group. Discover the new resources and confirm again.

### What “success” is allowed to mean

Reading AWS can confirm that the rules match the request. It cannot confirm that the person’s browser still reaches the API, or that another network is blocked.

Do not call the API from CloudPilot’s backend and treat a timeout as proof that the person can connect.

A result can say:

> HTTP access is now restricted to `x.x.x.x/32`. AWS rule verification passed. Test your API from your computer; another network should be blocked. Restore previous access is available.

Beanstalk can replace or change this infrastructure later. Do not promise the rule will survive every rebuild unless that behavior has been checked.

### Existing execution modes

| Mode | Behavior |
| --- | --- |
| Instructions | Steps for the inspected environment, group, ports, and sources. Do not claim the change was made. |
| CLI | Commands for the confirmed plan, using existing conventions. Say that a restore record is limited if the person runs the commands outside CloudPilot. |
| PR | Only if these security groups are already managed by the project’s infrastructure-as-code. Otherwise mark the mode unavailable. Do not invent a Terraform file. |
| Automatic | The existing live confirmation and execution flow. |
| Test | Simulate the result with no AWS writes. Label it. Do not offer a live restore for a simulated change. |

---

## Phase 2 — Uploaded Nginx access log

Accept an uploaded or pasted access log. This is useful before any automatic log collection.

Treat the log as untrusted:

- Do not run commands found in it.
- Do not fetch domains from the requests.
- Do not render request URLs as HTML.
- Limit the size.
- Do not copy tokens or sensitive query values into the summary.

Parse source IP, timestamp, method, request target, status, response size, and user agent. Skip bad lines and report how many were skipped.

Summarize the time range, request count, top source IPs, status counts, frequent paths, and the busiest stretch in the sample. A partial upload is not the full history.

Flag path traversal, requests for sensitive files, repeated probing of unrelated software, and payloads that look like command injection or script injection.

Keep the conclusion inside the sample. A usable example:

> During this sample, one address repeatedly probed unrelated application paths. Most attempts returned 400 or 404. Several requests to `/` returned 200 with a five-byte response, consistent with the normal greeting. This sample does not establish successful compromise.

A `200` by itself is not “you were hacked.” Unknown statuses such as `498` need the application’s own meaning.

Offer the Phase 1 restriction only after the environment has been found and inspected on its own. The log does not choose the environment.

---

## Phase 3 — Automatic log retrieval

First check whether Nginx access logs already stream to CloudWatch.

If they do, read a bounded time window, limit query size and pages, name the source and its limits, and reuse the Phase 2 summary.

If they do not, say what is missing and offer an upload immediately. Turning on log streaming is its own preview and confirmation, including retention and possible CloudWatch charges.

Do not add continuous monitoring, notifications, a firewall, or automatic blocking in this phase unless that is asked for separately.

---

## Checks

Use the existing test style and mocked AWS calls. Do not change a live AWS environment to run tests.

- Detect the public IP from `https://checkip.amazonaws.com`, then accept a typed replacement.
- A private, loopback, or malformed address is rejected.
- Restrict public HTTP to one IPv4 address.
- Restore the original access.
- A repeated confirmation does not apply twice.
- An already-matching rule reports “Already configured” and writes no Undo entry.
- Public access through a second attached group is detected.
- IPv6 exposure is included.
- Broad rules and shared groups stop automatic execution.
- Untrusted proxy headers cannot set the authorized IP. The lookup is the outbound check-ip request, or an address the person types.
- A change after the preview invalidates confirmation.
- A partial AWS failure uses the recorded steps to recover.
- Restore respects a later manual change.
- Another user cannot use the plan ID.
- Test mode makes no AWS writes.
- Log analysis survives bad lines.
- A `200` on `/` is not reported as a compromise.

---

## Done when

Phase 1:

- A person can ask CloudPilot to restrict the API to their IP.
- It finds the right environment and access path.
- It shows the real public IP and the exact rule changes.
- It requires confirmation.
- It saves the original rules before changing anything.
- It checks every attached security group that affects the web ports.
- It applies the change and reports the result accurately.
- The person can restore the original access, with confirmation.
- Undo still works after a restart.
- Unsupported and conflicting setups get a useful explanation.

Phase 2:

- A person can provide an Nginx access log.
- The summary uses the evidence in that sample.
- Probing is distinguished from a demonstrated success.
- CloudPilot can offer the confirmed Phase 1 restriction.

---

## What to report when a phase is built

- What changed
- The files that were modified
- The AWS permissions required
- What was verified
- Supported and unsupported cases
- How to try it in the CloudPilot UI
- Any deploy or configuration step still left



---

# Source: `feature_useful_costs.md`

# Useful Costs — a dollar amount next to a named resource

## What this is

CloudPilot can already describe configuration. It cannot yet say:

```text
S3 bucket Davey is about $3/month.
EC2 is about $11/month.
```

**Status:** Plan. Do not implement from this file until a step is chosen.  
**Codename:** `feature_useful_costs`  
**Related:** [Useful Price](../finished/feature_useful_price.md) (shipped EC2 hourly estimates) · [billing.md](../future/billing.md) (`show_billing`, real AWS bill, out of this plan) · [First useful AWS costs](feature_first_useful_aws_costs.md) (account bill on the Costs page; separate from this plan)

This plan does **not** read the AWS bill. No Cost Explorer, no Price List API, no `GetCostAndUsage`. The dollar amount is our estimate: a rate we store, times a quantity we already know or can put on the scan.

---

## Feeling we want

> A person looking at the dashboard, or asking in chat, sees what a named bucket or the EC2 fleet is roughly costing — labeled as an estimate, omitted when we do not have the inputs.

---

## What already exists

| Piece | Today | Gap |
|-------|--------|-----|
| `cloud_service_pricing` | Hourly On-Demand rows for `t3.nano` and `t3.micro` in `us-west-2` | No S3 rows. No other instance types |
| `estimatePricing.js` | `hourly × 730` → monthly. Missing row → null. Speak says “about” | Only the hour unit |
| EC2 scan | `enrichEC2InstancesWithPricing` sets `estimatedMonthlyCost` | — |
| EC2 navigator table | Column `estimated_monthly_cost`, label Cost | Chat scan table only |
| Dashboard EC2 | `buildFriendlyEC2Instances` builds `costLabel` | The EC2 table does not render it. Columns are Instance, Type, State, Health, Findings |
| Dashboard S3 | Bucket, Region, Health, Findings | No cost field anywhere on a bucket |
| S3 rules | Configuration (versioning, public access, lifecycle, encryption, tags) | `estimated_monthly_savings` is null. Rules do not know size or price |
| `show_billing` | Cost Explorer, last 30 days, **by service** | “S3 $3.20” for the whole account. Not “bucket Davey”. Leave it alone |

So “EC2 is about $X/month” is mostly a display and a sum of numbers we already calculate. “Bucket Davey is about $3/month” is new, because a bucket has no size and no stored price.

---

## How a number is made

Two inputs. If either is missing, do not invent a dollar amount.

```text
estimate = quantity × stored rate
```

| Resource | Quantity | Rate | Unit in the table |
|----------|----------|------|-------------------|
| One EC2 instance | `1` if state is running | hourly On-Demand for that instance type and region | `hour` (already stored). Monthly = hourly × 730 |
| EC2 as a group | count of running instances that have a rate | same rows | sum of those monthly estimates |
| One S3 bucket | gigabytes stored | price per GB-month for that region and storage class | `gb-month` (new rows, same table) |

Language stays the same as Useful Price: **about**, **estimate**, and what the number leaves out.

```text
S3 bucket Davey is about $2.99/month
in Standard storage for us-west-2 (about 130 GB).
Requests, transfer, and other storage classes are not included.

EC2 is about $11.39/month
in compute On-Demand for 2 running instances with a stored rate.
1 instance has no stored rate and is not included.
```

Stopped instances contribute **$0 compute**. EBS, public IPv4, data transfer, and tax stay out of the sentence.

---

## EC2 — use the estimate we already have

A running `t3.micro` in `us-west-2` is already about **$7.59/month** (`0.010400 × 730`). A running `t3.nano` is about **$3.80/month**. Two of those running is about **$11.39/month**. That is the “EC2 is costing $X a month” line. It is not the AWS bill.

### Where the quantity comes from

The scan already has `instanceType`, `region`, and `state`. No new AWS call.

### Where the rate comes from

`cloud_service_pricing`, lookup already in `CloudServicePricing.findHourlyRate` / `findHourlyRatesForNames`. Unknown type or region → that instance is left out of the sum, and the sentence says how many were left out.

### Where it should show

1. Dashboard EC2 table: a Cost column from `costLabel` (already computed, not rendered).
2. Above that table: one line, the sum, for running instances only.
3. Chat can reuse `estimatedCostSpeak` on a single instance. A fleet sentence is the new bit.

Do not add instance types in this step unless a scan we care about is not nano/micro. Missing rate stays blank.

---

## S3 — size times a stored GB price

S3 is not “one bucket, one price.” The bill is storage class × gigabytes, plus requests, plus data transfer, plus extra copies from versioning. This feature only estimates **one storage class in one region**.

### Worked example

Public S3 Standard price in `us-west-2` has long been **$0.023 per GB-month** for the first 50 TB. Re-check that figure before seeding. Do not treat it as live.

```text
Davey holds about 130 GB
rate = 0.023 USD per GB-month
monthly = 130 × 0.023 = 2.99
```

That is the “about $3/month” sentence. It is storage only.

### Where the rate comes from

Same table. New kind of row. Do not store the monthly total.

```text
aws | s3 | us-west-2 | storage | standard | 0.023000 | gb-month | on_demand | n/a
```

`operating_system` is `NOT NULL` today (default `linux`) because of the EC2 unique key. An S3 row can use a non-Linux placeholder such as `n/a` so it does not pretend to be Linux compute. Lookup for S3 must pass that value. Do not change the EC2 unique key in this feature.

`estimatePricing.js` needs a second helper. Do not run `× 730` on a GB-month price.

```text
monthly = gigabytes × price     (unit = gb-month)
```

Missing region or missing `standard` row → omit the cost. Same rule as an unknown instance type.

### Where the gigabytes come from

The S3 scan does not collect size today. Buckets are name, region, and configuration findings. Until `sizeGb` is on the bucket, the dashboard shows no S3 dollar amount.

Size is usage, not a cost API. Two ways to get it, in order:

1. **Mock / sandbox first.** Put `size_gb` on the fake bucket (Davey = 130). Proves the sentence and the column with no AWS.
2. **Later, a scan field from CloudWatch.** `BucketSizeBytes` for that bucket, `StorageType = StandardStorage`, latest daily point, bytes ÷ `1024³` → `sizeGb`. That metric is published by AWS once a day and is not the bill. It is the right quantity if we want a real bucket. List-every-object is the wrong way (slow, request-priced, easy to miss versions).

Versioning makes this honest only if the byte metric includes the bytes we mean. `StandardStorage` is current Standard objects, not Glacier and not a full request bill. The sentence says “Standard storage,” not “this bucket’s AWS bill.”

### Where it should show

1. Dashboard S3 table: Cost column. Blank when `sizeGb` or the rate is missing.
2. Bucket detail: “about 130 GB · about $2.99/month Standard storage.”
3. Chat, when someone asks what a named bucket costs: same sentence, or a short refusal if size or rate is missing.

---

## What we will not say

| Tempting sentence | Why not |
|-------------------|---------|
| “Davey accounts for $3 of the S3 bill” | We are not reading the bill, and one bucket is not a share of Cost Explorer’s S3 total |
| “EC2 costs $5 this month” with no “about” | The number is a list price × hours, not UnblendedCost |
| A dollar amount when the rate or size is missing | Useful Price already forbids inventing prices |
| Savings from lifecycle / versioning rules | Those rules still have null `estimated_monthly_savings`. A cost column does not make them savings findings |

`show_billing` can still say “S3 was $3.20 over the last 30 days” for the account. That number and these estimates are allowed to disagree. Do not merge them into one “total.”

---

## Locked decisions

| Topic | Decision |
|-------|----------|
| Source of dollars | Stored `cloud_service_pricing` only |
| AWS bill | Out. Do not call Cost Explorer for this feature |
| Price List API | Out. Curated rows, same as Useful Price |
| EC2 quantity | Running instance = 1. Stopped = $0 compute. Sum the ones with a rate |
| EC2 display | Show the cost we already attach. Add a fleet sum |
| S3 quantity | `sizeGb` on the bucket. No size → no price |
| S3 rate | `unit = gb-month`, resource `standard`, one region to start (`us-west-2`) |
| S3 math | `gigabytes × price`. Not × 730 |
| First S3 proof | Mock `size_gb`, not a new live CloudWatch call |
| Honesty | “about” / estimate. Name what is excluded |
| Unknown input | Omit that resource. Say how many were omitted when summing |

---

## Steps

### Step 1 — Show EC2 estimates that already exist

- Dashboard EC2 table renders `costLabel`.
- Header line sums `estimatedMonthlyCost` for `running` instances.
- Instances with no rate are counted in the “not included” clause, not given $0 as if we priced them.
- No new seed rows required for nano/micro in `us-west-2`.

### Step 2 — S3 rate + GB math

- Seed one `gb-month` row after re-checking the public Standard price.
- `estimateFromGigabyteMonth` next to `estimateFromHourly`.
- Unit other than `hour` must not go through the × 730 path.

### Step 3 — Size on the bucket, mock first

- Scan bucket object gains optional `sizeGb`.
- Mock AWS bucket can carry it (Davey = 130 → about $2.99).
- Live scan leaves it unset until a later CloudWatch step. Unset → blank cost, not zero.

### Step 4 — S3 column + named sentence

- Dashboard S3 Cost column and bucket detail line.
- Chat sentence for a named bucket when both inputs exist.

### Step 5 — Acceptance

| Check | Expected |
|-------|----------|
| Running `t3.micro` us-west-2 | About $7.59/month on the dashboard |
| Stopped instance | $0 compute, not the full monthly rate |
| Unknown instance type | Blank cost, excluded from the EC2 sum, mentioned as not included |
| Davey 130 GB + Standard row | About $2.99/month |
| Bucket with no size | No dollar amount |
| No Cost Explorer call | This feature does not use `getBillingSummary` |
| Wording | Estimate, and storage-only or compute-only |

---

## Costs page — checklist to make the mock real

The design mock is `kite/atlas/src/pages/design/CostsPage.js` (“Your AWS costs”). Every number on it is hardcoded. Replacing the JSX with an API call is the small part. Each block below is real only when its data exists. Blank is better than a copied mock number.

Steps 1–4 above fill the **resource “this month”** column for EC2 (known rates) and S3 (known size). They do not fill month-to-month history. Service totals and the chart are a later billing read. Do not merge that bill with these estimates into one unlabeled total.

| Done when | Block on the page | What “real” means |
|-----------|-------------------|-------------------|
| [ ] | Page is not the design mock | `/costs` reads an API. No `$42.18` left in the component |
| [ ] | Current month | One account total for a named month, from Cost Explorer. Today’s `show_billing` is the last 30 days by service, not “September 2026” |
| [ ] | ↑ or ↓ from last month | The same total for the previous month. Needs two periods, not one |
| [ ] | Projected month | Labeled as a pace guess (month so far, extended) or left off. Not a fake forecast |
| [ ] | Potential savings | Sum only where a finding already has `estimated_monthly_savings`. EC2 low CPU can. S3 rules are null, so they add nothing. “2 opportunities” only if two such findings exist |
| [ ] | Cost over time | Daily or monthly points kept from Cost Explorer (the billing call already asks for daily groups, then throws the days away). 30 days, 6 months, and 1 year are three ranges of that series |
| [ ] | Cost by service | EC2, S3, and whatever else Cost Explorer returns (Data Transfer, Other). Map AWS service names. This is account spend, not the sum of the resource estimates |
| [ ] | Insight: instance barely used | A real low-CPU finding for that instance, with a link to it. No insight if the scan has none |
| [ ] | Insight: S3 went up because of one bucket | Off until a bucket has two months of its own number. Do not say `wishlist-images` “accounts for” an increase from the service total alone |
| [ ] | Resources table, this month | One row per instance or bucket we can price. EC2: stored rate × 730 when the type is known. S3: `sizeGb` × GB-month rate. Unknown → no row, or a row with no dollar amount |
| [ ] | Resources table, last month and change | A second stored or billed number for that same resource. Estimates have no last month. Leave those cells blank until then |

Order that matches the difficulty:

1. Wire the page and show **cost by service** plus a **current total** from the billing summary that already exists.
2. Keep the daily series so **last month**, the **change**, and the **chart** are the same source.
3. Show **this month** on named EC2 and S3 rows from Steps 1–4. Savings insight only from findings that already carry a savings figure.
4. Last month and percent change **per resource**, and the “this bucket caused the increase” insight, wait until that per-resource history exists.

---

## Out of scope

- Steps 1–4 calling Cost Explorer. The Costs page checklist uses it later for account totals, the chart, and month-to-month service spend. Those totals stay labeled as the bill, separate from the rate × quantity estimates
- CUR, cost allocation tags, and claiming one bucket’s share of the S3 bill
- AWS Price List sync
- Requests, data transfer, Glacier, Intelligent-Tiering, replication
- EBS, Elastic IP, tax
- Turning configuration findings into savings dollars
- A unified AWS + OpenAI spend cap



---

# Source: `feature_first_useful_aws_costs.md`

# First useful AWS costs — the account bill on the Costs page

## What this is

Chat can already ask AWS what the account spent. The Costs page still shows a design mock (`$42.18`, a projected month, potential savings, and named resources such as `cloudpilot-demo`).

This feature puts the same Cost Explorer report in both places:

1. Chat, through the existing `show_billing` capability.
2. The Costs page, through an authenticated read of that same report.

**Status:** Plan. Do not implement from this file until a step is chosen.  
**Codename:** `feature_first_useful_aws_costs`  
**Related:** [Useful Costs](feature_useful_costs.md) (estimates next to a named bucket or instance; leave that plan alone) · [billing.md](../future/billing.md)

The number is historical **UnblendedCost** from AWS Cost Explorer. It is account-level actual spending for the billing view the current Atlas credentials can see. It is not a price-list estimate, and AWS may still revise recent days.

---

## Feeling we want

> A person opens Costs, or asks in chat, and sees what AWS charged over the last 30 complete days: one total, each day, and each service. The page says these are account charges, not the cost of one environment or one database.

---

## What already exists

| Piece | Today | What this feature changes |
|-------|--------|---------------------------|
| `atlas/app/core/cloud/billing/get_spend_by_service.py` | `GetCostAndUsage`, daily, `UnblendedCost`, grouped by `SERVICE` | Keep that query. Add paging, daily rows, UTC dates, and unrounded totals |
| `atlas/app/api/services/billing_service.py` | `run_billing_summary`; accepts `period_days` from 1 to 365 | This report always uses 30 complete UTC days |
| `atlas/app/api/routes/billing_route.py` | `POST /billing/summary` | Same route. Richer `data` |
| `api/.../providers/atlas/billing/getBillingSummary.js` | Node calls Atlas `POST /billing/summary` | Dashboard and chat both use this call |
| `show_billing` | `billingAWSHandler.js` → message + navigator | Message uses the shared result. No second billing path |
| Costs page | `kite/atlas/src/pages/design/CostsPage.js`, route `/costs` | Replace the mock with the report |
| AWS access | One named profile, `PROFILE = "atlas"` in `atlas/app/config/config.py` | Keep it. There is no per-user AWS connection yet |
| IAM note | `billing.md` already requires `ce:GetCostAndUsage` | No new permission |
| Chart library | None in `kite/atlas/package.json` | A small inline SVG on the page |

Current query behavior worth keeping in mind:

- `End` is already exclusive and set to “today,” so a local-date run on 15 October already covers 15 September through 14 October. The change is to compute that window in **UTC**, and to return every day.
- Amounts `<= 0` are dropped, then each service is rounded to cents before the total. This feature sums the raw amounts and keeps negatives.
- Service names are shortened in Python (`EC2`, `RDS`, `S3`). This feature returns AWS’s name from the aggregator. Chat and the page apply the short labels.
- Only the first Cost Explorer page is read. `NextPageToken` is ignored.
- `ResultsByTime[].Estimated` is ignored.
- The test double is `atlas/app/api/routes/test/billing_route_test.py`. It returns four service rows and no days.

---

## How a number is made

One AWS call family per request. The browser never supplies credentials, a period, or a second set of totals.

```text
UTC today
  → startDate = today minus 30 days
  → endDateExclusive = today
  → GetCostAndUsage (daily, UnblendedCost, group by SERVICE, every page)
  → one result: total, 30 days, nonzero services
```

If UTC today is 15 October 2026, the window is `2026-09-15` inclusive through `2026-10-15` exclusive. The last included day is 14 October. The Costs page says **Last 30 complete days** and prints those dates from the response. The page does not compute the window itself.

### Calculation rules

Use `decimal.Decimal` in the Python aggregator. Sum first. Round only when a screen or chat sentence displays cents.

| Figure | Rule |
|--------|------|
| Day | Sum every service amount on that date |
| Service | Sum that service across the window |
| Total | Sum of the daily amounts. It must also equal the sum of the service amounts |
| Missing day | Amount `0`. Still return the day |
| Day order | Ascending date. Always 30 entries |
| Service order | Amount descending, then service name ascending |
| Zero service | Omit when the exact period total is zero |
| Negative amount | Keep it |
| Tiny amount | Keep it in the result, even if two-decimal display would show `0.00` |
| Currency | Read `UnblendedCost.Unit`. If any group is not `USD`, fail the report. Do not add mixed units |
| Estimated | `hasEstimatedData` is true when any returned day has `Estimated: true` |

Display amounts are decimal strings in the API (`"42.18"`). The chart may convert a string to a number to draw a bar. It does not add those numbers into a new total.

### Service names

The result keeps AWS’s string, for example `Amazon Relational Database Service`.

Chat and the Costs page may show a short label when the name contains a known phrase:

| AWS name contains | Label |
|-------------------|--------|
| Amazon Elastic Compute Cloud | EC2 |
| Amazon Relational Database Service | RDS |
| Elastic Load Balancing | Elastic Load Balancing |
| Amazon Simple Storage Service | S3 |
| Elastic Beanstalk | Elastic Beanstalk |

Any other name is shown as AWS sent it. A service does not need to be in this list to appear. RDS shows up on its own when AWS returns a nonzero RDS total. An Elastic Beanstalk line is whatever AWS billed to that service name. It is not the sum of the EC2 and load-balancing lines underneath an environment.

---

## Shared result

Extend the payload of `POST /billing/summary`. Chat and the Costs page both read it. They format text. They do not re-sum AWS.

```json
{
  "period": {
    "startDate": "2026-09-15",
    "endDateExclusive": "2026-10-15",
    "label": "Last 30 complete days"
  },
  "currency": "USD",
  "metric": "UnblendedCost",
  "scope": "atlas-profile",
  "fetchedAt": "2026-10-15T23:40:00Z",
  "hasEstimatedData": true,
  "total": "42.18",
  "daily": [
    { "date": "2026-09-15", "amount": "1.24" }
  ],
  "services": [
    {
      "service": "Amazon Elastic Compute Cloud - Compute",
      "amount": "24.82"
    }
  ]
}
```

`daily` always has 30 objects. `scope` is `atlas-profile` because the query has no `LINKED_ACCOUNT` filter. Cost Explorer then returns the billing view those credentials have: a member account sees that account; a payer account sees the consolidated bill. The page must say that, and must not say the person picked an account.

`period_days` on the request body is ignored for this report. The window is fixed so chat and the page cannot drift.

---

## What stays out

This feature does not add:

- A dollar amount for one instance, bucket, database, or Beanstalk environment.
- `cloud_service_pricing`, hourly × 730, or any other estimate mixed into this total.
- A forecast, a savings number, or a comparison with the previous month.
- A date picker or any period other than these 30 days.
- An RDS scan, a Beanstalk scan, or a new table of billing snapshots.
- Polling, a new confirmation step, or a new chat card framework.
- A chart package. The page can draw bars with inline SVG.
- A per-user AWS connection. That belongs to [adding services](feature_adding_services.md). Until then, “no connection” means the Atlas profile cannot call Cost Explorer.

`show_billing` stays an immediate information capability. It does not create a request row.

EC2 scan estimates may keep using `estimatedMonthlyCost`. Those figures stay off this page.

---

## Dashboard

The browser calls the Node API, the same way scans do (`verifyUser`, then the server talks to Atlas). Suggested route, matching `scanRoutes.js`:

```text
GET /cloudpilot/billing/summary
```

The handler calls the existing `getBillingSummary` function and returns Atlas’s `data`. It does not accept AWS keys. A failed AWS call is an error, never a successful `$0.00` and never the old mock.

| Situation | What the person sees |
|-----------|----------------------|
| Loading | The page’s normal waiting state. No `$0.00` and no mock numbers first |
| Success | Total, 30 daily bars, every nonzero service |
| Successful zero | `$0.00` and “No AWS spending reported for this period.” |
| Profile cannot call Cost Explorer | “Cloud Pilot could not access AWS billing data. Your AWS connection needs Cost Explorer access.” |
| Other failure | A short error and Retry |
| Refresh | Same GET. The button does nothing while a refresh is in flight. The last good report stays on screen if the refresh fails. `fetchedAt` changes only after success |

### Page content

Header:

```text
AWS spending
Account-level actual spending
Last 30 complete days · September 15–October 14, 2026
```

Dates and currency come from the response. One summary card: **Total AWS spending**, the total, and “Last 30 complete days.”

Remove the mock projected-month card, the potential-savings card, the savings insights, and the named-resource table.

**Daily spending.** One bar per day, including zeros. Tooltip is the date and the display amount. Negative days remain visible.

**Spending by service.** Backend order. Amounts right-aligned. A positive amount that would display as `$0.00` shows as `< $0.01`. A negative amount keeps its sign.

Note under the table:

> AWS billing data may be delayed, and recent amounts may change. These totals are the billing view of the connected Atlas credentials, not individual resources.

If `hasEstimatedData` is true, the note can say recent days are still marked estimated by AWS. Show “Retrieved …” from `fetchedAt`. That time is when CloudPilot fetched the report.

---

## Chat

`billingAWSHandler.js` keeps calling `POST /billing/summary`. `atlasAWSBillingMessage.js` reads `total`, `period`, and `services` from that result.

A normal answer:

```text
Your AWS spending was $42.18 for September 15–October 14, 2026.

Spending by service:
• EC2: $24.82
• RDS: $9.41
• Elastic Load Balancing: $4.20
• S3: $3.75

These are account-level actual charges reported by AWS.
Recent billing amounts may change.
```

The daily series stays in the result and out of this paragraph. If there are many services, the message shows the largest ones and says the Costs page has the full list. Name the Costs page in the sentence. Do not build a new card type for it.

Drop the current billing follow-up “Show RDS databases.” There is no RDS scan, and a service line is not a list of databases.

An RDS question still gets the service total only: that is RDS spend across this billing view for these 30 days. No RDS line means AWS returned no nonzero RDS amount for the window. It does not mean there is no database. A Beanstalk environment total is out of reach; do not add EC2 and load balancing and call that the environment.

---

## Tests

Use the current Python and Node test style. Mock Cost Explorer. Do not call AWS.

Aggregator:

1. UTC start and exclusive end.
2. Several days and services sum to the same total.
3. A second page via `NextPageToken` is included.
4. Exactly 30 days, zeros filled in, days sorted.
5. A negative amount and a sub-cent amount survive.
6. An all-zero service is omitted.
7. `Estimated: true` sets `hasEstimatedData`.
8. A non-USD unit fails the report.

API and chat:

- `GET /cloudpilot/billing/summary` requires `verifyUser`.
- The handler returns the Atlas payload and does not rebuild totals.
- Access denied stays an error.
- The chat string uses the canonical total and dates, and it does not print 30 daily rows.

Update `billing_route_test.py` so the mock payload includes `period`, `daily`, and `services` in the new shape. Otherwise Test mode will not match what the page expects.

---

## Steps

1. Extend `get_spend_by_service` with the UTC window, paging, `Decimal` sums, daily rows, and the shared result. Stop shortening names and dropping negatives there.
2. Lock `run_billing_summary` to that window.
3. Point `buildBillingMessage` at the shared fields. Remove the RDS-database follow-up.
4. Add `GET /cloudpilot/billing/summary` with `verifyUser`, calling `getBillingSummary`.
5. Replace the Costs mock: total, SVG daily bars, service table, loading, zero, error, refresh.
6. Run the focused tests and open `/costs`.

---

## Done when

- Chat and `/costs` show one Cost Explorer report.
- The window is the last 30 complete UTC days, and the page says so.
- The page shows the total, every day, and every nonzero service.
- RDS and any other newly billed service appear without a code change.
- The mock projected, savings, and per-resource figures are gone.
- A failed AWS call is not shown as `$0.00`.
- Refresh keeps the last good report if the new fetch fails.
- Focused tests pass.



---

# Source: `feature_adding_services.md`

# Adding Services — connect an AWS account

## What this is

A person who just created an AWS account should not have to invent IAM policies, roles, and access keys before CloudPilot can see it.

They open CloudPilot, choose EC2 and S3, choose how much CloudPilot may do, and approve a CloudFormation stack in their own account. CloudPilot then assumes a role. Scans and fixes they already have keep working. They receive an authorized client for that account instead of a single machine profile.


**Status:** Plan. Do not implement from this file until a step is chosen.  
**Codename:** `feature_adding_services`  
**Related:** [Useful Costs](./feature_useful_costs.md) · [Mock AWS](./feature_mock_aws.md)

This is one of the product’s main doors. Connections is setup. Chat explains the setup and, later, can start the same wizard. Dashboard stays a view of resources and findings, not a second place to grant access.

---

## Feeling we want

> Someone connects the AWS account they are standing up — including the account that will run CloudPilot’s own API — and the next sentence is “scan this account and tell me if anything looks wrong.”

---

## What exists today

| Piece | Today |
|-------|--------|
| `/connections` | Design mock. Hardcoded “Connected · Account 631447262459”. Manage opens a dialog that says the real flow is not built. OpenAI, Gmail, Jira, Slack, Azure, and Team are the same mock |
| Atlas credentials | One boto3 **named profile** from config (`PROFILE`). `create_session(profile, region)` builds EC2, S3, CloudWatch, RDS, and STS clients |
| Scans and writes | EC2 and S3 scanners and operations call that profile directly. There is no account id, role ARN, or connection id |
| Chat | Understand → decide → fulfill, with confirmation before changes. No “connect an account” capability |
| Services that work | EC2 and S3 inventory, scan, and a small set of confirmed writes (pause/resume, create, tags, S3 versioning, and similar) |

There is no stored AWS connection. “Connected” on the page is not a role CloudPilot can assume.

---

## Two doors, one wizard

Connections and Chat do different jobs. They do not each grow an onboarding system.

```text
                 CLOUDPILOT
                     │
          ┌──────────┴──────────┐
          │                     │
     Connections              Chat
     setup and config         explain, then start
          │                     │
          └──────────┬──────────┘
                     │
              AWS Connection
                  Wizard
                     │
                AWS Account
```

| Surface | Job |
|---------|-----|
| **Connections** | What accounts and services can CloudPilot access? Add, view, test, disconnect |
| **Dashboard** | What resources, findings, and activity exist in those accounts? |
| **Chat** | What does the user want done? For MVP, chat does not run the wizard. Later, “connect my new AWS account” opens this same wizard |

MVP builds the wizard once and opens it from **Add AWS Account** on Connections. Chat is a later caller of that wizard, not a second implementation.

---

## The experience

### 1 — Connected accounts

The AWS block on Connections lists accounts, not a single fake row.

```text
Connected Services

AWS

Production AWS
Account: 123456789012
Status: Connected

Services: EC2, S3
Permissions: Read + Selected Actions

[ Manage ]

[ + Add AWS Account ]
```

The data model holds many accounts from the start (personal, development, production, a client). The first ship can be used with one account. The screen and the table are not shaped for “the” account.

Manage shows status, services, permission level, last test, and Disconnect. Disconnect in CloudPilot marks the row disconnected and stops using the role. It does **not** delete the IAM role in AWS unless a later cleanup is built. Say that on the screen.

OpenAI and the other mock tiles stay out of this feature.

### 2 — Choose services

Add AWS Account asks what CloudPilot may touch. The person is not granting the whole account.

```text
Which AWS services would you like CloudPilot to manage?

[x] EC2
    Virtual machines and compute resources

[x] S3
    Storage buckets and objects

[ ] RDS
    Managed databases
    Coming soon

[ ] Lambda
    Serverless functions
    Coming soon
```

MVP: only EC2 and S3 can be checked. RDS and Lambda are visible and disabled. At least one of EC2 or S3 must be selected.

### 3 — Choose permissions

Three levels. MVP ships the first two. The third is the advanced path later.

| Level | CloudPilot can | CloudPilot cannot |
|-------|----------------|-------------------|
| **Read only** (recommended) | Discover EC2 and S3. Scan configuration and security. Recommend changes | Modify resources |
| **Read + selected actions** | Read only, plus the operations CloudPilot already knows how to confirm: start/stop, create EC2, update EC2 tags, supported S3 fixes | Act as an account administrator. Run actions that are not in the product |
| **Custom** (later) | An IAM policy the account owner supplies | — |

Read + selected actions is the write option. It is not `AdministratorAccess`. The IAM policy lists the API actions behind today’s confirmations, plus the read actions for inventory and scan. New product actions mean a new template version, not a quiet widening of the role.

Chat confirmation still runs before a write. The role is the ceiling. Confirmation is the second gate.

### 4 — Connect with CloudFormation

Do not ask for access keys.

```text
USER AWS ACCOUNT
    IAM role
        trust: CloudPilot account only
        external id: unique per connection
        permissions: the template for the chosen services and level
            │
            │  STS AssumeRole (temporary credentials)
            ▼
CLOUDPILOT
    EC2 inventory / scan
    S3 inventory / scan
    authorized remediation
```

**Connect with CloudFormation** is the MVP path.

1. User clicks Connect.
2. CloudPilot creates a pending connection: name, chosen services, permission level, a new external id, and the CloudFormation launch URL.
3. The user signs in to AWS. The console shows the role and the policy that will be created.
4. They approve the stack.
5. They return with the role ARN (stack output, or a paste field if the callback is not ready).
6. CloudPilot calls STS `AssumeRole` with that ARN and the external id, then `GetCallerIdentity`. Success marks the connection `connected` and stores the account id from the caller identity.

Security bar for the template:

- Trust policy allows only CloudPilot’s account.
- `sts:ExternalId` must match the id stored for this connection. A new id per connection. Never one global id.
- Policy is least privilege for the selected services and level. Read only omits mutating actions.
- No long-lived keys in CloudPilot’s database. Store role ARN, external id (protected), account id, services, level, status. AssumeRole at use time.

A manual “paste a role ARN” path can exist for the person debugging the template. It is not the recommended button.

### 5 — You are connected

```text
AWS account connected

Development AWS
Region for EC2: us-west-2

Services: EC2, S3
Permissions: Read only

[ Scan my AWS account ]
[ View resources ]
[ Open chat ]
```

Scan uses the scans that already exist, aimed at this connection. View resources opens the dashboard for this account. Open chat does not connect anything. It is the place to say “scan my new account and tell me if anything looks wrong.”

EC2 work is regional. S3 bucket discovery is account-wide. The connection is account access. The region on the connection is the default region for EC2 operations, not a limit on which buckets exist. An EC2 scan still takes a region. An S3 scan does not pretend the bucket list is only `us-west-2`.

---

## Backend

One concept: an **AWS connection**. One row is one account.

```json
{
  "id": 1,
  "name": "Production AWS",
  "accountId": "123456789012",
  "roleArn": "arn:aws:iam::123456789012:role/CloudPilotRole",
  "externalId": "stored-protected",
  "defaultRegion": "us-west-2",
  "services": ["ec2", "s3"],
  "permissionLevel": "read_write",
  "status": "connected"
}
```

`read_write` in storage means **Read + selected actions**, not admin.

Fulfillment stays the pipeline you have. The new step is “which connection, then which client.”

```text
"Scan EC2 in my production account"
    UNDERSTAND
    DECIDE
    find AWS connection
    AssumeRole
    FULFILL  — existing EC2 scan
    RESPOND
```

Scan and remediation code should not know about CloudFormation or the Connections page. They should receive clients already built for the selected account (the same shape `create_session` returns today). A small session helper assumes the role, or in local dev keeps using the named profile when no connection id is passed.

Until Connections is real, the current `PROFILE` path can remain the default so today’s scans do not break. A request that names an account uses that connection. A request that names none uses the default connection once one exists, and until then the profile.

Guard writes with both checks:

- Connection `permissionLevel` is read + selected actions.
- The action is one CloudPilot already confirms.

A read-only connection never receives a write, even if chat tries to confirm one.

---

## What to build

| Feature | MVP | Later |
|---------|-----|-------|
| Add AWS account | Yes | |
| Many accounts in the model and on the page | Yes | |
| Select EC2 and S3; RDS and Lambda shown as coming soon | Yes | |
| Read only | Yes | |
| Read + selected actions | Yes | |
| Custom IAM | | Yes |
| CloudFormation connect | Yes | |
| Test connection (`AssumeRole` + caller identity) | Yes | |
| List connected accounts | Yes | |
| Disconnect in CloudPilot, without deleting the AWS role | Yes | |
| Role cleanup in AWS on disconnect | | Yes |
| Start the wizard from Chat | | Yes |
| Change services or permission level after connect | | Yes |
| More AWS services actually enabled | | Yes |
| Guided troubleshooting when the stack fails | | Yes |
| Counts and findings on the Connections cards | | Yes |

The later Connections page can become a control center: each account with instance count, bucket count, and finding count, plus a way into chat. That is Dashboard data shown on Connections. Do not merge the two pages. Connections answers “what can we access?” Dashboard answers “what is in there?”

---

## Locked decisions

| Topic | Decision |
|-------|----------|
| Who configures access | Connections page |
| Who explains it | Chat. Wizard-from-chat is later, same wizard |
| Accounts | Many from the first schema. Using one is fine |
| Services in MVP | EC2 and S3 only. Others visible, not selectable |
| Keys | No access keys collected or stored |
| How we get in | IAM role, STS `AssumeRole`, external id per connection |
| How the role is created | CloudFormation launch is the recommended path |
| Write scope | Only APIs CloudPilot already performs, still behind confirmation |
| What code receives | An authorized client for that account, not the connection form |
| Region | Default region for EC2. S3 discovery stays account-wide |
| Disconnect | Stops CloudPilot using the role. Does not remove the role in AWS |
| Other Connections tiles | Unchanged mocks. This feature is AWS accounts |

---

## Steps

### Step 1 — Connection record

- Table and API for the JSON above.
- External id generated per row and stored protected.
- Status: `pending`, `connected`, `disconnected`, `error`.
- List and disconnect. Disconnect does not call AWS to delete the stack.

### Step 2 — Wizard UI

- Add account → services (EC2/S3 only) → permission level (read only, or read + selected actions) → CloudFormation handoff → paste or return role ARN → test.
- Success screen with Scan, View resources, Open chat.
- Connections list replaces the hardcoded AWS row for real accounts. The design-mock dialog for AWS goes away.

### Step 3 — AssumeRole session

- Helper: connection id + region → temporary clients in today’s session shape.
- EC2 and S3 scan and the existing write operations take that client when a connection id is present.
- Profile fallback remains for local dev with no connection.

### Step 4 — CloudFormation template

- One template parameterized by services, permission level, CloudPilot account id, and external id.
- Read only vs selected actions are two policy documents, not a broad admin policy.
- Document the trust policy and the stack outputs (role ARN, account id).

### Step 5 — Acceptance

| Check | Expected |
|-------|----------|
| Add account | Pending row, unique external id, no access key stored |
| EC2 + S3 only | RDS and Lambda cannot be selected |
| CloudFormation | User can see the role and policy before they approve |
| Test | `AssumeRole` with external id succeeds, account id saved, status connected |
| Wrong external id | AssumeRole fails, status error, no scan |
| Read only | Scan runs. A write is refused before confirm |
| Read + selected actions | An existing confirmed action runs with the assumed role |
| Second account | Both listed. A named account is the one assumed |
| Disconnect | CloudPilot stops using it. The role still exists in AWS until the user deletes the stack |
| Existing profile dev | Scans still run when no connection is selected |

---

## Out of scope

- Collecting or storing AWS access keys
- Administrator or power-user policies
- Chat-driven onboarding (same wizard, later)
- Editing services or permission level on a live connection
- Deleting the CloudFormation stack from Disconnect
- Enabling RDS, Lambda, or the other Connections tiles
- Putting finding counts on the account cards
- Replacing confirmation with “the role allows it”



---

# Source: `feature_history.md`

# CloudPilot — Resource History

## What this is

Recents tells you what you have been doing. History tells you what happened to one AWS resource.

A bucket or instance has its own timeline: Version A, then B, then C. If C broke something, you can look back at B. Restoring B is a later feature. The first version of history is read-only.

**Status:** Architecture locked. Do not implement from this file until a step is chosen.  
**Codename:** `feature_history`  
**Decision:** C — one timeline per resource, combining CloudPilot actions and configuration changes discovered during scans.

---

## Feeling we want

> One AWS resource → one timeline → many recorded states.

Open S3 bucket `hello` and see how its configuration changed, when it changed, and whether CloudPilot did it or only found it.

```text
S3 Bucket: hello
Resource history · us-west-2
Active

1. Version C — Today          Latest
   Versioning disabled
   Change detected during S3 scan

2. Version B — Yesterday
   Versioning enabled
   CloudPilot enabled bucket versioning

3. Version A — Tuesday
   Initial configuration captured
   First S3 scan
```

A version is the configuration recorded at that moment. It is not a backup of the bucket’s objects, and it is not a promise that CloudPilot can put every setting back.

---

## Three ideas, built separately

| Idea | Job | When |
|------|-----|------|
| History | Read-only timeline for one resource | First |
| Snapshots | Saved configuration for each version, plus compare | Second |
| Restore | Preview a supported change, confirm, apply, record it as a new version | Third |

Restore is **restore configuration**, not a universal Undo.

| AWS change | Can CloudPilot reverse it? |
|------------|----------------------------|
| EC2 instance type | Usually, with stop / change / start |
| EC2 tags | Yes, if the previous values were saved |
| EC2 stop / start | Usually, subject to instance state |
| S3 versioning | Not fully. Enabled versioning can be suspended. It cannot return to never-enabled |
| S3 deleted objects | Only if recoverable versions or backups exist |
| EC2 terminated instance | Cannot restore the original instance |

A restore compares current AWS state with the chosen version, shows the proposed changes, requires confirmation, and runs only supported operations. It records a new history entry. It does not erase the later version.

---

## Recents stays Recents

Recents stays the activity list across CloudPilot: scans, requests, and dashboards.

Resource History is a different page. It belongs to one resource, opened from a scan result, the dashboard, or later from an inventory.

```text
RECENTS
What have I been doing?

S3 scan completed
3 buckets · 18 findings

EC2 instance created
my-app-server

RESOURCE HISTORY
What happened to this resource?

S3: hello
Version C · Versioning disabled

EC2: my-app-server
3 recorded configuration changes
```

One scan of 20 resources is one Recents entry. It can create or update history for each of those 20 resources.

---

## Identity

Display names are not the primary key. Names change. The AWS identifier does not.

| Resource | Identity | Display name |
|----------|----------|----------------|
| S3 | Bucket name within the AWS partition | `hello` |
| EC2 | Account + region + instance ID | `my-app-server` |
| Future RDS | Account + region + DB identifier | `production-db` |

```json
{
  "resourceType": "ec2",
  "resourceId": "i-0123456789abcdef0",
  "resourceName": "my-app-server",
  "region": "us-west-2"
}
```

Store the AWS account ID in the internal resource key even while CloudPilot uses one profile. That avoids collisions when more than one account exists.

A resource is unique by account, type, and AWS identifier. EC2 identity also includes region. S3 identity includes the AWS partition where it matters.

---

## Use what already exists

Do not build a second history system. Connect the pieces that already exist.

| Existing piece | Job today | Change |
|----------------|-----------|--------|
| `cloudpilot_scan_snapshots` | Complete EC2 and S3 scan results | Keep |
| `ScanSnapshotService` | Saves formatted scans | Extend the integration. Do not duplicate it |
| `cloudpilot_requests` | Requests, field collection, confirmation | Keep |
| `cloudpilot_history` | CloudPilot changes and undo data | Keep. Point records at a resource |
| `historyBuilders` | Action-specific history records | Reuse |
| Recents | Recent scans, requests, dashboard activity | Keep its job |

A scan snapshot is a whole scan. A resource snapshot is one bucket or one instance at one moment.

```text
S3 Scan #104
  hello
  images
  backups

Resource history
  each bucket has its own versions and events
```

| Store | Question it answers |
|-------|---------------------|
| `cloudpilot_resources` | What is this thing? |
| `cloudpilot_resource_snapshots` | What did it look like? |
| `cloudpilot_history` | What did CloudPilot do to it? |
| `cloudpilot_scan_snapshots` | What did the overall scan produce? |

---

## New tables

### `cloudpilot_resources`

One row for each AWS resource CloudPilot has seen.

| Field | Purpose |
|-------|---------|
| `id` | CloudPilot internal resource ID |
| `aws_account_id` | Account that owns the resource |
| `resource_type` | `ec2` or `s3` |
| `resource_id` | AWS identifier |
| `resource_name` | Display name |
| `region` | EC2 region, or bucket location for S3 |
| `first_seen_at` | First discovered |
| `last_seen_at` | Last observed |

### `cloudpilot_resource_snapshots`

Immutable configuration states for one resource. A new row is a new version. Rows are not edited in place.

| Field | Purpose |
|-------|---------|
| `id` | Snapshot ID |
| `resource_id` | `cloudpilot_resources.id` |
| `version` | Integer version (shown as A, B, C) |
| `configuration` | JSON of supported settings |
| `configuration_hash` | Detects an unchanged configuration |
| `source` | `scan` or `change` |
| `scan_snapshot_id` | Optional originating scan |
| `history_id` | Optional originating change |
| `created_at` | When this configuration was captured |

`configuration` is normalized JSON, not one column per setting.

```json
{
  "versioning": "Enabled",
  "encryption": "AES256",
  "publicAccessBlock": {
    "blockPublicAcls": true,
    "ignorePublicAcls": true,
    "blockPublicPolicy": true,
    "restrictPublicBuckets": true
  }
}
```

That shape is an example. It is not a claim that the current scanner already returns every field.

Leave findings, recommendations, and utilization metrics out of `configuration`. Those can change when rules or time windows change, while the resource’s settings stay the same.

If a scan did not collect a setting, store unknown / not collected. Do not store it as disabled. An incomplete scan must not look like a configuration change.

### How `cloudpilot_history` connects

Keep `cloudpilot_history`. Review its real schema before writing the migration.

For a change that touches one resource, an internal `resource_id` on `cloudpilot_history` may be enough.

`toggle_ec2` can affect two instances. If the current schema cannot represent that, add `cloudpilot_history_resources` so one action can point at more than one resource. Do not record a two-instance action as if it happened to only one.

---

## How a scan updates history

Keep the current scan path. After the scan snapshot is saved, add one step.

```text
CloudPilot Chat
    → scanS3Handler
    → Atlas POST /scan/s3
    → formatted scan results
    → ScanSnapshotService
    → cloudpilot_scan_snapshots
    → Recents / Dashboard

Saved scan snapshot
    → ResourceSnapshotService
    → for each resource:
         identify the resource
         read the normalized configuration
         compare it with the latest recorded configuration
         save a new version only if it changed
```

| Scan | Bucket configuration | Result |
|------|----------------------|--------|
| Monday | Versioning off | Create Version A |
| Tuesday | Versioning off | No new version |
| Wednesday | Versioning on | Create Version B |
| Thursday | Versioning on | No new version |
| Friday | Versioning off | Create Version C |

The full scan is still saved every time in `cloudpilot_scan_snapshots`. The resource timeline only gains a version when the tracked configuration changes.

Normalize before compare: sort tags, canonicalize unordered values, drop metadata that is not configuration. A missing field is unknown, not deleted.

Recording is idempotent. Retrying the same scan or the same action does not create a duplicate version.

`ScanSnapshotService` owns the complete scan. `ResourceSnapshotService` owns per-resource versions. Neither takes the other’s job. Call the resource snapshot step only after a scan has been saved, or after a change has been verified.

---

## How a CloudPilot change updates the same timeline

Example: enable versioning on `hello`.

```text
User requests the change
    → existing confirmation / request flow
    → Atlas executes and verifies
    → history records the operation
    → snapshot captures the verified state
```

The action record can store only what that action changed, plus what an undo would need:

```json
{
  "action": "enable_s3_versioning",
  "status": "completed",
  "before": { "versioning": "Suspended" },
  "after": { "versioning": "Enabled" }
}
```

The resource snapshot stores the full supported configuration after the action, read back from AWS. Do not declare the new version verified from the request alone.

Capture the pre-change state when it is available. Execute. Read the actual AWS state. Then save the version.

A partial failure still gets an action-history record, even when CloudPilot cannot save a complete new snapshot. A failed EC2 action appears on the timeline without a new verified version.

An EC2 tag update follows the same rule: a history record for the action, and a new snapshot only if the tracked configuration changed.

---

## Changes made outside CloudPilot

1. Monday: a scan records Version A.
2. Tuesday: CloudPilot enables versioning and records Version B.
3. Wednesday: someone suspends versioning in the AWS Console.
4. Thursday: a scan sees the difference and records Version C.

| Version | Source | What the UI may say |
|---------|--------|---------------------|
| C | Scan | Change detected during scan |
| B | CloudPilot | Enabled bucket versioning |
| A | Scan | Initial configuration captured |

CloudPilot knows C differs from B. It does not know who changed AWS, or the exact time, unless something like CloudTrail is added later. The UI says “Change detected during scan.” It does not say “User changed versioning on Thursday.”

---

## Combined timeline

The page is one chronological view of two stored ideas:

- Configuration versions: what the resource looked like when observed.
- Action events: what CloudPilot attempted, completed, or failed.

A successful operation can produce both an action and a snapshot. The page shows them as one entry, not two.

```text
hello
S3 bucket · Resource history
Latest: C

Version C · Thursday
Versioning change detected
S3 scan · Suspended
View configuration →

Version B · Tuesday
Enabled bucket versioning
CloudPilot action · Completed
View configuration →

Version A · Monday
Initial configuration
S3 scan · Suspended
View configuration →
```

Compare is read-only in the first versions of this feature.

```text
Compare B → C
1 change

Setting               Version B    Version C
Versioning            Enabled      Disabled
Encryption            Enabled      Enabled
Public access block   On           On
```

Version B is yesterday’s recorded configuration, not a copy of the objects in the bucket.

“Explore restoring Version B” can be shown as a future action. It does not run in the MVP.

---

## Where it lives

| Layer | Responsibility |
|-------|----------------|
| React / CloudPilot UI | Recents, resource detail, versions, timeline |
| Node.js API | Resource identity, history links, snapshots, read API |
| Python Atlas | Read AWS configuration, scan, execute changes |
| Database | Existing scan results and change history, plus resource versions |

Node owns persistence and retrieval. Python does not get a second history database. React does not merge the records itself.

Possible read API, after the current routes are inspected. These are not implementation requirements yet.

| Endpoint | Job |
|----------|-----|
| `GET /resources` | List known resources |
| `GET /resources/:id` | Resource details |
| `GET /resources/:id/history` | Combined timeline |
| `GET /resources/:id/versions` | Configuration versions |
| `GET /resources/:id/versions/:version` | One recorded configuration |

---

## MVP

Prove the flow with one S3 bucket and two scans that show a real configuration difference. Then attach a successful CloudPilot action to that same timeline.

1. Inspect `cloudpilot_history`, `cloudpilot_scan_snapshots`, `ScanSnapshotService`, and the S3 and EC2 formatters.
2. Add stable resource identity for EC2 and S3.
3. Store normalized per-resource configuration snapshots.
4. Create a new version only when the tracked configuration changes.
5. Associate existing CloudPilot change records with resources.
6. Expose a read-only combined timeline.
7. Link to that timeline from scan results and the dashboard.

### Leave out

- Automatic restoration
- CloudTrail
- Scheduled background scans
- Storing every AWS property
- Resources other than EC2 and S3
- Backfill of old versions unless the old record actually contains a reliable configuration

An old scan or action without a captured state is not a recoverable version.

---

## Decisions already made

1. Resource history is not another Recents page. Recents is activity across CloudPilot. History belongs to one resource.
2. A version is an observed configuration. It is not a promise that every setting in it can be restored.
3. The timeline is option C: CloudPilot actions and scan-discovered changes on the same resource history.
4. History, snapshots, and restore ship separately. History is read-only first.

```text
                 CloudPilot
                     |
           +---------+---------+
           |                   |
        AWS Scan           AWS Change
           |                   |
     Save Scan Result     Save Action History
           |                   |
           +---------+---------+
                     |
             Identify Resource
                     |
          Capture / Compare State
                     |
        Save Version if Different
                     |
             Resource History
                     |
           View / Compare Versions
```

## Next step

Inspect the real `cloudpilot_history` schema, `cloudpilot_scan_snapshots` schema, `ScanSnapshotService`, and the S3 and EC2 formatters. That inspection decides which fields and builders to reuse, which database additions are actually required, and whether current scan output is enough to compare versions.



---

# Source: `feature_mock_aws.md`

# CloudPilot — Persistent Mock AWS (Sandbox)

## What this is

A note on making the existing mock infrastructure **persistent**, so CloudPilot can scan, pause, resume, and rescan a fake AWS environment without touching real AWS.

**Status:** Idea only. Not ready to build.  
**Codename:** `feature_mock_aws`  
**Do not implement from this file yet.**

Do not build a fake AWS platform. No database of AWS-like behavior, no VPCs, IAM, networking, or billing rules. The useful middle ground is a small persistent store behind the routes that already exist.

---

## Feeling we want

CloudPilot talks to the same FastAPI flow in test mode as in real mode. The difference is what sits under the routes: boto3, or a fake environment that remembers state.

```text
REAL MODE

CloudPilot
   ↓
FastAPI
   ↓
AWS / boto3
```

```text
SANDBOX MODE

CloudPilot
   ↓
FastAPI
   ↓
Fake AWS Environment
```

The Node app does not need to know which one it is.

---

## What already exists

Mock routes are no longer only canned JSON. Pause and resume already model state:

```text
CloudPilot
    ↓
Mock FastAPI routes
    ↓
infrastructure_store
    ↓
Fake EC2 resources
```

Those routes call `get_ec2()`, `stop_ec2()`, and `start_ec2()`. Keep the engine simple: route → operation → infrastructure provider. Evolve `infrastructure_store`. Do not replace it with a new stack.

Today the mock route itself still knows too much:

```python
instance = get_ec2(instance_id, region)

if not is_noop:
    instance = stop_ec2(instance_id, region)
```

That is fine for now. The persistent fake environment should live **behind** `infrastructure_store`, not inside the routes.

```text
TEST ROUTES
      │
      ▼
Fake Infrastructure Store
      │
      ├── EC2
      ├── S3
      └── maybe billing later
```

---

## Starting environment

A known demo environment CloudPilot can actually change.

```text
EC2

i-demo-web-01
name: wishlist-api
region: us-west-2
type: t3.small
state: running

i-demo-worker-01
name: background-worker
region: us-west-2
type: t3.micro
state: stopped

i-demo-old-01
name: old-test-server
region: us-west-2
type: t2.micro
state: running
```

```text
S3

wishlist-images
versioning: disabled
public_access: false

wishlist-backups
versioning: enabled
public_access: false
```

Example conversation:

> Scan my EC2 instances

CloudPilot finds all three.

> Pause wishlist-api

The normal flow runs `POST /ec2/pause` and the fake environment changes `wishlist-api` from `running` to `stopped`.

> Show my EC2 inventory

It reports stopped. That is more useful than a route that always returns `MOCK_PAUSE_DATA`.

---

## Version 1 — JSON files

Start simpler than a database.

```text
core/
    mock/
        infrastructure_store.py
        data/
            ec2.json
            s3.json
```

Example shape:

```json
{
    "instances": [
        {
            "instance_id": "i-demo001",
            "region": "us-west-2",
            "name": "wishlist-api",
            "instance_type": "t3.micro",
            "state": "running",
            "tags": {
                "Environment": "demo"
            }
        }
    ]
}
```

`stop_ec2("i-demo001", "us-west-2")` reads `ec2.json`, finds the instance, sets `state` to `stopped`, and saves the file.

Store API CloudPilot calls. Persistence stays behind these functions:

```python
get_ec2()
list_ec2()
create_ec2()
delete_ec2()
start_ec2()
stop_ec2()
update_ec2_tag()

get_s3()
list_s3()
enable_s3_versioning()
```

Existing routes become clients of that store.

```text
Mock Routes
    ↓
infrastructure_store.py
    ↓
JSON files
```

---

## Version 2 — SQLite, only if JSON gets annoying

Move the store when you need relationships, history, concurrent writes, multiple sandbox environments, or different demo accounts. The routes barely change.

```text
Mock Routes
    ↓
infrastructure_store.py
    ↓
SQLite
```

Do not start at the database.

---

## Reset

Add this with the JSON store:

```text
POST /test/infrastructure/reset
```

```text
ec2.json  →  default_ec2.json
s3.json   →  default_s3.json
```

One canonical CloudPilot Demo Environment, always the same start:

```text
3 EC2 instances
3 S3 buckets
known findings
known tags
known states
```

---

## Why this helps scans

Scans inspect the sandbox instead of returning a canned result.

```text
wishlist-api
type: t3.large
cpu_average: 4%
state: running
```

The fake scan can report:

```text
Finding:
wishlist-api appears oversized.

Current: t3.large
Suggested: t3.small
```

Then the whole loop is testable:

```text
Fake infrastructure
        ↓
CloudPilot scan
        ↓
Finding
        ↓
User chooses remediation
        ↓
Confirmation
        ↓
Fake infrastructure changes
        ↓
Rescan
        ↓
Finding disappears
```

That matches the MVP: scan → remediation → rescan, plus EC2 and S3 operations. You can type create, tag, pause, resume, scan, delete, and inventory and exercise the pipeline without touching AWS.

---

## What not to build

Only model a property if CloudPilot needs to read or change it.

Do not model:

```text
VPCs
subnets
IAM
security groups
availability zones
EBS
CloudWatch
real CPU simulation
networking
AWS billing rules
AWS dependency rules
instance boot times
eventual consistency
```

| Resource | Fake state worth storing |
|---|---|
| EC2 | ID, name, region, state, instance type, tags |
| S3 | bucket name, versioning, maybe public/private |
| Billing | maybe a few fixed fake cost records |
| Scan metadata | only fields required to generate findings |

---

## Recommendation

Pursue **CloudPilot Sandbox**. Do not make “database-backed fake AWS” the project.

```text
             CLOUDPILOT
                 │
        normal application flow
                 │
             FastAPI
            /       \
           /         \
      REAL MODE    TEST MODE
         │             │
       boto3      infrastructure_store
                       │
                    JSON files
```

A day or two making the existing mock store persistent and resettable is enough. JSON → SQLite only when JSON becomes annoying.



---

# Source: `feature_core_organization_ideas.md`

# CloudPilot — Core Organization Ideas

## What this is

An information-architecture note. The individual pages are fine. **Dashboard, Recents, Cloud, and Findings are starting to overlap**, and this is a way to give each one a job.

**Status:** Ideas only. Not ready to change the product.  
**Codename:** `feature_core_organization_ideas`  
**Do not implement from this file yet.**

---

## Feeling we want

Each layer has one question it answers. Chat can still jump straight to a resource. The Dashboard menu item is a stable overview, not “wherever I was last.”

---

## 1. Clicking Dashboard

Today:

> **Dashboard → last scan / whatever resource I was viewing**

A menu item called **Dashboard** should be a stable destination. If it opens S3 today and an EC2 instance tomorrow because that was the last thing touched, Dashboard feels unpredictable.

**Dashboard is not Recents.** Recents already has its own page.

```text
DASHBOARD
What's happening right now?

Needs attention
2 high-priority findings

AWS
3 EC2 instances
5 S3 buckets

Costs
$42.18 this month

Recent
S3 scan · 5 findings          20 min ago
EC2 scan · 2 findings         Yesterday
```

**Dashboard is the stable overview / home base.**

```text
RECENTS
What have I been doing?

Sep 27   Scanned sam-youtube-demo
Sep 27   Enabled versioning
Sep 26   Scanned EC2
Sep 25   Created EC2 instance
...
```

Opening a specific resource stays. It happens when something is explicitly selected.

If the user says in Chat:

> "Show me my S3 buckets"

CloudPilot opens:

`Dashboard → S3 → Buckets`

If they click a bucket:

`Dashboard → S3 → sam-youtube-demo`

If Chat says:

> "That EC2 instance has two findings"

and the user clicks it:

`Dashboard → EC2 → cloudpilot-demo`

**Chat takes you directly to context. Clicking Dashboard takes you to the overview.**

---

## 2. Chat | Cloud | Findings

Keep the top bar. Those three are not arbitrary pages. They are the three primary ways of looking at CloudPilot.

```text
CHAT        CLOUD        FINDINGS
Ask         Explore      Act
```

### Chat

The conversational interface to everything.

```text
Chat

"What's costing me the most?"
"Scan S3."
"Why does this bucket exist?"
"Who owns wishlist-api?"
"Pause cloudpilot-demo."
```

### Cloud

**Cloud is the infrastructure explorer.**

```text
Cloud

AWS

EC2
3 instances

S3
5 buckets


EC2 INSTANCES

cloudpilot-demo        us-west-2     running
wishlist-api           us-west-2     running
kite-demo              us-east-1     stopped


S3 BUCKETS

wishlist-images        us-west-2
cloudpilot-data        us-west-2
...
```

Everything under a resource hangs off Cloud:

```text
Cloud
 │
 ├── AWS
 │    │
 │    ├── EC2
 │    │    └── cloudpilot-demo
 │    │         ├── Findings
 │    │         ├── About / Story
 │    │         ├── Costs
 │    │         └── History
 │    │
 │    └── S3
 │         └── sam-youtube-demo
 │              ├── Findings
 │              ├── About / Story
 │              ├── Costs
 │              └── History
 │
 └── eventually Azure / GCP / etc.
```

**Cloud is not Dashboard.**

Dashboard says **"Here's what matters."**

Cloud says **"Let me browse my infrastructure."**

### Findings

The third perspective: **show problems regardless of where they live.**

```text
Findings

12 open findings

HIGH

Encryption is off
sam-youtube-demo · S3

Public IP attached
cloudpilot-demo · EC2


MEDIUM

Versioning is off
sam-youtube-demo · S3

Instance is underutilized
cloudpilot-demo · EC2
```

Click one and you travel into that resource or finding.

**Cloud:** start with infrastructure, then discover its findings.

**Findings:** start with a problem, then discover the affected infrastructure.

---

## Two navigation layers

### Global product modes — top header

```text
CloudPilot       Chat     Cloud     Findings
```

Available everywhere:

**Chat** — talk to your infrastructure  
**Cloud** — browse your infrastructure  
**Findings** — see what needs attention

### Workspace — left sidebar

```text
MAIN

⌂  Home
▣  Dashboard
＋  New Chat
↶  Recents
☑  To Do
◎  Team
⬡  Connections


PROJECTS

Wishlist
Kite
CloudPilot


RECENT

S3 scan
cloudpilot-demo
Create EC2 instance
```

These answer a different set of questions:

**Dashboard** — What's happening?  
**Recents** — What was I doing?  
**To Do** — What do I need to do?  
**Team** — Who am I working with?  
**Connections** — What is CloudPilot connected to?

**Projects** scope that world.

---

## Home vs Dashboard

Home and Dashboard may eventually be redundant. The overview described above is what would naturally be called the CloudPilot home:

```text
Good morning, David

Needs attention
2 high priority findings

Recent activity
...

Costs
...

Projects
...

CloudPilot insight
...
```

That is essentially a Dashboard.

Do not change this yet. If it becomes hard to explain Home and Dashboard in one sentence each, one of them does not need to exist.

A later sidebar might be:

```text
MAIN

▣  Home
＋  New Chat
↶  Recents
☑  To Do
◎  Team
⬡  Connections
```

where **Home is the dashboard**. Or keep the name **Dashboard** if that word fits CloudPilot better.

---

## Model to use when placing new features

```text
                     CLOUDPILOT

              CHAT    CLOUD    FINDINGS
               │       │          │
              Ask    Explore    Problems
                       │
                  Infrastructure
                       │
                 ┌─────┴─────┐
                 EC2         S3
                  │           │
              Resource     Resource
                  │
        ┌─────────┼──────────┐
      About     History     Costs
                  │
               Changes
```

```text
Dashboard = overview
Recents   = activity
To Do     = future work
Team      = people
```

Each recent design gets a distinct job instead of competing for the same space.

**Stop making the Dashboard menu remember the last resource.** Keep direct-to-resource behavior when the user explicitly opens something from Chat, Findings, Cloud, Recents, and similar places. The Dashboard menu item is the reliable way back to the overview.

---

## Notes on this model (2026-09-27)

The split is the right one. Dashboard answers what matters right now. Cloud is where you browse infrastructure. Findings starts from a problem. Recents is what you already did. To Do is work someone chose to come back to. Those are different questions, and the pages stop competing once each one owns only its question.

The decision worth keeping is the menu behavior. Clicking **Dashboard** always opens the overview. Chat, Cloud, Findings, and Recents still open a specific bucket or instance when the user picks one. Today the Dashboard menu does not actually reopen the last bucket or instance. That open resource is forgotten when you leave the page. What it does keep is the last scan, so Dashboard opens as the S3 list or the EC2 list depending on what ran most recently. That is already enough to make the menu feel unstable. An overview replaces that. The direct jump from Chat stays.

The top bar is the bigger structural change, and it is the right one. **Chat** and **Cloud** both go to `/chat` right now, and **Findings** opens the S3 findings mock. In this model, the page currently called Dashboard — the bucket list and the instance list — mostly becomes **Cloud**. Dashboard becomes the small overview above that: needs attention, a count of EC2 and S3, this month’s cost, and the latest scans. Per-resource findings stay on the resource. The Findings mode is the cross-resource list: encryption on one bucket and a public IP on an instance, in one place.

Two things are already overlapping more tightly than Home versus Dashboard.

**Home** and **New Chat** both open `/chat`. Home versus Dashboard is a later naming question. Home versus New Chat is the one that is true today. If Home eventually becomes the overview, New Chat can stay the way to start a conversation, and Dashboard as a second name can wait.

There are also two Recents. The **Recents** menu item is the mock activity page. Lower in the sidebar, **Recent** is the real list of completed scans. The note still shows both. The lower list works as a short preview of the Recents page — the last few scans — as long as it is the same activity, not a second history.

About, History, and Costs belong on the resource, which matches the **More Info** and **History** buttons. A cost number on the Dashboard overview is the summary. The Costs page is the detail. To Do stays separate from Findings: a finding is something CloudPilot discovered, and a to-do is something David, Sam, or CloudPilot put on a list.

---

## The project is the container (2026-09-27)

**New Chat** is probably the wrong concept. What you are actually creating is a **new Project**.

```text
CloudPilot
│
├── Project: Wishlist
│   ├── Chat: General
│   ├── Chat: AWS Deployment
│   ├── Chat: S3 Cleanup
│   ├── Chat: Production Issue
│   └── Scans / Findings / History
│
├── Project: Kite
│   ├── Chat: General
│   ├── Chat: Infrastructure
│   └── ...
│
└── Project: University of Hawaii
    ├── Chat: General
    └── ...
```

### MVP

Do not build multiple chats yet.

Treat the data model mentally as:

> **Project → one primary chat**

The sidebar action becomes:

**＋ New Project**

Clicking a project opens that project's existing chat.

That makes the current one-conversation setup feel intentional. It is the first version of the model, not a temporary limit.

Later a project can grow into:

```text
PROJECT
  ↓
Chats
Cloud
Findings
Recents
Connected Services
Team
```

**The chat is not CloudPilot's main container. The project is.**

A project can eventually hold AWS and Azure connections, repos, people, knowledge, scans, findings, actions, history, and multiple conversations. Chat is one way of interacting with everything that belongs to that project.

---

## Chat is the experience (2026-09-27)

**Project is the container. Chat is the experience.**

The user should not feel like they entered a project-management dashboard and then picked Chat as one tool among six. They should feel like they entered **CloudPilot**, where the primary thing they do is talk to it.

```text
PROJECT: Wishlist
│
├── ★ Chat              ← HOME / STAR
│
├── Cloud
├── Findings
├── Recents
│
├── Team
└── Connected Services
```

Later, with more than one conversation:

```text
PROJECT: Wishlist
│
├── Chats
│   ├── General             ← default
│   ├── AWS Deployment
│   ├── S3 Cleanup
│   └── Production Issue
│
├── Cloud
├── Findings
├── Recents
└── ...
```

Even with multiple chats, **the most recent or default chat opens immediately when the user enters the project.** They do not land on a project overview unless there is a strong reason.

The other pages support what happens in Chat.

CloudPilot says:

> I scanned your S3 buckets and found 6 things worth looking at.

The user can handle that in Chat. If they want all six in detail, they click **View findings** and move into the Findings UI.

Or:

> I paused `wishlist-worker-02`. Want me to show you what changed?

Chat does the work. **Recents** keeps the permanent record.

```text
Chat        = Do things
Cloud       = Understand things
Findings    = Investigate things
Recents     = Go back to things
Team / Connections = Configure things
```

Chat deserves the most product attention. The tables and dashboards can be excellent, and they are supporting cast.

CloudPilot is not a cloud dashboard with an AI chat attached. It is an **AI cloud teammate whose work has dashboards, history, findings, and controls attached to it.**
