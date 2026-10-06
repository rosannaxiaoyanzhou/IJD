const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxGlow = document.getElementById('lightboxGlow');
let activePhoto = null;

function openLightbox(photo) {
  const img = photo.querySelector('img');
  activePhoto = photo;

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

  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
  activePhoto = null;
}

document.querySelectorAll('.photo').forEach(photo => {
  photo.addEventListener('click', () => openLightbox(photo));
});

lightbox.addEventListener('click', closeLightbox);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLightbox();
});
