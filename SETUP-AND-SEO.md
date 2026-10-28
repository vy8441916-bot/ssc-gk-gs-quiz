# Setup, publishing and Google Search Console

This site is a plain static website: HTML, CSS, one small JavaScript file and JSON data.
There is no build step needed to publish it and no server to maintain.

Live URL: https://vy8441916-bot.github.io/ssc-gk-gs-quiz/

## 1. How it is published (already done, free)

1. The files live in the public repository `vy8441916-bot/ssc-gk-gs-quiz`.
2. Repository **Settings → Pages** is set to *Deploy from a branch*, branch `main`, folder `/ (root)`.
3. GitHub Pages builds the site and serves it over HTTPS at the URL above. Nothing is paid:
   public repositories get Pages hosting free, including the `github.io` address.

To publish your own copy, push the same files to a public repository and repeat step 2.

## 2. Editing content

| Change | Where |
| --- | --- |
| Page text, headings | the `.html` file for that page |
| Colours, spacing, layout | `assets/css/style.css` |
| Quiz behaviour | `assets/js/quiz.js` |
| Questions | `data/bank/<subject>.json` (see `docs/importing-questions.html`) |
| Question counts shown on pages | `data/bank/index.json` |

After editing a question file, also update the numbers in `data/bank/index.json` so the counts
on the pages stay accurate.

## 3. Google Search Console — verify the site

Google Search Console is free. You need a Google account and access to this repository.

1. Open https://search.google.com/search-console and sign in.
2. Click **Add property**.
3. Choose **URL prefix** and enter exactly:
   `https://vy8441916-bot.github.io/ssc-gk-gs-quiz/`
   (A Domain property will not work here because you cannot add DNS records for `github.io`.)
4. For verification, the simplest method is **HTML tag**:
   - Search Console shows a meta tag like
     `<meta name="google-site-verification" content="XXXXXXXX" />`.
   - Copy the `content` value.
   - Add that meta tag inside the `<head>` of `index.html` (and any other page you want verified —
     one page is enough), commit and push.
   - Wait for the Pages build, then click **Verify** in Search Console.
5. Alternative method: **HTML file** upload. Download the verification file Google gives you
   (for example `google1a2b3c4d.html`), add it to the repository root, push, wait for the build,
   then click **Verify**.

## 4. Submit the sitemap

1. In Search Console, open your property and choose **Sitemaps** in the left menu.
2. Enter `sitemap.xml` (the full URL is
   `https://vy8441916-bot.github.io/ssc-gk-gs-quiz/sitemap.xml`).
3. Click **Submit**. The status will show as *Success* once Google fetches it. Fetching can take
   from a few hours to a few days.

`robots.txt` already allows crawling of all public pages and points to the sitemap:

```
User-agent: *
Allow: /
Disallow: /data/

Sitemap: https://vy8441916-bot.github.io/ssc-gk-gs-quiz/sitemap.xml
```

## 5. What happens after submission

- Google discovers the 20 public pages in the sitemap and crawls them at its own pace.
- Use **URL Inspection** in Search Console to request indexing for a specific page. This is a
  request, not a guarantee.
- Indexing is never immediate and cannot be promised. Ranking for competitive keywords takes
  time, content depth and, usually, links from other sites. Nothing in this project can or does
  promise a first-page position.

## 6. Adding a custom domain later (optional, not required)

A `github.io` address is free and works immediately. A custom domain costs money, so it is not
part of this setup. If you buy one later:

1. Add a `CNAME` file to the repository root containing your domain, for example `example.com`.
2. Configure the DNS records GitHub lists in **Settings → Pages**.
3. Change `SITE_BASE` in the page builder to your domain and regenerate `sitemap.xml`, canonical
   tags and `robots.txt`, so all of them point at the new address.

## 7. Social links

Only the verified Telegram channel is linked: https://t.me/sscgkgs0

If you create other official profiles later, add them in two places:
the footer of each page (`site-foot` section) and, for the structured data, the `sameAs` list in
the organisation block inside `index.html`.

## 8. Checks you can run yourself

- `python3 scripts/import_questions.py --check-all` validates every question file.
- `python3 -m http.server 8000` in the project folder, then open http://localhost:8000 to test
  the quiz locally (open it through the server, not by double-clicking the file).
