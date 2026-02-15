const STORAGE_KEY = 'odds-notepad-entries';

const formFields = {
  game: document.getElementById('game'),
  sportsbookA: document.getElementById('sportsbookA'),
  oddsA: document.getElementById('oddsA'),
  sportsbookB: document.getElementById('sportsbookB'),
  oddsB: document.getElementById('oddsB')
};

const saveButton = document.getElementById('saveButton');
const entriesBody = document.getElementById('entriesBody');

let entries = loadEntries();
renderEntries();

saveButton.addEventListener('click', () => {
  const newEntry = {
    id: createEntryId(),
    game: formFields.game.value.trim(),
    sportsbookA: formFields.sportsbookA.value.trim(),
    oddsA: formFields.oddsA.value.trim(),
    sportsbookB: formFields.sportsbookB.value.trim(),
    oddsB: formFields.oddsB.value.trim()
  };

  if (!newEntry.game || !newEntry.sportsbookA || !newEntry.oddsA || !newEntry.sportsbookB || !newEntry.oddsB) {
    alert('Please fill in all fields before saving.');
    return;
  }

  entries.push(newEntry);
  persistEntries();
  renderEntries();
  clearForm();
});

function loadEntries() {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
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
    emptyRow.innerHTML = '<td colspan="6">No saved entries yet.</td>';
    entriesBody.appendChild(emptyRow);
    return;
  }

  entries.forEach((entry) => {
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${escapeHtml(entry.game)}</td>
      <td>${escapeHtml(entry.sportsbookA)}</td>
      <td>${escapeHtml(entry.oddsA)}</td>
      <td>${escapeHtml(entry.sportsbookB)}</td>
      <td>${escapeHtml(entry.oddsB)}</td>
      <td><button type="button" class="delete-btn" data-id="${entry.id}">Delete</button></td>
    `;

    const deleteButton = row.querySelector('.delete-btn');
    deleteButton.addEventListener('click', () => deleteEntry(entry.id));

    entriesBody.appendChild(row);
  });
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
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
