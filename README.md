# SSC GK GS Quiz & Preparation

A fast, mobile-first static website for SSC GK and GS practice: subject pages, exam pages,
an interactive quiz engine and 23,654 multiple-choice questions with answers and explanations.

Live site: https://vy8441916-bot.github.io/ssc-gk-gs-quiz/

## What is in this repository

| Path | Purpose |
| --- | --- |
| `index.html`, `subjects/`, `exams/`, `practice.html`, `about.html` | Public pages |
| `assets/css/style.css` | Single stylesheet, mobile first, no framework |
| `assets/js/quiz.js` | Quiz engine (vanilla JS, no dependencies) |
| `data/bank/<subject>.json` | Question bank, one file per subject |
| `data/pool/*.json` | Mixed and exam-weighted pools |
| `scripts/import_questions.py` | Validate and import questions from JSON |
| `docs/importing-questions.html` | Human-readable import guide |
| `sitemap.xml`, `robots.txt` | Search engine files |

## Question data format

Browser files are compact arrays to keep pages light:

```json
[["Which article abolishes untouchability?", ["Article 14", "Article 15", "Article 17", "Article 21"], 2, "Article 17 abolishes untouchability.", "optional-id"]]
```

`correct_option` is a zero-based index, so `2` means the third option.

## Importing questions

Write questions as objects (see `data/examples/my-questions.example.json`), then:

```bash
python3 scripts/import_questions.py data/examples/my-questions.example.json --subject indian-polity --dry-run
python3 scripts/import_questions.py data/examples/my-questions.example.json --subject indian-polity
python3 scripts/import_questions.py --check-all
```

The script validates structure, rejects duplicates (normalised question text) and keeps a
`.bak` backup of the previous bank file. Full details: `docs/importing-questions.html`.

## Local preview

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Open the site through a local server rather than double-clicking the HTML file, because the
quiz loads JSON with `fetch`, which browsers block on `file://`.

## Publishing (GitHub Pages, free)

1. Push these files to a public GitHub repository.
2. Repository Settings → Pages → Source: "Deploy from a branch", branch `main`, folder `/ (root)`.
3. Wait for the build to finish; the site appears at `https://<user>.github.io/<repo>/`.

If you rename the repository or add a custom domain, update `SITE_BASE` in the page builder and
regenerate `sitemap.xml`, the canonical tags and `robots.txt`.

## Notes on data safety

This repository contains no tokens, keys or private repository URLs. The site is fully static
and reads only public JSON files, so no credentials are needed at runtime.

## Copyright and accuracy

Questions are compiled from standard SSC preparation material for practice use. If you
redistribute this content, check that you have the rights to do so. Exam patterns quoted on the
exam pages follow recent SSC schemes; always confirm in the official notification at ssc.gov.in.
