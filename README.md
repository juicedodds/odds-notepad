# Odds Notepad

A simple beginner web app for tracking and comparing odds from two sportsbooks.

## How to open

1. Open this folder on your computer.
2. Double-click `index.html` (or right-click and choose your browser).

## How to use

1. Choose **Odds Format**:
   - **American** (example: `+120`, `-110`)
   - **Decimal** (example: `2.20`, `1.91`)
2. Enter values for **Game**, **Sportsbook A**, **Odds A**, **Sportsbook B**, and **Odds B**.
3. Click **Save**.
4. Each row shows converted values for both books:
   - American
   - Decimal
   - Implied %
5. The app labels the better payout as **Best Price** (higher decimal odds).
6. Entries stay saved after refresh using browser local storage.
7. Click **Delete** to remove a row.

## Run unit tests

From this repo folder, run:

```bash
node tests/odds-utils.test.js
```
