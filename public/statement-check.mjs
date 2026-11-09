import './app.mjs';

const nav = document.querySelector('#marketing-navigation');
const menu = document.querySelector('.marketing-menu-toggle');
function setMenu(open) { nav.dataset.open = open; menu.setAttribute('aria-expanded', open); }
menu.onclick = () => setMenu(nav.dataset.open !== 'true');
nav.querySelectorAll('a').forEach(link => link.onclick = () => setMenu(false));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.dataset.open === 'true') { setMenu(false); menu.focus(); } });
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const reveal = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('yotion-visible');
        reveal.unobserve(entry.target);
      }
    }
  }, {threshold:0.08});
  document.querySelectorAll('.lc-problem,.lc-how,.lc-trust,.lc-faq,.lc-closing,#ownership').forEach(section => {
    section.classList.add('yotion-await');
    reveal.observe(section);
  });
}

const fileInput = document.querySelector('#file');
for (const button of document.querySelectorAll('#choose-file, #header-choose-file')) {
  button.addEventListener('click', () => fileInput.click());
}
