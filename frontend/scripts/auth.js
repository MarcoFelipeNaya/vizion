
// ── Tab switching ─────────────────────────────────

const loginTab     = document.getElementById('loginTab');
const registerTab  = document.getElementById('registerTab');
const loginForm    = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

loginTab.addEventListener('click', () => {
  loginTab.classList.add('active');
  registerTab.classList.remove('active');
  loginForm.classList.remove('hidden');
  registerForm.classList.add('hidden');
});

registerTab.addEventListener('click', () => {
  registerTab.classList.add('active');
  loginTab.classList.remove('active');
  registerForm.classList.remove('hidden');
  loginForm.classList.add('hidden');
});

// ── Helpers ───────────────────────────────────────

function showMessage(elementId, text, type) {
  const el = document.getElementById(elementId);
  el.textContent = text;
  el.className = `auth-message ${type}`;
}

function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.querySelector('span').textContent = loading ? 'Please wait...' : btn.dataset.label;
}

// ── Login ─────────────────────────────────────────

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = loginForm.querySelector('button');
  btn.dataset.label = btn.querySelector('span').textContent;

  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  setLoading(btn, true);

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showMessage('loginMessage', data.error, 'error');
      return;
    }

    // save token and user to localStorage
    localStorage.setItem('vizion-token', data.token);
    localStorage.setItem('vizion-user', JSON.stringify(data.user));

    // redirect to app
    window.location.href = 'index.html';

  } catch (error) {
    showMessage('loginMessage', 'Something went wrong. Please try again.', 'error');
  } finally {
    setLoading(btn, false);
  }
});

// ── Register ──────────────────────────────────────

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = registerForm.querySelector('button');
  btn.dataset.label = btn.querySelector('span').textContent;

  const name     = document.getElementById('registerName').value.trim();
  const email    = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;

  setLoading(btn, true);

  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showMessage('registerMessage', data.error, 'error');
      return;
    }

    // save token and user
    localStorage.setItem('vizion-token', data.token);
    localStorage.setItem('vizion-user', JSON.stringify(data.user));

    // redirect to app
    window.location.href = 'index.html';

  } catch (error) {
    showMessage('registerMessage', 'Something went wrong. Please try again.', 'error');
  } finally {
    setLoading(btn, false);
  }
});

// ── Redirect if already logged in ─────────────────

if (localStorage.getItem('vizion-token')) {
  window.location.href = 'index.html';
}