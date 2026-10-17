# Ranowin admin setup (one-time)

This backend is not active until the owner deploys it. No passwords or GitHub tokens belong in this repository.

1. Create a standalone project at https://script.google.com/ and paste `Code.gs` into its Code file.
2. Add an HTML file named **Admin** and paste `Admin.html`.
3. Create a private Drive folder for material originals. Copy its folder ID.
4. In Project Settings → Script Properties set:

| Property | Value |
|---|---|
| SHEET_ID | 1rMr7T6skcQ2DYAsqqdxW4Vl9flCrFvZEPLRyroxWsAc |
| DRIVE_FOLDER_ID | Your new folder ID |
| GITHUB_REPO | VidunD/ranowin-website |
| GITHUB_TOKEN | Fine-grained GitHub token scoped to this repository only, Contents read/write |
| ADMIN_USER | Your chosen username |
| ADMIN_PASSWORD | Unique password of 16+ characters (use a password manager) |

5. Run `setupAdmin_` once in the editor and authorize Drive, Sheets and external requests. It creates Materials/Sales tabs and replaces the temporary password with a salted hash. To reset a password, set ADMIN_PASSWORD again and rerun setupAdmin_. Existing sessions expire within 6 hours.
6. Deploy → New deployment → Web app → Execute as **Me**, access **Anyone**. Access is protected by the backend username/password checks on every data operation. Do not expose any additional server functions without the same checks. Open the deployment /exec URL to log in.
7. Test with one material: select a bag, click “Manage existing…” (keeps existing image), enter Qty and switch the low-stock message ON, then Save. Check Sheet, stock.json and store. All existing stock remains untracked until explicitly entered; blank Qty never implies zero.
8. Upload a replacement photo. The browser creates a JPEG up to 1000 px; it is stored in private Drive and public GitHub uploads/. It updates the matching Sheet pattern column. Old files remain for recovery.
9. Confirm an actual sale with a unique order reference. The backend serializes changes and rejects duplicate references, zero/negative sales and overselling. Cancelled WhatsApp requests require no action.
10. Save/sale updates Sheet first and then stock.json. If GitHub fails, do **not repeat a sale**. Click Retry website sync. A normal GitHub Pages deployment and published Google CSV may take a few minutes; existing visitors may need to reload. This is manual inventory, not a real-time reservation/payment system.

Do not publish the Materials or Sales tabs separately. They are internal. The stock.json feed intentionally contains design stock but no customer/order references, Drive IDs, passwords or tokens.

## Google Search

PNG favicons, canonical URL, Organization metadata, social image metadata, robots.txt and sitemap.xml are included. In Google Search Console inspect https://ranowin.com.lk/ and request indexing, then submit sitemap.xml. Google determines whether/when it shows a favicon or larger image. A social Open Graph image does not force a Google result thumbnail.
