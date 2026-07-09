/* Sino de notificações no header — polling leve. */
(function () {
  const bell   = document.getElementById('notifBell');
  const panel  = document.getElementById('notifPanel');
  const list   = document.getElementById('notifPanelList');
  const count  = document.getElementById('notifCount');
  if (!bell || !panel) return;

  const feedUrl = bell.dataset.feed;
  const listUrl = bell.dataset.list;

  function fmt(dt) {
    try { const d = new Date(dt.replace(' ', 'T')); return d.toLocaleString('pt-PT'); }
    catch (e) { return dt; }
  }

  function render(data) {
    if (data.unread > 0) {
      count.textContent = data.unread > 99 ? '99+' : data.unread;
      count.style.display = 'flex';
    } else {
      count.style.display = 'none';
    }
    if (!data.items || data.items.length === 0) {
      list.innerHTML = '<div class="np-empty">Sem notificações.</div>';
      return;
    }
    list.innerHTML = data.items.map(it => `
      <a class="np-item ${it.unread ? 'unread' : ''}" href="${it.link || '#'}">
        <div class="np-title">${escapeHtml(it.title)}</div>
        <div class="np-msg">${escapeHtml(it.message)}</div>
        <div class="np-meta">${fmt(it.created_at)} · ${it.type}</div>
      </a>
    `).join('');
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[c]);
  }

  async function refresh() {
    try {
      const r = await fetch(feedUrl, { headers: { 'X-Requested-With': 'XMLHttpRequest' }, credentials: 'same-origin' });
      if (!r.ok) return;
      const data = await r.json();
      render(data);
    } catch (e) { /* silent */ }
  }

  bell.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) refresh();
  });
  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && e.target !== bell) panel.classList.remove('open');
  });

  refresh();
  setInterval(refresh, 60000); // 60s
})();
