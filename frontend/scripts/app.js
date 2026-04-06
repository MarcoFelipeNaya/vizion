// ── Auth guard ────────────────────────────────────
// redirects to login if no token found

function checkAuth() {
  const token = localStorage.getItem('vizion-token');
  if (!token) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function logout() {
  localStorage.removeItem('vizion-token');
  localStorage.removeItem('vizion-user');
  window.location.href = 'login.html';
}

// show user name and logout button in sidebar
function renderUserInfo() {
  const user = JSON.parse(localStorage.getItem('vizion-user'));
  if (!user) return;

  const sidebarFooter = document.querySelector('.sidebar-footer');
  sidebarFooter.insertAdjacentHTML('afterbegin', `
    <div class="user-info">
      <div class="user-avatar">
        ${user.name.charAt(0).toUpperCase()}
      </div>
      <div class="user-details">
        <span class="user-name">${user.name}</span>
        <span class="user-email">${user.email}</span>
      </div>
      <button class="btn-icon" id="logoutBtn" title="Logout">
        <i class="fa-solid fa-right-from-bracket"></i>
      </button>
    </div>
  `);

  document.getElementById('logoutBtn').addEventListener('click', logout);
}


// ── State ─────────────────────────────────────────
// This object holds everything the app needs to remember
let state = {
  boards: [],       // all boards from the API
  activeBoard: null // the currently selected board
};

// ── DOM references ────────────────────────────────
// Grab all the elements we'll need to interact with
const boardList    = document.getElementById('boardList');
const boardArea    = document.getElementById('boardArea');
const boardTitle   = document.getElementById('boardTitle');
const emptyState   = document.getElementById('emptyState');
const topbarActions = document.getElementById('topbarActions');
const newBoardBtn  = document.getElementById('newBoardBtn');
const modalOverlay = document.getElementById('modalOverlay');
const modalClose   = document.getElementById('modalClose');
const modalTitle   = document.getElementById('modalTitle');
const modalBody    = document.getElementById('modalBody');

// ── Theme toggle ──────────────────────────────────
const themeToggle = document.getElementById('themeToggle');
const themeIcon   = document.getElementById('themeIcon');
const themeLabel  = document.getElementById('themeLabel');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('vizion-theme', theme);
  if (theme === 'dark') {
    themeIcon.className = 'fa-solid fa-sun';
    themeLabel.textContent = 'Light mode';
  } else {
    themeIcon.className = 'fa-solid fa-moon';
    themeLabel.textContent = 'Dark mode';
  }
}

applyTheme(localStorage.getItem('vizion-theme') || 'light');
themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

// ── Modal ─────────────────────────────────────────
function openModal(title, bodyHTML, onConfirm) {
  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHTML;
  modalOverlay.classList.add('active');

  // focus first input automatically
  const firstInput = modalBody.querySelector('input, textarea');
  if (firstInput) setTimeout(() => firstInput.focus(), 50);

  // confirm button inside modal triggers onConfirm callback
  const confirmBtn = modalBody.querySelector('.btn-confirm');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', onConfirm);
  }

  // allow pressing Enter to confirm
  modalBody.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) onConfirm();
  });
}

function closeModal() {
  modalOverlay.classList.remove('active');
  modalBody.innerHTML = '';
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal(); // close when clicking backdrop
});

// ── Boards ────────────────────────────────────────

async function loadBoards() {
  state.boards = await getBoards();
  renderBoardList();
}

function renderBoardList() {
  boardList.innerHTML = '';

  if (state.boards.length === 0) {
    boardList.innerHTML = `
      <li style="padding: 8px 12px; font-size: 13px; color: var(--text-muted);">
        No boards yet
      </li>`;
    return;
  }

  state.boards.forEach(board => {
    const li = document.createElement('li');
    li.className = 'board-item' + (state.activeBoard?.id === board.id ? ' active' : '');
    li.innerHTML = `
      <div class="board-item-name">
        <i class="fa-solid fa-table-columns" style="font-size: 12px;"></i>
        <span>${board.title}</span>
      </div>
      <button class="board-item-delete btn-danger" data-id="${board.id}" title="Delete board">
        <i class="fa-solid fa-trash"></i>
      </button>
    `;

    // select board on click
    li.addEventListener('click', (e) => {
      if (!e.target.closest('.board-item-delete')) {
        selectBoard(board);
      }
    });

    // delete board
    li.querySelector('.board-item-delete').addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm(`Delete "${board.title}"? This will delete all columns and cards.`)) {
        await deleteBoard(board.id);
        if (state.activeBoard?.id === board.id) {
          state.activeBoard = null;
          renderEmptyState();
        }
        await loadBoards();
      }
    });

    boardList.appendChild(li);
  });
}

async function selectBoard(board) {
  state.activeBoard = board;
  boardTitle.textContent = board.title;
  renderBoardList(); // re-render to update active highlight
  await loadColumns();
}

function renderEmptyState() {
  boardTitle.textContent = 'Select a board';
  topbarActions.innerHTML = '';
  boardArea.innerHTML = `
    <div class="empty-state" id="emptyState">
      <i class="fa-solid fa-table-columns"></i>
      <p>Select or create a board to get started</p>
    </div>`;
}

// new board button
newBoardBtn.addEventListener('click', () => {
  openModal('New Board', `
    <label>Board name</label>
    <input type="text" placeholder="e.g. My Project" maxlength="50" />
    <button class="btn-primary btn-confirm">
      <i class="fa-solid fa-plus"></i> Create Board
    </button>
  `, async () => {
    const input = modalBody.querySelector('input');
    const title = input.value.trim();
    if (!title) return;
    await createBoard(title);
    await loadBoards();
    closeModal();
  });
});

// ── Columns ───────────────────────────────────────

async function loadColumns() {
  if (!state.activeBoard) return;
  const columns = await getColumns(state.activeBoard.id);
  renderBoard(columns);
}

function renderBoard(columns) {
  boardArea.innerHTML = '';

  // add column button in topbar
  topbarActions.innerHTML = `
    <button class="btn-primary" id="addColumnBtn">
      <i class="fa-solid fa-plus"></i> Add Column
    </button>`;

  document.getElementById('addColumnBtn').addEventListener('click', () => {
    openModal('New Column', `
      <label>Column name</label>
      <input type="text" placeholder="e.g. In Progress" maxlength="50" />
      <button class="btn-primary btn-confirm">
        <i class="fa-solid fa-plus"></i> Add Column
      </button>
    `, async () => {
      const input = modalBody.querySelector('input');
      const title = input.value.trim();
      if (!title) return;
      await createColumn(state.activeBoard.id, title);
      await loadColumns();
      closeModal();
    });
  });

  if (columns.length === 0) {
    boardArea.innerHTML += `
      <div class="empty-state">
        <i class="fa-solid fa-plus"></i>
        <p>Add a column to get started</p>
      </div>`;
    return;
  }

  columns.forEach(column => {
    boardArea.appendChild(createColumnEl(column));
  });

  initDragAndDrop();
}

function createColumnEl(column) {
  const el = document.createElement('div');
  el.className = 'column';
  el.draggable = true;
  el.dataset.id = column.id;

  el.innerHTML = `
    <div class="column-header">
      <div style="display:flex; align-items:center; gap:8px;">
        <span class="column-title">${column.title}</span>
        <span class="column-count">${column.cards.length}</span>
      </div>
      <div class="column-actions">
        <button class="btn-icon btn-delete-col" title="Delete column">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
    <div class="column-cards" data-column-id="${column.id}">
      ${column.cards.map(card => createCardHTML(card)).join('')}
    </div>
    <div class="column-footer">
      <button class="btn-add-card">
        <i class="fa-solid fa-plus"></i> Add card
      </button>
    </div>
  `;

  // delete column
  el.querySelector('.btn-delete-col').addEventListener('click', async () => {
    if (confirm(`Delete "${column.title}" and all its cards?`)) {
      await deleteColumn(column.id);
      await loadColumns();
    }
  });

  // add card
  el.querySelector('.btn-add-card').addEventListener('click', () => {
    openModal('New Card', `
      <label>Title</label>
      <input type="text" placeholder="What needs to be done?" maxlength="100" />
      <label>Description (optional)</label>
      <textarea placeholder="Add more detail..."></textarea>
      <label>Color</label>
      <div class="color-options">
        ${renderColorOptions('#8b5cf6')}
      </div>
      <button class="btn-primary btn-confirm">
        <i class="fa-solid fa-plus"></i> Add Card
      </button>
    `, async () => {
      const title = modalBody.querySelector('input').value.trim();
      const desc  = modalBody.querySelector('textarea').value.trim();
      const color = modalBody.querySelector('.color-dot.selected')?.dataset.color || '#8b5cf6';
      if (!title) return;
      await createCard(column.id, title, desc, color);
      await loadColumns();
      closeModal();
    });

    // color dot selection
    modalBody.addEventListener('click', (e) => {
      if (e.target.classList.contains('color-dot')) {
        modalBody.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
        e.target.classList.add('selected');
      }
    });
  });

  return el;
}

// ── Cards ─────────────────────────────────────────

const COLORS = ['#8b5cf6','#3b82f6','#22c55e','#eab308','#f97316','#ef4444','#ec4899','#94a3b8'];

function renderColorOptions(selected) {
  return COLORS.map(color => `
    <div class="color-dot ${color === selected ? 'selected' : ''}"
         data-color="${color}"
         style="background-color: ${color}">
    </div>
  `).join('');
}

function createCardHTML(card) {
  return `
    <div class="card" draggable="true" data-id="${card.id}" data-column-id="${card.column_id}">
      <div style="border-left: 3px solid ${card.color}; padding-left: 8px;">
        <div class="card-title">${card.title}</div>
        ${card.description ? `<div class="card-desc">${card.description}</div>` : ''}
      </div>
      <div class="card-footer">
        <button class="btn-danger btn-edit-card" data-id="${card.id}" title="Edit">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="btn-danger btn-delete-card" data-id="${card.id}" title="Delete">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
  `;
}

// ── Optimistic UI helpers ────────────────────────
// Updates the column card count badge without a full re-render
function updateColumnCount(columnCardsEl) {
  if (!columnCardsEl) return;
  const column = columnCardsEl.closest('.column');
  if (!column) return;
  const badge = column.querySelector('.column-count');
  if (badge) badge.textContent = columnCardsEl.children.length;
}

// ── Card events (edit + delete) ───────────────────
// Uses event delegation — one listener on boardArea handles all cards

boardArea.addEventListener('click', async (e) => {

  // edit card
  if (e.target.closest('.btn-edit-card')) {
    const btn = e.target.closest('.btn-edit-card');
    const cardEl = btn.closest('.card');
    const id = cardEl.dataset.id;
    const title = cardEl.querySelector('.card-title').textContent;
    const desc  = cardEl.querySelector('.card-desc')?.textContent || '';
    const color = cardEl.querySelector('[style*="border-left"]')
                        .style.borderLeftColor || '#8b5cf6';

    openModal('Edit Card', `
      <label>Title</label>
      <input type="text" value="${title}" maxlength="100" />
      <label>Description (optional)</label>
      <textarea placeholder="Add more detail...">${desc}</textarea>
      <label>Color</label>
      <div class="color-options">
        ${renderColorOptions(color)}
      </div>
      <button class="btn-primary btn-confirm">
        <i class="fa-solid fa-check"></i> Save
      </button>
    `, async () => {
      const newTitle = modalBody.querySelector('input').value.trim();
      const newDesc  = modalBody.querySelector('textarea').value.trim();
      const newColor = modalBody.querySelector('.color-dot.selected')?.dataset.color || color;
      if (!newTitle) return;
      await updateCard(id, newTitle, newDesc, newColor);
      await loadColumns();
      closeModal();
    });

    modalBody.addEventListener('click', (e) => {
      if (e.target.classList.contains('color-dot')) {
        modalBody.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
        e.target.classList.add('selected');
      }
    });
  }

  // delete card — optimistic: remove from DOM immediately, sync in background
  if (e.target.closest('.btn-delete-card')) {
    const btn = e.target.closest('.btn-delete-card');
    const id = btn.dataset.id;
    if (confirm('Delete this card?')) {
      const cardEl = btn.closest('.card');
      const columnCardsEl = cardEl.closest('.column-cards');
      cardEl.remove();
      updateColumnCount(columnCardsEl);
      deleteCard(id).catch(() => {
        // if the server call fails, reload to restore correct state
        loadColumns();
      });
    }
  }
});

// ── Drag and Drop ─────────────────────────────────

function initDragAndDrop() {
  const cards = document.querySelectorAll('.card');
  const dropZones = document.querySelectorAll('.column-cards');
  const columns = document.querySelectorAll('.column');

  // ── Card drag ──────────────────────────────────
  cards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      e.stopPropagation(); // prevent column drag from firing
      e.dataTransfer.setData('cardId', card.dataset.id);
      e.dataTransfer.setData('type', 'card');
      setTimeout(() => card.classList.add('dragging'), 0);
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      dropZones.forEach(z => z.classList.remove('drag-over'));
    });
  });

  dropZones.forEach(zone => {
    zone.addEventListener('dragover', (e) => {
      if (!e.dataTransfer.types.includes('cardid')) return;
      e.preventDefault();
      e.stopPropagation(); // prevent column dragover from firing
      zone.classList.add('drag-over');
    });

    zone.addEventListener('dragleave', (e) => {
      if (!zone.contains(e.relatedTarget)) {
        zone.classList.remove('drag-over');
      }
    });

    zone.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation(); // prevent column drop from firing
      zone.classList.remove('drag-over');
      const cardId = e.dataTransfer.getData('cardId');
      if (!cardId) return; // ignore column drops on card zones

      // optimistic: move the card element in the DOM immediately
      const cardEl = document.querySelector(`.card[data-id="${cardId}"]`);
      if (!cardEl) return;
      const sourceZone = cardEl.closest('.column-cards');
      zone.appendChild(cardEl);
      cardEl.dataset.columnId = zone.dataset.columnId;
      updateColumnCount(sourceZone);
      updateColumnCount(zone);

      const columnId = zone.dataset.columnId;
      const position = zone.children.length - 1;
      moveCard(cardId, columnId, position).catch(() => {
        // if the server call fails, reload to restore correct state
        loadColumns();
      });
    });
  });

  // ── Column drag ────────────────────────────────
  columns.forEach(column => {
    column.addEventListener('dragstart', (e) => {
      // only fire if dragging the column itself, not a card inside
      if (e.target.closest('.card')) return;
      e.dataTransfer.setData('columnId', column.dataset.id);
      e.dataTransfer.setData('type', 'column');
      setTimeout(() => column.classList.add('dragging-col'), 0);
    });

    column.addEventListener('dragend', () => {
      column.classList.remove('dragging-col');
      document.querySelectorAll('.column').forEach(c => {
        c.classList.remove('col-drag-over');
      });
    });

    column.addEventListener('dragover', (e) => {
      // ignore if a card is being dragged — let the drop zone handle it
      if (e.dataTransfer.types.includes('cardid')) return;
      e.preventDefault();
      const draggedId = e.dataTransfer.getData('columnId');
      if (draggedId !== column.dataset.id) {
        column.classList.add('col-drag-over');
      }
    });

    column.addEventListener('dragleave', (e) => {
      // only remove highlight if leaving the column entirely
      if (!column.contains(e.relatedTarget)) {
        column.classList.remove('col-drag-over');
      }
    });

    column.addEventListener('drop', async (e) => {
      e.preventDefault();
      column.classList.remove('col-drag-over');

      const columnId = e.dataTransfer.getData('columnId');
      if (!columnId) return; // ignore card drops on columns

      const targetId = column.dataset.id;
      if (columnId === targetId) return; // dropped on itself

      // get all current column ids in DOM order
      const allColumns = [...document.querySelectorAll('.column')];
      const ids = allColumns.map(c => c.dataset.id);

      // swap positions
      const fromIndex = ids.indexOf(columnId);
      const toIndex   = ids.indexOf(targetId);

      // reorder the ids array
      ids.splice(fromIndex, 1);
      ids.splice(toIndex, 0, columnId);

      // optimistic: reorder columns in the DOM immediately
      ids.forEach(id => {
        const col = document.querySelector(`.column[data-id="${id}"]`);
        if (col) boardArea.appendChild(col);
      });

      // single bulk request instead of N parallel PUTs
      reorderColumns(ids).catch(() => {
        // if the server call fails, reload to restore correct state
        loadColumns();
      });
    });
  });
}

// ── Init ──────────────────────────────────────────
// This runs when the page loads

document.addEventListener('DOMContentLoaded', () => {
  if (!checkAuth()) return; // stop if not logged in
  renderUserInfo();         // show user name in sidebar
  loadBoards();             // load boards for this user
});

// ── Mobile sidebar toggle ─────────────────────────
const hamburger      = document.getElementById('hamburger');
const sidebar        = document.querySelector('.sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

function openSidebar() {
  sidebar.classList.add('open');
  sidebarOverlay.classList.add('active');
}

function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('active');
}

hamburger.addEventListener('click', () => {
  sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
});

// Close sidebar when clicking the overlay
sidebarOverlay.addEventListener('click', closeSidebar);

// Close sidebar after selecting a board on mobile
document.getElementById('boardList').addEventListener('click', () => {
  if (window.innerWidth <= 768) closeSidebar();
});