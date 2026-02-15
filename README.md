# Odds Notepad

A simple beginner web app for tracking odds from two sportsbooks and running a true arbitrage (surebet) calculator.

## How to open

1. Open this folder on your computer.
2. Double-click `index.html` (or right-click and choose your browser).

## Odds Notepad usage

1. Choose **Odds Format** (`American` or `Decimal`).
2. Enter Game, Sportsbook A/B, and Odds A/B.
3. Click **Save** to add to the table.
4. Best line is highlighted by higher decimal odds.

## Arbitrage Calculator usage

1. Choose **2-way** or **3-way** mode.
2. Enter odds for each outcome (sportsbook names are optional).
3. Enter **Total stake** and optional **currency rounding** (default `0.01`).
4. Click **Calculate**.
5. Use **Copy summary** to copy a text result.

## How arbitrage is calculated

- Convert American odds to decimal:
  - If `American > 0`: `decimal = 1 + (american / 100)`
  - If `American < 0`: `decimal = 1 + (100 / abs(american))`
- Implied probability: `p = 1 / decimal`
- Sum implied probabilities:
  - 2-way: `S = (1/dec1) + (1/dec2)`
  - 3-way: `S = (1/dec1) + (1/dec2) + (1/dec3)`
- Arbitrage exists if `S < 1`.
- Stake split for total stake `T`:
  - `stake_i = T * ((1/dec_i) / S)`
- Theoretical guaranteed profit:
  - `profit = (T / S) - T`
  - `profitPct = ((1/S) - 1) * 100`
- After rounding stakes to currency increment, use real-world conservative payout:
  - `minPayout = min(stake_i * dec_i after rounding)`
  - `profitAfterRounding = minPayout - T`

## Notes

- If `S >= 1`, the app still shows stake splits but labels result as **Not risk-free / no arbitrage**.
- Disclaimer in app: **Educational only. Not betting advice. Check local laws. 21+.**
- Arbitrage inputs, mode, and odds format are saved in `localStorage`.

## Run unit tests

```bash
node tests/odds-utils.test.js
```
