# Future Kite and Wishlist work

iOS, Kite, and Wishlist plans. CloudPilot plans live in `master_future_work.md`.

The Beanstalk deploy checklist is in `api/doc/development/finished/api_beanstalk_deploy.md`. The full photo-item writeup is in `backup/` with the other old notes.

---

# First part

## Add an item from a photo

You take a picture of something you want. The app suggests the name, the price it can see, a real store link, and a cleaner product photo. You check every field before it is saved. If a step fails, you can still type the item yourself.

---

# Second part

## Add an item from a photo

Status: plan. Build one endpoint and try it before the next. The Full Item, Simple Item, and Find an Item chooser already exists. Find an Item still opens the Paste screen. This plan does not replace that chooser.

Source: `feature_wishlist_new_item.md`.

The product and the store listing stay apart. The name and the platform are the product. The store, the link, and the price printed in the photo are the listing. Target’s price must not sit next to a Walmart link as if it were Walmart’s price.

OpenAI only reads the picture. It does not search the web, invent a URL, or draw a photo. Search is a separate step and can be replaced later.

- [ ] Phase 1. `POST /item/product/analyze/`. JPEG, PNG, or WEBP, up to 10 MB, in memory. Do not use the post-photo uploader. Return only what is visible. Unknown fields are null. Do not save the file or create an item.
- [ ] Try a store screenshot and a game box. A missing price or URL stays empty.
- [ ] Phase 2. `POST /item/product/find-url/`. Real search results, up to three. Prefer the store seen in the picture. Return none when the match is weak, including the same game on another console.
- [ ] Phase 3. `POST /item/product/find-image/`. Read an image from the chosen page first. Search for images only if that fails. Up to three choices. Do not store the files.
- [ ] Phase 4. On the photo screen, Continue runs the three calls, then the existing review screen. Save with the existing create-item call.
- [ ] Paste and Manual still open review and save with no analysis.
- [ ] A failed search still opens review with the photo the person already chose.
- [ ] Changing the title by hand does not rerun all three calls.
- [ ] Do not build a catalog, price watching, generated photos, a cart scan, a second create API, or a new feed.

Files named in the source plan: routes in `itemRoutes.js`, logic in a new `itemProduct.js`, search in a new `productSearch.js`, and the Wishlist photo and review screens. Leave `items.js` create, edit, feed, and purchase as they are.
