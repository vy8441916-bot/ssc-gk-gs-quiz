# Importing questions from JSON

The site reads one JSON file per subject from `data/bank/`. You never need to edit the HTML.

## 1. Write your questions

Save a file such as `my-questions.json`:

```json
[
  {
    "question": "Which article of the Constitution abolishes untouchability?",
    "options": ["Article 14", "Article 15", "Article 17", "Article 21"],
    "correct_option": 2,
    "explanation": "Article 17 abolishes untouchability and forbids its practice in any form."
  }
]
```

Rules enforced by the validator:

- `question` — at least 12 characters, plain text, no HTML.
- `options` — exactly four non-empty, different strings.
- `correct_option` — integer 0 to 3 (0 = first option).
- `explanation` — at least 12 characters.

An object with a `questions` array instead of a bare array is also accepted.

## 2. Validate without writing anything

```bash
python3 scripts/import_questions.py my-questions.json --subject indian-polity --dry-run
```

The report lists accepted and rejected questions with a reason for each rejection, plus how
many questions the bank would contain afterwards.

## 3. Import

```bash
python3 scripts/import_questions.py my-questions.json --subject indian-polity
```

The script merges your questions into `data/bank/indian-polity.json`, writes a `.bak` backup
first, and skips questions that duplicate an existing one.

## 4. Refresh counts and publish

Question counts shown on the pages come from `data/bank/index.json`. Regenerate it with your
site build step, or edit the numbers by hand, then commit and push.

## Subjects

`history`, `indian-polity`, `geography`, `economy`, `biology`, `physics`, `chemistry`,
`environment`, `static-gk`, `miscellaneous-gk`

## Duplicate detection

Questions are compared on normalised text: lower-cased, punctuation stripped, whitespace
collapsed. Two questions that differ only in spacing or punctuation count as duplicates.
Duplicates inside the input file are caught as well as duplicates against the existing bank.

## Integrity check

```bash
python3 scripts/import_questions.py --check-all
```

Validates every bank file: four distinct options, a valid answer index, a non-empty explanation
and no repeated question text. Use it before every commit.

## Keeping private data private

Do not commit access tokens, private repository URLs or credentials. If your source bank lives
in a private repository, export it to JSON locally, validate it here, and commit only the
resulting `data/bank/*.json`. The site is static and needs no token at runtime.
