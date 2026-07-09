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
});
