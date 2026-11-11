/* The Book of Answers flip (the Answers tab, index.html). The markup — back
   board, last page, the turning leaves and the cover — and the open/close
   sequence. Two classes drive it, as in the founder's reference
   (Design/reference/book-flip-2b.html): .open (the leaves are turned)
   and .fits, set by measure() when the green area is wider than tall.
   measure() also sizes the book from that area and centres it there.
   Shut, the book is centred. With .fits it slides half a page right as it
   opens, so the spread is centred on its spine, and back after closing;
   without it, it never moves and the last page is centred. Every timing is read from
   the --flip-* variables in flip.css. */
window.StillFlip = (() => {
  const root = () => document.documentElement;

  // A --flip-* value in ms (for "550ms" / ".8s") or as a plain number.
  function read(name, fallback, el){
    const v = getComputedStyle(el || root()).getPropertyValue(name).trim();
    const n = parseFloat(v);
    if(isNaN(n)) return fallback;
    if(/ms$/.test(v)) return n;
    if(/s$/.test(v)) return n * 1000;
    return n;
  }
  const reduced = () => matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* How many pages turn after the cover. */
  const count = () => Math.max(0, Math.round(read('--flip-count', 10)));

  /* The green area the book sits on: the Answers page, below any top bar,
     beside the sidebar, and above a bottom tab bar, which floats over it.
     Measured as laid out at the top of the page. */
  /* The height is the small viewport's (100svh): on a phone the browser's
     toolbars come and go as the page scrolls, and the book must not change
     size with them. */
  let probe = null;
  function viewH(){
    if(!probe){
      probe = document.createElement('div');
      probe.setAttribute('aria-hidden', 'true');
      probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100vh;height:100svh;visibility:hidden;pointer-events:none';
      document.body.appendChild(probe);
    }
    return probe.offsetHeight || innerHeight;
  }
  function area(book){
    const page = book.closest('.page--answers');
    const w = page ? page.clientWidth : innerWidth;
    const top = page ? page.getBoundingClientRect().top + scrollY : 0;
    const vh = viewH();
    let bottom = vh;
    const nav = document.getElementById('nav');
    const r = nav && nav.getBoundingClientRect();
    // A bar fixed to the bottom: as far above the small viewport's bottom
    // as it is above the current one.
    if(r && r.height && r.top > innerHeight / 2) bottom = vh - (innerHeight - r.top);
    return { page, w, h: Math.max(0, bottom - top), top };
  }
  /* Wider than tall: the desktop approach (.fits), the open spread centred
     on its spine. Otherwise the mobile one: the last page centred, the left
     page running off the edge (founder, 2026-11-10). */
  const fits = a => a.w > a.h;

  /* Everything that depends on the window, measured after layout and again
     on every resize: the approach, the book's size and where it sits.
     The book is --flip-fill of the area's height, between --flip-min-h and
     --flip-max-h, but never wider than the area allows: on desktop the open
     spread keeps --flip-margin either side; on mobile one page is at most
     --flip-mobile-width of the width. It is centred in the area both ways. */
  function measure(book){
    if(!book || !book.isConnected) return;
    const a = area(book), wide = fits(a);
    const ratio = 494 / 763, margin = read('--flip-margin', 48, book);
    let h = Math.min(read('--flip-max-h', 1200, book),
      Math.max(read('--flip-min-h', 360, book), a.h * read('--flip-fill', .7, book)));
    const maxW = wide ? (a.w - 2 * margin) / 2 : a.w * read('--flip-mobile-width', .78, book);
    h = Math.floor(Math.max(0, Math.min(h, maxW / ratio, a.h - 2 * read('--flip-edge', 16, book))));
    if(a.page){
      a.page.style.setProperty('--book-h', h + 'px');
      const ans = book.parentElement;
      const at = ans.getBoundingClientRect().top + scrollY;
      a.page.style.setProperty('--flip-pad-top', Math.max(0, Math.round(a.top + (a.h - h) / 2 - at)) + 'px');
    }
    book.style.setProperty('--book-w', book.offsetWidth + 'px');
    if(wide === book.classList.contains('fits')) return;
    // A change of window, not a step of the flip: jump, don't slide.
    const shift = book.querySelector('.shift');
    if(shift) shift.style.transition = 'none';
    book.classList.toggle('fits', wide);
    if(shift){ void shift.offsetWidth; shift.style.transition = ''; }
  }

  /* The backs of the pages: plain line drawings, drawn for this book, in
     the page's ink. Nothing in them is anyone's likeness. 120 x 120. */
  const ART = [
    // a willow over still water
    '<path d="M60 100C58 78 62 56 60 32M60 32C44 34 33 52 31 78M60 32C76 34 87 52 89 78M60 42C50 48 44 62 44 84M60 42C70 48 76 62 76 84M24 100h72M36 108h48"/>',
    // a candle
    '<path d="M48 102h24M52 102V58h16v44M60 58v-7M60 51c-6-6-5-14 0-21 5 7 6 15 0 21z"/>',
    // an hourglass
    '<path d="M38 18h44M38 102h44M44 18c0 24 16 30 16 42S44 78 44 102M76 18c0 24-16 30-16 42s16 18 16 42M52 94q8-8 16 0"/>',
    // a crescent over hills
    '<path d="M80 22a20 20 0 1 0 14 34 16 16 0 0 1-14-34zM8 98q26-30 52 0t52 0"/>',
    // a boat on small waves
    '<path d="M28 76h64l-10 14H38zM60 76V28l24 38H60M14 100q8-6 16 0t16 0 16 0 16 0 16 0 16 0"/>',
    // a tea bowl, steaming
    '<path d="M28 64h64c0 20-14 32-32 32S28 84 28 64zM46 96h28M50 52c-5-6 5-10 0-16M60 52c-5-6 5-10 0-16M70 52c-5-6 5-10 0-16"/>',
    // a mountain and the sun
    '<path d="M8 100l34-52 18 26 14-18 38 44z"/><circle cx="88" cy="32" r="9"/>',
    // a key
    '<circle cx="38" cy="60" r="14"/><path d="M52 60h52M90 60v12M100 60v8"/>',
    // two birds
    '<path d="M18 58q12-14 24 0q12-14 24 0M58 84q8-9 16 0q8-9 16 0"/>',
    // a leaf
    '<path d="M30 96C36 60 58 34 92 24 88 58 66 84 34 94M30 96L84 34M50 74l12 2M58 62l14 2M66 50l12 2"/>',
    // an oil lamp
    '<path d="M28 74h52c8 0 14-6 18-12M28 74c-4 0-6-6-2-8l14-6M42 74c0 10 8 14 18 14s18-4 18-14M60 88v8M48 96h24"/><path d="M98 60c-4-4-4-10 0-14 4 4 4 10 0 14z"/>',
    // an open door onto a path
    '<path d="M36 104V20h48v84M36 104h48M84 20L66 30v84M52 104l-14 12M68 104l14 12"/>'
  ];
  const art = i => `<svg viewBox="0 0 120 120" aria-hidden="true">${ART[i % ART.length]}</svg>`;

  /* Class names inside the book must not be ones index.html styles on its
     own: its .cover (library covers: 2:3, overflow hidden, padding) once
     shrank and flattened this cover — on an iPhone it sat small in the
     corner with the pages showing round it — and .wide resized the book.
     Hence .lid, .fits. */
  /* The whole book. `final` is the last page's inner markup; `pages` the
     passages on the turning pages (real ones, already cut); `title` and
     `cta` the cover's words, already translated. `open` draws it settled
     open, as it is after a flip. */
  function bookHTML({ open, attrs = '', final = '', pages = [], title = '', cta = '', esc }){
    const n = pages.length;
    const leaves = pages.map((x, k) => `<div class="fl" style="--i:${k + 1}">
        <div class="face front"><p class="passage">“${esc(x.text)}”</p><p class="attrib">— ${esc(x.name)}</p></div>
        <div class="face back">${art(k)}</div></div>`).reverse().join('');
    return `<div class="book2${open ? ' open' : ''}" style="--n:${n}" ${attrs}>
      <div class="shift">
        <div class="board"></div>
        <div class="final">${final}</div>
        <div class="leaves" aria-hidden="true">${leaves}
          <div class="fl lid" style="--i:0">
            <div class="face front cover2">
              <h2>${title}</h2>
              <div class="cta"><span>${cta}</span>
                <b class="go"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"
                  fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></b></div>
            </div>
            <div class="face back"><div class="endpaper"></div></div>
          </div>
        </div>
      </div>
    </div>`;
  }

  /* Run one flip on a rendered book, then call onLand once the last page
     has landed (the caller re-renders it settled). Returns a cancel
     function. */
  function run(book, opening, onLand){
    measure(book);
    void book.offsetWidth;
    const timers = [];
    const cancel = () => timers.forEach(clearTimeout);
    if(reduced()){
      book.classList.toggle('open', opening);
      timers.push(setTimeout(onLand, 0));
      return cancel;
    }
    const n = parseInt(book.style.getPropertyValue('--n'), 10) || count();
    const turn = read('--flip-turn', 800, book);
    const turns = opening
      ? n * read('--flip-gap-open', 200, book) + turn + 100
      : n * read('--flip-gap-close', 70, book) + turn + 50
        // … and, where it slid, the shut book's slide back to the centre.
        + (book.classList.contains('fits')
          ? read('--flip-slide-close-delay', 0, book) + read('--flip-slide-close', 450, book) : 0);
    book.classList.toggle('open', opening);
    timers.push(setTimeout(onLand, turns));
    return cancel;
  }
  // The landing is the end of the sequence: nothing is left to play after it.
  const returnMs = () => 0;

  return { read, count, measure, bookHTML, run, returnMs, reduced };
})();
