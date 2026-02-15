const STORAGE_KEY = 'odds-notepad-entries';

const formFields = {
  game: document.getElementById('game'),
  sportsbookA: document.getElementById('sportsbookA'),
  oddsA: document.getElementById('oddsA'),
  sportsbookB: document.getElementById('sportsbookB'),
  oddsB: document.getElementById('oddsB')
};

const oddsFormatSelect = document.getElementById('oddsFormat');
const oddsHelpText = document.getElementById('oddsHelpText');
const saveButton = document.getElementById('saveButton');
const entriesBody = document.getElementById('entriesBody');

let entries = loadEntries();
updateOddsHelpText();
renderEntries();

oddsFormatSelect.addEventListener('change', updateOddsHelpText);
saveButton.addEventListener('click', () => {
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

  let convertedA;
  let convertedB;

  try {
    convertedA = OddsUtils.toInternalOdds(oddsA, format);
    convertedB = OddsUtils.toInternalOdds(oddsB, format);
  } catch (error) {
    alert(error.message);
    return;
  }

  entries.push({
    id: createEntryId(),
    game,
    sportsbookA,
    sportsbookB,
    sourceFormat: format,
    rawOddsA: oddsA,
    rawOddsB: oddsB,
    convertedA,
    convertedB
  });

  persistEntries();
  renderEntries();
  clearForm();
});

function updateOddsHelpText() {
  const format = oddsFormatSelect.value;
  const placeholder = format === 'american' ? 'e.g. +120 or -110' : 'e.g. 2.20';

  formFields.oddsA.placeholder = placeholder;
  formFields.oddsB.placeholder = placeholder;

  oddsHelpText.textContent =
    format === 'american'
      ? 'American odds use + and - signs. Example: +120 returns 1.2x profit on $100, while -110 means you risk $110 to profit $100.'
      : 'Decimal odds show total return per $1 stake. Example: 2.20 returns $2.20 total (stake included) for each $1.';
}

function loadEntries() {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry) => entry && entry.convertedA && entry.convertedB);
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
    emptyRow.innerHTML = '<td colspan="10">No saved entries yet.</td>';
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

    const deleteButton = row.querySelector('.delete-btn');
    deleteButton.addEventListener('click', () => deleteEntry(entry.id));
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
