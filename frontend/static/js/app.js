const API = 'http://localhost:8000';

let sessionId = null;
let selectedFiles = [];
let messageCount = 0;

// ─── DOM Refs ─────────────────────────────────────────
const dropZone       = document.getElementById('dropZone');
const fileInput      = document.getElementById('fileInput');
const fileList       = document.getElementById('fileList');
const uploadBtn      = document.getElementById('uploadBtn');
const clearBtn       = document.getElementById('clearBtn');
const statsBox       = document.getElementById('statsBox');
const statFiles      = document.getElementById('statFiles');
const statMessages   = document.getElementById('statMessages');
const chatContainer  = document.getElementById('chatContainer');
const emptyState     = document.getElementById('emptyState');
const messages       = document.getElementById('messages');
const questionInput  = document.getElementById('questionInput');
const sendBtn        = document.getElementById('sendBtn');
const statusPill     = document.getElementById('statusPill');
const statusText     = document.getElementById('statusText');

// ─── Drag & Drop ──────────────────────────────────────
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave',  () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  handleFiles([...e.dataTransfer.files]);
});
fileInput.addEventListener('change', () => handleFiles([...fileInput.files]));

function handleFiles(files) {
  const pdfs = files.filter(f => f.name.endsWith('.pdf'));
  if (pdfs.length !== files.length) showToast('Only PDF files are accepted.', 'error');
  pdfs.forEach(f => {
    if (!selectedFiles.find(sf => sf.name === f.name)) selectedFiles.push(f);
  });
  renderFileList();
}

function renderFileList() {
  fileList.innerHTML = '';
  selectedFiles.forEach((f, i) => {
    const item = document.createElement('div');
    item.className = 'file-item';
    item.innerHTML = `
      <span class="file-item-name" title="${f.name}">📄 ${f.name}</span>
      <button class="file-remove" data-i="${i}" title="Remove">×</button>
    `;
    fileList.appendChild(item);
  });
  fileList.querySelectorAll('.file-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedFiles.splice(+btn.dataset.i, 1);
      renderFileList();
    });
  });
  uploadBtn.disabled = selectedFiles.length === 0;
}

// ─── Upload ───────────────────────────────────────────
uploadBtn.addEventListener('click', async () => {
  if (selectedFiles.length === 0) return;

  const btnText   = uploadBtn.querySelector('.btn-text');
  const btnLoader = uploadBtn.querySelector('.btn-loader');
  btnText.hidden   = true;
  btnLoader.hidden = false;
  uploadBtn.disabled = true;
  setStatus('loading', 'Processing PDFs…');

  const form = new FormData();
  selectedFiles.forEach(f => form.append('files', f));

  try {
    const res  = await fetch(`${API}/upload`, { method: 'POST', body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Upload failed');

    sessionId = data.session_id;
    showToast(`✓ ${data.files.length} PDF(s) ready!`, 'success');
    setStatus('ready', 'Ready to chat');

    // Enable chat
    questionInput.disabled = false;
    sendBtn.disabled = false;
    questionInput.focus();

    // Show stats
    statFiles.textContent = `${data.files.length} file(s) loaded`;
    statsBox.style.display = 'flex';

    // Hide empty state
    emptyState.style.display = 'none';

    // Clear file selection
    selectedFiles = [];
    fileList.innerHTML = '';
    fileInput.value = '';
    uploadBtn.disabled = true;

  } catch (err) {
    showToast(err.message, 'error');
    setStatus('error', 'Upload failed');
  } finally {
    btnText.hidden   = false;
    btnLoader.hidden = true;
    uploadBtn.disabled = selectedFiles.length === 0;
  }
});

// ─── Chat ─────────────────────────────────────────────
sendBtn.addEventListener('click', sendMessage);
questionInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});

// Auto-resize textarea
questionInput.addEventListener('input', () => {
  questionInput.style.height = 'auto';
  questionInput.style.height = Math.min(questionInput.scrollHeight, 140) + 'px';
});

async function sendMessage() {
  const q = questionInput.value.trim();
  if (!q || !sessionId) return;

  questionInput.value = '';
  questionInput.style.height = 'auto';
  sendBtn.disabled = true;
  questionInput.disabled = true;

  appendMessage('user', q);
  const typingId = appendTyping();
  setStatus('loading', 'Thinking…');

  try {
    const res  = await fetch(`${API}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q, session_id: sessionId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Request failed');

    removeTyping(typingId);
    appendMessage('ai', data.answer, data.sources);
    messageCount++;
    statMessages.textContent = `${messageCount} message(s)`;
    setStatus('ready', 'Ready to chat');

  } catch (err) {
    removeTyping(typingId);
    appendMessage('ai', `⚠️ ${err.message}`, []);
    setStatus('error', 'Error');
  } finally {
    sendBtn.disabled = false;
    questionInput.disabled = false;
    questionInput.focus();
  }
}

function appendMessage(role, text, sources = []) {
  const div = document.createElement('div');
  div.className = `message ${role}`;

  const avatar = role === 'user'
    ? `<div class="msg-avatar">U</div>`
    : `<div class="msg-avatar">⬡</div>`;

  const sourcesHtml = sources.length
    ? `<div class="msg-sources">${sources.map(s => `<span class="source-tag">📄 ${s}</span>`).join('')}</div>`
    : '';

  div.innerHTML = `
    ${avatar}
    <div class="msg-body">
      <div class="msg-bubble">${escapeHtml(text).replace(/\n/g,'<br>')}</div>
      ${sourcesHtml}
    </div>
  `;
  messages.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  return div;
}

function appendTyping() {
  const id = 'typing-' + Date.now();
  const div = document.createElement('div');
  div.className = 'message ai';
  div.id = id;
  div.innerHTML = `
    <div class="msg-avatar">⬡</div>
    <div class="msg-body">
      <div class="typing-bubble">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>
  `;
  messages.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  return id;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// ─── Clear Session ────────────────────────────────────
clearBtn.addEventListener('click', async () => {
  if (!sessionId) return;
  try {
    await fetch(`${API}/session/${sessionId}`, { method: 'DELETE' });
  } catch {}
  sessionId = null;
  messageCount = 0;
  messages.innerHTML = '';
  emptyState.style.display = 'flex';
  statsBox.style.display = 'none';
  questionInput.disabled = true;
  sendBtn.disabled = true;
  setStatus('', 'Waiting for upload');
  showToast('Session cleared.', 'success');
});

// ─── Helpers ──────────────────────────────────────────
function setStatus(cls, text) {
  statusPill.className = `status-pill ${cls}`;
  statusText.textContent = text;
}

function showToast(msg, type = '') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

function escapeHtml(str) {
  return str
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}
