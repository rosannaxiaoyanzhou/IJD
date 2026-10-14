// the EN | ES switch in the nav: every element with data-es holds its Spanish
// text, and the English is read from the page itself; the choice is kept
// for the next visit and the next page
const STORE_KEY = 'lang';
const translated = () => document.querySelectorAll('[data-es], [data-es-label]');

function setLang(lang) {
  for (const el of translated()) {
    if (el.dataset.es !== undefined) {
      if (el.dataset.en === undefined) el.dataset.en = el.innerHTML;
      el.innerHTML = lang === 'es' ? el.dataset.es : el.dataset.en;
    }
    if (el.dataset.esLabel !== undefined) {
      if (el.dataset.enLabel === undefined) el.dataset.enLabel = el.getAttribute('aria-label');
      el.setAttribute('aria-label', lang === 'es' ? el.dataset.esLabel : el.dataset.enLabel);
    }
  }
  document.documentElement.lang = lang;
  for (const button of document.querySelectorAll('.lang-switch button')) {
    button.setAttribute('aria-pressed', button.dataset.lang === lang);
  }
  try { localStorage.setItem(STORE_KEY, lang); } catch (e) {}
  document.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
}

for (const button of document.querySelectorAll('.lang-switch button')) {
  button.addEventListener('click', () => setLang(button.dataset.lang));
}

let saved = null;
try { saved = localStorage.getItem(STORE_KEY); } catch (e) {}
setLang(saved === 'es' ? 'es' : 'en');
