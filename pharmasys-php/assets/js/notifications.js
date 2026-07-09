/* Sino de notificações no header — polling leve + mark-read. */
(function () {
  const bell   = document.getElementById('notifBell');
  const panel  = document.getElementById('notifPanel');
  const list   = document.getElementById('notifPanelList');
  const count  = document.getElementById('notifCount');
  if (!bell || !panel) return;

  const feedUrl = bell.dataset.feed;
  const csrfMeta = document.querySelector('meta[name="csrf-token"]');
  const csrf = csrfMeta ? csrfMeta.getAttribute('content') : '';

  function fmt(dt) {
    try { const d = new Date(dt.replace(' ', 'T')); return d.toLocaleString('pt-PT'); }
    catch (e) { return dt; }
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[c]);
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
    const hasUnread = data.items.some(i => i.unread);
    let html = '';
    if (hasUnread) {
      html += '<div class="np-actions" style="padding:8px 12px;border-bottom:1px solid #eef2f0;text-align:right;">'
           +  '<button type="button" id="npMarkAll" class="btn btn-sm">Marcar todas como lidas</button></div>';
    }
    html += data.items.map(it => `
      <a class="np-item ${it.unread ? 'unread' : ''}" href="${it.link || '#'}" data-id="${it.id}">
        <div class="np-title">${escapeHtml(it.title)}</div>
        <div class="np-msg">${escapeHtml(it.message)}</div>
        <div class="np-meta">${fmt(it.created_at)} · ${escapeHtml(it.type)}</div>
      </a>
    `).join('');
    list.innerHTML = html;

    // Marcar individual ao clicar
    list.querySelectorAll('.np-item.unread').forEach(a => {
      a.addEventListener('click', () => {
        const id = a.dataset.id;
        if (!id) return;
        postForm('notifications/read', { id });
      });
    });
    const mAll = document.getElementById('npMarkAll');
    if (mAll) mAll.addEventListener('click', async (e) => {
      e.preventDefault();
      await postForm('notifications/read-all', {});
      refresh();
    });
  }

  function postForm(path, data) {
    const body = new URLSearchParams();
    body.set('csrf_token', csrf);
    Object.keys(data).forEach(k => body.set(k, data[k]));
    return fetch('./?r=' + encodeURIComponent(path), {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    }).catch(() => {});
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
  setInterval(refresh, 60000);
})();
