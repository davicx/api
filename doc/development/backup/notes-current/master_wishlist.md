# Master wishlist

Wishlist notes from `api/doc/development/current`. Nothing in `api/doc/development/future` is a Wishlist product note. CloudPilot examples that use names like `wishlist-api` stay in those CloudPilot notes.

The original notes are unchanged.

## Contents

- `feature_wishlist_new_item.md` — Wishlist — add an item from a photo. Status: Plan. Do not implement from this file until a phase is chosen.
- `api_beanstalk_deploy.md` — Wishlist API — Beanstalk deploy. Done

## What each note is

- `feature_wishlist_new_item.md` is the product plan: a photo becomes a suggested name, price, real store link, and product image, then the person confirms. Status is Plan. No phase has been chosen.
- `api_beanstalk_deploy.md` is the Wishlist API deploy checklist. RDS, secrets, the S3 bucket, and the Beanstalk role are checked off. Pipeline, photo-to-S3 verification, and committing the API config files are still open.



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
