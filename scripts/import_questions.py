#!/usr/bin/env python3
"""Validate and import GK/GS questions from JSON into the site's question bank.

Usage
-----
    python3 scripts/import_questions.py my-questions.json --subject indian-polity --dry-run
    python3 scripts/import_questions.py my-questions.json --subject indian-polity
    python3 scripts/import_questions.py --check-all

Input format (JSON array, or an object with a "questions" array):

    [
      {
        "question": "Which article of the Constitution abolishes untouchability?",
        "options": ["Article 14", "Article 15", "Article 17", "Article 21"],
        "correct_option": 2,
        "explanation": "Article 17 abolishes untouchability in any form."
      }
    ]

Bank format written to data/bank/<subject>.json (compact, browser-friendly):

    [["question", ["a","b","c","d"], 2, "explanation", "optional-id"], ...]

Only the Python standard library is used. No network access, no tokens.
"""
import argparse
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
BANK_DIR = os.path.join(ROOT, 'data', 'bank')

SUBJECTS = ['history', 'indian-polity', 'geography', 'economy', 'biology', 'physics',
            'chemistry', 'environment', 'static-gk', 'miscellaneous-gk']

MIN_QUESTION = 12
MIN_EXPLANATION = 12


def norm(text):
    """Normalisation used for duplicate detection."""
    return re.sub(r'[^a-z0-9]+', ' ', str(text).lower()).strip()


def load_json(path):
    with open(path, encoding='utf-8') as fh:
        return json.load(fh)


def existing_keys(subject):
    path = os.path.join(BANK_DIR, subject + '.json')
    if not os.path.exists(path):
        return set(), []
    rows = load_json(path)
    keys = set()
    for row in rows:
        # compact array form: [q, options, answer, explanation, id?]
        keys.add(norm(row[0]))
    return keys, rows


def validate(item, position, seen_keys, bank_keys):
    """Return (record, None) for a valid question or (None, reason)."""
    if not isinstance(item, dict):
        return None, 'not a JSON object'

    question = str(item.get('question', '')).strip()
    if len(question) < MIN_QUESTION:
        return None, 'question shorter than %d characters' % MIN_QUESTION

    options = item.get('options')
    if not isinstance(options, list) or len(options) != 4:
        return None, 'options must be a list of exactly four items'
    options = [str(o).strip() for o in options]
    if any(not o for o in options):
        return None, 'one or more options are empty'
    if len({o.lower() for o in options}) != 4:
        return None, 'options are not all different'

    answer = item.get('correct_option')
    if not isinstance(answer, int) or isinstance(answer, bool) or not 0 <= answer <= 3:
        return None, 'correct_option must be an integer from 0 to 3'

    explanation = str(item.get('explanation', '')).strip()
    if len(explanation) < MIN_EXPLANATION:
        return None, 'explanation shorter than %d characters' % MIN_EXPLANATION

    key = norm(question)
    if key in seen_keys:
        return None, 'duplicate of another question in this file'
    if key in bank_keys:
        return None, 'duplicate of a question already in the bank'
    seen_keys.add(key)

    qid = item.get('id')
    return [question, options, answer, explanation, str(qid) if qid else ''], None


def read_input(path):
    data = load_json(path)
    if isinstance(data, dict) and 'questions' in data:
        data = data['questions']
    if not isinstance(data, list):
        raise SystemExit('Input must be a JSON array of questions (or {"questions": [...]}).')
    return data


def import_subject(input_path, subject, dry_run=False, allow_duplicates=False):
    if subject not in SUBJECTS:
        raise SystemExit('Unknown subject "%s". Choose from: %s' % (subject, ', '.join(SUBJECTS)))

    bank_keys, rows = existing_keys(subject)
    seen = set()
    accepted, rejected = [], []

    for i, item in enumerate(read_input(input_path), start=1):
        record, reason = validate(item, i, seen, bank_keys)
        if record:
            accepted.append(record)
        else:
            if allow_duplicates and reason and reason.startswith('duplicate'):
                continue
            rejected.append((i, reason))

    print('File          : %s' % input_path)
    print('Subject       : %s' % subject)
    print('Bank currently: %d questions' % len(rows))
    print('Valid         : %d' % len(accepted))
    print('Rejected      : %d' % len(rejected))
    for pos, reason in rejected[:40]:
        print('  - item %d: %s' % (pos, reason))
    if len(rejected) > 40:
        print('  ... %d more' % (len(rejected) - 40))

    if not accepted:
        print('\nNothing to import.')
        return 1 if rejected else 0

    merged = rows + accepted
    if dry_run:
        print('\nDry run: nothing written. Bank would become %d questions.' % len(merged))
        return 0

    os.makedirs(BANK_DIR, exist_ok=True)
    target = os.path.join(BANK_DIR, subject + '.json')
    if os.path.exists(target):
        backup = target + '.bak'
        with open(target, 'rb') as src, open(backup, 'wb') as dst:
            dst.write(src.read())
        print('\nBackup written: %s' % backup)

    with open(target, 'w', encoding='utf-8') as fh:
        json.dump(merged, fh, ensure_ascii=False, separators=(',', ':'))
    print('Wrote %d questions to %s' % (len(merged), target))

    index_path = os.path.join(BANK_DIR, 'index.json')
    if os.path.exists(index_path):
        print('Note: data/bank/index.json holds the counts used by the pages. '
              'Rebuild it with the site pipeline, or edit the numbers by hand.')
    return 0


def check_all():
    """Integrity check across every bank file."""
    problems = 0
    total = 0
    for subject in SUBJECTS:
        path = os.path.join(BANK_DIR, subject + '.json')
        if not os.path.exists(path):
            print('%-18s missing' % subject)
            problems += 1
            continue
        rows = load_json(path)
        keys = set()
        bad = 0
        for i, row in enumerate(rows, start=1):
            if not isinstance(row, list) or len(row) < 4:
                bad += 1
                continue
            q, opts, ans, expl = row[0], row[1], row[2], row[3]
            if not isinstance(opts, list) or len(opts) != 4 or len({str(o).lower() for o in opts}) != 4:
                bad += 1
            elif not isinstance(ans, int) or not 0 <= ans <= 3:
                bad += 1
            elif len(str(expl).strip()) < MIN_EXPLANATION:
                bad += 1
            k = norm(q)
            if k in keys:
                bad += 1
            keys.add(k)
        total += len(rows)
        status = 'ok' if bad == 0 else '%d problem(s)' % bad
        print('%-18s %6d questions  %s' % (subject, len(rows), status))
        problems += bad
    print('\nTotal: %d questions, %d problem(s)' % (total, problems))
    return 0 if problems == 0 else 1


def main():
    ap = argparse.ArgumentParser(description='Validate and import GK/GS questions from JSON.')
    ap.add_argument('input', nargs='?', help='JSON file with your questions')
    ap.add_argument('--subject', help='target subject slug, e.g. indian-polity')
    ap.add_argument('--dry-run', action='store_true', help='validate only, write nothing')
    ap.add_argument('--allow-duplicates', action='store_true',
                    help='skip duplicates silently instead of reporting them')
    ap.add_argument('--check-all', action='store_true', help='integrity check every bank file')
    args = ap.parse_args()

    if args.check_all:
        sys.exit(check_all())
    if not args.input or not args.subject:
        ap.error('provide an input file and --subject, or use --check-all')
    sys.exit(import_subject(args.input, args.subject, args.dry_run, args.allow_duplicates))


if __name__ == '__main__':
    main()
