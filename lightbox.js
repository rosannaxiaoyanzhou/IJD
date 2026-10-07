const lightbox = document.getElementById('lightbox');
const lightboxStage = document.getElementById('lightboxStage');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxGlow = document.getElementById('lightboxGlow');
const lightboxClose = document.getElementById('lightboxClose');
const photos = Array.from(document.querySelectorAll('.photo'));
let activeIndex = -1;
let switchTimer = null;

// the arrow cursor from the Figma mockup; the left one is the same shape flipped
const ARROW_PATH = 'M1.11257 0.343224C1.04715 0.22141 0.947532 0.116231 0.820605 0.0555695C0.693783 -0.00512522 0.551744 -0.0168678 0.421924 0.0241278C0.292105 0.0651233 0.182569 0.156311 0.113606 0.278832C0.0445364 0.401387 0.0233889 0.544703 0.0397916 0.681997C0.0397916 0.681997 0.0397916 0.681997 0.0397916 0.681997C0.130497 1.38422 0.278245 2.07592 0.484736 2.75748C1.30685 5.49881 3.09135 7.95237 5.3018 9.74449C7.95157 11.8777 10.8854 13.4047 14.2062 14.3694L14.1032 11.6882C8.35734 14.2038 1.99991 17.6373 0.171626 24.3597C0.0261465 25.0707 -0.0280941 25.7915 0.0136818 26.5126C0.0227751 26.6572 0.0831691 26.7959 0.187791 26.8981C0.292356 27.0004 0.431617 27.0578 0.576182 27.0578C0.720747 27.0578 0.860008 27.0004 0.964573 26.8981C1.06919 26.7959 1.12959 26.6572 1.13868 26.5126C1.18041 25.8892 1.30159 25.2883 1.494 24.7048C3.57505 19.2959 9.70999 16.4019 15.0492 14.337L19.2593 12.7912L14.9462 11.6558C12.2346 10.7521 9.46474 9.26521 7.19844 7.4201C5.27691 5.84973 3.54146 4.11125 2.11702 1.99875C1.76168 1.47135 1.42705 0.923704 1.11257 0.343224Z';

// the arrow follows the mouse as a white shape in "difference" blend mode,
// which shows the inverted colors of whatever is underneath it
const arrow = document.createElement('div');
arrow.className = 'lightbox-arrow';
arrow.innerHTML = `<svg width="19.2593" height="27.0578" viewBox="0 0 19.2593 27.0578" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="${ARROW_PATH}" fill="#ffffff"/></svg>`;
document.body.appendChild(arrow);

function showPhoto(photo) {
  const img = photo.querySelector('img');

  const targetHeight = window.innerHeight * 0.62;
  const maxWidth = window.innerWidth * 0.88;
  const ratio = img.naturalWidth / img.naturalHeight;

  let width = targetHeight * ratio;
  let height = targetHeight;
  if (width > maxWidth) {
    width = maxWidth;
    height = width / ratio;
  }

  // film photos are shown as shot, without the polaroid treatment
  lightbox.classList.toggle('plain', photo.classList.contains('film'));

  lightboxImg.src = img.src;
  lightboxGlow.src = img.src;
  lightboxImg.style.width = width + 'px';
  lightboxImg.style.height = height + 'px';
}

function setArrow(x, y) {
  arrow.classList.toggle('prev', x < window.innerWidth / 2);
  arrow.style.transform = `translate(${x - 10}px, ${y - 14}px)`;
}

function openLightbox(index, x, y, pointerType) {
  activeIndex = index;
  showPhoto(photos[index]);
  setArrow(x, y);
  arrow.classList.toggle('visible', pointerType !== 'touch' && pointerType !== 'pen');

  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('active');
  arrow.classList.remove('visible');
  document.body.style.overflow = '';
  activeIndex = -1;
}

// step forward (+1) or back (-1), wrapping around at either end
function step(direction) {
  activeIndex = (activeIndex + direction + photos.length) % photos.length;
  const photo = photos[activeIndex];

  clearTimeout(switchTimer);
  lightboxStage.classList.add('switching');
  switchTimer = setTimeout(() => {
    showPhoto(photo);
    lightboxStage.classList.remove('switching');
  }, 150);
}

photos.forEach((photo, index) => {
  photo.addEventListener('click', e => openLightbox(index, e.clientX, e.clientY, e.pointerType));
});

lightbox.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse') return;
  setArrow(e.clientX, e.clientY);
  // over the X the normal pointer takes over
  arrow.classList.toggle('visible', !lightboxClose.contains(e.target));
});

lightbox.addEventListener('pointerleave', () => arrow.classList.remove('visible'));

lightbox.addEventListener('click', e => {
  if (lightboxClose.contains(e.target)) return;
  step(e.clientX >= window.innerWidth / 2 ? 1 : -1);
});

lightboxClose.addEventListener('click', closeLightbox);

document.addEventListener('keydown', e => {
  if (activeIndex === -1) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') step(1);
  if (e.key === 'ArrowLeft') step(-1);
});
