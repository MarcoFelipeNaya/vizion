const API = 'http://localhost:3000/api';

// ── Boards ────────────────────────────────────────

async function getBoards() {
  const res = await fetch(`${API}/boards`);
  return res.json();
}

async function createBoard(title) {
  const res = await fetch(`${API}/boards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title })
  });
  return res.json();
}

async function deleteBoard(id) {
  const res = await fetch(`${API}/boards/${id}`, { method: 'DELETE' });
  return res.json();
}

// ── Columns ───────────────────────────────────────

async function getColumns(boardId) {
  const res = await fetch(`${API}/columns/${boardId}`);
  return res.json();
}

async function createColumn(boardId, title) {
  const res = await fetch(`${API}/columns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ board_id: boardId, title })
  });
  return res.json();
}

async function deleteColumn(id) {
  const res = await fetch(`${API}/columns/${id}`, { method: 'DELETE' });
  return res.json();
}

// ── Cards ─────────────────────────────────────────

async function createCard(columnId, title, description, color) {
  const res = await fetch(`${API}/cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ column_id: columnId, title, description, color })
  });
  return res.json();
}

async function updateCard(id, title, description, color) {
  const res = await fetch(`${API}/cards/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description, color })
  });
  return res.json();
}

async function moveCard(id, columnId, position) {
  const res = await fetch(`${API}/cards/${id}/move`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ column_id: columnId, position })
  });
  return res.json();
}

async function deleteCard(id) {
  const res = await fetch(`${API}/cards/${id}`, { method: 'DELETE' });
  return res.json();
}