// PharmaSys — JS global. Vazio no Pacote 1; pacotes seguintes irão preencher.
document.addEventListener('DOMContentLoaded', () => {
  // Auto-hide flash messages
  document.querySelectorAll('.flash').forEach(el => {
    setTimeout(() => { el.style.transition = 'opacity .4s'; el.style.opacity = '0'; }, 4000);
    setTimeout(() => el.remove(), 4500);
  });
});
