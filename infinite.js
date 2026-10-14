// the homepage's endless canvas: the photos are scattered at random over a
// tile that is a little bigger than the screen, and the tile repeats in
// every direction; each photo is drawn once per tile, wrapped to wherever
// it shows, with extra copies of the set when one set would look sparse
const field = document.getElementById('infinite');
const originals = Array.from(field.querySelectorAll('.item'));
let items = [...originals];

const GAP = 50;          // the least space between two photos, in px
const FILL = 0.45;       // about how much of the tile the photos (with gaps) cover
const FRICTION = 0.94;   // how quickly a flung canvas slows down, per frame
const DRAG_SLOP = 5;     // px of movement before a press counts as a drag

let tileW = 0;
let tileH = 0;
let camX = 0;
let camY = 0;
let velX = 0;
let velY = 0;
let boxes = [];          // { el, x, y, w, h } in tile coordinates

const mod = (n, m) => ((n % m) + m) % m;

// how far apart two spans are on a loop of length `size` (negative if they overlap)
function loopGap(a, aLen, b, bLen, size) {
  const d = mod(b - a, size);
  return Math.min(d - aLen, size - d - bLen);
}

// keep `sets` copies of the photo set on the canvas; copies point the
// lightbox back at their original with data-clone
function useSets(sets) {
  const want = originals.length * sets;
  while (items.length < want) {
    const index = items.length % originals.length;
    const copy = originals[index].cloneNode(true);
    copy.querySelector('.photo').dataset.clone = index;
    field.appendChild(copy);
    items.push(copy);
  }
  while (items.length > want) items.pop().remove();
}

function scatter() {
  const sizes = originals.map(el => ({ w: el.offsetWidth, h: el.offsetHeight }));
  const maxW = Math.max(...sizes.map(b => b.w));
  const maxH = Math.max(...sizes.map(b => b.h));
  const area = sizes.reduce((sum, b) => sum + (b.w + GAP) * (b.h + GAP), 0);

  // the tile must be at least a screen plus a photo across, so a photo never
  // needs to be in two places at once
  tileW = window.innerWidth + maxW + GAP;
  tileH = window.innerHeight + maxH + GAP;
  useSets(Math.max(1, Math.round(FILL * tileW * tileH / area)));
  boxes = items.map((el, i) => ({ el, ...sizes[i % originals.length] }));

  // place the largest first; if a photo can't find room, grow the tile and retry
  const order = [...boxes].sort((a, b) => b.w * b.h - a.w * a.h);
  for (let round = 0; round < 30; round++) {
    const placed = [];
    const fits = order.every(box => {
      for (let tries = 0; tries < 500; tries++) {
        box.x = Math.random() * tileW;
        box.y = Math.random() * tileH;
        const clear = placed.every(o =>
          loopGap(o.x, o.w, box.x, box.w, tileW) >= GAP ||
          loopGap(o.y, o.h, box.y, box.h, tileH) >= GAP);
        if (clear) {
          placed.push(box);
          return true;
        }
      }
      return false;
    });
    if (fits) break;
    tileW *= 1.05;
    tileH *= 1.05;
  }

  // start with some photo near the middle of the screen
  const first = boxes[Math.floor(Math.random() * boxes.length)];
  camX = window.innerWidth / 2 - first.x - first.w / 2;
  camY = window.innerHeight / 2 - first.y - first.h / 2;
  draw();
}

function draw() {
  for (const b of boxes) {
    // wrap each photo into the window [-w, tile - w) so it's on screen when it should be
    const x = mod(b.x + camX + b.w, tileW) - b.w;
    const y = mod(b.y + camY + b.h, tileH) - b.h;
    b.el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }
}

// one glide loop at a time, however many flings or key presses start it
let gliding = false;

function glide() {
  if (gliding) return;
  gliding = true;
  (function frame() {
    if (Math.abs(velX) < 0.05 && Math.abs(velY) < 0.05) {
      gliding = false;
      return;
    }
    camX += velX;
    camY += velY;
    velX *= FRICTION;
    velY *= FRICTION;
    draw();
    requestAnimationFrame(frame);
  })();
}

// ---- dragging, with a fling when let go ----

let pointer = null;      // { id, x, y, startX, startY, t, moved }

field.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  velX = velY = 0;
  pointer = { id: e.pointerId, x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, t: performance.now(), moved: false };
});

field.addEventListener('pointermove', e => {
  if (!pointer || e.pointerId !== pointer.id) return;
  if (!pointer.moved && Math.hypot(e.clientX - pointer.startX, e.clientY - pointer.startY) > DRAG_SLOP) {
    pointer.moved = true;
    field.classList.add('dragging');
    field.setPointerCapture(e.pointerId);
  }
  if (!pointer.moved) return;

  const now = performance.now();
  const dx = e.clientX - pointer.x;
  const dy = e.clientY - pointer.y;
  const frames = Math.max(1, (now - pointer.t) / 16.7);
  velX = dx / frames;
  velY = dy / frames;
  camX += dx;
  camY += dy;
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  pointer.t = now;
  draw();
});

function release(e) {
  if (!pointer || e.pointerId !== pointer.id) return;
  const wasDrag = pointer.moved;
  // a pause before letting go means no fling
  if (performance.now() - pointer.t > 80) velX = velY = 0;
  pointer = null;
  field.classList.remove('dragging');
  if (wasDrag) {
    justDragged = true;
    setTimeout(() => { justDragged = false; }, 0);
    glide();
  }
}

// swallow the click that follows a drag so it doesn't open the lightbox
let justDragged = false;
field.addEventListener('click', e => {
  if (justDragged) e.stopPropagation();
}, true);

field.addEventListener('pointerup', release);
field.addEventListener('pointercancel', release);

// ---- wheel and trackpad scrolling move the canvas too ----

field.addEventListener('wheel', e => {
  e.preventDefault();
  velX = velY = 0;
  const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
  // a plain mouse wheel scrolls up and down; shift turns it sideways
  const dx = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX;
  const dy = e.shiftKey && !e.deltaX ? 0 : e.deltaY;
  camX -= dx * unit;
  camY -= dy * unit;
  draw();
}, { passive: false });

// ---- arrow keys, when the lightbox is closed ----

document.addEventListener('keydown', e => {
  if (document.getElementById('lightbox').classList.contains('active')) return;
  const keys = { ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
  if (!keys[e.key]) return;
  e.preventDefault();
  velX = keys[e.key][0] * 12;
  velY = keys[e.key][1] * 12;
  glide();
});

// lay out once the fonts are in, so the captions have their real size,
// and again when the screen changes size
document.fonts.load('18px "Nothing You Could Do"').catch(() => {}).then(scatter);

// (only reshuffle when the screen outgrows the tile, so a phone's address
// bar sliding in and out leaves the photos where they are)
let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const tooSmall = boxes.some(b =>
      window.innerWidth + b.w + GAP > tileW || window.innerHeight + b.h + GAP > tileH);
    if (tooSmall || originals.some((el, i) => boxes[i].w !== el.offsetWidth)) scatter();
    else draw();
  }, 200);
});
