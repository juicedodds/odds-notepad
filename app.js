const STORAGE_KEY = 'odds-notepad-entries';
const ARB_STORAGE_KEY = 'odds-notepad-arb-v2';

const formFields = {
  game: document.getElementById('game'),
  sportsbookA: document.getElementById('sportsbookA'),
  oddsA: document.getElementById('oddsA'),
  sportsbookB: document.getElementById('sportsbookB'),
  oddsB: document.getElementById('oddsB')
};

const arbFields = {
  mode: document.getElementById('arbMode'),
  roundingIncrement: document.getElementById('roundingIncrement'),
  stake: document.getElementById('arbStake'),
  book1: document.getElementById('arbBook1'),
  odds1: document.getElementById('arbOdds1'),
  book2: document.getElementById('arbBook2'),
  odds2: document.getElementById('arbOdds2'),
  book3: document.getElementById('arbBook3'),
  odds3: document.getElementById('arbOdds3'),
  outcome3BookWrap: document.getElementById('outcome3BookWrap'),
  outcome3OddsWrap: document.getElementById('outcome3OddsWrap')
};

const oddsFormatSelect = document.getElementById('oddsFormat');
const oddsHelpText = document.getElementById('oddsHelpText');
const saveButton = document.getElementById('saveButton');
const entriesBody = document.getElementById('entriesBody');
const calculateArbButton = document.getElementById('calculateArbButton');
const copySummaryButton = document.getElementById('copySummaryButton');
const arbResults = document.getElementById('arbResults');

let entries = loadEntries();
updateOddsHelpText();
loadArbInputs();
updateArbModeVisibility();
renderEntries();

oddsFormatSelect.addEventListener('change', () => {
  updateOddsHelpText();
  persistArbInputs();
});
arbFields.mode.addEventListener('change', () => {
  updateArbModeVisibility();
  persistArbInputs();
});
Object.values(arbFields)
  .filter((field) => field && typeof field.addEventListener === 'function' && field.tagName === 'INPUT')
  .forEach((field) => field.addEventListener('input', persistArbInputs));

saveButton.addEventListener('click', saveEntry);
calculateArbButton.addEventListener('click', calculateArbitrage);
copySummaryButton.addEventListener('click', copyArbSummary);

function saveEntry() {
  const game = formFields.game.value.trim();
  const sportsbookA = formFields.sportsbookA.value.trim();
  const sportsbookB = formFields.sportsbookB.value.trim();
  const oddsA = formFields.oddsA.value.trim();
  const oddsB = formFields.oddsB.value.trim();
  const format = oddsFormatSelect.value;

  if (!game || !sportsbookA || !oddsA || !sportsbookB || !oddsB) {
    alert('Please fill in all fields before saving.');
    return;
  }

  try {
    const convertedA = OddsUtils.toInternalOdds(oddsA, format);
    const convertedB = OddsUtils.toInternalOdds(oddsB, format);

    entries.push({
      id: createEntryId(),
      game,
      sportsbookA,
      sportsbookB,
      convertedA,
      convertedB
    });

    persistEntries();
    renderEntries();
    clearForm();
  } catch (error) {
    alert(error.message);
  }
}

function calculateArbitrage() {
  const mode = Number.parseInt(arbFields.mode.value, 10);
  const format = oddsFormatSelect.value;
  const roundingIncrement = Number.parseFloat(arbFields.roundingIncrement.value);
  const totalStake = Number.parseFloat(arbFields.stake.value);

  if (!(totalStake > 0)) {
    arbResults.textContent = 'Total stake must be greater than 0.';
    return;
  }

  const outcomes = [
    { label: 'Outcome 1', book: arbFields.book1.value.trim(), oddsRaw: arbFields.odds1.value.trim() },
    { label: 'Outcome 2', book: arbFields.book2.value.trim(), oddsRaw: arbFields.odds2.value.trim() }
  ];

  if (mode === 3) {
    outcomes.push({ label: 'Outcome 3', book: arbFields.book3.value.trim(), oddsRaw: arbFields.odds3.value.trim() });
  }

  if (outcomes.some((outcome) => !outcome.oddsRaw)) {
    arbResults.textContent = 'Please enter odds for every active outcome.';
    return;
  }

  try {
    const converted = outcomes.map((outcome) => {
      const convertedOdds = OddsUtils.toInternalOdds(outcome.oddsRaw, format);
      return {
        ...outcome,
        decimal: convertedOdds.decimal,
        american: convertedOdds.american,
        original: convertedOdds.original
      };
    });

    const result = OddsUtils.calculateSurebet(
      converted.map((item) => item.decimal),
      totalStake,
      roundingIncrement
    );

    arbResults.innerHTML = renderArbResults(result, converted, totalStake);
    arbResults.dataset.summary = buildSummaryText(result, converted, totalStake);
    persistArbInputs();
  } catch (error) {
    arbResults.textContent = error.message;
  }
}

async function copyArbSummary() {
  const summary = arbResults.dataset.summary;
  if (!summary) {
    arbResults.textContent = 'Run a calculation first so there is a summary to copy.';
    return;
  }

  try {
    await navigator.clipboard.writeText(summary);
    copySummaryButton.textContent = 'Copied!';
    setTimeout(() => {
      copySummaryButton.textContent = 'Copy summary';
    }, 1200);
  } catch {
    arbResults.textContent = 'Unable to copy automatically. Please copy manually.';
  }
}

function renderArbResults(result, converted, totalStake) {
  const statusMessage = result.exists ? 'Arbitrage exists' : 'Not risk-free / no arbitrage (needs S < 1)';

  const rows = converted
    .map((item, index) => {
      const stake = result.roundedStakes[index];
      const payout = result.payoutsAfterRounding[index];
      return `<tr>
        <td>${escapeHtml(item.label)}</td>
        <td>${escapeHtml(item.book || '-')}</td>
        <td>${escapeHtml(item.original)} (dec ${OddsUtils.formatDecimal(item.decimal)})</td>
        <td>$${stake.toFixed(2)}</td>
        <td>$${payout.toFixed(2)}</td>
      </tr>`;
    })
    .join('');

  return `
    <div><strong>S (sum implied probabilities):</strong> ${result.S.toFixed(6)} — <strong>${statusMessage}</strong></div>
    <div><strong>Theoretical profit:</strong> $${result.theoreticalProfit.toFixed(2)} (${result.theoreticalProfitPct.toFixed(2)}%)</div>
    <div><strong>Profit after rounding:</strong> $${result.profitRounded.toFixed(2)} (${result.profitRoundedPct.toFixed(2)}%)</div>
    <div><strong>Total stake:</strong> $${Number(totalStake).toFixed(2)}</div>
    <table class="arb-table">
      <thead><tr><th>Outcome</th><th>Sportsbook</th><th>Odds</th><th>Stake</th><th>Expected payout</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function buildSummaryText(result, converted, totalStake) {
  const betText = converted
    .map((item, idx) => `$${result.roundedStakes[idx].toFixed(2)} on ${item.label} at ${item.original}`)
    .join(', ');

  return `S=${result.S.toFixed(4)}, Total=$${Number(totalStake).toFixed(2)}, ` +
    `Profit(theoretical)=$${result.theoreticalProfit.toFixed(2)} (${result.theoreticalProfitPct.toFixed(2)}%), ` +
    `Profit(after rounding)=$${result.profitRounded.toFixed(2)} (${result.profitRoundedPct.toFixed(2)}%). ` +
    `Bet: ${betText}.`;
}

function updateArbModeVisibility() {
  const showThird = arbFields.mode.value === '3';
  arbFields.outcome3BookWrap.style.display = showThird ? 'flex' : 'none';
  arbFields.outcome3OddsWrap.style.display = showThird ? 'flex' : 'none';
}

function updateOddsHelpText() {
  const format = oddsFormatSelect.value;
  const placeholder = format === 'american' ? 'e.g. +120 or -110' : 'e.g. 2.20';

  formFields.oddsA.placeholder = placeholder;
  formFields.oddsB.placeholder = placeholder;
  arbFields.odds1.placeholder = placeholder;
  arbFields.odds2.placeholder = placeholder;
  arbFields.odds3.placeholder = placeholder;

  oddsHelpText.textContent =
    format === 'american'
      ? 'American odds use + and -. +120 => 2.20 decimal, -110 => 1.91 decimal.'
      : 'Decimal odds are total return per $1 stake. Implied probability is 1 / decimal.';
}

function loadArbInputs() {
  const stored = localStorage.getItem(ARB_STORAGE_KEY);
  if (!stored) {
    return;
  }

  try {
    const parsed = JSON.parse(stored);
    if (parsed.format === 'american' || parsed.format === 'decimal') {
      oddsFormatSelect.value = parsed.format;
      updateOddsHelpText();
    }
    arbFields.mode.value = parsed.mode === '3' ? '3' : '2';
    arbFields.roundingIncrement.value = parsed.roundingIncrement || '0.01';
    arbFields.stake.value = parsed.stake || '';
    arbFields.book1.value = parsed.book1 || '';
    arbFields.book2.value = parsed.book2 || '';
    arbFields.book3.value = parsed.book3 || '';
    arbFields.odds1.value = parsed.odds1 || '';
    arbFields.odds2.value = parsed.odds2 || '';
    arbFields.odds3.value = parsed.odds3 || '';
  } catch {
    // ignore storage parse errors
  }
}

function persistArbInputs() {
  localStorage.setItem(
    ARB_STORAGE_KEY,
    JSON.stringify({
      format: oddsFormatSelect.value,
      mode: arbFields.mode.value,
      roundingIncrement: arbFields.roundingIncrement.value,
      stake: arbFields.stake.value,
      book1: arbFields.book1.value,
      book2: arbFields.book2.value,
      book3: arbFields.book3.value,
      odds1: arbFields.odds1.value,
      odds2: arbFields.odds2.value,
      odds3: arbFields.odds3.value
    })
  );
}

function loadEntries() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return [];
  }
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter((entry) => entry && entry.convertedA && entry.convertedB) : [];
  } catch {
    return [];
  }
}

function persistEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function renderEntries() {
  entriesBody.innerHTML = '';

  if (entries.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = '<td colspan="5">No saved entries yet.</td>';
    entriesBody.appendChild(emptyRow);
    return;
  }

  entries.forEach((entry) => {
    const row = document.createElement('tr');
    const bestBookKey = entry.convertedA.decimal >= entry.convertedB.decimal ? 'A' : 'B';
    const bestBookName = bestBookKey === 'A' ? entry.sportsbookA : entry.sportsbookB;

    row.innerHTML = `
      <td>${escapeHtml(entry.game)}</td>
      <td>${renderBookOdds(entry.sportsbookA, entry.convertedA, bestBookKey === 'A')}</td>
      <td>${renderBookOdds(entry.sportsbookB, entry.convertedB, bestBookKey === 'B')}</td>
      <td><span class="best-price">Best Price: ${escapeHtml(bestBookName)}</span></td>
      <td><button type="button" class="delete-btn" data-id="${entry.id}">Delete</button></td>
    `;

    row.querySelector('.delete-btn').addEventListener('click', () => deleteEntry(entry.id));
    entriesBody.appendChild(row);
  });
}

function renderBookOdds(bookName, convertedOdds, isBestPrice) {
  return `
    <div class="book-cell ${isBestPrice ? 'book-cell-best' : ''}">
      <div class="book-name">${escapeHtml(bookName)}</div>
      <div>American: ${escapeHtml(convertedOdds.american)}</div>
      <div>Decimal: ${OddsUtils.formatDecimal(convertedOdds.decimal)}</div>
      <div>Implied %: ${OddsUtils.formatImpliedProbability(convertedOdds.impliedProbability)}</div>
      ${isBestPrice ? '<div class="best-inline-label">Best Price</div>' : ''}
    </div>
  `;
}

function createEntryId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return `entry-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

function deleteEntry(id) {
  entries = entries.filter((entry) => entry.id !== id);
  persistEntries();
  renderEntries();
}

function clearForm() {
  Object.values(formFields).forEach((field) => {
    field.value = '';
  });
  formFields.game.focus();
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
