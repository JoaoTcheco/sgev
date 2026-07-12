// PharmaSys — JS global
document.addEventListener('DOMContentLoaded', () => {
  // Flash: botão de fechar + auto-hide
  document.querySelectorAll('.flash').forEach(el => {
    const dismiss = () => {
      el.style.transition = 'opacity .3s ease, transform .3s ease';
      el.style.opacity = '0';
      el.style.transform = 'translateY(-8px)';
      setTimeout(() => el.remove(), 320);
    };
    el.querySelector('.flash-close')?.addEventListener('click', dismiss);
    setTimeout(dismiss, 5000);
  });

  // Confirmação genérica para forms com data-confirm
  document.querySelectorAll('form[data-confirm]').forEach(form => {
    form.addEventListener('submit', (e) => {
      if (!confirm(form.getAttribute('data-confirm') || 'Confirmar operação?')) {
        e.preventDefault();
      }
    });
  });

  // Sidebar responsiva (mobile)
  const shell    = document.querySelector('.app-shell');
  const sidebar  = document.querySelector('.app-sidebar');
  const toggle   = document.getElementById('sb-toggle');
  const overlay  = document.getElementById('sb-overlay');
  const openSb = () => {
    shell?.classList.add('sb-open');
    overlay?.removeAttribute('hidden');
    toggle?.setAttribute('aria-expanded', 'true');
  };
  const closeSb = () => {
    shell?.classList.remove('sb-open');
    overlay?.setAttribute('hidden', '');
    toggle?.setAttribute('aria-expanded', 'false');
  };
  toggle?.addEventListener('click', () => {
    shell?.classList.contains('sb-open') ? closeSb() : openSb();
  });
  overlay?.addEventListener('click', closeSb);
  // Fechar ao navegar
  sidebar?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    if (window.innerWidth < 900) closeSb();
  }));
  // Fechar ao redimensionar para desktop
  window.addEventListener('resize', () => { if (window.innerWidth >= 900) closeSb(); });

  // Envolver tabelas grandes em wrapper com scroll horizontal
  document.querySelectorAll('.app-content table').forEach(tbl => {
    if (tbl.closest('.table-scroll')) return;
    // Não envolver tabelas dentro de layouts especiais (carrinho PDV, recibo)
    if (tbl.closest('.pdv, .receipt, .print-mode')) return;
    const wrap = document.createElement('div');
    wrap.className = 'table-scroll';
    tbl.parentNode.insertBefore(wrap, tbl);
    wrap.appendChild(tbl);
  });
});
